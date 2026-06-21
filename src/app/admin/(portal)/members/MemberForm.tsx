"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { translateDescriptionAction } from "./actions";
import {
  LOCALES,
  MEMBER_INTERNAL_PROFILE_KEYS,
  MEMBER_INTERNAL_PROFILE_LABELS,
  emptyMemberInternalProfile,
  type Locale,
  type Multilingual,
  type MemberInternalProfileFields,
} from "@/lib/types";

interface Props {
  action: (formData: FormData) => Promise<void>;
  formId?: string;
  initial?: {
    name: string;
    description: string;
    descriptions?: Multilingual;
    source_lang: Locale;
    logo_url: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    website_url: string | null;
    member_since: string | null;
    internal_profile?: MemberInternalProfileFields;
  };
}

const label =
  "font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]";
const input =
  "mt-1.5 w-full rounded-[2px] border border-[#c4c4cc] bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-[#0a0a0b] focus:ring-2 focus:ring-[#e1000f]/20";

export function MemberForm({ action, formId = "member-form", initial }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [descLang, setDescLang] = useState<Locale>(initial?.source_lang ?? "de");
  const internal = initial?.internal_profile ?? emptyMemberInternalProfile();
  const sourceLang = initial?.source_lang ?? "de";

  const initDescs = (): Record<Locale, string> => {
    const base: Record<Locale, string> = { de: "", fr: "", it: "", en: "" };
    if (initial?.descriptions) return { ...base, ...initial.descriptions };
    if (initial?.description) base[sourceLang] = initial.description;
    return base;
  };
  const [descs, setDescs] = useState<Record<Locale, string>>(initDescs);
  const [effectiveSourceLang, setEffectiveSourceLang] = useState<Locale>(initial?.source_lang ?? "de");
  const [skipTranslate, setSkipTranslate] = useState(false);
  const [translating, setTranslating] = useState(false);

  async function handleTranslate() {
    const text = descs[descLang];
    if (!text.trim()) return;
    setTranslating(true);
    try {
      const result = await translateDescriptionAction(text, descLang);
      setDescs(result);
      setEffectiveSourceLang(descLang);
      setSkipTranslate(true);
    } finally {
      setTranslating(false);
    }
  }

  async function onSubmit(formData: FormData) {
    setPending(true);
    try {
      await action(formData);
    } finally {
      setPending(false);
    }
  }

  return (
    <form id={formId} action={onSubmit}>
      <div className="space-y-6 p-5 sm:p-7">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="h-2 w-2 bg-[#e1000f]" />
              <span className="font-sdi-mono text-[11px] font-bold uppercase tracking-[0.14em]">
                01 — Stammdaten
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={label}>Firmenname</span>
                <input name="name" required defaultValue={initial?.name} className={input} />
              </label>
              <label className="block">
                <span className={label}>Mitglied seit</span>
                <input
                  name="member_since"
                  type="date"
                  defaultValue={initial?.member_since ?? ""}
                  className={input}
                />
              </label>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className={label}>Beschreibung</span>
              <div className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em]">
                <span className="mr-1 text-[#6b6b73]">AUTO-ÜBERSETZT —</span>
                {LOCALES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setDescLang(code)}
                    className={`rounded-[2px] px-1.5 py-0.5 transition-colors ${
                      code === descLang
                        ? code === effectiveSourceLang
                          ? "bg-[#0a0a0b] text-white"
                          : "bg-[#e8f7f0] text-[#1f8a5b] ring-1 ring-[#1f8a5b]/40"
                        : code === effectiveSourceLang
                        ? "font-bold text-[#0a0a0b]"
                        : "text-[#6b6b73] hover:text-[#0a0a0b]"
                    }`}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              key={descLang}
              rows={7}
              value={descs[descLang]}
              onChange={(e) => {
                setDescs((prev) => ({ ...prev, [descLang]: e.target.value }));
                setSkipTranslate(false);
              }}
              className={`${input} leading-relaxed`}
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="font-sdi-mono text-[10.5px] uppercase tracking-[0.04em] text-[#6b6b73]">
                {skipTranslate
                  ? `Übersetzt aus ${effectiveSourceLang.toUpperCase()} · bereit zum Speichern`
                  : descLang === effectiveSourceLang
                  ? "Speichern löst automatische Übersetzung aus"
                  : `Direkte Bearbeitung · ${effectiveSourceLang.toUpperCase()} = Quellsprache`}
              </span>
              <button
                type="button"
                onClick={handleTranslate}
                disabled={translating || !descs[descLang].trim()}
                className="flex shrink-0 items-center gap-1.5 rounded-[2px] border border-[#0a0a0b] bg-white px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[#0a0a0b] transition-colors hover:bg-[#0a0a0b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {translating ? (
                  <>
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Übersetzen…
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    Übersetzen
                  </>
                )}
              </button>
            </div>

            {/* Hidden fields that actually submit */}
            <input type="hidden" name="description" value={descs[effectiveSourceLang]} />
            <input type="hidden" name="_original_description" value={initial?.description ?? ""} />
            <input type="hidden" name="_skip_translate" value={skipTranslate ? "1" : "0"} />
            <input type="hidden" name="_effective_source_lang" value={effectiveSourceLang} />
            {LOCALES.map((code) => (
              <input key={code} type="hidden" name={`desc_${code}`} value={descs[code]} />
            ))}
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="h-2 w-2 bg-[#e1000f]" />
              <span className="font-sdi-mono text-[11px] font-bold uppercase tracking-[0.14em]">
                02 — Kontakt & Standort
              </span>
            </div>
            <label className="block">
              <span className={label}>Adresse</span>
              <textarea
                name="address"
                rows={3}
                defaultValue={initial?.address ?? ""}
                className={`${input} leading-relaxed`}
              />
              <span className="font-sdi-mono mt-1.5 block text-[10.5px] uppercase tracking-[0.04em] text-[#1f8a5b]">
                Geocodierung erfolgt automatisch
              </span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Telefon</span>
              <input name="phone" defaultValue={initial?.phone ?? ""} className={input} />
            </label>
            <label className="block">
              <span className={label}>E-Mail</span>
              <input
                name="email"
                type="email"
                defaultValue={initial?.email ?? ""}
                className={input}
              />
            </label>
          </div>

          <label className="block">
            <span className={label}>Website</span>
            <input
              name="website_url"
              defaultValue={initial?.website_url ?? ""}
              placeholder="https://..."
              className={input}
            />
          </label>

          <section className="border-t border-[#e2e2e7] pt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 bg-[#0a0a0b]" />
                <span className="font-sdi-mono text-[11px] font-bold uppercase tracking-[0.14em]">
                  03 — Interne Mitgliedsdaten
                </span>
              </div>
              <span className="font-sdi-mono rounded-[2px] bg-[#0a0a0b] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                Nicht öffentlich
              </span>
            </div>
            <p className="mb-4 text-[13px] leading-relaxed text-[#6b6b73]">
              Diese Angaben sind nur für das Admin-Portal und die Mitgliederverwaltung.
              Sie werden nicht auf der Website angezeigt.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {MEMBER_INTERNAL_PROFILE_KEYS.map((key) => (
                <label key={key} className={key === "internal_notes" ? "block sm:col-span-2" : "block"}>
                  <span className={label}>{MEMBER_INTERNAL_PROFILE_LABELS[key]}</span>
                  {key === "internal_notes" ? (
                    <textarea
                      name={`internal_${key}`}
                      rows={4}
                      defaultValue={internal[key] ?? ""}
                      className={`${input} leading-relaxed`}
                    />
                  ) : (
                    <input
                      name={`internal_${key}`}
                      type={key === "direct_email" ? "email" : "text"}
                      defaultValue={internal[key] ?? ""}
                      className={input}
                    />
                  )}
                </label>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-[3px] bg-[#e1000f] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[#c9000d] disabled:opacity-60"
            >
              {pending ? "Speichern ..." : "Speichern"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/members")}
              className="rounded-[3px] border border-[#c4c4cc] bg-white px-4 py-2 text-[12.5px] font-semibold hover:bg-[#fafaf8]"
            >
              Abbrechen
            </button>
          </div>
      </div>
    </form>
  );
}
