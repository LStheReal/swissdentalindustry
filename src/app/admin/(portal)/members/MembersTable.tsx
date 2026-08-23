"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { type Member, type MemberInternalProfileFields, MEMBER_INTERNAL_PROFILE_LABELS } from "@/lib/types";
import { formatAddress, formatAddressOneLine } from "@/lib/address";
import { effectiveMember, hasDraft } from "@/lib/member-draft";
import { deleteMember, publishMember } from "./actions";
import { SubmitButton } from "@/components/admin/SubmitButton";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

interface Props {
  members: Member[];
  internalProfiles: Record<string, MemberInternalProfileFields>;
}

type StatusFilter = "all" | "published" | "draft";

export function MembersTable({ members, internalProfiles }: Props) {
  const [selected, setSelected] = useState<Member | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const profile = selected ? (internalProfiles[selected.id] ?? null) : null;
  // Die Schublade zeigt den Stand, den der Admin bearbeitet — also inklusive
  // unveröffentlichter Änderungen. Was davon online steht, sagt das Badge.
  const view = selected ? effectiveMember(selected) : null;

  const filtered = (() => {
    const q = query.trim().toLowerCase();
    const pool = members.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || (m.canton ?? "").toLowerCase().includes(q);
    });
    if (!q) return pool;
    return pool
      .map((m) => {
        const name = m.name.toLowerCase();
        const canton = (m.canton ?? "").toLowerCase();
        let score = 0;
        if (name === q) score += 100;
        else if (name.startsWith(q)) score += 60;
        else if (name.includes(q)) score += 30 - name.indexOf(q);
        if (canton === q) score += 50;
        else if (canton.startsWith(q)) score += 20;
        else if (canton.includes(q)) score += 10;
        return { m, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(({ m }) => m);
  })();

  const statusLabel: Record<StatusFilter, string> = {
    all: "Status: Alle",
    published: "Status: Publiziert",
    draft: "Status: Entwurf",
  };

  function cycleStatus() {
    setStatusFilter((prev) =>
      prev === "all" ? "published" : prev === "published" ? "draft" : "all"
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-[3px] border border-[#c4c4cc] bg-white px-3 py-2 text-[13px] focus-within:border-[#0a0a0b]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6b73" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Firma oder Kanton suchen..."
            className="flex-1 bg-transparent text-[13px] text-[#0a0a0b] placeholder:text-[#9595a0] outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-[#9595a0] hover:text-[#0a0a0b]"
              aria-label="Suche löschen"
            >
              ×
            </button>
          )}
        </label>
        <button
          type="button"
          onClick={cycleStatus}
          className={`rounded-[3px] border px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
            statusFilter !== "all"
              ? "border-[#0a0a0b] bg-[#0a0a0b] text-white"
              : "border-[#c4c4cc] bg-white text-[#0a0a0b] hover:bg-[#fafaf8]"
          }`}
        >
          {statusLabel[statusFilter]}
        </button>
      </div>

      <div className="overflow-hidden border border-[#e2e2e7] bg-white">
        <div className="font-sdi-mono grid grid-cols-[48px_minmax(0,1fr)_150px_96px_240px] items-center gap-3.5 border-b border-[#e2e2e7] bg-[#fafaf8] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b6b73] max-lg:hidden">
          <span />
          <span>Firma · Standort</span>
          <span>Status</span>
          <span>Geändert</span>
          <span />
        </div>
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-[13px] text-[#6b6b73]">
            Keine Einträge gefunden.
          </div>
        )}
        {filtered.map((m) => (
          <div
            key={m.id}
            onClick={() => setSelected(m)}
            className="grid cursor-pointer gap-3.5 border-b border-[#ececf0] px-4 py-3.5 last:border-b-0 hover:bg-[#fafaf8] lg:grid-cols-[48px_minmax(0,1fr)_150px_96px_240px] lg:items-center"
          >
            <div className="flex items-center gap-3 lg:contents">
              <div className="font-sdi-mono flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-[#e2e2e7] bg-[#fafaf8] text-[10px] font-bold text-[#0a0a0b]">
                {m.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.logo_url} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  initials(m.name)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-[-0.01em]">
                  {m.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#6b6b73]">
                  {m.canton ? `${m.canton} · ` : ""}
                  {formatAddressOneLine(m) || "Keine Adresse"}
                </p>
              </div>
            </div>
            <span className="font-sdi-mono flex flex-col whitespace-nowrap text-[10.5px] font-bold uppercase tracking-[0.08em]">
              <span className={m.status === "published" ? "text-[#1f8a5b]" : "text-[#a66a00]"}>
                ● {m.status === "published" ? "Publiziert" : "Entwurf"}
              </span>
              {hasDraft(m) && (
                <span className="text-[#a66a00]">◐ Änderung offen</span>
              )}
            </span>
            <span className="font-sdi-mono whitespace-nowrap text-[11.5px] text-[#6b6b73]">
              {formatDate(m.updated_at)}
            </span>
            <div
              className="flex flex-nowrap items-center gap-1.5 lg:justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              {(m.status === "draft" || hasDraft(m)) && (
                <form action={publishMember.bind(null, m.id)}>
                  <SubmitButton
                    pendingLabel="Wird veröffentlicht …"
                    className="min-w-[74px] whitespace-nowrap rounded-[3px] border border-[#1f8a5b] bg-[#1f8a5b] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#18724b]"
                  >
                    Veröffentlichen
                  </SubmitButton>
                </form>
              )}
              <Link
                href={`/admin/members/${m.id}`}
                className="min-w-[86px] whitespace-nowrap rounded-[3px] border border-[#c4c4cc] px-2.5 py-1.5 text-[11px] font-semibold text-center hover:bg-[#fafaf8]"
              >
                Bearbeiten
              </Link>
              <form action={deleteMember.bind(null, m.id)}>
                <SubmitButton
                  pendingLabel="Wird gelöscht …"
                  className="min-w-[74px] whitespace-nowrap rounded-[3px] border border-[#e1000f] px-2.5 py-1.5 text-[11px] font-semibold text-[#e1000f] hover:bg-[#fdecec]"
                >
                  Löschen
                </SubmitButton>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* Backdrop */}
      {selected && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setSelected(null)}
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl transition-transform duration-300 ${
          selected ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selected && view && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#e2e2e7] px-6 py-5">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="font-sdi-mono flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-[#e2e2e7] bg-[#fafaf8] text-[11px] font-bold text-[#0a0a0b]">
                  {view.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={view.logo_url} alt="" className="h-full w-full object-contain p-1" />
                  ) : (
                    initials(view.name)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-extrabold tracking-[-0.02em]">{view.name}</p>
                  <span
                    className={`font-sdi-mono mt-0.5 block text-[10px] font-bold uppercase tracking-[0.08em] ${
                      selected.status === "published" ? "text-[#1f8a5b]" : "text-[#a66a00]"
                    }`}
                  >
                    ● {selected.status === "published" ? "Publiziert" : "Entwurf"}
                  </span>
                  {hasDraft(selected) && (
                    <span className="font-sdi-mono mt-0.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#a66a00]">
                      ◐ Unveröffentlichte Änderung
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="ml-4 shrink-0 rounded-[2px] p-1.5 text-[#6b6b73] hover:bg-[#f0f0f3] hover:text-[#0a0a0b]"
                aria-label="Schliessen"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="3" x2="13" y2="13" />
                  <line x1="13" y1="3" x2="3" y2="13" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Öffentliche Info */}
              <section>
                <div className="font-sdi-mono mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#e1000f]">
                  Öffentliche Angaben
                </div>
                <dl className="space-y-2.5">
                  {view.canton && (
                    <Row label="Kanton" value={view.canton} />
                  )}
                  {formatAddress(view) && (
                    <Row label="Adresse" value={formatAddress(view)} />
                  )}
                  {view.phone && (
                    <Row label="Telefon" value={view.phone} />
                  )}
                  {view.email && (
                    <Row label="E-Mail" value={view.email} link={`mailto:${view.email}`} />
                  )}
                  {view.website_url && (
                    <Row label="Website" value={view.website_url} link={view.website_url} external />
                  )}
                  {view.member_since && (
                    <Row label="Mitglied seit" value={view.member_since} />
                  )}
                </dl>
              </section>

              {/* Interne Daten (Firma + Hauptkontakt) */}
              {profile && (
                <section>
                  <div className="font-sdi-mono mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6b6b73]">
                    Interne Daten
                  </div>
                  <dl className="space-y-2.5">
                    {(Object.entries(MEMBER_INTERNAL_PROFILE_LABELS) as [keyof typeof MEMBER_INTERNAL_PROFILE_LABELS, string][]).map(
                      ([key, label]) => {
                        const val = profile[key];
                        if (!val) return null;
                        return <Row key={key} label={label} value={val} />;
                      }
                    )}
                  </dl>
                </section>
              )}

              {/* Meta */}
              <section>
                <div className="font-sdi-mono mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6b6b73]">
                  Meta
                </div>
                <dl className="space-y-2.5">
                  <Row label="Erstellt" value={formatDate(selected.created_at)} />
                  <Row label="Geändert" value={formatDate(selected.updated_at)} />
                  <Row label="ID" value={selected.id} mono />
                </dl>
              </section>
            </div>

            {/* Footer */}
            <div className="border-t border-[#e2e2e7] px-6 py-4">
              <Link
                href={`/admin/members/${selected.id}`}
                className="block w-full rounded-[3px] bg-[#0a0a0b] px-4 py-2.5 text-center text-[13px] font-semibold text-white hover:bg-[#26262b]"
              >
                Bearbeiten
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Row({
  label,
  value,
  link,
  external,
  mono,
}: {
  label: string;
  value: string;
  link?: string;
  external?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-3 border-b border-[#ececf0] pb-2.5">
      <dt className="font-sdi-mono w-32 shrink-0 pt-px text-[10px] font-bold uppercase tracking-[0.08em] text-[#9595a0]">
        {label}
      </dt>
      <dd className={`min-w-0 break-all text-[12.5px] text-[#0a0a0b] ${mono ? "font-mono text-[11px] text-[#6b6b73]" : ""}`}>
        {link ? (
          <a
            href={link}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="text-[#1a6dbf] underline underline-offset-2 hover:text-[#0a4a8f]"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
