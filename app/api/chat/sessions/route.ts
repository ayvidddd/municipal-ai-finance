import { NextResponse } from "next/server";
import { db, logAudit } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessions = db
    .prepare(`SELECT id, started_at, last_message_at, title FROM chat_sessions ORDER BY last_message_at DESC`)
    .all();
  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (body.action === "create") {
    const r = db.prepare(`INSERT INTO chat_sessions (title) VALUES (?)`).run(body.title || "New conversation");
    logAudit("user", "create_chat", "chat_session", r.lastInsertRowid);
    return NextResponse.json({ id: r.lastInsertRowid });
  }
  if (body.action === "rename") {
    db.prepare(`UPDATE chat_sessions SET title = ? WHERE id = ?`).run(body.title, body.id);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "delete") {
    db.prepare(`DELETE FROM chat_sessions WHERE id = ?`).run(body.id);
    logAudit("user", "delete_chat", "chat_session", body.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
