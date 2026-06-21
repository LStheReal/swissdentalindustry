import { headers } from "next/headers";
import { DEFAULT_LOCALE, type Locale } from "@/lib/types";
import { PUBLIC_LOCALE_HEADER, isLocale } from "@/lib/public-i18n";

export async function getPublicLocale(): Promise<Locale> {
  const headerStore = await headers();
  const fromHeader = headerStore.get(PUBLIC_LOCALE_HEADER) ?? undefined;
  return isLocale(fromHeader) ? fromHeader : DEFAULT_LOCALE;
}
