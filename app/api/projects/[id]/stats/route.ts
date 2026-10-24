import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const total = (db.prepare("SELECT COUNT(*) as n FROM Callback WHERE projectId = ?").get(id) as { n: number }).n;
  const successful = (db.prepare("SELECT COUNT(*) as n FROM Callback WHERE projectId = ? AND resultCode = 0").get(id) as { n: number }).n;
  const failed = (db.prepare("SELECT COUNT(*) as n FROM Callback WHERE projectId = ? AND status = 'failed'").get(id) as { n: number }).n;
  const replays = (db.prepare("SELECT COALESCE(SUM(replayCount),0) as n FROM Callback WHERE projectId = ?").get(id) as { n: number }).n;

  const deliveryRate = total > 0 ? Math.round(((total - failed) / total) * 1000) / 10 : 100;
  const successRate = total > 0 ? Math.round((successful / total) * 1000) / 10 : 100;

  const recent = db.prepare(
    "SELECT receivedAt, forwardedAt FROM Callback WHERE projectId = ? AND forwardedAt IS NOT NULL ORDER BY receivedAt DESC LIMIT 20"
  ).all(id) as { receivedAt: number; forwardedAt: number }[];

  const avgLatency = recent.length > 0
    ? Math.round(recent.reduce((acc, c) => acc + (c.forwardedAt - c.receivedAt), 0) / recent.length)
    : null;

  const latencyHistory = recent.slice(0, 6).reverse().map(c => c.forwardedAt - c.receivedAt);

  return NextResponse.json({
    total,
    successful,
    failed,
    replays,
    deliveryRate,
    successRate,
    avgLatency,
    latencyHistory,
  });
}
