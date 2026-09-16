"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ADMIN_LOCALE_COOKIE } from "@/lib/i18n-admin";
import { LOCALES, type Locale } from "@/lib/types";

export async function setAdminLocale(locale: Locale, currentPath?: string) {
  // Wie jede Server Action ein öffentlicher POST-Endpunkt — ohne Guard könnte
  // jeder Besucher Admin-Pfade revalidieren lassen.
  await requireAdmin();
  if (!LOCALES.includes(locale)) return;
  (await cookies()).set(ADMIN_LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/admin", "layout");
  if (currentPath?.startsWith("/admin")) {
    revalidatePath(currentPath);
  }
}
