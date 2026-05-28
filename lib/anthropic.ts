import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

let client: Anthropic | null = null;
export function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set in .env.local");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const NO_EM_DASH_RULE =
  "Never use em dashes (—). Use commas, periods, or rephrase. Be concise and direct.";
