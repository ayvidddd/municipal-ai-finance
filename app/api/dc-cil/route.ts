import { NextResponse } from "next/server";
import { db, logAudit } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const dc = db.prepare(`SELECT * FROM dc_accounts ORDER BY balance DESC`).all() as Array<{
    id: number;
    developer: string;
    project_name: string;
    address: string;
    total_owed: number;
    paid: number;
    balance: number;
    due_date: string;
    status: string;
    by_law_version: string;
    units: number;
    unit_type: string;
  }>;
  const cil = db.prepare(`SELECT * FROM cil_accounts ORDER BY balance DESC`).all() as Array<{
    id: number;
    project_name: string;
    parkland_sqm: number;
    rate_per_sqm: number;
    total_owed: number;
    paid: number;
    balance: number;
    status: string;
  }>;

  const dcOutstanding = dc.reduce((s, r) => s + r.balance, 0);
  const dcOverdue = dc.filter((r) => r.status === "overdue").reduce((s, r) => s + r.balance, 0);
  const dcDisputed = dc.filter((r) => r.status === "disputed").reduce((s, r) => s + r.balance, 0);
  const cilOutstanding = cil.reduce((s, r) => s + r.balance, 0);

  const collectedMtd = dc.reduce((s, r) => s + r.paid, 0) + cil.reduce((s, r) => s + r.paid, 0);

  return NextResponse.json({
    dc,
    cil,
    kpis: {
      totalOutstanding: dcOutstanding + cilOutstanding,
      overdue: dcOverdue,
      collectedMtd,
      disputed: dcDisputed,
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (body.action === "mark_paid") {
    const { id, type } = body;
    const table = type === "cil" ? "cil_accounts" : "dc_accounts";
    db.prepare(`UPDATE ${table} SET paid = total_owed, balance = 0, status = 'paid' WHERE id = ?`).run(id);
    logAudit("user", "mark_paid", table, id);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "bylaw_update") {
    const { pct } = body;
    const factor = 1 + Number(pct) / 100;
    const rowsBefore = db.prepare(`SELECT id, total_owed, paid FROM dc_accounts WHERE status != 'paid'`).all() as Array<{ id: number; total_owed: number; paid: number }>;
    const txn = db.transaction(() => {
      for (const r of rowsBefore) {
        const newTotal = Math.round(r.total_owed * factor);
        const newBalance = newTotal - r.paid;
        db.prepare(`UPDATE dc_accounts SET total_owed = ?, balance = ? WHERE id = ?`).run(
          newTotal,
          newBalance,
          r.id
        );
      }
    });
    txn();
    logAudit("user", "bylaw_update", "dc_accounts", null, { pct, affected: rowsBefore.length });
    return NextResponse.json({ affected: rowsBefore.length });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
