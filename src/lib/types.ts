// Geteilte Typen für die gesamte App.

export const LOCALES = ["de", "fr", "it", "en"] as const;
export type Locale = (typeof LOCALES)[number];
// Default-Sprache der öffentlichen Website: Englisch lebt ohne URL-Präfix
// ("/"), de/fr/it unter "/de", "/fr", "/it". Browser-Sprache bzw. die im
// Cookie gespeicherte Wahl wird im Proxy gematcht.
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
  en: "English",
};

// Mehrsprachiges Textfeld, in der DB als JSONB gespeichert.
export type Multilingual = Record<Locale, string>;

export function emptyMultilingual(): Multilingual {
  return { de: "", fr: "", it: "", en: "" };
}

// Wählt den Text in der gewünschten Sprache; fällt auf die erste nicht-leere
// Sprache zurück, damit nie ein leerer String entsteht.
export function mlText(ml: Multilingual | null | undefined, locale: Locale): string {
  if (!ml) return "";
  if (ml[locale]?.trim()) return ml[locale];
  for (const l of LOCALES) if (ml[l]?.trim()) return ml[l];
  return "";
}

// ─── DB-Zeilen ────────────────────────────────────────────────────────────────

export type MemberStatus = "draft" | "published";

export interface Member {
  id: string;
  name: string;
  logo_url: string | null;
  description: Multilingual;
  street_name: string | null;
  street_number: string | null;
  postal_code: string | null;
  city: string | null;
  /**
   * Archiv der ursprünglichen Freitext-Adresse (Migration 0013). Wird aus den
   * Einzelfeldern mitgeschrieben, aber nirgends mehr gelesen.
   */
  address: string | null;
  /** Die Adresse konnte nicht zerlegt werden und braucht eine Handprüfung. */
  address_needs_review: boolean;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  lat: number | null;
  lng: number | null;
  canton: string | null;
  member_since: string | null;
  source_lang: Locale;
  /**
   * 'draft' = die Firma war nie öffentlich, 'published' = sie steht im
   * Verzeichnis. Unabhängig davon, ob unveröffentlichte Änderungen anliegen —
   * dafür gibt es `draft` (Migration 0014).
   */
  status: MemberStatus;
  /**
   * Noch nicht veröffentlichte Änderungen an den öffentlichen Feldern.
   * `null` = der veröffentlichte Stand ist aktuell. Siehe lib/member-draft.ts.
   */
  draft: import("./member-draft").MemberDraft | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const MEMBER_INTERNAL_PROFILE_KEYS = [
  "member_number",
  "contact_title",
  "contact_first_name",
  "contact_last_name",
  "contact_job_title",
  "street_name",
  "street_number",
  "postal_code",
  "city",
  "direct_phone",
  "direct_email",
] as const;

export type MemberInternalProfileKey = (typeof MEMBER_INTERNAL_PROFILE_KEYS)[number];

// Interne Felder, die ein Mitglied im Self-Service (/edit/[token]) sehen und
// ändern darf. Seit Migration 0018 sind das alle verbliebenen — Beitrag und
// interne Notizen hängen an der Firma und nicht mehr an der Person.
export const MEMBER_SELF_SERVICE_PROFILE_KEYS: readonly MemberInternalProfileKey[] =
  MEMBER_INTERNAL_PROFILE_KEYS;

// Alle Felder eines Kontakts. Seit Migration 0018 gehören auch die
// Adressfelder dazu: sie beschreiben die Person, nicht die Firma — die
// Firmenadresse steht in `members`.
export const CONTACT_PERSON_KEYS: readonly MemberInternalProfileKey[] =
  MEMBER_INTERNAL_PROFILE_KEYS;

export type MemberInternalProfileFields = Record<MemberInternalProfileKey, string | null>;

// ─── Rollen eines Kontakts ────────────────────────────────────────────────────
// Eine Person kann mehrere halten — häufig ist dieselbe Person Haupt- und
// Rechnungskontakt. Höchstens ein Hauptkontakt je Firma (Migration 0017).

export const CONTACT_ROLES = ["main", "billing", "marketing"] as const;
export type ContactRole = (typeof CONTACT_ROLES)[number];

export const CONTACT_ROLE_LABELS: Record<ContactRole, Multilingual> = {
  main: {
    de: "Hauptkontakt",
    fr: "Contact principal",
    it: "Contatto principale",
    en: "Main contact",
  },
  billing: {
    de: "Rechnungskontakt",
    fr: "Contact de facturation",
    it: "Contatto di fatturazione",
    en: "Billing contact",
  },
  marketing: {
    de: "Marketingkontakt",
    fr: "Contact marketing",
    it: "Contatto marketing",
    en: "Marketing contact",
  },
};

export function contactRoleLabel(role: ContactRole, locale: Locale): string {
  return CONTACT_ROLE_LABELS[role][locale] || CONTACT_ROLE_LABELS[role].de;
}

/** Filtert unbekannte Rollen heraus und entfernt Duplikate. */
export function normalizeContactRoles(value: unknown): ContactRole[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<ContactRole>();
  for (const entry of value) {
    if (typeof entry === "string" && (CONTACT_ROLES as readonly string[]).includes(entry)) {
      seen.add(entry as ContactRole);
    }
  }
  return CONTACT_ROLES.filter((role) => seen.has(role));
}

export interface MemberInternalProfile extends MemberInternalProfileFields {
  member_id: string;
  created_at: string;
  updated_at: string;
}

// Feldbeschriftungen der internen Daten — in allen vier Sprachen, weil sie
// sowohl im Admin-Portal (Sprachumschalter) als auch im öffentlichen
// Self-Service-Formular (/edit/[token]) angezeigt werden.
//
// Terminologie: die Personen, die bei einer Mitgliedsfirma arbeiten, heissen
// „Kontakte" — nicht „Mitglieder". Mitglied ist die Firma.
export const INTERNAL_FIELD_LABELS: Record<MemberInternalProfileKey, Multilingual> = {
  member_number: {
    de: "Kontaktnummer",
    fr: "Numéro de contact",
    it: "Numero di contatto",
    en: "Contact number",
  },
  contact_title: {
    de: "Anrede / Titel",
    fr: "Civilité / titre",
    it: "Titolo",
    en: "Salutation / title",
  },
  contact_first_name: { de: "Vorname", fr: "Prénom", it: "Nome", en: "First name" },
  contact_last_name: { de: "Nachname", fr: "Nom", it: "Cognome", en: "Last name" },
  contact_job_title: { de: "Funktion", fr: "Fonction", it: "Funzione", en: "Job title" },
  street_name: { de: "Strasse", fr: "Rue", it: "Via", en: "Street" },
  street_number: { de: "Hausnummer", fr: "Numéro", it: "Numero", en: "Number" },
  postal_code: { de: "PLZ", fr: "NPA", it: "CAP", en: "Postal code" },
  city: { de: "Ort", fr: "Localité", it: "Località", en: "City" },
  direct_phone: {
    de: "Direkttelefon",
    fr: "Téléphone direct",
    it: "Telefono diretto",
    en: "Direct phone",
  },
  direct_email: {
    de: "Direkt-E-Mail",
    fr: "E-mail direct",
    it: "E-mail diretta",
    en: "Direct email",
  },
};

// Firmen-interne Felder. Sie liegen auf `members` (Migration 0018) und nicht
// auf einem Kontakt — der Beitrag hängt an der Firma, nicht an einer Person.
export const COMPANY_INTERNAL_LABELS = {
  employee_count: {
    de: "Mitarbeiterzahl",
    fr: "Nombre de collaborateurs",
    it: "Numero di collaboratori",
    en: "Number of employees",
  },
  membership_fee: {
    de: "Mitgliederbeitrag",
    fr: "Cotisation",
    it: "Quota associativa",
    en: "Membership fee",
  },
  internal_notes: {
    de: "Interne Notizen",
    fr: "Notes internes",
    it: "Note interne",
    en: "Internal notes",
  },
} as const satisfies Record<string, Multilingual>;

export type CompanyInternalKey = keyof typeof COMPANY_INTERNAL_LABELS;

export function companyInternalLabel(key: CompanyInternalKey, locale: Locale): string {
  return COMPANY_INTERNAL_LABELS[key][locale] || COMPANY_INTERNAL_LABELS[key].de;
}

/**
 * Beschriftung eines internen Feldes in der gewünschten Sprache.
 *
 * Fällt für einen Schlüssel ausserhalb von MemberInternalProfileKey auf den
 * Schlüssel selbst zurück statt zu werfen. TypeScript verhindert das im
 * Normalfall — ein Aufrufer, der den Typ mit `as never` erzwingt (wie es die
 * ursprüngliche Fassung des Publish-Panels tat), müsste sonst darauf
 * vertrauen, dass jeder künftige Aufrufer diese Regel nie bricht. Ein
 * unschönes Label ist ein kleiner Fehler; ein Absturz der ganzen Seite ist
 * keiner.
 */
export function internalFieldLabel(
  key: MemberInternalProfileKey,
  locale: Locale,
): string {
  const entry = INTERNAL_FIELD_LABELS[key];
  return entry?.[locale] || entry?.de || key;
}

/** Alle Beschriftungen in einer Sprache — praktisch als Prop für Client-Komponenten. */
export function internalFieldLabels(
  locale: Locale,
): Record<MemberInternalProfileKey, string> {
  return Object.fromEntries(
    MEMBER_INTERNAL_PROFILE_KEYS.map((key) => [key, internalFieldLabel(key, locale)]),
  ) as Record<MemberInternalProfileKey, string>;
}

// Deutsche Projektion für die Stellen, die bewusst immer Deutsch bleiben
// (Admin-Benachrichtigungsmails).
export const MEMBER_INTERNAL_PROFILE_LABELS: Record<MemberInternalProfileKey, string> =
  internalFieldLabels("de");

export function emptyMemberInternalProfile(): MemberInternalProfileFields {
  return Object.fromEntries(
    MEMBER_INTERNAL_PROFILE_KEYS.map((key) => [key, null]),
  ) as MemberInternalProfileFields;
}

export function normalizeMemberInternalProfile(
  value: Partial<MemberInternalProfileFields> | null | undefined,
): MemberInternalProfileFields {
  const empty = emptyMemberInternalProfile();
  for (const key of MEMBER_INTERNAL_PROFILE_KEYS) {
    const raw = value?.[key];
    empty[key] = typeof raw === "string" && raw.trim() ? raw.trim() : null;
  }
  return empty;
}

// Felder, die ein Mitglied über die Public-URL selbst ändern darf.
export interface MemberEditableFields {
  logo_url: string | null;
  description: Multilingual;
  street_name: string | null;
  street_number: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  internal_profile: MemberInternalProfileFields;
}

export type ChangeRequestStatus = "pending" | "approved" | "rejected";

export interface MemberChangeRequest {
  id: string;
  member_id: string;
  proposed: Partial<MemberEditableFields>;
  status: ChangeRequestStatus;
  contact_email: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface MemberEditToken {
  id: string;
  member_id: string;
  token: string;
  is_active: boolean;
  created_at: string;
  revoked_at: string | null;
}

export interface News {
  id: string;
  title: Multilingual;
  body: Multilingual;
  image_url: string | null;
  link_url: string | null;
  youtube_url: string | null;
  source_lang: Locale;
  is_published: boolean;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// 'converted' stammt aus dem alten Flow (Antrag wurde ohne Prüfung sofort zum
// Mitglied) und bleibt nur für Altbestand gültig.
export type ApplicationStatus =
  | "new"
  | "approved"
  | "rejected"
  | "archived"
  | "converted";

/** Antrag auf Mitgliedschaft vs. allgemeine Kontakt-/Mitwirken-Anfrage. */
export type ApplicationKind = "membership" | "inquiry";

/**
 * Felder, die der öffentliche Mitgliedsantrag erhebt. Alles, was später auf der
 * Website steht, wird hier schon abgefragt — damit der Admin beim Prüfen genau
 * das sieht, was live gehen würde, und nichts nachträglich erraten muss.
 */
export const APPLICATION_REQUIRED_FIELDS = [
  "company",
  "street_name",
  "postal_code",
  "city",
  "email",
  "description",
  "contact_last_name",
  "contact_first_name",
  "contact_email",
] as const;

export interface ApplicationPayload {
  // ─── Firma ────────────────────────────────────────────────────────────────
  /** Offizieller Firmenname — wird als Mitgliedsname angezeigt. */
  company?: string;
  /** Firmenadresse — seit Migration 0013 in Einzelfeldern. */
  street_name?: string;
  street_number?: string;
  postal_code?: string;
  city?: string;
  email?: string;
  phone?: string;
  website_url?: string;
  /** Mitarbeiterzahl — intern. */
  employee_count?: string;
  description?: string;
  /** Freitext an das Sekretariat, wird nicht veröffentlicht. */
  message?: string;

  // ─── Kontaktperson ────────────────────────────────────────────────────────
  contact_last_name?: string;
  contact_first_name?: string;
  contact_job_title?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_street_name?: string;
  contact_street_number?: string;
  contact_postal_code?: string;
  contact_city?: string;
  /** "1" = Adresse der Kontaktperson entspricht der Firmenadresse. */
  contact_address_same?: string;

  /** Altbestand: vor Abschnitt 7 wurde nur ein Namensfeld erhoben. */
  contact_person?: string;

  source?: string;
  /** Sprache des Formulars — bestimmt die Sprache von Zusage/Ablehnung. */
  locale?: string;
  [key: string]: string | undefined;
}

export interface MembershipApplication {
  id: string;
  payload: ApplicationPayload;
  kind: ApplicationKind;
  status: ApplicationStatus;
  logo_url: string | null;
  /** Grund, warum der Logo-Upload fehlgeschlagen ist (Migration 0016). */
  logo_error: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  member_id: string | null;
  created_at: string;
}
