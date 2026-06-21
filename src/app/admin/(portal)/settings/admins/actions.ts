"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sendAdminInviteMail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export async function inviteAdmin(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Bitte eine gültige E-Mail-Adresse angeben.");
  }

  const supabase = createAdminClient();

  let userId: string | null = null;

  const { data: list, error: listErr } =
    await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw new Error(listErr.message);
  const existing = list.users.find(
    (u) => (u.email ?? "").toLowerCase() === email,
  );
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://swissdentalindustry.ch"
  ).replace(/\/$/, "");
  const redirectTo = `${base}/admin/accept-invite`;

  if (existing) {
    userId = existing.id;
    const { data: link, error: linkErr } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });
    if (linkErr) throw new Error(linkErr.message);
    const inviteUrl = link.properties?.action_link;
    if (!inviteUrl) {
      throw new Error("Einladungs-Link konnte nicht erstellt werden.");
    }
    await sendAdminInviteMail({ to: email, inviteUrl });
  } else {
    const { data: invited, error: invErr } =
      await supabase.auth.admin.generateLink({
        type: "invite",
        email,
        options: { redirectTo },
      });
    if (invErr) throw new Error(invErr.message);
    userId = invited.user?.id ?? null;
    const inviteUrl = invited.properties?.action_link;
    if (!inviteUrl) {
      throw new Error("Einladungs-Link konnte nicht erstellt werden.");
    }
    await sendAdminInviteMail({ to: email, inviteUrl });
  }

  if (!userId) throw new Error("Benutzer-ID konnte nicht ermittelt werden.");

  const { error: insErr } = await supabase
    .from("admins")
    .upsert({ user_id: userId, email }, { onConflict: "user_id" });
  if (insErr) throw new Error(insErr.message);

  revalidatePath("/admin/settings/admins");
}

export async function removeAdmin(formData: FormData) {
  const current = await requireAdmin();
  const userId = String(formData.get("user_id") || "").trim();
  if (!userId) throw new Error("user_id fehlt.");
  if (userId === current.id) {
    throw new Error("Du kannst dich nicht selbst entfernen.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("admins").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings/admins");
}
