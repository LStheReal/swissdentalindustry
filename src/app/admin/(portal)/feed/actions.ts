"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { geocodeAddress } from "@/lib/geocode";
import { sendChangeApprovedMail } from "@/lib/email";
import { describeMemberValue, memberFieldLabel } from "@/lib/email-templates";
import { saveInternalProfile } from "@/lib/member-internal-profiles";
import {
  normalizeMemberInternalProfile,
  type Member,
  type MemberChangeRequest,
  type MemberInternalProfileFields,
} from "@/lib/types";

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
  const update: Record<string, unknown> = { ...publicProposed };

  // Bei Adressänderung neu geocodieren.
  if (
    "address" in publicProposed &&
    publicProposed.address !== member.address
  ) {
    const geo = publicProposed.address
      ? await geocodeAddress(publicProposed.address)
      : null;
    update.lat = geo?.lat ?? null;
    update.lng = geo?.lng ?? null;
    update.canton = geo?.canton ?? null;
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
    await saveInternalProfile(supabase, member.id, profile);
  }

  await supabase
    .from("member_change_requests")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", requestId);

  // Firma benachrichtigen (Fehler hier sollen die Freigabe nicht blockieren).
  const to = request.contact_email || member.email;
  if (to) {
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
