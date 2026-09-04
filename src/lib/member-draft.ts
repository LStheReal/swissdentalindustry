// Entwurf und veröffentlichter Stand einer Mitgliedsfirma.
//
// Vorher gab es beides nicht getrennt: `members` trug genau eine Fassung des
// Inhalts, und jedes Speichern im Admin — und jede freigegebene Änderung aus
// dem Self-Service — stand damit sofort auf der öffentlichen Website. Ein
// Tippfehler war live, bevor jemand ihn sehen konnte.
//
// Jetzt gilt:
//
//   * Die Spalten von `members` sind der VERÖFFENTLICHTE Stand. Nur sie
//     werden auf der Website gelesen — die Leseseite musste deshalb nicht
//     angefasst werden.
//   * `members.draft` (jsonb) trägt die noch nicht veröffentlichten
//     Änderungen als Teilmenge derselben Felder. `null` heisst: der
//     veröffentlichte Stand ist aktuell.
//   * Öffentlich wird ein Entwurf ausschliesslich durch „Veröffentlichen".
//
// `status` behält seine Bedeutung: 'draft' = die Firma war noch nie online,
// 'published' = sie steht im Verzeichnis. Solange sie nie online war, wird
// direkt in die Spalten geschrieben — es gibt ja nichts, was dadurch live
// gehen könnte.

import { internalFieldLabel, type Locale, type Member, type Multilingual } from "./types";

/** Felder, die den öffentlichen Auftritt ausmachen und deshalb Entwurf sein können. */
export const DRAFTABLE_KEYS = [
  "name",
  "logo_url",
  "description",
  "street_name",
  "street_number",
  "postal_code",
  "city",
  "address",
  "phone",
  "email",
  "website_url",
  "member_since",
  "source_lang",
] as const;

export type DraftableKey = (typeof DRAFTABLE_KEYS)[number];

export type MemberDraft = Partial<Pick<Member, DraftableKey>>;

/** Behält nur Felder, die überhaupt Entwurf sein dürfen. */
export function pickDraftable(patch: Record<string, unknown>): MemberDraft {
  const out: Record<string, unknown> = {};
  for (const key of DRAFTABLE_KEYS) {
    if (key in patch) out[key] = patch[key];
  }
  return out as MemberDraft;
}

/** Felder eines Patches, die NICHT zum Entwurf gehören (z.B. Koordinaten). */
export function pickNonDraftable(patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(patch)) {
    if (!(DRAFTABLE_KEYS as readonly string[]).includes(key)) out[key] = patch[key];
  }
  return out;
}

/** Hat die Firma unveröffentlichte Änderungen? */
export function hasDraft(member: Pick<Member, "draft">): boolean {
  return Boolean(member.draft && Object.keys(member.draft).length > 0);
}

/**
 * Der Stand, den der Admin bearbeitet: veröffentlichte Werte, überlagert von
 * dem, was im Entwurf abweicht. Die Website benutzt das bewusst NICHT.
 */
export function effectiveMember(member: Member): Member {
  return member.draft ? { ...member, ...member.draft } : member;
}

/** Die Felder, in denen sich Entwurf und veröffentlichter Stand unterscheiden. */
export function draftedFields(member: Member): DraftableKey[] {
  if (!member.draft) return [];
  const draft = member.draft as Record<string, unknown>;
  return DRAFTABLE_KEYS.filter(
    (key) =>
      key in draft &&
      JSON.stringify(draft[key] ?? null) !== JSON.stringify(member[key] ?? null),
  );
}

// ─── Beschriftungen für das Publish-Panel ────────────────────────────────────
//
// Diese Beschriftungen gehören zu DRAFTABLE_KEYS (Member-Feldern) — einer
// anderen Schlüsselmenge als MemberInternalProfileKey (Kontakt-/Firmenfelder
// in member_internal_profiles). Eine frühere Fassung dieser Seite hat versucht,
// beide mit derselben Funktion (internalFieldLabel) zu beschriften; die beiden
// Mengen überschneiden sich nur bei den vier Adressfeldern, und für jeden
// anderen Schlüssel (phone, email, name, logo_url, …) schlug die Suche fehl —
// ohne Rückfallwert stürzte das die ganze Seite ab, sobald ein Entwurf eines
// dieser Felder enthielt. Deshalb: eine eigene, vollständige Tabelle für genau
// diese Schlüsselmenge, mit garantiertem Rückfallwert.
const DRAFTABLE_FIELD_LABELS: Record<DraftableKey, Multilingual> = {
  name: { de: "Firmenname", fr: "Nom de l'entreprise", it: "Nome dell'azienda", en: "Company name" },
  logo_url: { de: "Logo", fr: "Logo", it: "Logo", en: "Logo" },
  description: { de: "Beschreibung", fr: "Description", it: "Descrizione", en: "Description" },
  // Die vier Adressfelder gehören auch zu MemberInternalProfileKey — hier
  // absichtlich nicht dupliziert, siehe draftableFieldLabel() unten.
  street_name: { de: "Strasse", fr: "Rue", it: "Via", en: "Street" },
  street_number: { de: "Hausnummer", fr: "Numéro", it: "Numero", en: "Number" },
  postal_code: { de: "PLZ", fr: "NPA", it: "CAP", en: "Postal code" },
  city: { de: "Ort", fr: "Localité", it: "Località", en: "City" },
  // Reiner Archiv-Spiegel der vier Felder oben (siehe address.ts) — trägt
  // keine eigene Information und wird im Publish-Panel bewusst nicht
  // separat angezeigt. Hier trotzdem beschriftet, falls sie je woanders
  // auftaucht.
  address: { de: "Adresse", fr: "Adresse", it: "Indirizzo", en: "Address" },
  phone: { de: "Telefon", fr: "Téléphone", it: "Telefono", en: "Phone" },
  email: { de: "E-Mail", fr: "E-mail", it: "E-mail", en: "Email" },
  website_url: { de: "Website", fr: "Site web", it: "Sito web", en: "Website" },
  member_since: { de: "Mitglied seit", fr: "Membre depuis", it: "Membro dal", en: "Member since" },
  source_lang: {
    de: "Sprache der Firma",
    fr: "Langue de l'entreprise",
    it: "Lingua dell'azienda",
    en: "Company language",
  },
};

const ADDRESS_COMPONENT_KEYS = new Set<DraftableKey>([
  "street_name",
  "street_number",
  "postal_code",
  "city",
]);

/**
 * Beschriftung eines Draftable-Feldes für das Publish-Panel. Fällt für einen
 * unbekannten Schlüssel auf den Schlüssel selbst zurück statt zu werfen — ein
 * unschönes Label ist ein kleiner Schönheitsfehler, ein Absturz der ganzen
 * Seite ist keiner.
 */
export function draftableFieldLabel(key: DraftableKey, locale: Locale): string {
  // Die vier Adressfelder haben ihre Beschriftung schon bei
  // MemberInternalProfileKey — von dort übernehmen statt zu duplizieren,
  // damit Wortlaut und Übersetzung nicht auseinanderlaufen.
  if (ADDRESS_COMPONENT_KEYS.has(key)) return internalFieldLabel(key as never, locale);
  const entry = DRAFTABLE_FIELD_LABELS[key];
  return entry?.[locale] || entry?.de || key;
}
