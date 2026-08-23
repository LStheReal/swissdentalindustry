"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/settings", label: "Allgemein" },
  { href: "/admin/settings/admins", label: "Admin-Benutzer" },
  { href: "/admin/settings/mail-log", label: "Mail-Protokoll" },
];

export function SettingsTabs() {
  const pathname = usePathname();
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
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
