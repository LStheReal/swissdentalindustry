"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { geocodeAfterResponse } from "@/lib/after-response";
import { sendChangeApprovedMail } from "@/lib/email";
import { describeMemberValue, memberFieldLabel } from "@/lib/email-templates";
import { getInternalProfileForMember, saveInternalProfile } from "@/lib/member-internal-profiles";
import { sanitizeExternalUrl } from "@/lib/url";
import {
  normalizeMemberInternalProfile,
  type Member,
  type MemberChangeRequest,
  type MemberInternalProfileFields,
} from "@/lib/types";

// Nur diese Spalten dürfen aus einem Change-Request in `members` übernommen
// werden — `proposed` stammt ursprünglich vom unauthentifizierten Edit-Link.
const APPROVABLE_MEMBER_KEYS = [
  "logo_url",
  "description",
  "address",
  "phone",
  "email",
  "website_url",
] as const;

export async function approveChange(requestId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: reqData } = await supabase
    .from("member_change_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "pending")
    .maybeSingle();
  if (!reqData) return;
  const request = reqData as MemberChangeRequest;

  // Anfrage beanspruchen, bevor irgendetwas übernommen wird. Ohne diesen
  // bedingten Update übernehmen zwei parallele Klicks dieselbe Änderung
  // zweimal und verschicken zwei Bestätigungsmails.
  const { data: claimed } = await supabase
    .from("member_change_requests")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (!claimed) {
    revalidatePath("/admin/feed");
    return;
  }

  const { data: memberData } = await supabase
    .from("members")
    .select("*")
    .eq("id", request.member_id)
    .maybeSingle();
  if (!memberData) return;
  const member = memberData as Member;

  // Vorgeschlagene Felder auf den Live-Stand übernehmen. Interne
  // Mitgliedsdaten bleiben in der separaten, nicht öffentlichen Tabelle.
  const { internal_profile: internalProfile, ...publicProposed } = request.proposed;
  const update: Record<string, unknown> = {};
  for (const key of APPROVABLE_MEMBER_KEYS) {
    if (key in publicProposed) {
      update[key] = (publicProposed as Record<string, unknown>)[key];
    }
  }
  if ("website_url" in update) {
    update.website_url = sanitizeExternalUrl(update.website_url as string | null);
  }

  // Bei Adressänderung: alte Koordinaten sofort verwerfen, die neuen holt
  // geocodeAfterResponse nach der Antwort — der Aufruf kostet sonst Wartezeit.
  const newAddress =
    "address" in publicProposed && publicProposed.address !== member.address
      ? (publicProposed.address ?? null)
      : undefined;
  if (newAddress !== undefined) {
    update.lat = null;
    update.lng = null;
    update.canton = null;
  }

  if (Object.keys(update).length > 0) {
    const { error: updErr } = await supabase
      .from("members")
      .update(update)
      .eq("id", member.id);
    if (updErr) throw new Error(updErr.message);
  }

  if (internalProfile) {
    const profile = normalizeMemberInternalProfile(
      internalProfile as Partial<MemberInternalProfileFields>,
    );
    // Admin-only-Felder können über den Self-Service nie geändert werden —
    // auch bei älteren, vor dieser Prüfung eingereichten Anfragen.
    const current = await getInternalProfileForMember(supabase, member.id);
    profile.membership_fee = current.membership_fee;
    profile.internal_notes = current.internal_notes;
    await saveInternalProfile(supabase, member.id, profile);
  }

  if (newAddress !== undefined) {
    geocodeAfterResponse({ memberId: member.id, address: newAddress });
  }

  // Firma benachrichtigen — nach der Antwort, damit der SMTP-Versand die
  // Freigabe nicht verzögert. Fehler blockieren die Freigabe ohnehin nicht.
  const to = request.contact_email || member.email;
  if (to) {
    after(async () => {
      try {
        const locale = member.source_lang;
        const changes = Object.entries(request.proposed).map(([key, value]) => ({
          label: memberFieldLabel(key, locale),
          value: describeMemberValue(key, value),
        }));
        await sendChangeApprovedMail({
          to,
          memberName: member.name,
          changes,
          locale,
        });
      } catch (err) {
        console.error("notification email failed:", err);
      }
    });
  }

  revalidatePath("/admin/feed");
}

export async function rejectChange(requestId: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("member_change_requests")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/feed");
}
