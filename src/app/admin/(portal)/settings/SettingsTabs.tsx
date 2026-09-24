"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminI18nKey } from "@/lib/admin-i18n";
import { useAdminT } from "@/components/admin/AdminI18n";

const tabs: { href: string; label: AdminI18nKey }[] = [
  { href: "/admin/settings", label: "settings.tabGeneral" },
  { href: "/admin/settings/admins", label: "settings.tabAdmins" },
  { href: "/admin/settings/mail-log", label: "settings.tabMailLog" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  const { t } = useAdminT();
  return (
    <nav className="flex gap-1 border-b border-slate-200">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              active
                ? "border-[#e1000f] text-[#0a0a0b]"
                : "border-transparent text-slate-500 hover:text-[#0a0a0b]"
            }`}
          >
            {t(tab.label)}
          </Link>
        );
      })}
    </nav>
  );
}
