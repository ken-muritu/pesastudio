import { NextRequest, NextResponse } from "next/server";
import { getDb, type Callback } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const callbacks = db
    .prepare(
      `SELECT * FROM Callback WHERE projectId = ? ORDER BY receivedAt DESC LIMIT ? OFFSET ?`
    )
    .all(id, limit, offset) as Callback[];

  const total = (
    db
      .prepare("SELECT COUNT(*) as count FROM Callback WHERE projectId = ?")
      .get(id) as { count: number }
  ).count;

  return NextResponse.json({ callbacks, total });
}
