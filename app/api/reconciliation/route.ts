import { NextResponse } from "next/server";
import { db, logAudit } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const a = db.prepare(`SELECT * FROM trades_system_a ORDER BY trade_id`).all();
  const b = db.prepare(`SELECT * FROM trades_system_b ORDER BY trade_id`).all();
  const breaks = db.prepare(`SELECT * FROM breaks ORDER BY resolved ASC, detected_at DESC`).all() as Array<{
    id: number;
    trade_id: string;
    break_type: string;
    system_a_value: string | null;
    system_b_value: string | null;
    detected_at: string;
    resolved: number;
    sla_deadline: string;
    investigation_notes: string | null;
  }>;

  const now = Date.now();
  const slaAtRisk = breaks.filter((br) => !br.resolved && new Date(br.sla_deadline).getTime() < now + 24 * 3600 * 1000).length;
  const openBreaks = breaks.filter((br) => !br.resolved).length;
  const totalTrades = (db.prepare(`SELECT COUNT(*) as v FROM trades_system_a`).get() as { v: number }).v;
  const matched = totalTrades - openBreaks;

  return NextResponse.json({
    a,
    b,
    breaks,
    kpis: { totalTrades, matched, breaks: openBreaks, slaAtRisk },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (body.action === "resolve_break") {
    const { id, notes } = body;
    db.prepare(`UPDATE breaks SET resolved = 1, investigation_notes = ? WHERE id = ?`).run(notes || null, id);
    logAudit("user", "resolve_break", "break", id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
