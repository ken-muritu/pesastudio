import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { broadcast } from "@/lib/sse";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const project = db.prepare("SELECT id FROM Project WHERE id = ?").get(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { changes } = db.prepare("DELETE FROM Callback WHERE projectId = ?").run(id) as { changes: number };

  broadcast(id, { type: "reset", data: { projectId: id } });

  return NextResponse.json({ deleted: changes });
}
