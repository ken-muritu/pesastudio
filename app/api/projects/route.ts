import { NextRequest, NextResponse } from "next/server";
import { getDb, createId, type Project } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const projects = db.prepare("SELECT * FROM Project ORDER BY createdAt DESC").all() as Project[];
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const db = getDb();
  const id = createId();
  const apiKey = `ps_${createId()}`;

  db.prepare(
    "INSERT INTO Project (id, name, apiKey) VALUES (?, ?, ?)"
  ).run(id, name.trim(), apiKey);

  const project = db.prepare("SELECT * FROM Project WHERE id = ?").get(id) as Project;
  return NextResponse.json({ project }, { status: 201 });
}
