import { createAdminClient } from "./supabase/admin";

// Liest ein eingereichtes Formular als flaches String-Objekt — egal ob als
// JSON oder als multipart/urlencoded gesendet.
export async function parseFormPayload(
  request: Request,
): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") || "";
  const out: Record<string, string> = {};

  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    for (const [k, v] of Object.entries(json)) out[k] = String(v ?? "");
  } else {
    const form = await request.formData();
    for (const [k, v] of form.entries()) out[k] = String(v);
  }
  return out;
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
