import { NextRequest, NextResponse } from "next/server";
import { getDb, type Project } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { localEndpoint } = await req.json();

  if (
    localEndpoint &&
    typeof localEndpoint === "string" &&
    !localEndpoint.startsWith("http")
  ) {
    return NextResponse.json(
      { error: "localEndpoint must start with http:// or https://" },
      { status: 400 }
    );
  }

  const db = getDb();
  db.prepare("UPDATE Project SET localEndpoint = ? WHERE id = ?").run(
    localEndpoint ?? null,
    id
  );

  const project = db
    .prepare("SELECT * FROM Project WHERE id = ?")
    .get(id) as Project;

  return NextResponse.json({ project });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const project = db
    .prepare("SELECT * FROM Project WHERE id = ?")
    .get(id) as Project | undefined;

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}
