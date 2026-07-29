"use client";

import { useEffect, useRef, useState } from "react";
import { withLocalePath } from "@/lib/public-i18n";
import { sanitizeExternalUrl } from "@/lib/url";
import { mlText, type Locale, type Member } from "@/lib/types";
import { ArrowRight } from "./ui";

// Copy-Ausschnitte als Props, damit das 4-sprachige Copy-Modul
// nicht im Client-Bundle landet.
export type MembersGridCopy = {
  openProfile: string;
  viewProfile: string;
  fallbackOrg: string;
  close: string;
  detail: {
    eyebrow: string;
    openWebsite: string;
    canton: string;
    noContact: string;
    googleMaps: string;
  };
};

export function MembersGrid({
  members,
  locale,
  copy,
}: {
  members: Member[];
  locale: Locale;
  copy: MembersGridCopy;
}) {
  const [selected, setSelected] = useState<Member | null>(null);

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-v2-stagger>
        {members.map((member) => {
          const description = mlText(member.description, locale);
          return (
            // Echter Link (Crawler, Cmd/Ctrl-Klick, neuer Tab) — ein einfacher
            // Klick öffnet stattdessen das Profil als Popup.
            <a
              key={member.id}
              href={withLocalePath(`/members/${member.id}`, locale)}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                setSelected(member);
              }}
              className="v2-member-card"
              aria-label={`${member.name} ${copy.openProfile}`}
              data-v2-spot
            >
              <span className="v2-member-card__logo">
                {member.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.logo_url} alt="" loading="lazy" />
                ) : (
                  <span className="text-center text-[24px] font-extrabold tracking-[-0.03em] text-[color:var(--ink-600)]">
                    {member.name}
                  </span>
                )}
              </span>
              <span className="v2-member-card__meta">
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-bold tracking-[-0.01em]">{member.name}</span>
                  <span
                    className="mt-[2px] block truncate text-[10.5px] uppercase tracking-[0.1em] text-[color:var(--text-muted)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {member.canton || (description ? copy.viewProfile : copy.fallbackOrg)}
                  </span>
                </span>
                <span className="v2-member-card__arrow" aria-hidden>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" />
                  </svg>
                </span>
              </span>
            </a>
          );
        })}
      </div>

      {selected ? (
        <MemberModal member={selected} locale={locale} copy={copy} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}

function MemberModal({
  member,
  locale,
  copy,
  onClose,
}: {
  member: Member;
  locale: Locale;
  copy: MembersGridCopy;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const description = mlText(member.description, locale);
  const websiteUrl = sanitizeExternalUrl(member.website_url);
  const googleMapsUrl =
    member.lat != null && member.lng != null
      ? `https://www.google.com/maps?q=${member.lat},${member.lng}`
      : member.address
        ? `https://www.google.com/maps/search/${encodeURIComponent(member.address)}`
        : null;

  // ESC schliesst, Hintergrund-Scroll gesperrt, Fokus auf den Schliessen-Knopf.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="v2-modal" role="dialog" aria-modal="true" aria-label={member.name} onClick={onClose}>
      <div className="v2-modal__panel v2-card" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" className="v2-modal__close" aria-label={copy.close} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>

        <div className="flex flex-wrap items-center gap-6">
          {member.logo_url ? (
            <span className="flex h-[92px] w-[150px] shrink-0 items-center justify-center rounded-[10px] border border-[color:var(--border-subtle)] bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={member.logo_url} alt="" className="max-h-full max-w-full object-contain" />
            </span>
          ) : null}
          <div className="min-w-0">
            <span className="v2-eyebrow">{copy.detail.eyebrow}</span>
            <h2 className="mt-2 break-words text-[clamp(24px,3vw,34px)] font-extrabold leading-[1.05] tracking-[-0.025em]">
              {member.name}
            </h2>
          </div>
        </div>

        {description ? (
          <p className="v2-serif mt-6 break-words text-[clamp(17px,1.9vw,21px)] leading-[1.55] text-[color:var(--ink-800)] [overflow-wrap:anywhere]">
            {description}
          </p>
        ) : null}

        <div className="mt-6 space-y-2 border-t border-[color:var(--border-subtle)] pt-5 text-[14.5px] leading-[1.7] text-[color:var(--text-secondary)]">
          {member.address ? (
            <p className="break-words [overflow-wrap:anywhere]" style={{ whiteSpace: "pre-line" }}>
              {member.address}
            </p>
          ) : null}
          {member.canton ? (
            <p>
              {copy.detail.canton}: {member.canton}
            </p>
          ) : null}
          {member.phone ? (
            <p>
              <a href={`tel:${member.phone}`} className="transition-colors hover:text-[color:var(--ink-950)]">
                {member.phone}
              </a>
            </p>
          ) : null}
          {member.email ? (
            <p>
              <a
                className="font-semibold text-[color:var(--red-500)] transition-colors hover:text-[color:var(--red-600)]"
                href={`mailto:${member.email}`}
              >
                {member.email}
              </a>
            </p>
          ) : null}
          {!member.address && !member.phone && !member.email ? <p>{copy.detail.noContact}</p> : null}
        </div>

        {websiteUrl || googleMapsUrl ? (
          <div className="mt-7 flex flex-wrap items-center gap-4">
            {websiteUrl ? (
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="v2-btn v2-btn--primary v2-btn--sm">
                <span className="v2-btn__label">{copy.detail.openWebsite}</span>
                <span className="v2-btn__arrow" aria-hidden>
                  <ArrowRight />
                  <ArrowRight />
                </span>
              </a>
            ) : null}
            {googleMapsUrl ? (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-bold text-[color:var(--red-500)] transition-colors hover:text-[color:var(--red-600)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {copy.detail.googleMaps}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
