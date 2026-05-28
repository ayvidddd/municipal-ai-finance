import { NextResponse } from "next/server";
import { db, logAudit } from "@/lib/db";
import { getClient, MODEL, NO_EM_DASH_RULE } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export async function POST() {
  const total = (db.prepare(`SELECT COUNT(*) as v FROM trades_system_a`).get() as { v: number }).v;
  const breaks = db.prepare(`SELECT break_type, COUNT(*) as cnt FROM breaks GROUP BY break_type`).all();
  const open = (db.prepare(`SELECT COUNT(*) as v FROM breaks WHERE resolved = 0`).get() as { v: number }).v;
  const resolved = (db.prepare(`SELECT COUNT(*) as v FROM breaks WHERE resolved = 1`).get() as { v: number }).v;

  const client = getClient();
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: `You are writing a month-end reconciliation report for the head of capital markets operations. Use bullet sections. ${NO_EM_DASH_RULE}`,
    messages: [
      {
        role: "user",
        content: `Write a one-page month-end recon report.

Total trades: ${total}
Open breaks: ${open}
Resolved breaks: ${resolved}
Break breakdown: ${JSON.stringify(breaks)}

Sections: Executive summary, By break type, Aging, Recommendations.`,
      },
    ],
  });
  const text = resp.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
  logAudit("ai", "month_end_report", "reconciliation");
  return NextResponse.json({ report: text });
}
