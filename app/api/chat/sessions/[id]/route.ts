import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = db.prepare(`SELECT * FROM chat_sessions WHERE id = ?`).get(Number(id)) as
    | { id: number; title: string; messages_json: string; started_at: string }
    | undefined;
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: session.id,
    title: session.title,
    started_at: session.started_at,
    messages: JSON.parse(session.messages_json),
  });
}
