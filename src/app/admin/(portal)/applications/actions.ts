"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateToAllAuto } from "@/lib/translate";
import { geocodeAddress } from "@/lib/geocode";
import { sanitizeExternalUrl } from "@/lib/url";
import { saveInternalProfile } from "@/lib/member-internal-profiles";
import {
  sendApplicationApprovedMail,
  sendApplicationRejectedMail,
} from "@/lib/email";
import {
  LOCALES,
  normalizeMemberInternalProfile,
  type ApplicationPayload,
  type Locale,
  type MembershipApplication,
} from "@/lib/types";

/**
 * Sprache, in der der Antrag gestellt wurde. Das Formular schickt sie mit;
 * bei Anträgen von vor dieser Änderung fehlt sie — dann Deutsch.
 */
function applicantLocale(payload: ApplicationPayload): Locale {
  const value = (payload.locale || "").trim() as Locale;
  return LOCALES.includes(value) ? value : "de";
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

async function loadApplication(
  supabase: ReturnType<typeof createAdminClient>,
  id: string,
): Promise<MembershipApplication | null> {
  const { data } = await supabase
    .from("membership_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as MembershipApplication) ?? null;
}

/**
 * Antrag annehmen: legt die Firma an, erzeugt den Self-Service-Link und
 * schickt die Zusage.
 *
 * Der Antrag enthält bereits alle öffentlichen Angaben (das Formular erzwingt
 * sie), deshalb wird direkt veröffentlicht — der Admin hat den Inhalt in der
 * Vorschau gesehen und gibt mit dem Klick genau das frei.
 */
export async function approveApplication(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const app = await loadApplication(supabase, id);
  if (!app) return;
  if (app.status === "approved" || app.status === "converted") {
    // Doppelklick oder zweiter Tab: nicht zweimal anlegen.
    redirect(app.member_id ? `/admin/members/${app.member_id}` : "/admin/applications");
  }

  const p = app.payload;
  const name = (p.company || "").trim() || "Neue Firma";
  const description = (p.description || "").trim();
  const address = (p.address || "").trim() || null;
  const email = (p.email || "").trim() || null;

  const [descResult, geo] = await Promise.all([
    translateToAllAuto(description, "de"),
    address ? geocodeAddress(address) : Promise.resolve(null),
  ]);
  const sourceLang: Locale = descResult.sourceLang;

  const { data: member, error } = await supabase
    .from("members")
    .insert({
      name,
      logo_url: app.logo_url,
      description: descResult.ml,
      address,
      phone: (p.phone || "").trim() || null,
      email,
      website_url: sanitizeExternalUrl(p.website_url ?? null),
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
      canton: geo?.canton ?? null,
      source_lang: sourceLang,
      status: "published",
      is_active: true,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Was der Antrag über die Kontaktperson weiss, wandert ins interne Profil —
  // den Rest trägt die Firma über den Self-Service-Link selbst nach.
  const contact = (p.contact_person || "").trim();
  const spaceIdx = contact.lastIndexOf(" ");
  await saveInternalProfile(
    supabase,
    member.id,
    normalizeMemberInternalProfile({
      contact_first_name: spaceIdx > 0 ? contact.slice(0, spaceIdx) : contact || null,
      contact_last_name: spaceIdx > 0 ? contact.slice(spaceIdx + 1) : null,
      direct_email: email,
      direct_phone: (p.phone || "").trim() || null,
    }),
  );

  // Self-Service-Token erzeugen (ein aktiver pro Firma).
  const token = randomBytes(32).toString("base64url");
  const { error: tokenErr } = await supabase.from("member_edit_tokens").insert({
    member_id: member.id,
    token,
    is_active: true,
  });
  if (tokenErr) throw new Error(tokenErr.message);

  await supabase
    .from("membership_applications")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      member_id: member.id,
    })
    .eq("id", id);

  // Zusage verschicken. Ein Mail-Fehler darf die Aufnahme nicht rückgängig
  // machen — der Admin kann den Link im Mitglieder-Detail erneut senden.
  if (email) {
    try {
      const locale = applicantLocale(p);
      const localePrefix = locale !== "de" ? `${locale}/` : "";
      await sendApplicationApprovedMail({
        to: email,
        memberName: name,
        editUrl: `${appBaseUrl()}/${localePrefix}edit/${token}`,
        locale,
      });
    } catch (err) {
      console.error("application approved mail failed:", err);
    }
  }

  revalidatePath("/admin/applications");
  revalidatePath("/admin/members");
  redirect(`/admin/members/${member.id}`);
}

/**
 * Antrag ablehnen. Die Begründung ist optional, geht aber — falls angegeben —
 * unverändert an die Firma.
 */
export async function rejectApplication(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const app = await loadApplication(supabase, id);
  if (!app) return;

  const reason = String(formData.get("reason") || "").trim().slice(0, 2000) || null;

  await supabase
    .from("membership_applications")
    .update({
      status: "rejected",
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  const email = (app.payload.email || "").trim();
  if (email) {
    try {
      await sendApplicationRejectedMail({
        to: email,
        memberName: (app.payload.company || "").trim() || email,
        reason,
        locale: applicantLocale(app.payload),
      });
    } catch (err) {
      console.error("application rejected mail failed:", err);
    }
  }

  revalidatePath("/admin/applications");
}

export async function archiveApplication(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase
    .from("membership_applications")
    .update({ status: "archived" })
    .eq("id", id);
  revalidatePath("/admin/applications");
}

export async function deleteApplication(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await supabase.from("membership_applications").delete().eq("id", id);
  revalidatePath("/admin/applications");
}
