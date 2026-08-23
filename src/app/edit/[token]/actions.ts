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
import { sanitizeExternalUrl } from "@/lib/url";
import { ADDRESS_KEYS } from "@/lib/address";
import { cleanDescription, stripDuplicatedName } from "@/lib/description";
import {
  LOCALES,
  MEMBER_SELF_SERVICE_PROFILE_KEYS,
  normalizeMemberInternalProfile,
  type Locale,
  type MemberEditableFields,
  type MemberInternalProfileFields,
  type Multilingual,
} from "@/lib/types";

export interface SubmitState {
  step?: "edit" | "done";
  error?: string;
}

function eq(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

// Liest nur die Self-Service-Felder aus dem Formular — Admin-only-Felder
// (Beitrag, interne Notizen) kann die Firma weder sehen noch ändern.
function readInternalProfile(formData: FormData): MemberInternalProfileFields {
  return normalizeMemberInternalProfile(
    Object.fromEntries(
      MEMBER_SELF_SERVICE_PROFILE_KEYS.map((key) => [
        key,
        String(formData.get(`internal_${key}`) || ""),
      ]),
    ) as Partial<MemberInternalProfileFields>,
  );
}

function field(formData: FormData, key: string, maxLength: number): string | null {
  const value = String(formData.get(key) || "").trim();
  return value ? value.slice(0, maxLength) : null;
}

/**
 * Speichert die Änderungen einer Firma als Vorschlag für die Prüfung.
 *
 * Ein Schritt, kein Bestätigen mehr. Vorher musste die Firma ihre eigenen
 * Eingaben erst in einer Vorschau abnicken, bevor überhaupt etwas gespeichert
 * wurde — wer dort abbrach oder den Tab schloss, verlor alles, und geprüft
 * wird ohnehin im Sekretariat.
 *
 * Der Wegfall der Vorschau schliesst nebenbei eine Angriffsfläche: der
 * Vorschlag lief bisher als verstecktes Feld durch den Browser und musste
 * serverseitig gegen Mass Assignment gefiltert werden. Jetzt entsteht er
 * ausschliesslich hier und verlässt den Server nie.
 */
export async function submitChange(
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

  const descriptionText = stripDuplicatedName(
    member.name,
    String(formData.get("description") || "").trim(),
  );
  const phone = field(formData, "phone", 100);
  const email = field(formData, "email", 200);
  const websiteRaw = String(formData.get("website_url") || "").trim();
  const website_url = sanitizeExternalUrl(websiteRaw);
  if (websiteRaw && !website_url) return { step: "edit", error: "website" };

  const logoFile = formData.get("logo");
  const internalProfile = readInternalProfile(formData);

  // Nur neu übersetzen, wenn der Quelltext sich gegenüber dem Live-Stand
  // wirklich unterscheidet. Sonst würde die Nicht-Determiniertheit des Modells
  // bei jedem Absenden eine "Änderung" erzeugen, obwohl die Firma die
  // Beschreibung gar nicht angefasst hat.
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
    descriptionMl = descResult ? cleanDescription(member.name, descResult.ml) : null;
  } catch (err) {
    console.error("submitChange processing failed:", err);
    return { step: "edit", error: "processing" };
  }

  const supabase = createAdminClient();
  const currentInternalProfile = await getInternalProfileForMember(supabase, member.id);

  // Admin-only-Felder stehen nicht im Formular — für Vergleich und Speicherung
  // gilt immer der aktuelle Stand aus der Datenbank.
  internalProfile.membership_fee = currentInternalProfile.membership_fee;
  internalProfile.internal_notes = currentInternalProfile.internal_notes;

  const proposed: Partial<MemberEditableFields> = {};
  if (logoUrl) proposed.logo_url = logoUrl;
  if (descriptionMl) proposed.description = descriptionMl;
  for (const key of ADDRESS_KEYS) {
    const value = field(formData, key, 200);
    if (!eq(value, member[key])) proposed[key] = value;
  }
  if (!eq(phone, member.phone)) proposed.phone = phone;
  if (!eq(email, member.email)) proposed.email = email;
  if (!eq(website_url, member.website_url)) proposed.website_url = website_url;
  if (!eq(internalProfile, currentInternalProfile)) {
    proposed.internal_profile = internalProfile;
  }

  if (Object.keys(proposed).length === 0) {
    return { step: "edit", error: "nochange" };
  }

  const { data: pending } = await supabase
    .from("member_change_requests")
    .select("proposed")
    .eq("member_id", member.id)
    .eq("status", "pending");

  if (pending?.some((r) => eq(r.proposed, proposed))) {
    return { step: "edit", error: "duplicate" };
  }

  // Pro Firma soll immer nur die jüngste offene Anfrage existieren — ältere
  // pending Einreichungen werden überschrieben.
  const { error: delErr } = await supabase
    .from("member_change_requests")
    .delete()
    .eq("member_id", member.id)
    .eq("status", "pending");
  if (delErr) console.error("delete previous pending failed:", delErr);

  const contactEmail = email || member.email;
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

  // Admin informieren — ein Mail-Fehler darf den Ablauf nicht umwerfen, der
  // Vorschlag liegt bereits im Feed.
  try {
    const to = await getRecipient("admin_notification_email");
    if (to) {
      const currentRecord = member as unknown as Record<string, unknown>;
      const diff = Object.entries(proposed).map(([key, value]) => {
        const pair = describeMemberValuePair(key, currentRecord[key], value);
        return { label: memberFieldLabel(key), ...pair };
      });
      // street_name, street_number, postal_code, city, phone, email,
      // website_url, description, logo_url, internal_profile
      const totalFields = 10;
      await sendAdminChangeNotification({
        to,
        memberName: member.name,
        contactEmail,
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
