import Anthropic from "@anthropic-ai/sdk";
import { db, logAudit } from "@/lib/db";
import { getClient, MODEL, NO_EM_DASH_RULE } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are MuniBot, an AI assistant for a municipal finance and capital markets operations team. You have live database access via tools across three domains:

1. Financial Forecasting: budgets, transactions, anomalies, variance, departments.
2. DC/CIL Management: Development Charges and Cash-in-Lieu accounts, balances, overdue, by-law rates.
3. Trade Reconciliation: trades across two systems, breaks, SLA aging.

Operating rules:
- Always use tools when answering questions about specific accounts, balances, transactions, or breaks. Do not guess numbers.
- Cite specific account IDs, trade IDs, and dollar figures from tool results.
- Be concise and direct. Lead with the answer.
- ${NO_EM_DASH_RULE}
- If a question is outside these domains, say so briefly and offer to redirect.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "lookup_dc_account",
    description: "Look up a Development Charges account by id or project name keyword",
    input_schema: {
      type: "object",
      properties: { id: { type: "number" }, query: { type: "string" } },
    },
  },
  {
    name: "lookup_cil_account",
    description: "Look up a Cash-in-Lieu account by id or project keyword",
    input_schema: {
      type: "object",
      properties: { id: { type: "number" }, query: { type: "string" } },
    },
  },
  {
    name: "get_payment_status",
    description: "Get payment status summary for DC by status keyword",
    input_schema: {
      type: "object",
      properties: { status: { type: "string", description: "current, overdue, disputed, paid" } },
      required: ["status"],
    },
  },
  {
    name: "calculate_dc_payment",
    description: "Calculate DC payment for a hypothetical project",
    input_schema: {
      type: "object",
      properties: {
        units: { type: "number" },
        unit_type: { type: "string" },
      },
      required: ["units", "unit_type"],
    },
  },
  {
    name: "check_overdue_accounts",
    description: "List overdue DC accounts",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_bylaw_rates",
    description: "Get current by-law rate schedule",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "search_transactions",
    description: "Search transactions by vendor, category, or department",
    input_schema: {
      type: "object",
      properties: {
        vendor: { type: "string" },
        category: { type: "string" },
        department: { type: "string" },
      },
    },
  },
  {
    name: "get_reconciliation_breaks",
    description: "List current open reconciliation breaks, optionally filtered by type",
    input_schema: {
      type: "object",
      properties: { break_type: { type: "string" } },
    },
  },
  {
    name: "get_anomalies",
    description: "List flagged transaction anomalies",
    input_schema: { type: "object", properties: { limit: { type: "number" } } },
  },
];

