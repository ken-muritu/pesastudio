import { NextRequest, NextResponse } from "next/server";

const RESULT_DESCRIPTIONS: Record<number, string> = {
  0: "The service request is processed successfully.",
  1: "The balance is insufficient for the transaction.",
  1032: "Request cancelled by user.",
  1037: "DS timeout user cannot be reached.",
  2001: "The initiator information is invalid.",
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    targetUrl,
    resultCode = 0,
    amount = 100,
    phoneNumber = "254708374149",
  } = body as {
    targetUrl: string;
    resultCode?: number;
    amount?: number;
    phoneNumber?: string;
  };

  if (!targetUrl) {
    return NextResponse.json({ error: "targetUrl required" }, { status: 400 });
  }

  const ts = Date.now();
  const receipt = `SIM${ts.toString().slice(-8)}`;
  const merchantRequestId = `SIM-MR-${ts}`;
  const checkoutRequestId = `ws_CO_SIM_${ts}`;

  const mockCallback: Record<string, unknown> = {
    Body: {
      stkCallback: {
        MerchantRequestID: merchantRequestId,
        CheckoutRequestID: checkoutRequestId,
        ResultCode: resultCode,
        ResultDesc:
          RESULT_DESCRIPTIONS[resultCode] ?? "An unknown error occurred.",
        ...(resultCode === 0 && {
          CallbackMetadata: {
            Item: [
              { Name: "Amount", Value: amount },
              { Name: "MpesaReceiptNumber", Value: receipt },
              { Name: "TransactionDate", Value: new Date().toISOString() },
              { Name: "PhoneNumber", Value: parseInt(phoneNumber, 10) },
            ],
          },
        }),
      },
    },
  };

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockCallback),
      signal: AbortSignal.timeout(10000),
    });
    const responseBody = await response.text().catch(() => "");

    return NextResponse.json({
      simulated: true,
      resultCode,
      sentTo: targetUrl,
      responseStatus: response.status,
      responseBody,
      payload: mockCallback,
    });
  } catch (err) {
    return NextResponse.json(
      {
        simulated: false,
        error: err instanceof Error ? err.message : "Failed to reach target",
        payload: mockCallback,
      },
      { status: 502 }
    );
  }
}
