// Serverseitiger Zugang zur Admin-Sprache (Cookie). Das Wörterbuch selbst
// liegt in lib/admin-i18n/ und ist auch im Browser nutzbar.

import { cookies } from "next/headers";
import type { Locale } from "./types";
import {
  ADMIN_DEFAULT_LOCALE,
  ADMIN_LOCALE_COOKIE,
  isAdminLocale,
  makeT,
} from "./admin-i18n";

export {
  ADMIN_LOCALE_COOKIE,
  adminDateLocale,
  formatAdminDate,
  formatAdminDateTime,
  makeT,
  type AdminI18nKey,
  type AdminT,
} from "./admin-i18n";

/** Liest die gewählte Portal-Sprache aus dem Cookie (Default: DE). */
export async function getAdminLocale(): Promise<Locale> {
  const value = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  return isAdminLocale(value) ? value : ADMIN_DEFAULT_LOCALE;
}

/** Bequemer Server-Helper: liefert Locale + t() in einem. */
export async function getAdminT() {
  const locale = await getAdminLocale();
  return { locale, t: makeT(locale) };
}
