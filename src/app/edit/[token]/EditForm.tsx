"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LOCALES,
  LOCALE_LABELS,
  MEMBER_SELF_SERVICE_PROFILE_KEYS,
  internalFieldLabel,
  emptyMemberInternalProfile,
  type Locale,
  type MemberInternalProfileFields,
} from "@/lib/types";
import { addressFieldLabel } from "@/lib/address";
import { getPublicCopy } from "@/lib/public-copy";
import { submitChange, type SubmitState } from "./actions";

interface Props {
  token: string;
  locale: Locale;
  hasPending?: boolean;
  initial: {
    name: string;
    description: string;
    source_lang: Locale;
    logo_url: string | null;
    street_name: string | null;
    street_number: string | null;
    postal_code: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
    website_url: string | null;
    internal_profile: MemberInternalProfileFields | null;
  };
}

const label =
  "font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]";
const input =
  "mt-2 w-full rounded-[2px] border border-[#c4c4cc] bg-white px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#0a0a0b] focus:ring-2 focus:ring-[#e1000f]/20";

export function EditForm({ token, locale, initial, hasPending }: Props) {
  const router = useRouter();
  const [resetKey, setResetKey] = useState(0);
  return (
    <EditFormInner
      key={resetKey}
      token={token}
      locale={locale}
      initial={initial}
      hasPending={hasPending}
      onReset={() => {
        router.refresh();
        setResetKey((k) => k + 1);
      }}
    />
  );
}

