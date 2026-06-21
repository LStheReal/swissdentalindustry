import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { getAdminT } from "@/lib/i18n-admin";
import { logout } from "../login/actions";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { NavLinks } from "./NavLinks";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const { locale, t } = await getAdminT();

  const navItems = [
    { href: "/admin", label: "Übersicht" },
    { href: "/admin/members", label: t("nav.members") },
    { href: "/admin/applications", label: t("nav.applications") },
    { href: "/admin/feed", label: t("nav.feed") },
    { href: "/admin/news", label: t("nav.news") },
    { href: "/admin/settings", label: t("nav.settings") },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#e7e5df] p-4 text-[#0a0a0b] lg:h-screen lg:overflow-hidden lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1320px] flex-col overflow-hidden rounded-[2px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] lg:h-full lg:min-h-0">
        <div className="h-[3px] bg-[#e1000f]" />
        <div className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[240px_1fr] lg:overflow-hidden">
          <aside className="flex flex-col border-b border-[#e2e2e7] bg-[#fafaf8] p-5 lg:h-full lg:border-b-0 lg:border-r">
            <div className="mb-8">
              <Image
                src="/sdi/logo.png"
                alt="Swiss Dental Industry"
                width={1819}
                height={591}
                className="h-[34px] w-auto"
                preload
              />
            </div>

            <div className="font-sdi-mono mb-2 pl-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9595a0]">
              Navigation
            </div>
            <NavLinks items={navItems} />

            <div className="flex-1" />

            <div className="mt-auto border-t border-[#e2e2e7] pt-5">
              <div className="font-sdi-mono mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9595a0]">
                Sprache
              </div>
              <LocaleSwitcher current={locale} />
              <p
                className="mt-4 truncate text-[11.5px] text-[#6b6b73]"
                title={admin.email ?? ""}
              >
                {admin.email}
              </p>
              <form action={logout} className="mt-6">
                <button
                  type="submit"
                  className="w-full rounded-[3px] border border-[#c4c4cc] bg-white px-3 py-2 text-xs font-semibold text-[#0a0a0b] hover:bg-[#f2f2f0]"
                >
                  {t("nav.logout")}
                </button>
              </form>
            </div>
          </aside>

          <main className="min-w-0 p-5 sm:p-8 lg:min-h-0 lg:overflow-y-auto lg:p-9">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
