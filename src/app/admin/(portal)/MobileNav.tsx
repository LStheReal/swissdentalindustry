"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "../login/actions";
import { LocaleSwitcher } from "./LocaleSwitcher";
import type { NavItem } from "./NavLinks";
import type { Locale } from "@/lib/types";

export function MobileNav({
  items,
  locale,
  email,
  logoutLabel,
}: {
  items: NavItem[];
  locale: Locale;
  email: string;
  logoutLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Top bar — mobile only */}
      <div className="flex items-center justify-between border-b border-[#e2e2e7] bg-[#fafaf8] px-5 py-3 lg:hidden">
        <Image
          src="/sdi/logo.png"
          alt="Swiss Dental Industry"
          width={140}
          height={46}
          className="h-[28px] w-auto"
          priority
        />
        <button
          onClick={() => setOpen(true)}
          aria-label="Menü öffnen"
          className="rounded-[2px] p-1.5 hover:bg-[#e7e5df]"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h16M3 12h16M3 18h16" />
          </svg>
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#fafaf8] shadow-xl transition-transform duration-200 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-[#e2e2e7] px-5 py-4">
          <Image
            src="/sdi/logo.png"
            alt="Swiss Dental Industry"
            width={140}
            height={46}
            className="h-[28px] w-auto"
          />
          <button
            onClick={() => setOpen(false)}
            aria-label="Menü schließen"
            className="rounded-[2px] p-1.5 hover:bg-[#e7e5df]"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-5">
          <div className="font-sdi-mono mb-2 pl-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9595a0]">
            Navigation
          </div>
          <nav className="flex flex-col gap-0.5">
            {items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`border-l-2 px-3 py-[9px] text-[13.5px] font-semibold transition ${
                    active
                      ? "border-[#e1000f] bg-[#0a0a0b] text-white"
                      : "border-transparent text-[#4a4a51] hover:border-[#c4c4cc] hover:bg-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          <div className="mt-auto border-t border-[#e2e2e7] pt-5">
            <div className="font-sdi-mono mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9595a0]">
              Sprache
            </div>
            <LocaleSwitcher current={locale} />
            <p className="mt-4 truncate text-[11.5px] text-[#6b6b73]" title={email}>
              {email}
            </p>
            <form action={logout} className="mt-6">
              <button
                type="submit"
                className="w-full rounded-[3px] border border-[#c4c4cc] bg-white px-3 py-2 text-xs font-semibold text-[#0a0a0b] hover:bg-[#f2f2f0]"
              >
                {logoutLabel}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
