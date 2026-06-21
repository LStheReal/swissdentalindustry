"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_LOCALE_COOKIE } from "@/lib/i18n-admin";
import { LOCALES, type Locale } from "@/lib/types";

export async function setAdminLocale(locale: Locale, currentPath?: string) {
  if (!LOCALES.includes(locale)) return;
  (await cookies()).set(ADMIN_LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/admin", "layout");
  if (currentPath?.startsWith("/admin")) {
    revalidatePath(currentPath);
  }
}
