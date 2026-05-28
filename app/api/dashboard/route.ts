import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aggregateMonthly, forecastSeries, detectAnomalies } from "@/lib/forecast";

export const dynamic = "force-dynamic";

export async function GET() {
  const txs = db
    .prepare(`SELECT id, date, department, category, vendor, amount FROM transactions ORDER BY date`)
    .all() as Array<{ id: number; date: string; department: string; category: string; vendor: string; amount: number }>;
  const months = aggregateMonthly(txs);
  const series = forecastSeries(months, 6);
  const lastActual = series.filter((p) => p.actual != null).slice(-1)[0];
  const matchingForecast = lastActual ? series.find((p) => p.month === lastActual.month)?.forecast : null;
  const variancePct =
    lastActual && matchingForecast
      ? Math.round(((lastActual.actual! - matchingForecast) / matchingForecast) * 1000) / 10
      : 0;

  const dcOutstanding = (db.prepare(`SELECT SUM(balance) as v FROM dc_accounts`).get() as { v: number }).v || 0;
  const cilOutstanding = (db.prepare(`SELECT SUM(balance) as v FROM cil_accounts`).get() as { v: number }).v || 0;
  const outstanding = dcOutstanding + cilOutstanding;

  const openBreaks = (db.prepare(`SELECT COUNT(*) as v FROM breaks WHERE resolved = 0`).get() as { v: number }).v || 0;
  const totalBreaks = (db.prepare(`SELECT COUNT(*) as v FROM breaks`).get() as { v: number }).v || 0;
  const matchedTrades =
    (db.prepare(`SELECT COUNT(*) as v FROM trades_system_a`).get() as { v: number }).v - openBreaks;

  const today = new Date().toISOString().slice(0, 10);
  const aiActionsToday = (db
    .prepare(`SELECT COUNT(*) as v FROM audit_log WHERE timestamp >= ?`)
    .get(today) as { v: number }).v || 0;

  const anomalies = detectAnomalies(txs).slice(0, 5);
  const recentAudit = db
    .prepare(`SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 10`)
    .all();

  return NextResponse.json({
    kpis: {
      variancePct,
      outstanding,
      openBreaks,
      aiActionsToday,
    },
    series,
    anomalies,
    reconciliation: {
      matched: matchedTrades,
      breaks: openBreaks,
      total: totalBreaks + matchedTrades,
    },
    audit: recentAudit,
  });
}
