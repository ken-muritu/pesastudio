import { NextRequest, NextResponse } from "next/server";
import { getDb, parseMpesaPayload, createId, type Project } from "@/lib/db";
import { broadcast } from "@/lib/sse";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ apiKey: string }> }
) {
  const { apiKey } = await params;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const db = getDb();
  const project = db
    .prepare("SELECT * FROM Project WHERE apiKey = ?")
    .get(apiKey) as Project | undefined;

  if (!project) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 404 });
  }

  const parsed = parseMpesaPayload(payload);
  const callbackId = createId();
  const now = Date.now();

  db.prepare(`
    INSERT INTO Callback (id, projectId, payload, mpesaReceipt, resultCode, transactionType, amount, phoneNumber, status, receivedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'received', ?)
  `).run(
    callbackId,
    project.id,
    JSON.stringify(payload),
    parsed.mpesaReceipt,
    parsed.resultCode,
    parsed.transactionType,
    parsed.amount,
    parsed.phoneNumber,
    now
  );

  broadcast(project.id, {
    type: "new-callback",
    data: {
      id: callbackId,
      projectId: project.id,
      payload,
      mpesaReceipt: parsed.mpesaReceipt,
      resultCode: parsed.resultCode,
      resultDesc: parsed.resultDesc,
      transactionType: parsed.transactionType,
      amount: parsed.amount,
      phoneNumber: parsed.phoneNumber,
      status: "received",
      replayCount: 0,
      receivedAt: now,
      forwardedAt: null,
      forwardedResponse: null,
    },
  });

  if (project.localEndpoint) {
    const endpoint = project.localEndpoint;
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })
      .then(async (res) => {
        const body = await res.text().catch(() => "");
        const fwdAt = Date.now();
        db.prepare(
          "UPDATE Callback SET status = 'forwarded', forwardedResponse = ?, forwardedAt = ? WHERE id = ?"
        ).run(JSON.stringify({ status: res.status, body }), fwdAt, callbackId);
        broadcast(project.id, {
          type: "callback-updated",
          data: { id: callbackId, status: "forwarded", forwardedAt: fwdAt },
        });
      })
      .catch(() => {
        db.prepare(
          "UPDATE Callback SET status = 'failed' WHERE id = ?"
        ).run(callbackId);
        broadcast(project.id, {
          type: "callback-updated",
          data: { id: callbackId, status: "failed" },
        });
      });
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
}
