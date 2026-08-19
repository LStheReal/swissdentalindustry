"use server";

import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateToAll } from "@/lib/translate";
import {
  geocodeAfterResponse,
  provisionalMultilingual,
  translateAfterResponse,
} from "@/lib/after-response";
import { uploadImage } from "@/lib/storage";
import { sanitizeExternalUrl } from "@/lib/url";
import { sendMemberWelcomeMail } from "@/lib/email";
import {
  ensureInternalProfilesTableAvailable,
  saveInternalProfile,
  getInternalProfileForMember,
  addContactPerson,
  updateContactPerson,
  deleteContactPerson,
} from "@/lib/member-internal-profiles";
import { getImportedMemberKey, parseMemberImportSpreadsheet } from "@/lib/member-import";
import {
  LOCALES,
  MEMBER_INTERNAL_PROFILE_KEYS,
  CONTACT_PERSON_KEYS,
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

/**
 * Liefert den aktiven Edit-Token der Firma — und legt nur dann einen neuen an,
 * wenn es noch keinen gibt.
 *
 * Wichtig für den Link-Versand: `createEditTokenFor` widerruft beim Rotieren
 * alle bestehenden Tokens. Wer zweimal auf "Link senden" klickte, machte damit
 * den Link aus der ersten Mail ungültig — der Empfänger landete auf
 * "Link ungültig". Zum bewussten Rotieren gibt es `generateEditLink`.
 */
async function activeEditTokenFor(
  supabase: ReturnType<typeof createAdminClient>,
  memberId: string,
): Promise<string> {
  const { data } = await supabase
    .from("member_edit_tokens")
    .select("token")
    .eq("member_id", memberId)
    .eq("is_active", true)
    .maybeSingle();
  if (data?.token) return data.token;
  return createEditTokenFor(supabase, memberId);
}

function readLocale(formData: FormData): Locale {
  const v = String(formData.get("source_lang") || "de");
  return (LOCALES.includes(v as Locale) ? v : "de") as Locale;
}

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) || "").trim();
  return v || null;
}

/**
 * Liest nur die Felder, die das Formular tatsächlich mitschickt. Seit die
 * Kontakte getrennt bearbeitet werden, enthält das Mitglieder-Formular
 * nur noch die Firmenfelder — die Personenfelder dürfen dabei nicht
 * verlorengehen (siehe `upsertInternalProfile`).
 */
function readInternalProfile(formData: FormData): Partial<MemberInternalProfileFields> {
  const partial: Partial<MemberInternalProfileFields> = {};
  for (const key of MEMBER_INTERNAL_PROFILE_KEYS) {
    const field = `internal_${key}`;
    if (!formData.has(field)) continue;
    const raw = String(formData.get(field) || "").trim();
    partial[key] = raw || null;
  }
  return partial;
}