function EditFormInner({
  token,
  locale,
  initial,
  hasPending,
  onReset,
}: Props & { onReset: () => void }) {
  const t = getPublicCopy(locale).editForm;
  const [state, action, pending] = useActionState<SubmitState, FormData>(
    submitChange.bind(null, token),
    {},
  );
  const [activeTab, setActiveTab] = useState<"public" | "internal">("public");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const internal = initial.internal_profile ?? emptyMemberInternalProfile();

  const formRef = useRef<HTMLFormElement>(null);
  // Entwurf pro Link, damit zwei Firmen sich nicht in die Quere kommen.
  const storageKey = `sdi-edit-draft:${token}`;

  /**
   * Eingaben überleben das Verlassen der Seite.
   *
   * Wer im Browser zurückgeht, den Tab wechselt oder versehentlich neu lädt,
   * fand vorher ein leeres Formular vor — bei einer Beschreibung, die man
   * einmal getippt hat, ist das ärgerlich genug, dass man es nicht noch einmal
   * macht. Dateien lassen sich technisch nicht wiederherstellen; alles andere
   * schon.
   */
  const persist = useCallback(() => {
    const form = formRef.current;
    if (!form) return;
    const data: Record<string, string> = {};
    for (const el of Array.from(form.elements)) {
      if (
        (el instanceof HTMLInputElement && el.type !== "file") ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        if (el.name) data[el.name] = el.value;
      }
    }
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      /* privater Modus o.ä. — dann eben ohne Entwurf */
    }
  }, [storageKey]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, string>;
      for (const [name, value] of Object.entries(saved)) {
        const el = form.elements.namedItem(name);
        if (
          (el instanceof HTMLInputElement && el.type !== "file") ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) {
          el.value = value;
        }
      }
    } catch {
      /* kaputter Entwurf: lieber die Live-Werte zeigen */
    }
  }, [storageKey]);

  useEffect(() => {
    if (state.step !== "done") return;
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* egal */
    }
  }, [state.step, storageKey]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  if (state.step === "done") {
    return (
      <div className="space-y-4">
        <div className="rounded-[3px] border border-[#c4e8d2] bg-[#eef9f3] p-6 text-center sm:p-8">
          <h2 className="text-[19px] font-bold text-[#0e5934]">{t.doneTitle}</h2>
          <p className="mx-auto mt-2 max-w-prose text-[14px] leading-relaxed text-[#0e5934]">
            {t.doneText}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-[3px] border border-[#c4c4cc] px-4 py-3 text-[14px] font-semibold hover:bg-[#fafaf8]"
        >
          {t.doneButton}
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} onInput={persist} onChange={persist} className="space-y-6">
      <p className="text-[14px] leading-relaxed text-[#4a4a51]">
        {t.companyLabel}:{" "}
        <span className="font-semibold text-[#0a0a0b]">{initial.name}</span>
      </p>

      {hasPending && (
        <div className="rounded-[2px] border-l-2 border-[#e1000f] bg-[#fafaf8] p-3.5 text-[13.5px] leading-relaxed text-[#4a4a51]">
          {t.pendingWarning}
        </div>
      )}

      <div className="flex flex-col gap-1 rounded-[2px] border border-[#c4c4cc] bg-[#fafaf8] p-1 sm:flex-row">
        <TabButton active={activeTab === "public"} onClick={() => setActiveTab("public")}>
          {t.publicTabLabel}
        </TabButton>
        <TabButton active={activeTab === "internal"} onClick={() => setActiveTab("internal")}>
          {t.internalTabLabel}
        </TabButton>
      </div>

      {/* Beide Bereiche bleiben im DOM — ein Tabwechsel darf nichts leeren. */}
      <div className={activeTab === "public" ? "space-y-6" : "hidden"}>
        <div className="flex flex-col gap-4 rounded-[3px] border border-[#e2e2e7] p-4 sm:flex-row sm:items-start">
          <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-[#e2e2e7] bg-white p-3 sm:w-40">
            {logoPreview || initial.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview ?? initial.logo_url ?? ""}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="font-sdi-mono text-[13px] font-bold text-[#c4c4cc]">SDI</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className={label}>{t.logoLabel}</span>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#4a4a51]">{t.logoHint}</p>
            <input
              name="logo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setLogoPreview((old) => {
                  if (old) URL.revokeObjectURL(old);
                  return file ? URL.createObjectURL(file) : null;
                });
              }}
              className="mt-3 block w-full text-[12px] file:mr-3 file:rounded-[3px] file:border file:border-[#c4c4cc] file:bg-white file:px-3 file:py-1.5 file:text-[12px] file:font-semibold"
            />
          </div>
        </div>

        <label className="block">
          <span className={label}>{t.descLangLabel}</span>
          <select name="source_lang" defaultValue={initial.source_lang} className={input}>
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_LABELS[l]}
              </option>
            ))}
          </select>
          <span className="font-sdi-mono mt-1.5 block text-[10.5px] uppercase tracking-[0.04em] text-[#6b6b73]">
            {t.descLangHint}
          </span>
        </label>

        <label className="block">
          <span className={label}>{t.descriptionLabel}</span>
          <textarea
            name="description"
            rows={6}
            defaultValue={initial.description}
            className={input}
          />
        </label>

        <fieldset className="block">
          <legend className={label}>{t.addressLabel}</legend>
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_8rem]">
            <label className="block">
              <span className={label}>{addressFieldLabel("street_name", locale)}</span>
              <input name="street_name" defaultValue={initial.street_name ?? ""} className={input} />
            </label>
            <label className="block">
              <span className={label}>{addressFieldLabel("street_number", locale)}</span>
              <input
                name="street_number"
                defaultValue={initial.street_number ?? ""}
                className={input}
              />
            </label>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[8rem_1fr]">
            <label className="block">
              <span className={label}>{addressFieldLabel("postal_code", locale)}</span>
              <input
                name="postal_code"
                inputMode="numeric"
                defaultValue={initial.postal_code ?? ""}
                className={input}
              />
            </label>
            <label className="block">
              <span className={label}>{addressFieldLabel("city", locale)}</span>
              <input name="city" defaultValue={initial.city ?? ""} className={input} />
            </label>
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={label}>{t.phoneLabel}</span>
            <input name="phone" defaultValue={initial.phone ?? ""} className={input} />
          </label>
          <label className="block">
            <span className={label}>{t.emailLabel}</span>
            <input
              name="email"
              type="email"
              defaultValue={initial.email ?? ""}
              className={input}
            />
          </label>
        </div>

        <label className="block">
          <span className={label}>{t.websiteLabel}</span>
          <input
            name="website_url"
            defaultValue={initial.website_url ?? ""}
            placeholder="https://…"
            className={input}
          />
        </label>
      </div>

      <section
        className={`space-y-4 rounded-[3px] border border-[#e2e2e7] bg-[#fafaf8] p-4 sm:p-5 ${
          activeTab === "internal" ? "" : "hidden"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={label}>{t.internalTitle}</p>
            <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-[#4a4a51]">
              {t.internalHint}
            </p>
          </div>
          <span className="font-sdi-mono shrink-0 rounded-[2px] bg-[#0a0a0b] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
            {t.internalBadge}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {MEMBER_SELF_SERVICE_PROFILE_KEYS.map((key) => (
            <label key={key} className="block">
              <span className={label}>{internalFieldLabel(key, locale)}</span>
              <input
                name={`internal_${key}`}
                type={key === "direct_email" ? "email" : "text"}
                defaultValue={internal[key] ?? ""}
                className={input}
              />
            </label>
          ))}
        </div>
      </section>

      {state.error && (
        <p className="rounded-[2px] border border-[#f2c4c4] bg-[#fdecec] px-3.5 py-3 text-[13.5px] text-[#b3000c]">
          {t.errors[state.error as keyof typeof t.errors] ?? t.errors.unknown}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[3px] bg-[#e1000f] px-4 py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#c9000d] disabled:opacity-60"
      >
        {pending ? t.submitPending : t.submitLabel}
      </button>
    </form>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-[2px] px-3 py-2.5 text-[12.5px] font-bold transition-colors ${
        active ? "bg-[#0a0a0b] text-white" : "text-[#4a4a51] hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}
