import { NextResponse } from "next/server";
import { db, logAudit, createNotification } from "@/lib/db";
import { getClient, MODEL, NO_EM_DASH_RULE } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { id, action } = await req.json();
  const tx = db
    .prepare(
      `SELECT id, date, department, category, vendor, amount, anomaly_reasons FROM transactions WHERE id = ?`
    )
    .get(id) as
    | {
        id: number;
        date: string;
        department: string;
        category: string;
        vendor: string;
        amount: number;
        anomaly_reasons: string | null;
      }
    | undefined;
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reasons = tx.anomaly_reasons ? JSON.parse(tx.anomaly_reasons) : [];

  if (action === "approve") {
    db.prepare(`UPDATE transactions SET flagged = 0, anomaly_score = 0 WHERE id = ?`).run(id);
    logAudit("user", "approve_anomaly", "transaction", id, { vendor: tx.vendor, amount: tx.amount });
    return NextResponse.json({ ok: true });
  }
  if (action === "flag") {
    db.prepare(`UPDATE transactions SET flagged = 1, anomaly_score = 0.9 WHERE id = ?`).run(id);
    logAudit("user", "flag_anomaly", "transaction", id, { vendor: tx.vendor });
    createNotification(
      "anomaly",
      `Flagged for investigation: ${tx.vendor}`,
      `${tx.category} for $${tx.amount.toFixed(2)}`,
      "/solutions/financial-forecasting"
    );
    return NextResponse.json({ ok: true });
  }
  if (action === "email") {
    const client = getClient();
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: `You are a municipal finance controller drafting a clarification email to a vendor or department head about a flagged transaction. Be polite, specific, and professional. ${NO_EM_DASH_RULE}`,
      messages: [
        {
          role: "user",
          content: `Draft a clarification email for this flagged transaction:

Vendor: ${tx.vendor}
Department: ${tx.department}
Category: ${tx.category}
Date: ${tx.date}
Amount: $${tx.amount.toFixed(2)}
Anomaly reasons: ${reasons.join("; ") || "Statistical outlier"}

Output only the email body, no greeting wrapper. Reference invoice number placeholder [INV-####]. Ask 2-3 specific questions to clarify. Set a deadline of 5 business days. Sign off as "Finance Team".`,
        },
      ],
    });
    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n")
      .trim();
    logAudit("ai", "draft_email", "transaction", id, { vendor: tx.vendor, length: text.length });
    return NextResponse.json({ draft: text });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
