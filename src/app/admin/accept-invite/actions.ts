"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminT } from "@/lib/i18n-admin";

export interface AcceptState {
  error?: string;
}

export async function setInvitedPassword(
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
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
    return { error: t("invite.errExpired") };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/admin");
}
