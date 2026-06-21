"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateToAll, translateToAllAuto } from "@/lib/translate";
import { geocodeAddress } from "@/lib/geocode";
import { uploadImage } from "@/lib/storage";
import { sendMemberWelcomeMail } from "@/lib/email";
import {
  ensureInternalProfilesTableAvailable,
  saveInternalProfile,
} from "@/lib/member-internal-profiles";
import { getImportedMemberKey, parseMemberImportSpreadsheet } from "@/lib/member-import";
import {
  LOCALES,
  MEMBER_INTERNAL_PROFILE_KEYS,
  emptyMultilingual,
  normalizeMemberInternalProfile,
  type Locale,
  type Multilingual,
  type MemberInternalProfileFields,
} from "@/lib/types";

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

// Erzeugt einen frischen, aktiven Edit-Token und widerruft vorhandene aktive
// Tokens dieser Firma (max. ein aktiver pro Firma — DB-Unique-Index erzwingt
// es zusätzlich). Liefert den Token-String zurück.
async function createEditTokenFor(
  supabase: ReturnType<typeof createAdminClient>,
  memberId: string,
): Promise<string> {
  await supabase
    .from("member_edit_tokens")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("member_id", memberId)
    .eq("is_active", true);

  const token = randomBytes(32).toString("base64url");
  const { error } = await supabase.from("member_edit_tokens").insert({
    member_id: memberId,
    token,
    is_active: true,
  });
  if (error) throw new Error(error.message);
  return token;
}

function readLocale(formData: FormData): Locale {
  const v = String(formData.get("source_lang") || "de");
  return (LOCALES.includes(v as Locale) ? v : "de") as Locale;
}

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) || "").trim();
  return v || null;
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

async function upsertInternalProfile(
  supabase: ReturnType<typeof createAdminClient>,
  memberId: string,
  profile: MemberInternalProfileFields,
) {
  await saveInternalProfile(supabase, memberId, profile);
}

export interface ImportMembersState {
  status: "idle" | "success" | "error";
  message: string;
  importedCount: number;
  updatedCount: number;
  duplicateCount: number;
  skippedCount: number;
  details: string[];
}

