import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/types";

export const PUBLIC_LOCALE_HEADER = "x-sdi-locale";

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function getLocaleFromPath(pathname: string): Locale {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isLocale(segment) ? segment : DEFAULT_LOCALE;
}

export function stripLocaleFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (isLocale(parts[0])) parts.shift();
  return `/${parts.join("/")}`.replace(/\/$/, "") || "/";
}

export function withLocalePath(href: string, locale: Locale): string {
  if (/^(https?:|mailto:|tel:)/.test(href)) return href;

  const [pathWithQuery, hash = ""] = href.split("#");
  const [path = "", query = ""] = pathWithQuery.split("?");
  const cleanPath = stripLocaleFromPath(path || "/");
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const localized = `${prefix}${cleanPath === "/" ? "" : cleanPath}` || "/";
  return `${localized}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

/**
 * Canonical- und hreflang-Metadaten für eine öffentliche Seite.
 * Relative Pfade — Next löst sie gegen `metadataBase` im Root-Layout auf.
 */
export function localeAlternates(path: string, locale: Locale) {
  return {
    canonical: withLocalePath(path, locale),
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, withLocalePath(path, l)])),
      "x-default": withLocalePath(path, DEFAULT_LOCALE),
    },
  };
}

export function formatDate(date: string | null, locale: Locale): string {
  if (!date) return "";
  const intlLocale =
    locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : locale === "en" ? "en-CH" : "de-CH";
  return new Intl.DateTimeFormat(intlLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
