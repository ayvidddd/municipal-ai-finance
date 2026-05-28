import { NextResponse } from "next/server";
import { db, logAudit } from "@/lib/db";
import { aggregateMonthly, detectAnomalies, forecastSeries } from "@/lib/forecast";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dept = url.searchParams.get("department") || undefined;
  const fromDate = url.searchParams.get("from");
  const toDate = url.searchParams.get("to");

  let query = `SELECT id, date, department, category, vendor, amount, flagged, anomaly_score, anomaly_reasons FROM transactions WHERE 1=1`;
  const params: (string | number)[] = [];
  if (dept) {
    query += ` AND department = ?`;
    params.push(dept);
  }
  if (fromDate) {
    query += ` AND date >= ?`;
    params.push(fromDate);
  }
  if (toDate) {
    query += ` AND date <= ?`;
    params.push(toDate);
  }
  query += ` ORDER BY date`;
  const rows = db.prepare(query).all(...params) as Array<{
    id: number;
    date: string;
    department: string;
    category: string;
    vendor: string;
    amount: number;
    flagged: number;
    anomaly_score: number;
    anomaly_reasons: string | null;
  }>;

  const months = aggregateMonthly(rows);
  const series = forecastSeries(months, 6);

  const detected = detectAnomalies(rows);
  const flaggedFromDb = rows
    .filter((r) => r.flagged === 1)
    .map((r) => ({
      id: r.id,
      date: r.date,
      department: r.department,
      category: r.category,
      vendor: r.vendor,
      amount: r.amount,
      score: r.anomaly_score,
      reasons: r.anomaly_reasons ? JSON.parse(r.anomaly_reasons) : [],
    }));

  const merged = [
    ...flaggedFromDb,
    ...detected.filter((d) => !flaggedFromDb.some((f) => f.id === d.id)),
  ].sort((a, b) => b.score - a.score);

  const lastActual = series.filter((p) => p.actual != null).slice(-1)[0];
  const lastForecast = lastActual ? series.find((p) => p.month === lastActual.month)?.forecast : null;
  const variancePct =
    lastActual && lastForecast
      ? Math.round(((lastActual.actual! - lastForecast) / lastForecast) * 1000) / 10
      : 0;

  const departments = (db.prepare(`SELECT DISTINCT department FROM transactions ORDER BY department`).all() as Array<{ department: string }>).map((r) => r.department);

  return NextResponse.json({
    series,
    anomalies: merged,
    variancePct,
    departments,
    totalCount: rows.length,
    flaggedCount: merged.length,
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { date, department, category, vendor, amount } = body;
  if (!date || !department || !category || !vendor || amount == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const r = db
    .prepare(
      `INSERT INTO transactions (date, department, category, vendor, amount, status) VALUES (?, ?, ?, ?, ?, 'posted')`
    )
    .run(date, department, category, vendor, Number(amount));
  logAudit("user", "create_transaction", "transaction", r.lastInsertRowid, { vendor, amount });
  return NextResponse.json({ id: r.lastInsertRowid });
}
