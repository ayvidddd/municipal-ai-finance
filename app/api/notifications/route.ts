import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = db
    .prepare(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10`)
    .all();
  return NextResponse.json({ notifications: rows });
}

export async function POST(req: Request) {
  const { id, markAllRead } = await req.json();
  if (markAllRead) {
    db.prepare(`UPDATE notifications SET read = 1 WHERE read = 0`).run();
  } else if (id) {
    db.prepare(`UPDATE notifications SET read = 1 WHERE id = ?`).run(id);
  }
  return NextResponse.json({ ok: true });
}
