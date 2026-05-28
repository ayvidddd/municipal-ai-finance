import { NextResponse } from "next/server";
import { db, logAudit } from "@/lib/db";
import { getClient, MODEL, NO_EM_DASH_RULE } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { id, type } = await req.json();
  const table = type === "cil" ? "cil_accounts" : "dc_accounts";
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) as
    | Record<string, string | number>
    | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const client = getClient();
  const ctx =
    type === "cil"
      ? `CIL account
Project: ${row.project_name}
Parkland: ${row.parkland_sqm} sqm at $${row.rate_per_sqm}/sqm
Total owed: $${row.total_owed}
Paid: $${row.paid}
Balance: $${row.balance}
Status: ${row.status}`
      : `DC account
Developer: ${row.developer}
Project: ${row.project_name}
Address: ${row.address}
Units: ${row.units} ${row.unit_type}
Total owed: $${row.total_owed}
Paid: $${row.paid}
Balance: $${row.balance}
Due: ${row.due_date}
Status: ${row.status}
By-law: ${row.by_law_version}`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: `You are a municipal collections officer drafting a professional payment reminder. Tone: firm, courteous, factual. ${NO_EM_DASH_RULE}`,
    messages: [
      {
        role: "user",
        content: `Draft a payment reminder email for this account.

${ctx}

Output only the email body. Include the specific balance, the by-law reference if available, a payment portal placeholder [PAY-PORTAL], and ask them to confirm payment within 10 business days. Sign off as "City Finance Department".`,
      },
    ],
  });
  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n")
    .trim();
  logAudit("ai", "draft_reminder", table, id, { length: text.length });
  return NextResponse.json({ draft: text });
}
