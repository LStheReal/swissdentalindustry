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
  address: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  lat: number | null;
  lng: number | null;
  canton: string | null;
  member_since: string | null;
  source_lang: Locale;
  status: MemberStatus;
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
  "country",
  "direct_phone",
  "direct_email",
  "membership_fee",
  "internal_notes",
] as const;

export type MemberInternalProfileKey = (typeof MEMBER_INTERNAL_PROFILE_KEYS)[number];

// Interne Felder, die ein Mitglied im Self-Service (/edit/[token]) sehen und
// ändern darf. Mitgliederbeitrag und interne Notizen bleiben ausschliesslich
// im Admin-Portal sichtbar.
export const MEMBER_SELF_SERVICE_PROFILE_KEYS: readonly MemberInternalProfileKey[] =
  MEMBER_INTERNAL_PROFILE_KEYS.filter(
    (key) => key !== "membership_fee" && key !== "internal_notes",
  );

export type MemberInternalProfileFields = Record<MemberInternalProfileKey, string | null>;

export interface MemberInternalProfile extends MemberInternalProfileFields {
  member_id: string;
  created_at: string;
  updated_at: string;
}

export const MEMBER_INTERNAL_PROFILE_LABELS: Record<MemberInternalProfileKey, string> = {
  member_number: "Mitgliedsnummer",
  contact_title: "Anrede / Titel",
  contact_first_name: "Vorname",
  contact_last_name: "Nachname",
  contact_job_title: "Funktion",
  street_name: "Strasse",
  street_number: "Hausnummer",
  postal_code: "PLZ",
  city: "Ort",
  country: "Land",
  direct_phone: "Direkttelefon",
  direct_email: "Direkt-E-Mail",
  membership_fee: "Mitgliederbeitrag",
  internal_notes: "Interne Notizen",
};

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
  address: string | null;
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

export type ApplicationStatus = "new" | "converted" | "archived";

export interface MembershipApplication {
  id: string;
  payload: Record<string, string>;
  status: ApplicationStatus;
  created_at: string;
}
