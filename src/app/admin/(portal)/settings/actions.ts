"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const mitwirken_email = String(formData.get("mitwirken_email") || "").trim() || null;
  const membership_email = String(formData.get("membership_email") || "").trim() || null;
  const admin_notification_email =
    String(formData.get("admin_notification_email") || "").trim() || null;
  const email_test_mode = formData.get("email_test_mode") === "on";
  const email_test_recipients =
    String(formData.get("email_test_recipients") || "").trim() || null;

  const { error } = await supabase
    .from("app_settings")
    .update({
      mitwirken_email,
      membership_email,
      admin_notification_email,
      email_test_mode,
      email_test_recipients,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
}
