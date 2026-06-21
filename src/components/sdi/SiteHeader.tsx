"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LOCALES, type Locale } from "@/lib/types";
import { getPublicCopy } from "@/lib/public-copy";
import { getLocaleFromPath, withLocalePath } from "@/lib/public-i18n";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const copy = getPublicCopy(locale);

  function l(href: string, targetLocale: Locale = locale) {
    return withLocalePath(href, targetLocale);
  }

  return (
    <>
      <div className="h-[3px] w-full bg-[color:var(--accent)]" />
      <header
        id="top"
        className="sticky top-0 z-50 border-b border-[color:var(--border-default)]"
        style={{
          background: "rgba(255,255,255,0.86)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center gap-7 px-[clamp(20px,5vw,48px)]">
          <Link href={l("/")} className="flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sdi/logo.png"
              alt="Swiss Dental Industry"
              width={908}
              height={300}
              style={{ height: 38, width: "auto" }}
            />
          </Link>

          <nav className="ml-2 hidden flex-1 items-center gap-[26px] lg:flex">
            {copy.header.nav.map((item) => (
              <Link
                key={item.href}
                href={l(item.href)}
                className="border-b-2 border-transparent py-[6px] text-[14.5px] font-semibold tracking-[-0.01em] text-[color:var(--ink-700)] transition-colors hover:text-[color:var(--accent)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-4 lg:flex">
            <div className="flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em]">
              {LOCALES.map((code) => (
                <a
                  key={code}
                  href={withLocalePath(pathname, code)}
                  className="text-[color:var(--ink-500)] transition-colors hover:text-[color:var(--ink-950)]"
                  style={{ color: code === locale ? "var(--accent)" : "var(--ink-500)" }}
                >
                  {code}
                </a>
              ))}
            </div>
            <Link
              href={l("/mitglied-werden")}
              className="inline-flex items-center gap-2 rounded-[4px] bg-[color:var(--accent)] px-5 py-[11px] text-[14px] font-semibold text-white transition-colors hover:bg-[color:var(--accent-hover)]"
              style={{ color: "#ffffff" }}
            >
              {copy.header.join}
            </Link>
          </div>

          <button
            type="button"
            aria-label={copy.header.menu}
            onClick={() => setMenuOpen((v) => !v)}
            className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-[4px] border border-[color:var(--border-default)] bg-transparent text-[color:var(--ink-950)] lg:hidden"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        {menuOpen ? (
          <div className="border-t border-[color:var(--border-default)] bg-white px-[clamp(20px,5vw,48px)] pt-2 pb-5 lg:hidden">
            {copy.header.nav.map((item) => (
              <Link
                key={item.href}
                href={l(item.href)}
                onClick={() => setMenuOpen(false)}
                className="block border-b border-[color:var(--border-subtle)] py-[14px] text-[18px] font-semibold tracking-[-0.01em]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={l("/mitglied-werden")}
              onClick={() => setMenuOpen(false)}
              className="mt-4 flex items-center justify-center rounded-[4px] bg-[color:var(--accent)] px-5 py-[13px] text-[15px] font-semibold text-white"
              style={{ color: "#ffffff" }}
            >
              {copy.header.join}
            </Link>
          </div>
        ) : null}
      </header>
    </>
  );
}
