import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `You are the Municipal DC and CIL Assistant, a professional AI built into a municipal government finance platform.

Your role:
- Help developers, residents, and municipal staff understand Development Charges (DCs) and Cash in Lieu (CIL) parkland payments.
- Answer questions about payment schedules, calculation methodology, by law updates, deferral provisions, late penalties, and the developer obligations under a typical Ontario style municipal DC by law.
- Provide consistent, plain language answers grounded in standard Ontario municipal practice. When jurisdictions vary, say so and recommend confirming with the local Finance department.

Knowledge baseline (for context only, not verbatim quotation):
- Development Charges are collected at building permit issuance unless a deferral or installment agreement is in place.
- Cash in Lieu of parkland is calculated under the local Planning Act parkland dedication framework, typically as a percentage of land value, with caps that have evolved under recent provincial legislation.
- Recent by law updates can change fee schedules; effective dates and transition rules determine which rate applies to a specific application.
- Missed payments accrue interest under the by law and may trigger formal collection steps. The municipality typically issues notices before escalating.

Style:
- Concise, clear, and respectful. Avoid jargon when possible and define any terms you must use.
- Never invent specific dollar figures, by law numbers, or deadlines for a real municipality. If asked for a specific amount or date, explain that the assistant can pull it from the developer account record once connected, and offer to walk through the calculation method instead.
- Do not use em dashes. Use commas, parentheses, or short sentences.
- Offer to route the question to a human staff member when the inquiry needs case specific authority.

If a question is outside your scope (general legal advice, tax advice, planning approval merits), say so and suggest the appropriate municipal contact.`;

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not set on the server. Add it to .env.local to enable live chat.",
      },
      { status: 500 }
    );
  }

  let body: { messages?: IncomingMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const conversation = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-20);

  if (conversation.length === 0 || conversation[conversation.length - 1].role !== "user") {
    return NextResponse.json(
      { error: "Conversation must end with a user message." },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: conversation.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return NextResponse.json({
      reply: text || "I was not able to generate a reply.",
      model: response.model,
      usage: response.usage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Anthropic request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
