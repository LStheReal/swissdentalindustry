"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberByToken } from "@/lib/edit-token";
import { sendAdminChangeNotification } from "@/lib/email";
import { describeMemberValuePair, memberFieldLabel } from "@/lib/email-templates";
import { getRecipient } from "@/lib/forms";
import { getInternalProfileForMember } from "@/lib/member-internal-profiles";
import { translateToAllAuto } from "@/lib/translate";
import { uploadImage } from "@/lib/storage";
import {
  LOCALES,
  MEMBER_INTERNAL_PROFILE_KEYS,
  normalizeMemberInternalProfile,
  type Locale,
  type MemberEditableFields,
  type MemberInternalProfileFields,
  type Multilingual,
} from "@/lib/types";

export interface SubmitState {
  step?: "edit" | "preview" | "done";
  error?: string;
  proposed?: Partial<MemberEditableFields>;
  contact_email?: string | null;
}

function eq(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function readInternalProfile(formData: FormData): MemberInternalProfileFields {
  return normalizeMemberInternalProfile(
    Object.fromEntries(
      MEMBER_INTERNAL_PROFILE_KEYS.map((key) => [
        key,
        String(formData.get(`internal_${key}`) || ""),
      ]),
    ) as Partial<MemberInternalProfileFields>,
  );
}

export async function previewChange(
  token: string,
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const member = await getMemberByToken(token);
  if (!member) return { step: "edit", error: "invalid" };

  const sourceLangRaw = String(formData.get("source_lang") || member.source_lang);
  const sourceLang: Locale = LOCALES.includes(sourceLangRaw as Locale)
    ? (sourceLangRaw as Locale)
    : "de";

  const descriptionText = String(formData.get("description") || "").trim();
  const address = String(formData.get("address") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const website_url = String(formData.get("website_url") || "").trim() || null;
  const logoFile = formData.get("logo");
  const internalProfile = readInternalProfile(formData);

  // Nur neu übersetzen, wenn der Source-Text sich gegenüber dem aktuellen Live-
  // Stand wirklich unterscheidet. Sonst würde LLM-Drift (DeepSeek
  // non-deterministic) bei jedem Submit eine "Änderung" erzeugen, obwohl die
  // Firma die Beschreibung gar nicht angefasst hat.
  const liveSourceText = (member.description?.[sourceLang] ?? "").trim();
  const descriptionChanged =
    descriptionText.length > 0 && descriptionText !== liveSourceText;

  let logoUrl: string | null = null;
  let descriptionMl: Multilingual | null = null;
  try {
    const [logo, descResult] = await Promise.all([
      uploadImage("logos", logoFile instanceof File ? logoFile : null),
      descriptionChanged
        ? translateToAllAuto(descriptionText, sourceLang)
        : Promise.resolve(null),
    ]);
    logoUrl = logo;
    descriptionMl = descResult?.ml ?? null;
  } catch (err) {
    console.error("previewChange processing failed:", err);
    return { step: "edit", error: "processing" };
  }

  const supabase = createAdminClient();
  const currentInternalProfile = await getInternalProfileForMember(supabase, member.id);

  const proposed: Partial<MemberEditableFields> = {};
  if (logoUrl) proposed.logo_url = logoUrl;
  if (descriptionMl) proposed.description = descriptionMl;
  if (!eq(address, member.address)) proposed.address = address;
  if (!eq(phone, member.phone)) proposed.phone = phone;
  if (!eq(email, member.email)) proposed.email = email;
  if (!eq(website_url, member.website_url)) proposed.website_url = website_url;
  if (!eq(internalProfile, currentInternalProfile)) {
    proposed.internal_profile = internalProfile;
  }

  if (Object.keys(proposed).length === 0) {
    return { step: "edit", error: "nochange" };
  }

  // Duplicate-Check: existiert bereits eine offene Anfrage mit exakt diesem Inhalt?
  const { data: pending } = await supabase
    .from("member_change_requests")
    .select("proposed")
    .eq("member_id", member.id)
    .eq("status", "pending");

  if (pending?.some((r) => eq(r.proposed, proposed))) {
    return { step: "edit", error: "duplicate" };
  }

  return {
    step: "preview",
    proposed,
    contact_email: email || member.email,
  };
}

async function deleteOpenRequests(supabase: ReturnType<typeof createAdminClient>, memberId: string) {
  // Pro Firma soll immer nur die jüngste offene Anfrage existieren — ältere
  // pending Einreichungen werden überschrieben.
  const { error } = await supabase
    .from("member_change_requests")
    .delete()
    .eq("member_id", memberId)
    .eq("status", "pending");
  if (error) console.error("delete previous pending failed:", error);
}

export async function confirmChange(
  token: string,
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const member = await getMemberByToken(token);
  if (!member) return { step: "edit", error: "invalid" };

  const raw = String(formData.get("proposed") || "");
  const contactEmail = String(formData.get("contact_email") || "") || member.email;
  let proposed: Partial<MemberEditableFields>;
  try {
    proposed = JSON.parse(raw);
  } catch {
    return { step: "edit", error: "processing" };
  }

  if (!proposed || Object.keys(proposed).length === 0) {
    return { step: "edit", error: "nochange" };
  }

  const supabase = createAdminClient();

  // Alte offene Anfrage(n) dieser Firma überschreiben — es soll nur die
  // jüngste Einreichung im Feed des Admin-Portals erscheinen.
  await deleteOpenRequests(supabase, member.id);

  const { error } = await supabase.from("member_change_requests").insert({
    member_id: member.id,
    proposed,
    status: "pending",
    contact_email: contactEmail,
  });
  revalidatePath(`/edit/${token}`);
  if (error) {
    console.error("insert change request failed:", error);
    return { step: "edit", error: "save" };
  }

  // Admin asynchron informieren — ein Mail-Fehler darf den User-Flow nicht
  // umwerfen, der Vorschlag liegt bereits im Feed.
  try {
    const to = await getRecipient("admin_notification_email");
    if (to) {
      const currentRecord = member as unknown as Record<string, unknown>;
      const diff = Object.entries(proposed).map(([key, value]) => {
        const pair = describeMemberValuePair(key, currentRecord[key], value);
        return { label: memberFieldLabel(key), ...pair };
      });
      const totalFields = 7; // address, phone, email, website_url, description, logo_url, internal_profile
      await sendAdminChangeNotification({
        to,
        memberName: member.name,
        contactEmail: contactEmail,
        submittedAt: new Date(),
        changedCount: diff.length,
        totalFields,
        diff,
      });
    }
  } catch (err) {
    console.error("admin change notification failed:", err);
  }

  return { step: "done" };
}
