import { NextRequest } from "next/server";
import { addClient, removeClient } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
      addClient(id, controller);

      const ping = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": ping\n\n"));
        } catch {
          clearInterval(ping);
        }
      }, 15000);

      (controller as unknown as { _pingInterval: ReturnType<typeof setInterval> })._pingInterval = ping;
    },
    cancel() {
      removeClient(id, controller);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
