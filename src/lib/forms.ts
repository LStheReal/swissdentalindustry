import { createAdminClient } from "./supabase/admin";

// Harte Grenzen für eingereichte Formulare — die Endpunkte sind öffentlich.
const MAX_FIELDS = 40;
const MAX_KEY_LENGTH = 64;
const MAX_VALUE_LENGTH = 5000;
const MAX_TOTAL_LENGTH = 20000;

// Unsichtbares Honeypot-Feld: Menschen lassen es leer, Bots füllen es aus.
export const HONEYPOT_FIELD = "_hp";

// Liest ein eingereichtes Formular als flaches String-Objekt — egal ob als
// JSON oder als multipart/urlencoded gesendet. Feldanzahl und -längen sind
// begrenzt; gefährliche Schlüssel werden verworfen.
export async function parseFormPayload(
  request: Request,
): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") || "";
  const out: Record<string, string> = {};

  const entries: [string, unknown][] = [];
  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    entries.push(...Object.entries(json));
  } else {
    const form = await request.formData();
    entries.push(...form.entries());
  }

  let total = 0;
  for (const [rawKey, rawValue] of entries) {
    if (Object.keys(out).length >= MAX_FIELDS) break;
    const key = rawKey.slice(0, MAX_KEY_LENGTH);
    if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
    const value = String(rawValue ?? "").slice(0, MAX_VALUE_LENGTH);
    total += value.length;
    if (total > MAX_TOTAL_LENGTH) break;
    out[key] = value;
  }
  return out;
}

/** True, wenn das Honeypot-Feld ausgefüllt wurde (Bot). Entfernt es aus dem Payload. */
export function isHoneypotTripped(payload: Record<string, string>): boolean {
  const tripped = Boolean(payload[HONEYPOT_FIELD]?.trim());
  delete payload[HONEYPOT_FIELD];
  return tripped;
}

// Wandelt ein Payload-Objekt in lesbaren E-Mail-Text um.
export function payloadToText(payload: Record<string, string>): string {
  return Object.entries(payload)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

// Empfänger-Adresse aus den App-Einstellungen (mit Env-Fallback).
export async function getRecipient(
  field: "mitwirken_email" | "membership_email" | "admin_notification_email",
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("app_settings")
    .select(field)
    .eq("id", 1)
    .maybeSingle();
  const configured = (data as Record<string, string | null> | null)?.[field];
  return configured || process.env.DEFAULT_FORM_RECIPIENT || null;
}
