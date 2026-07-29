"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LOCALES, type Locale } from "@/lib/types";
import { stripLocaleFromPath, withLocalePath } from "@/lib/public-i18n";

// Nur der Header-Ausschnitt der Copy — als Props vom Server-Layout gereicht,
// damit nicht das gesamte mehrsprachige Copy-Modul im Client-Bundle landet.
export type HeaderCopy = {
  nav: readonly { readonly href: string; readonly label: string }[];
  join: string;
  menu: string;
};

export function V2Header({ locale, copy }: { locale: Locale; copy: HeaderCopy }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Shrink + scroll progress, one rAF-throttled listener.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > 8);
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        headerRef.current?.style.setProperty("--v2-progress", p.toFixed(4));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [menuOpen]);

  // Close the menu on navigation (state adjustment during render,
  // see react.dev "You Might Not Need an Effect").
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  const current = stripLocaleFromPath(pathname);

  function isActive(href: string) {
    const target = href.split("#")[0] || "/";
    if (target === "/") return current === "/";
    return current.startsWith(target);
  }

  // Immer MIT Präfix verlinken — auch für die Default-Sprache: "/en/…" ist
  // der Umschalt-Alias, über den der Proxy die Wahl im Cookie verankert,
  // bevor er auf die präfixlose kanonische URL umleitet.
  function localeHref(code: Locale) {
    return `/${code}${current === "/" ? "" : current}`;
  }

  return (
    <>
      <header ref={headerRef} className={`v2-header ${scrolled ? "is-scrolled" : ""}`}>
        <span className="v2-header__progress" aria-hidden />
        <div className="v2-container v2-header__bar">
          <Link href={withLocalePath("/", locale)} className="flex shrink-0 items-center" aria-label="Swiss Dental Industry">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sdi/logo.png"
              alt="Swiss Dental Industry"
              width={908}
              height={300}
              style={{ height: 36, width: "auto" }}
            />
          </Link>

          <nav className="hidden flex-1 items-center gap-[30px] lg:flex" aria-label="Main">
            {copy.nav.map((item) => (
              <Link
                key={item.href}
                href={withLocalePath(item.href, locale)}
                className={`v2-nav-link ${isActive(item.href) ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4 lg:gap-6">
            <div className="hidden items-center gap-1 lg:flex">
              {LOCALES.map((code) => (
                <a
                  key={code}
                  href={localeHref(code)}
                  className={`v2-locale ${code === locale ? "is-active" : ""}`}
                >
                  {code}
                </a>
              ))}
            </div>
            {/* CTA stays visible well below the nav's collapse point */}
            <Link
              href={withLocalePath("/contact", locale)}
              className="v2-btn v2-btn--primary v2-btn--sm v2-header__cta"
            >
              <span className="v2-btn__label">{copy.join}</span>
            </Link>
            <button
              type="button"
              aria-label={copy.menu}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className={`v2-burger lg:hidden ${menuOpen ? "is-open" : ""}`}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div className={`v2-menu lg:hidden ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <nav aria-label={copy.menu}>
          {copy.nav.map((item, i) => (
            <Link
              key={item.href}
              href={withLocalePath(item.href, locale)}
              onClick={() => setMenuOpen(false)}
              className="v2-menu__link"
              style={{ "--v2-d": i } as React.CSSProperties}
            >
              <span className="v2-menu__num">{String(i + 1).padStart(2, "0")}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-7 pt-10">
          <Link
            href={withLocalePath("/contact", locale)}
            onClick={() => setMenuOpen(false)}
            className="v2-btn v2-btn--primary v2-btn--lg justify-center"
          >
            <span className="v2-btn__label">{copy.join}</span>
          </Link>
          <div className="flex items-center justify-center gap-7">
            {LOCALES.map((code) => (
              <a
                key={code}
                href={localeHref(code)}
                className={`v2-locale text-[13px] ${code === locale ? "is-active" : ""}`}
              >
                {code}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
