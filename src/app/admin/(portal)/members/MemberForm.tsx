"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { translateDescriptionAction } from "./actions";
import { useAdminT } from "@/components/admin/AdminI18n";
import {
  LOCALES,
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
    street_name: string | null;
    street_number: string | null;
    postal_code: string | null;
    city: string | null;
    address_needs_review?: boolean;
    phone: string | null;
    email: string | null;
    website_url: string | null;
    member_since: string | null;
    employee_count: number | null;
    membership_fee: string | null;
    internal_notes: string | null;
    internal_profile?: MemberInternalProfileFields;
  };
  /** Name des Hauptkontakts — nur zur Anzeige, gepflegt wird er unter „Kontakte“. */
  mainContactName?: string | null;
}

const label =
  "font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]";
const input =
  "mt-1.5 w-full rounded-[2px] border border-[#c4c4cc] bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-[#0a0a0b] focus:ring-2 focus:ring-[#e1000f]/20";

export function MemberForm({
  action,
  formId = "member-form",
  initial,
  mainContactName,
}: Props) {
  const router = useRouter();
  const { t } = useAdminT();
  const [pending, setPending] = useState(false);
  const [descLang, setDescLang] = useState<Locale>(initial?.source_lang ?? "de");
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
                {t("form.sectionBasics")}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={label}>{t("field.companyName")}</span>
                <input name="name" required defaultValue={initial?.name} className={input} />
              </label>
              <label className="block">
                <span className={label}>{t("field.memberSince")}</span>
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
              <span className={label}>{t("field.description")}</span>
              <div className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em]">
                <span className="mr-1 text-[#6b6b73]">{t("form.autoTranslated")}</span>
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
                  ? t("form.translatedReady", { lang: effectiveSourceLang.toUpperCase() })
                  : descLang === effectiveSourceLang
                  ? t("form.saveTriggersTranslation")
                  : t("form.directEdit", { lang: effectiveSourceLang.toUpperCase() })}
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
                    {t("form.translating")}
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    {t("form.translate")}
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
                {t("form.sectionContact")}
              </span>
            </div>
            {initial?.address_needs_review ? (
              <p className="mb-4 border-l-2 border-[#a66a00] bg-[#fdf6e7] px-4 py-3 text-[13px] leading-relaxed text-[#7a4f00]">
                {t("form.addressNeedsReview")}
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_8rem]">
              <label className="block">
                <span className={label}>{t("field.street")}</span>
                <input
                  name="street_name"
                  defaultValue={initial?.street_name ?? ""}
                  className={input}
                />
              </label>
              <label className="block">
                <span className={label}>{t("field.streetNumber")}</span>
                <input
                  name="street_number"
                  defaultValue={initial?.street_number ?? ""}
                  className={input}
                />
              </label>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[8rem_1fr]">
              <label className="block">
                <span className={label}>{t("field.postalCode")}</span>
                <input
                  name="postal_code"
                  inputMode="numeric"
                  defaultValue={initial?.postal_code ?? ""}
                  className={input}
                />
              </label>
              <label className="block">
                <span className={label}>{t("field.city")}</span>
                <input name="city" defaultValue={initial?.city ?? ""} className={input} />
              </label>
            </div>
            <span className="font-sdi-mono mt-1.5 block text-[10.5px] uppercase tracking-[0.04em] text-[#1f8a5b]">
              {t("form.geocodingAuto")}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>{t("field.phone")}</span>
              <input name="phone" defaultValue={initial?.phone ?? ""} className={input} />
            </label>
            <label className="block">
              <span className={label}>{t("field.email")}</span>
              <input
                name="email"
                type="email"
                defaultValue={initial?.email ?? ""}
                className={input}
              />
            </label>
          </div>

          <label className="block">
            <span className={label}>{t("field.website")}</span>
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
                  {t("form.sectionInternal")}
                </span>
              </div>
              <span className="font-sdi-mono rounded-[2px] bg-[#0a0a0b] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                {t("common.notPublic")}
              </span>
            </div>
            <p className="mb-4 text-[13px] leading-relaxed text-[#6b6b73]">
              {t("form.internalIntro")}
            </p>
            {/* Firmen-interne Felder liegen seit Migration 0018 auf `members`
                selbst — vorher hingen sie an der Zeile des Hauptkontakts. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={label}>{t("field.employeeCount")}</span>
                <input
                  name="employee_count"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={initial?.employee_count ?? ""}
                  className={input}
                />
              </label>
              <label className="block">
                <span className={label}>{t("field.membershipFee")}</span>
                <input
                  name="membership_fee"
                  defaultValue={initial?.membership_fee ?? ""}
                  className={input}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className={label}>{t("field.mainContact")}</span>
                <p className="mt-2 rounded-[2px] border border-[#e2e2e7] bg-[#fafaf8] px-3 py-2.5 text-[13.5px] text-[#4a4a51]">
                  {mainContactName || t("form.noMainContact")}
                </p>
              </label>
              <label className="block sm:col-span-2">
                <span className={label}>{t("field.internalNotes")}</span>
                <textarea
                  name="internal_notes"
                  rows={4}
                  defaultValue={initial?.internal_notes ?? ""}
                  className={`${input} leading-relaxed`}
                />
              </label>
            </div>
          </section>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-[3px] bg-[#e1000f] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[#c9000d] disabled:opacity-60"
            >
              {pending ? t("common.saving") : t("common.save")}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/members")}
              className="rounded-[3px] border border-[#c4c4cc] bg-white px-4 py-2 text-[12.5px] font-semibold hover:bg-[#fafaf8]"
            >
              {t("common.cancel")}
            </button>
          </div>
      </div>
    </form>
  );
}