async function upsertInternalProfile(
  supabase: ReturnType<typeof createAdminClient>,
  memberId: string,
  patch: Partial<MemberInternalProfileFields>,
) {
  // Über den Bestand legen, statt ihn zu ersetzen: sonst löscht ein Speichern
  // des Firmenformulars die Angaben der ersten Kontakt.
  const existing = await getInternalProfileForMember(supabase, memberId);
  await saveInternalProfile(
    supabase,
    memberId,
    normalizeMemberInternalProfile({ ...existing, ...patch }),
  );
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

  // Die Sprache steht im Formular — kein Claude-Aufruf zur Erkennung (~4s).
  const sourceLang = fallbackLang;
  const logoUrl = await uploadImage("logos", image instanceof File ? image : null);

  const { data, error } = await supabase
    .from("members")
    .insert({
      name,
      logo_url: logoUrl,
      description: provisionalMultilingual(description),
      address,
      phone: str(formData, "phone"),
      email,
      website_url: sanitizeExternalUrl(str(formData, "website_url")),
      member_since: str(formData, "member_since"),
      lat: null,
      lng: null,
      canton: null,
      source_lang: sourceLang,
      status: "published",
      is_active: true,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await upsertInternalProfile(supabase, data.id, readInternalProfile(formData));

  translateAfterResponse({
    table: "members",
    id: data.id,
    fields: { description },
    sourceLang,
    paths: ["/members", `/members/${data.id}`],
  });
  geocodeAfterResponse({ memberId: data.id, address });

  // Self-Service-Link sofort erzeugen und der Firma per Mail zustellen, damit
  // der Admin nichts manuell verschicken muss. Mail-Fehler dürfen das Anlegen
  // nicht abbrechen.
  //
  // Synchron, nicht in `after()`: der Link ist der einzige Weg der Firma zu
  // ihrem Profil. In `after()` vor einem `redirect()` ging genau diese Mail in
  // der Zusage-Aktion verloren (siehe applications/actions.ts).
  if (email) {
    try {
      const token = await createEditTokenFor(supabase, data.id);
      await sendMemberWelcomeMail({
        to: email,
        memberName: name,
        editUrl: `${appBaseUrl()}/edit/${token}`,
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
    // Quelltext geändert → neu übersetzen, aber erst nach der Antwort. Die
    // Sprache kommt aus dem Formular, statt sie von Claude erkennen zu lassen.
    sourceLang = fallbackLang;
    descMl = provisionalMultilingual(description);
    const newLogoUrl = await uploadImage("logos", image instanceof File ? image : null);

    const update: Record<string, unknown> = {
      name,
      description: descMl,
      address,
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      website_url: sanitizeExternalUrl(str(formData, "website_url")),
      member_since: str(formData, "member_since"),
      source_lang: sourceLang,
      status: "published",
    };
    if (removeLogo) update.logo_url = null;
    else if (newLogoUrl) update.logo_url = newLogoUrl;
    if (addressChanged) {
      // Alte Koordinaten sofort verwerfen — sie gehören zur alten Adresse.
      // Die neuen trägt geocodeAfterResponse nach.
      update.lat = null;
      update.lng = null;
      update.canton = null;
    }
    const { error } = await supabase.from("members").update(update).eq("id", id);
    if (error) throw new Error(error.message);
    await upsertInternalProfile(supabase, id, readInternalProfile(formData));

    translateAfterResponse({
      table: "members",
      id,
      fields: { description },
      sourceLang,
      paths: ["/members", `/members/${id}`],
    });
    if (addressChanged) geocodeAfterResponse({ memberId: id, address });

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

  const newLogoUrl = await uploadImage("logos", image instanceof File ? image : null);

  const update: Record<string, unknown> = {
    name,
    description: descMl,
    address,
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    website_url: sanitizeExternalUrl(str(formData, "website_url")),
    member_since: str(formData, "member_since"),
    source_lang: sourceLang,
    status: "published",
  };
  if (removeLogo) update.logo_url = null;
  else if (newLogoUrl) update.logo_url = newLogoUrl;
  if (addressChanged) {
    update.lat = null;
    update.lng = null;
    update.canton = null;
  }

  const { error } = await supabase.from("members").update(update).eq("id", id);
  if (error) throw new Error(error.message);

  await upsertInternalProfile(supabase, id, readInternalProfile(formData));

  if (addressChanged) geocodeAfterResponse({ memberId: id, address });

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
            website_url: sanitizeExternalUrl(row.websiteUrl),
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
            "Interne Kontaktdaten konnten nicht gespeichert werden, weil public.member_internal_profiles fehlt.",
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
          website_url: sanitizeExternalUrl(row.websiteUrl),
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
          "Interne Kontaktdaten konnten nicht gespeichert werden, weil public.member_internal_profiles fehlt.",
        );
      }
      existingByName.set(key, { id: data.id, name: row.name });
      importedCount += 1;
    }

    if (parsed.aiApplied) {
      details.unshift("KI (Claude) wurde für das Header-Mapping des Imports verwendet.");
    } else {
      details.unshift("Die KI wurde für diesen Import nicht erreicht; Heuristiken wurden als Fallback verwendet.");
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
  const token = await activeEditTokenFor(supabase, memberId);
  await sendMemberWelcomeMail({
    to: member.email,
    memberName: member.name,
    editUrl: `${appBaseUrl()}/edit/${token}`,
    locale: memberLocale,
  });

  revalidatePath(`/admin/members/${memberId}`);
}

// ─── Kontakte (mehrere pro Partner) ──────────────────────────────────

/** Liest die Felder einer Kontakt aus dem Formular. */
function readContactPerson(formData: FormData): MemberInternalProfileFields {
  const partial: Partial<MemberInternalProfileFields> = {};
  for (const key of CONTACT_PERSON_KEYS) {
    const raw = String(formData.get(`contact_${key}`) || "").trim();
    partial[key] = raw || null;
  }
  return normalizeMemberInternalProfile(partial);
}

export async function addContactPersonAction(memberId: string, formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();
  await addContactPerson(supabase, memberId, readContactPerson(formData));
  revalidatePath(`/admin/members/${memberId}`);
}

export async function updateContactPersonAction(
  memberId: string,
  contactId: string,
  formData: FormData,
) {
  await requireAdmin();
  const supabase = createAdminClient();
  await updateContactPerson(supabase, contactId, readContactPerson(formData));
  revalidatePath(`/admin/members/${memberId}`);
}

export async function deleteContactPersonAction(memberId: string, contactId: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  await deleteContactPerson(supabase, contactId);
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
