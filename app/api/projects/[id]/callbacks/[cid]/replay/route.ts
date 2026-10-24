import { NextRequest, NextResponse } from "next/server";
import { getDb, type Callback, type Project } from "@/lib/db";
import { broadcast } from "@/lib/sse";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  const { id, cid } = await params;
  const db = getDb();

  const callback = db
    .prepare("SELECT * FROM Callback WHERE id = ? AND projectId = ?")
    .get(cid, id) as Callback | undefined;

  if (!callback) {
    return NextResponse.json({ error: "Callback not found" }, { status: 404 });
  }

  const project = db
    .prepare("SELECT * FROM Project WHERE id = ?")
    .get(id) as Project | undefined;

  if (!project?.localEndpoint) {
    return NextResponse.json(
      { error: "No local endpoint configured" },
      { status: 400 }
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(callback.payload);
  } catch {
    payload = callback.payload;
  }

  let responseStatus = 0;
  let responseBody = "";

  try {
    const res = await fetch(project.localEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    responseStatus = res.status;
    responseBody = await res.text().catch(() => "");
  } catch (err) {
    responseBody = err instanceof Error ? err.message : "Connection failed";
  }

  const now = Date.now();
  db.prepare(
    `UPDATE Callback
     SET status = 'replayed',
         replayCount = replayCount + 1,
         forwardedResponse = ?,
         forwardedAt = ?
     WHERE id = ?`
  ).run(
    JSON.stringify({ status: responseStatus, body: responseBody }),
    now,
    cid
  );

  broadcast(project.id, {
    type: "callback-updated",
    data: {
      id: cid,
      status: "replayed",
      replayCount: callback.replayCount + 1,
      forwardedAt: now,
    },
  });

  return NextResponse.json({
    replayed: true,
    sentTo: project.localEndpoint,
    responseStatus,
    responseBody,
  });
}
