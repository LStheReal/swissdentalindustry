"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminT } from "@/lib/i18n-admin";

export interface ResetState {
  error?: string;
}

/**
 * Setzt das neue Passwort. Läuft in der Recovery-Session, die der Link aus der
 * E-Mail erzeugt hat (siehe page.tsx), und ändert ausschliesslich das eigene
 * Konto — kein Service-Role-Client, also kein Weg zu fremden Konten.
 */
export async function setNewPassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const { t } = await getAdminT();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 8) {
    return { error: t("reset.errTooShort") };
  }
  if (password !== confirm) {
    return { error: t("reset.errMismatch") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error:
        "Der Link ist abgelaufen oder wurde bereits benutzt. Bitte einen neuen anfordern.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/admin");
}
