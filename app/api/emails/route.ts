import { NextResponse } from "next/server";
import { db, logAudit } from "@/lib/db";
import { getClient, MODEL, NO_EM_DASH_RULE } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

const NEW_EMAIL_TEMPLATES = [
  {
    sender: "ops@nationalbank.ca",
    subject: "Price discrepancy on TRD-100073",
    body: "Our front office shows 99.875 versus your 100.125 on TRD-100073. Need clarification before settlement.",
  },
  {
    sender: "permits@cityplanning.gov",
    subject: "Q4 DC revenue projection",
    body: "Council requested a refreshed Q4 projection for development charges revenue. Can you share by EOD Friday?",
  },
  {
    sender: "vendor@horizonenergy.com",
    subject: "Utility invoice clarification",
    body: "Invoice HE-44102 includes a $1,200 surcharge that may have been billed twice in the previous cycle.",
  },
  {
    sender: "auditor@external.ca",
    subject: "Anomaly trail request",
    body: "Need export of all flagged transactions from the last quarter for year-end audit.",
  },
];

export async function GET() {
  const emails = db.prepare(`SELECT * FROM emails ORDER BY received_at DESC`).all();
  const unread = (db.prepare(`SELECT COUNT(*) as v FROM emails WHERE status = 'unread'`).get() as { v: number }).v;
  const urgent = (db.prepare(`SELECT COUNT(*) as v FROM emails WHERE priority = 'urgent'`).get() as { v: number }).v;
  return NextResponse.json({ emails, kpis: { unread, urgent } });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (body.action === "send") {
    db.prepare(`UPDATE emails SET status = 'sent' WHERE id = ?`).run(body.id);
    logAudit("user", "send_email_response", "email", body.id);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "mark_read") {
    db.prepare(`UPDATE emails SET status = 'read' WHERE id = ?`).run(body.id);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "save_draft") {
    db.prepare(`UPDATE emails SET draft_response = ? WHERE id = ?`).run(body.draft, body.id);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "new_simulated") {
    const tpl = NEW_EMAIL_TEMPLATES[Math.floor(Math.random() * NEW_EMAIL_TEMPLATES.length)];
    const r = db
      .prepare(
        `INSERT INTO emails (sender, subject, body, priority, category, status) VALUES (?, ?, ?, 'medium', 'general', 'unread')`
      )
      .run(tpl.sender, tpl.subject, tpl.body);
    await runTriage([Number(r.lastInsertRowid)]);
    logAudit("system", "new_email", "email", r.lastInsertRowid);
    return NextResponse.json({ id: r.lastInsertRowid });
  }
  if (body.action === "reclassify_all") {
    const ids = (db.prepare(`SELECT id FROM emails`).all() as Array<{ id: number }>).map((r) => r.id);
    await runTriage(ids);
    logAudit("ai", "reclassify_all", "email", null, { count: ids.length });
    return NextResponse.json({ count: ids.length });
  }
  if (body.action === "triage_one") {
    await runTriage([body.id]);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

async function runTriage(ids: number[]) {
  const client = getClient();
  for (const id of ids) {
    const e = db.prepare(`SELECT id, sender, subject, body FROM emails WHERE id = ?`).get(id) as
      | { id: number; sender: string; subject: string; body: string }
      | undefined;
    if (!e) continue;
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: `You are a municipal finance triage assistant. Classify the email by priority (urgent/high/medium/low), category (dc_inquiry, cil_inquiry, reconciliation, policy, reporting, ap, audit, budget, general), suggest a brief action, and draft a polite response. Output strict JSON only:
{"priority": "...", "category": "...", "suggested_action": "...", "draft_response": "..."}
${NO_EM_DASH_RULE}`,
      messages: [
        {
          role: "user",
          content: `From: ${e.sender}\nSubject: ${e.subject}\n\n${e.body}`,
        },
      ],
    });
    const text = resp.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    try {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]) as {
          priority: string;
          category: string;
          suggested_action: string;
          draft_response: string;
        };
        db.prepare(
          `UPDATE emails SET priority = ?, category = ?, suggested_action = ?, draft_response = ? WHERE id = ?`
        ).run(parsed.priority, parsed.category, parsed.suggested_action, parsed.draft_response, id);
      }
    } catch {}
  }
}
