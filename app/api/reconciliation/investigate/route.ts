import { db, logAudit } from "@/lib/db";
import { getClient, MODEL, NO_EM_DASH_RULE } from "@/lib/anthropic";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_trade_details",
    description: "Fetch full trade details from both systems for a trade_id",
    input_schema: {
      type: "object",
      properties: { trade_id: { type: "string" } },
      required: ["trade_id"],
    },
  },
  {
    name: "get_counterparty_info",
    description: "Get counterparty profile: recent volume, prior breaks, contact",
    input_schema: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    },
  },
  {
    name: "get_historical_breaks",
    description: "Get prior breaks for an instrument over the last 90 days",
    input_schema: {
      type: "object",
      properties: { instrument: { type: "string" } },
      required: ["instrument"],
    },
  },
  {
    name: "draft_team_message",
    description: "Draft a message to a named operations team summarizing context",
    input_schema: {
      type: "object",
      properties: { team: { type: "string" }, context: { type: "string" } },
      required: ["team", "context"],
    },
  },
];

function runTool(name: string, input: Record<string, string>) {
  if (name === "get_trade_details") {
    const ta = db.prepare(`SELECT * FROM trades_system_a WHERE trade_id = ?`).get(input.trade_id);
    const tb = db.prepare(`SELECT * FROM trades_system_b WHERE trade_id = ?`).get(input.trade_id);
    return { trade_id: input.trade_id, system_a: ta ?? null, system_b: tb ?? null };
  }
  if (name === "get_counterparty_info") {
    const recent = db
      .prepare(`SELECT COUNT(*) as v, SUM(total_value) as total FROM trades_system_a WHERE counterparty = ?`)
      .get(input.name) as { v: number; total: number };
    const priorBreaks = db
      .prepare(
        `SELECT COUNT(*) as v FROM breaks b JOIN trades_system_a a ON a.trade_id = b.trade_id WHERE a.counterparty = ?`
      )
      .get(input.name) as { v: number };
    return {
      counterparty: input.name,
      recent_volume: recent.total,
      recent_trade_count: recent.v,
      prior_breaks_90d: priorBreaks.v,
      contact: `ops@${input.name.toLowerCase().replace(/[^a-z]/g, "")}.com`,
    };
  }
  if (name === "get_historical_breaks") {
    const rows = db
      .prepare(
        `SELECT b.break_type, COUNT(*) as cnt FROM breaks b JOIN trades_system_a a ON a.trade_id = b.trade_id WHERE a.instrument = ? GROUP BY b.break_type`
      )
      .all(input.instrument);
    return { instrument: input.instrument, breakdown: rows };
  }
  if (name === "draft_team_message") {
    return {
      team: input.team,
      message: `Hi ${input.team},\n\n${input.context}\n\nCan you confirm or rebook on your side? Available to jump on a call.\n\nThanks,\nReconciliation Ops`,
    };
  }
  return { error: "unknown tool" };
}

export async function POST(req: Request) {
  const { break_id } = await req.json();
  const br = db.prepare(`SELECT * FROM breaks WHERE id = ?`).get(break_id) as
    | {
        id: number;
        trade_id: string;
        break_type: string;
        system_a_value: string | null;
        system_b_value: string | null;
        sla_deadline: string;
      }
    | undefined;
  if (!br) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const client = getClient();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      const messages: Anthropic.MessageParam[] = [
        {
          role: "user",
          content: `A reconciliation break has been detected. Investigate and produce: 1) likely root cause, 2) resolution steps, 3) the operations team to contact, 4) a draft message to that team. Use the available tools before answering.

Break ID: ${br.id}
Trade ID: ${br.trade_id}
Break type: ${br.break_type}
System A value: ${br.system_a_value ?? "missing"}
System B value: ${br.system_b_value ?? "missing"}
SLA deadline: ${br.sla_deadline}

Be concise and direct. Reference specific values from your tool calls. ${NO_EM_DASH_RULE}`,
        },
      ];

      try {
        for (let iter = 0; iter < 5; iter++) {
          const resp = await client.messages.create({
            model: MODEL,
            max_tokens: 1200,
            tools: TOOLS,
            messages,
          });

          const toolUses: Anthropic.ToolUseBlock[] = [];
          for (const block of resp.content) {
            if (block.type === "text") send({ type: "text", text: block.text });
            if (block.type === "tool_use") {
              toolUses.push(block);
              send({ type: "tool_use", name: block.name, input: block.input });
            }
          }
          messages.push({ role: "assistant", content: resp.content });

          if (resp.stop_reason === "end_turn" || toolUses.length === 0) {
            send({ type: "done" });
            controller.close();
            logAudit("ai", "investigate_break", "break", br.id);
            return;
          }

          const toolResults: Anthropic.ToolResultBlockParam[] = toolUses.map((tu) => {
            const result = runTool(tu.name, tu.input as Record<string, string>);
            send({ type: "tool_result", name: tu.name, result });
            return { type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(result) };
          });
          messages.push({ role: "user", content: toolResults });
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
