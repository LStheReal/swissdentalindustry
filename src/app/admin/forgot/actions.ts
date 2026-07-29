"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { rateLimit } from "@/lib/rate-limit";

export interface ForgotState {
  sent?: boolean;
  error?: string;
}

/**
 * Passwort-Reset anfordern. Supabase verschickt die Mail selbst (eigener
 * Mailversand der Plattform) — funktioniert also auch ohne unsere SMTP-Config.
 *
 * Anti-Enumeration: die Antwort ist immer dieselbe, egal ob die Adresse
 * existiert. Sonst liesse sich über dieses Formular herausfinden, welche
 * E-Mail-Adressen ein Superadmin-Konto haben.
 */
export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Bitte eine gültige E-Mail-Adresse eingeben." };
  }

  // Der Endpunkt ist öffentlich: pro IP und pro Adresse begrenzen, damit
  // niemand fremde Postfächer zumüllen kann.
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`forgot:ip:${ip}`, 5, 15 * 60_000)) {
    return { error: "Zu viele Versuche. Bitte später erneut probieren." };
  }
  if (!rateLimit(`forgot:mail:${email}`, 3, 60 * 60_000)) {
    return { sent: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/admin/reset-password`,
  });

  // Fehler werden geloggt, aber nicht angezeigt — siehe Anti-Enumeration.
  if (error) console.error("password reset request failed:", error.message);

  return { sent: true };
}