function runTool(name: string, input: Record<string, string | number>) {
  if (name === "lookup_dc_account") {
    if (input.id) {
      return db.prepare(`SELECT * FROM dc_accounts WHERE id = ?`).get(input.id) ?? { error: "Not found" };
    }
    if (input.query) {
      return db
        .prepare(`SELECT * FROM dc_accounts WHERE project_name LIKE ? OR developer LIKE ? LIMIT 5`)
        .all(`%${input.query}%`, `%${input.query}%`);
    }
    return { error: "Provide id or query" };
  }
  if (name === "lookup_cil_account") {
    if (input.id) return db.prepare(`SELECT * FROM cil_accounts WHERE id = ?`).get(input.id) ?? { error: "Not found" };
    if (input.query)
      return db.prepare(`SELECT * FROM cil_accounts WHERE project_name LIKE ? LIMIT 5`).all(`%${input.query}%`);
    return { error: "Provide id or query" };
  }
  if (name === "get_payment_status") {
    return db
      .prepare(`SELECT id, developer, project_name, balance, due_date FROM dc_accounts WHERE status = ? LIMIT 10`)
      .all(input.status);
  }
  if (name === "calculate_dc_payment") {
    const rates: Record<string, number> = {
      "Single Family": 38500,
      Townhouse: 28900,
      "Mid-Rise": 22100,
      "High-Rise": 22100,
      "Mixed Use": 24000,
    };
    const rate = rates[input.unit_type as string] ?? 25000;
    return {
      units: input.units,
      unit_type: input.unit_type,
      rate_per_unit: rate,
      total: Number(input.units) * rate,
      by_law: "2024-02",
    };
  }
  if (name === "check_overdue_accounts") {
    return db
      .prepare(`SELECT id, developer, project_name, balance, due_date FROM dc_accounts WHERE status = 'overdue'`)
      .all();
  }
  if (name === "get_bylaw_rates") {
    return {
      "2024-02": { "Single Family": 38500, Townhouse: 28900, "Mid-Rise": 22100, "High-Rise": 22100 },
      cil_rate_range: { min_per_sqm: 220, max_per_sqm: 480 },
    };
  }
  if (name === "search_transactions") {
    const where: string[] = [];
    const params: string[] = [];
    if (input.vendor) {
      where.push("vendor LIKE ?");
      params.push(`%${input.vendor}%`);
    }
    if (input.category) {
      where.push("category = ?");
      params.push(String(input.category));
    }
    if (input.department) {
      where.push("department = ?");
      params.push(String(input.department));
    }
    const q = `SELECT id, date, department, category, vendor, amount FROM transactions ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY date DESC LIMIT 15`;
    return db.prepare(q).all(...params);
  }
  if (name === "get_reconciliation_breaks") {
    if (input.break_type) {
      return db
        .prepare(`SELECT * FROM breaks WHERE resolved = 0 AND break_type = ? ORDER BY sla_deadline LIMIT 20`)
        .all(input.break_type);
    }
    return db.prepare(`SELECT * FROM breaks WHERE resolved = 0 ORDER BY sla_deadline LIMIT 20`).all();
  }
  if (name === "get_anomalies") {
    const lim = Number(input.limit) || 10;
    return db
      .prepare(`SELECT id, date, vendor, amount, anomaly_reasons FROM transactions WHERE flagged = 1 ORDER BY anomaly_score DESC LIMIT ?`)
      .all(lim);
  }
  return { error: "Unknown tool" };
}

export async function POST(req: Request) {
  const { sessionId, messages: clientMessages } = (await req.json()) as {
    sessionId?: number;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  const client = getClient();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      const messages: Anthropic.MessageParam[] = clientMessages.map((m) => ({ role: m.role, content: m.content }));
      let finalAssistantText = "";

      try {
        for (let iter = 0; iter < 6; iter++) {
          const resp = client.messages.stream({
            model: MODEL,
            max_tokens: 1500,
            system: SYSTEM_PROMPT,
            tools: TOOLS,
            messages,
          });

          let iterText = "";

          for await (const event of resp) {
            if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
              send({ type: "tool_start", name: event.content_block.name });
            }
            if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                iterText += event.delta.text;
                send({ type: "text_delta", delta: event.delta.text });
              }
            }
          }
          const finalMsg = await resp.finalMessage();
          finalAssistantText += iterText;
          const toolUses = finalMsg.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
          messages.push({ role: "assistant", content: finalMsg.content });

          if (finalMsg.stop_reason === "end_turn" || toolUses.length === 0) break;

          const toolResults: Anthropic.ToolResultBlockParam[] = toolUses.map((tu) => {
            const r = runTool(tu.name, tu.input as Record<string, string | number>);
            send({ type: "tool_result", name: tu.name, result: r });
            return { type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(r) };
          });
          messages.push({ role: "user", content: toolResults });
        }

        if (sessionId) {
          const row = db.prepare(`SELECT messages_json FROM chat_sessions WHERE id = ?`).get(sessionId) as
            | { messages_json: string }
            | undefined;
          const existing = row ? JSON.parse(row.messages_json) : [];
          existing.push(clientMessages[clientMessages.length - 1]);
          existing.push({ role: "assistant", content: finalAssistantText });
          db.prepare(
            `UPDATE chat_sessions SET messages_json = ?, last_message_at = CURRENT_TIMESTAMP WHERE id = ?`
          ).run(JSON.stringify(existing), sessionId);
          logAudit("ai", "chat_message", "chat_session", sessionId);
        }

        send({ type: "done" });
        controller.close();
      } catch (err) {
        send({ type: "error", error: (err as Error).message });
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson" } });
}
