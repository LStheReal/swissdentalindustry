import { AdminI18nProvider } from "@/components/admin/AdminI18n";
import { getAdminLocale } from "@/lib/i18n-admin";

// Umschliesst Portal UND die Seiten vor dem Login (Login, Passwort vergessen,
// Einladung), damit überall dieselbe Sprache gilt.
export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getAdminLocale();
  return <AdminI18nProvider locale={locale}>{children}</AdminI18nProvider>;
}
