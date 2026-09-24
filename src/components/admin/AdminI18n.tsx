"use client";

import { createContext, useContext, useMemo } from "react";
import { ADMIN_DEFAULT_LOCALE, makeT, type AdminT } from "@/lib/admin-i18n";
import type { Locale } from "@/lib/types";

const AdminLocaleContext = createContext<Locale>(ADMIN_DEFAULT_LOCALE);

/**
 * Stellt die Portal-Sprache für Client-Komponenten bereit. Gesetzt in
 * app/admin/layout.tsx aus dem Cookie; nach dem Sprachwechsel rendert
 * router.refresh() das Layout neu und damit auch diesen Wert.
 */
export function AdminI18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <AdminLocaleContext.Provider value={locale}>{children}</AdminLocaleContext.Provider>;
}

export function useAdminT(): { locale: Locale; t: AdminT } {
  const locale = useContext(AdminLocaleContext);
  return useMemo(() => ({ locale, t: makeT(locale) }), [locale]);
}
