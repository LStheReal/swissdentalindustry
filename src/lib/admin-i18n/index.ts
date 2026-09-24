// Wörterbuch der Admin-Oberfläche.
//
// Bewusst ohne Server-Imports (kein next/headers): dieselbe Datei wird von
// Server-Komponenten, Server-Actions UND Client-Komponenten benutzt. Die
// Sprache kommt serverseitig aus dem Cookie (lib/i18n-admin.ts), clientseitig
// aus dem Provider (components/admin/AdminI18n.tsx).
//
// Aufgeteilt nach Bereich, damit keine 3000-Zeilen-Datei entsteht. Doppelte
// Schlüssel zwischen den Dateien würden sich beim Zusammenführen still
// überschreiben — tests/lib/admin-i18n.test.ts fängt das ab.

import { LOCALES, type Locale } from "../types";
import type { Msg } from "./msg";
import { APPLICATIONS } from "./applications";
import { AUTH } from "./auth";
import { COMMON } from "./common";
import { DASHBOARD } from "./dashboard";
import { EXPORT } from "./export";
import { FEED } from "./feed";
import { MAIL } from "./mail";
import { MEMBERS } from "./members";
import { NAV } from "./nav";
import { NEWS } from "./news";
import { SETTINGS } from "./settings";

export type { Msg } from "./msg";

export const ADMIN_DICT_PARTS = {
  NAV,
  COMMON,
  DASHBOARD,
  AUTH,
  MEMBERS,
  APPLICATIONS,
  FEED,
  NEWS,
  MAIL,
  EXPORT,
  SETTINGS,
} as const;

export const ADMIN_DICT = {
  ...NAV,
  ...COMMON,
  ...DASHBOARD,
  ...AUTH,
  ...MEMBERS,
  ...APPLICATIONS,
  ...FEED,
  ...NEWS,
  ...MAIL,
  ...EXPORT,
  ...SETTINGS,
} satisfies Record<string, Msg>;

export type AdminI18nKey = keyof typeof ADMIN_DICT;
export type AdminVars = Record<string, string | number>;
export type AdminT = (key: AdminI18nKey, vars?: AdminVars) => string;

export const ADMIN_LOCALE_COOKIE = "admin_locale";

// Das Portal bleibt standardmässig Deutsch — unabhängig von der
// Default-Sprache der öffentlichen Website (DEFAULT_LOCALE = en).
export const ADMIN_DEFAULT_LOCALE: Locale = "de";

export function isAdminLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

/**
 * Übersetzungsfunktion für eine Sprache. `{name}` im Text wird durch
 * vars.name ersetzt. Fehlt ein Eintrag (sollte der Typ verhindern), fällt sie
 * auf Deutsch und dann auf den Schlüssel zurück — nie ein Absturz.
 */
export function makeT(locale: Locale): AdminT {
  return (key, vars) => {
    const entry = (ADMIN_DICT as Record<string, Msg | undefined>)[key];
    let text = entry?.[locale] || entry?.de || key;
    if (vars) {
      text = text.replace(/\{(\w+)\}/g, (whole, name: string) =>
        name in vars ? String(vars[name]) : whole,
      );
    }
    return text;
  };
}

/** Sprachcode für toLocaleDateString & Co. — Schweizer Varianten. */
export function adminDateLocale(locale: Locale): string {
  return `${locale}-CH`;
}

/** Datum kurz (TT.MM.JJ bzw. landesüblich). */
export function formatAdminDate(value: string | null | undefined, locale: Locale): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(adminDateLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

/** Datum mit Uhrzeit. */
export function formatAdminDateTime(value: string | null | undefined, locale: Locale): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(adminDateLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
