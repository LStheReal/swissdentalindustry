import Anthropic from "@anthropic-ai/sdk";

/**
 * Gemeinsamer Anthropic-Client für Übersetzung und Mitglieder-Import.
 * Braucht `ANTHROPIC_API_KEY`; ohne Key sind die KI-Funktionen deaktiviert
 * (die Aufrufer fallen dann auf ihre Heuristiken bzw. den Originaltext zurück).
 */

export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

export function hasAI(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing. AI features are disabled.");
  }
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

/**
 * Schickt System- + User-Prompt an Claude und gibt das geparste JSON-Objekt
 * zurück. Ein eventueller Markdown-Codefence wird entfernt.
 */
export async function askForJson<T>(args: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const message = await getClient().messages.create({
    model: AI_MODEL,
    max_tokens: args.maxTokens ?? 8000,
    system:
      args.system +
      "\n\nRespond with a single JSON object and nothing else — no prose, no code fences.",
    messages: [{ role: "user", content: args.user }],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error(`Model did not return JSON: ${cleaned.slice(0, 200)}`);
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}