export async function createMember(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const fallbackLang = readLocale(formData);
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const address = str(formData, "address");
  const email = str(formData, "email");
  const image = formData.get("logo");

  const [descResult, logoUrl, geo] = await Promise.all([
    translateToAllAuto(description, fallbackLang),
    uploadImage("logos", image instanceof File ? image : null),
    address ? geocodeAddress(address) : Promise.resolve(null),
  ]);
  const sourceLang = descResult.sourceLang;

  const { data, error } = await supabase
    .from("members")
    .insert({
      name,
      logo_url: logoUrl,
      description: descResult.ml,
      address,
      phone: str(formData, "phone"),
      email,
      website_url: str(formData, "website_url"),
      member_since: str(formData, "member_since"),
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

  await upsertInternalProfile(supabase, data.id, readInternalProfile(formData));

  // Self-Service-Link sofort erzeugen und der Firma per Mail zustellen, damit
  // der Admin nichts manuell verschicken muss. Mail-Fehler dürfen das Anlegen
  // nicht abbrechen.
  if (email) {
    try {
      const token = await createEditTokenFor(supabase, data.id);
      const localePrefix = sourceLang !== "de" ? `${sourceLang}/` : "";
      await sendMemberWelcomeMail({
        to: email,
        memberName: name,
        editUrl: `${appBaseUrl()}/${localePrefix}edit/${token}`,
        locale: sourceLang,
      });
    } catch (err) {
      console.error("member welcome mail failed:", err);
    }
  }

  revalidatePath("/admin/members");
  redirect(`/admin/members/${data.id}`);
}

export async function updateMember(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const fallbackLang = readLocale(formData);
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const originalDescription = String(formData.get("_original_description") || "").trim();
  const address = str(formData, "address");
  const image = formData.get("logo");

  // Bestehende Firma laden, um zu prüfen, ob sich die Adresse geändert hat.
  const { data: existing } = await supabase
    .from("members")
    .select("address, lat, lng, canton")
    .eq("id", id)
    .single();

  const addressChanged = (existing?.address ?? null) !== address;
  const sourceChanged = description !== originalDescription;
  const skipTranslate = formData.get("_skip_translate") === "1";
  const effectiveSourceLangRaw = String(formData.get("_effective_source_lang") || "").trim();
  const effectiveSourceLang: Locale = (LOCALES.includes(effectiveSourceLangRaw as Locale) ? effectiveSourceLangRaw : fallbackLang) as Locale;

  let descMl: Multilingual;
  let sourceLang: Locale;

  const removeLogo = formData.get("remove_logo") === "1";

  if (!skipTranslate && (sourceChanged || !originalDescription)) {
    // Quelltext geändert → neu übersetzen
    const [descResult, newLogoUrl, geo] = await Promise.all([
      translateToAllAuto(description, fallbackLang),
      uploadImage("logos", image instanceof File ? image : null),
      addressChanged && address ? geocodeAddress(address) : Promise.resolve(null),
    ]);
    descMl = descResult.ml;
    sourceLang = descResult.sourceLang;

    const update: Record<string, unknown> = {
      name,
      description: descMl,
      address,
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      website_url: str(formData, "website_url"),
      member_since: str(formData, "member_since"),
      source_lang: sourceLang,
      status: "published",
    };
    if (removeLogo) update.logo_url = null;
    else if (newLogoUrl) update.logo_url = newLogoUrl;
    if (addressChanged) {
      update.lat = geo?.lat ?? null;
      update.lng = geo?.lng ?? null;
      update.canton = geo?.canton ?? null;
    }
    const { error } = await supabase.from("members").update(update).eq("id", id);
    if (error) throw new Error(error.message);
    await upsertInternalProfile(supabase, id, readInternalProfile(formData));
    revalidatePath("/admin/members");
    redirect("/admin/members");
  }

  // Quelltext unverändert oder skip_translate → Übersetzungen direkt speichern
  const directDesc: Multilingual = {
    de: String(formData.get("desc_de") || "").trim(),
    fr: String(formData.get("desc_fr") || "").trim(),
    it: String(formData.get("desc_it") || "").trim(),
    en: String(formData.get("desc_en") || "").trim(),
  };
  descMl = directDesc;
  sourceLang = effectiveSourceLang;

  const [newLogoUrl, geo] = await Promise.all([
    uploadImage("logos", image instanceof File ? image : null),
    addressChanged && address ? geocodeAddress(address) : Promise.resolve(null),
  ]);

  const update: Record<string, unknown> = {
    name,
    description: descMl,
    address,
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    website_url: str(formData, "website_url"),
    member_since: str(formData, "member_since"),
    source_lang: sourceLang,
    status: "published",
  };
  if (removeLogo) update.logo_url = null;
  else if (newLogoUrl) update.logo_url = newLogoUrl;
  if (addressChanged) {
    update.lat = geo?.lat ?? null;
    update.lng = geo?.lng ?? null;
    update.canton = geo?.canton ?? null;
  }

  const { error } = await supabase.from("members").update(update).eq("id", id);
  if (error) throw new Error(error.message);

  await upsertInternalProfile(supabase, id, readInternalProfile(formData));

  revalidatePath("/admin/members");
  redirect("/admin/members");
}


export async function publishMember(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("members")
    .update({ status: "published" })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
}

export async function deleteMember(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/members");
}

export async function importMembers(
  _prevState: ImportMembersState,
  formData: FormData,
): Promise<ImportMembersState> {
  await requireAdmin();

  const file = formData.get("spreadsheet");
  if (!(file instanceof File) || !file.size) {
    return {
      status: "error",
      message: "Bitte eine Spreadsheet-Datei auswählen.",
      importedCount: 0,
      updatedCount: 0,
      duplicateCount: 0,
      skippedCount: 0,
      details: [],
    };
  }

  try {
    const supabase = createAdminClient();
    await ensureInternalProfilesTableAvailable(supabase);

    const parsed = await parseMemberImportSpreadsheet(file);
    const { data: existingRows, error: existingError } = await supabase
      .from("members")
      .select("id, name");

    if (existingError) {
      throw new Error(existingError.message);
    }

    const existingByName = new Map(
      (existingRows ?? []).map((row) => [getImportedMemberKey(row.name), row]),
    );
    let importedCount = 0;
    let updatedCount = 0;
    let duplicateCount = 0;
    let skippedCount = parsed.skippedRows.length;
    const details = [...parsed.skippedRows];

    for (const row of parsed.rows) {
      const key = getImportedMemberKey(row.name);
      if (!key) {
        skippedCount += 1;
        details.push(`Zeile ${row.rowNumber}: Firmenname leer.`);
        continue;
      }

      const existing = existingByName.get(key);
      if (existing) {
        const { error } = await supabase
          .from("members")
          .update({
            address: row.address,
            phone: row.phone,
            email: row.email,
            website_url: row.websiteUrl,
          })
          .eq("id", existing.id);

        if (error) {
          skippedCount += 1;
          details.push(`Zeile ${row.rowNumber}: "${row.name}" konnte nicht aktualisiert werden (${error.message}).`);
          continue;
        }

        const internalSaved = await saveInternalProfile(supabase, existing.id, row.internalProfile);
        if (!internalSaved) {
          throw new Error(
            "Interne Mitgliedsdaten konnten nicht gespeichert werden, weil public.member_internal_profiles fehlt.",
          );
        }

        duplicateCount += 1;
        updatedCount += 1;
        details.push(`Zeile ${row.rowNumber}: "${row.name}" aktualisiert.`);
        continue;
      }

      const { data, error } = await supabase
        .from("members")
        .insert({
          name: row.name,
          logo_url: null,
          description: emptyMultilingual(),
          address: row.address,
          phone: row.phone,
          email: row.email,
          website_url: row.websiteUrl,
          member_since: null,
          lat: null,
          lng: null,
          canton: null,
          source_lang: "de",
          status: "draft",
          is_active: true,
        })
        .select("id")
        .single();

      if (error) {
        skippedCount += 1;
        details.push(`Zeile ${row.rowNumber}: "${row.name}" konnte nicht angelegt werden (${error.message}).`);
        continue;
      }

      const internalSaved = await saveInternalProfile(supabase, data.id, row.internalProfile);
      if (!internalSaved) {
        throw new Error(
          "Interne Mitgliedsdaten konnten nicht gespeichert werden, weil public.member_internal_profiles fehlt.",
        );
      }
      existingByName.set(key, { id: data.id, name: row.name });
      importedCount += 1;
    }

    if (parsed.deepSeekApplied) {
      details.unshift("DeepSeek wurde für das Header-Mapping des Imports verwendet.");
    } else {
      details.unshift("DeepSeek wurde für diesen Import nicht erreicht; Heuristiken wurden als Fallback verwendet.");
    }

    revalidatePath("/admin/members");

    return {
      status: "success",
      message: "Import abgeschlossen. Firmen wurden angelegt oder mit Spreadsheet-Daten aktualisiert.",
      importedCount,
      updatedCount,
      duplicateCount,
      skippedCount,
      details,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Der Import ist fehlgeschlagen.",
      importedCount: 0,
      updatedCount: 0,
      duplicateCount: 0,
      skippedCount: 0,
      details: [],
    };
  }
}

// ─── Übersetzung direkt auslösen (für den Übersetzen-Button im Formular) ─────

export async function translateDescriptionAction(
  text: string,
  lang: Locale,
): Promise<Multilingual> {
  await requireAdmin();
  return translateToAll(text, lang);
}

// ─── Edit-Link (permanent, widerrufbar) ──────────────────────────────────────

export async function generateEditLink(memberId: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await createEditTokenFor(supabase, memberId);
  revalidatePath(`/admin/members/${memberId}`);
}

// Rotiert den Token und schickt der hinterlegten Firmen-E-Mail einen
// frischen Link. Fehler werden geworfen, damit das UI Feedback geben kann.
export async function sendEditLinkToMember(memberId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: member, error: memErr } = await supabase
    .from("members")
    .select("name, email, source_lang")
    .eq("id", memberId)
    .maybeSingle();
  if (memErr) throw new Error(memErr.message);
  if (!member) throw new Error("Firma nicht gefunden.");
  if (!member.email) {
    throw new Error("Keine E-Mail-Adresse für diese Firma hinterlegt.");
  }

  const memberLocale = (LOCALES.includes(member.source_lang as Locale) ? member.source_lang : "de") as Locale;
  const token = await createEditTokenFor(supabase, memberId);
  const localePrefix = memberLocale !== "de" ? `${memberLocale}/` : "";
  await sendMemberWelcomeMail({
    to: member.email,
    memberName: member.name,
    editUrl: `${appBaseUrl()}/${localePrefix}edit/${token}`,
    locale: memberLocale,
  });

  revalidatePath(`/admin/members/${memberId}`);
}

export async function revokeEditLink(memberId: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("member_edit_tokens")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("member_id", memberId)
    .eq("is_active", true);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/members/${memberId}`);
}
