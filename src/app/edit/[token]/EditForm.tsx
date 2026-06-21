"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LOCALES,
  LOCALE_LABELS,
  MEMBER_INTERNAL_PROFILE_KEYS,
  MEMBER_INTERNAL_PROFILE_LABELS,
  emptyMemberInternalProfile,
  type Locale,
  type MemberEditableFields,
  type MemberInternalProfileFields,
  type Multilingual,
} from "@/lib/types";
import { getPublicCopy } from "@/lib/public-copy";
import { previewChange, confirmChange, type SubmitState } from "./actions";

interface Props {
  token: string;
  locale: Locale;
  hasPending?: boolean;
  initial: {
    name: string;
    description: string;
    source_lang: Locale;
    logo_url: string | null;
    address: string | null;
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
  const [previewState, previewAction, previewPending] = useActionState<
    SubmitState,
    FormData
  >(previewChange.bind(null, token), {});
  const [confirmState, confirmAction, confirmPending] = useActionState<
    SubmitState,
    FormData
  >(confirmChange.bind(null, token), {});
  const [activeTab, setActiveTab] = useState<"public" | "internal">("public");
  const internal = initial.internal_profile ?? emptyMemberInternalProfile();

  if (confirmState.step === "done") {
    return (
      <div className="space-y-4">
        <div className="border border-[#c4e8d2] bg-[#eef9f3] p-6 text-center">
          <h2 className="text-lg font-bold text-[#0e5934]">{t.doneTitle}</h2>
          <p className="mt-2 text-sm text-[#0e5934]">{t.doneText}</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-[3px] border border-[#c4c4cc] px-4 py-2 text-sm font-semibold hover:bg-[#fafaf8]"
        >
          {t.doneButton}
        </button>
      </div>
    );
  }

  if (previewState.step === "preview" && previewState.proposed) {
    return (
      <PreviewBlock
        t={t}
        current={initial}
        proposed={previewState.proposed}
        contactEmail={previewState.contact_email ?? initial.email}
        confirmAction={confirmAction}
        confirmPending={confirmPending}
        confirmError={confirmState.error}
        onBack={onReset}
      />
    );
  }

  return (
    <form action={previewAction} className="space-y-5">
      <p className="text-sm leading-relaxed text-[#4a4a51]">
        {t.companyLabel}: <span className="font-semibold text-[#0a0a0b]">{initial.name}</span>
      </p>

      {hasPending && (
        <div className="border-l-2 border-[#e1000f] bg-[#fafaf8] p-3 text-sm text-[#4a4a51]">
          {t.pendingWarning}
        </div>
      )}

      <div className="flex border border-[#c4c4cc] bg-[#fafaf8] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("public")}
          className={`flex-1 rounded-[2px] px-3 py-2 text-[12px] font-bold ${
            activeTab === "public"
              ? "bg-[#0a0a0b] text-white"
              : "text-[#4a4a51] hover:bg-white"
          }`}
        >
          Website-Profil
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("internal")}
          className={`flex-1 rounded-[2px] px-3 py-2 text-[12px] font-bold ${
            activeTab === "internal"
              ? "bg-[#0a0a0b] text-white"
              : "text-[#4a4a51] hover:bg-white"
          }`}
        >
          Interne Mitgliedsdaten
        </button>
      </div>

      <div className={activeTab === "public" ? "space-y-5" : "hidden"}>
          <div className="flex gap-4 border border-[#e2e2e7] p-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-[#e2e2e7] bg-[#fafaf8]">
              {initial.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={initial.logo_url} alt="" className="max-h-full max-w-full object-contain p-1" />
              ) : (
                <span className="font-sdi-mono font-bold">SDI</span>
              )}
            </div>
            <div className="flex-1">
              <span className={label}>{t.logoLabel}</span>
              <p className="mt-1 text-[13px] leading-relaxed text-[#4a4a51]">{t.logoHint}</p>
              <input name="logo" type="file" accept="image/*" className="mt-2 block text-xs" />
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

          <label className="block">
            <span className={label}>{t.addressLabel}</span>
            <textarea
              name="address"
              rows={3}
              defaultValue={initial.address ?? ""}
              className={input}
            />
          </label>

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
        className={`space-y-4 border border-[#e2e2e7] bg-[#fafaf8] p-4 ${
          activeTab === "internal" ? "" : "hidden"
        }`}
      >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]">
                Interne Mitgliedsdaten
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#4a4a51]">
                Diese Angaben sind nur für Swiss Dental Industry und erscheinen nicht auf der Website.
              </p>
            </div>
            <span className="font-sdi-mono rounded-[2px] bg-[#0a0a0b] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
              Nicht öffentlich
            </span>
          </div>
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

      {previewState.error && (
        <p className="text-sm text-[#e1000f]">
          {t.errors[previewState.error as keyof typeof t.errors] ?? t.errors.unknown}
        </p>
      )}

      <button
        type="submit"
        disabled={previewPending}
        className="w-full rounded-[3px] bg-[#e1000f] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#c9000d] disabled:opacity-60"
      >
        {previewPending ? t.submitPending : t.submitPreview}
      </button>
    </form>
  );
}

function PreviewBlock({
  t,
  current,
  proposed,
  contactEmail,
  confirmAction,
  confirmPending,
  confirmError,
  onBack,
}: {
  t: ReturnType<typeof getPublicCopy>["editForm"];
  current: Props["initial"];
  proposed: Partial<MemberEditableFields>;
  contactEmail: string | null;
  confirmAction: (formData: FormData) => void;
  confirmPending: boolean;
  confirmError: string | undefined;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="border-l-[3px] border-[#e1000f] bg-[#0a0a0b] p-5 text-sm leading-relaxed text-white">
        {t.previewWarning}
      </div>

      {proposed.logo_url && (
        <FieldPreview label={t.previewLogoLabel}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proposed.logo_url}
            alt=""
            className="h-20 rounded border border-slate-200 object-contain p-1"
          />
        </FieldPreview>
      )}

      {proposed.description && (
        <FieldPreview label={t.previewDescLabel}>
          <div className="space-y-2 text-sm">
            {LOCALES.map((l) => (
              <p key={l}>
                <span className="mr-2 text-xs font-semibold uppercase text-slate-400">
                  {l}
                </span>
                {(proposed.description as Multilingual)[l] || (
                  <span className="text-slate-400">—</span>
                )}
              </p>
            ))}
          </div>
        </FieldPreview>
      )}

      {"address" in proposed && (
        <FieldPreview label={t.previewAddressLabel}>
          <p className="whitespace-pre-line text-sm">
            {proposed.address || <span className="text-slate-400">—</span>}
          </p>
        </FieldPreview>
      )}

      {"phone" in proposed && (
        <FieldPreview label={t.previewPhoneLabel}>
          <p className="text-sm">
            {proposed.phone || <span className="text-slate-400">—</span>}
          </p>
        </FieldPreview>
      )}

      {"email" in proposed && (
        <FieldPreview label={t.previewEmailLabel}>
          <p className="text-sm">
            {proposed.email || <span className="text-slate-400">—</span>}
          </p>
        </FieldPreview>
      )}

      {"website_url" in proposed && (
        <FieldPreview label={t.previewWebsiteLabel}>
          <p className="text-sm">
            {proposed.website_url || <span className="text-slate-400">—</span>}
          </p>
        </FieldPreview>
      )}

      {proposed.internal_profile && (
        <FieldPreview label="Interne Mitgliedsdaten (nicht öffentlich)">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {MEMBER_INTERNAL_PROFILE_KEYS.map((key) => (
              <p key={key}>
                <span className="mr-2 text-xs font-semibold uppercase text-slate-400">
                  {MEMBER_INTERNAL_PROFILE_LABELS[key]}
                </span>
                {proposed.internal_profile?.[key] || (
                  <span className="text-slate-400">—</span>
                )}
              </p>
            ))}
          </div>
        </FieldPreview>
      )}

      {confirmError && (
        <p className="text-sm text-[#e1000f]">
          {t.errors[confirmError as keyof typeof t.errors] ?? t.errors.unknown}
        </p>
      )}

      <form action={confirmAction} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="proposed" value={JSON.stringify(proposed)} />
        <input type="hidden" name="contact_email" value={contactEmail ?? ""} />
        <button
          type="button"
          onClick={onBack}
          className="rounded-[3px] border border-[#c4c4cc] px-4 py-3 text-sm font-semibold hover:bg-[#fafaf8]"
        >
          {t.backButton}
        </button>
        <button
          type="submit"
          disabled={confirmPending}
          className="flex-1 rounded-[3px] bg-[#e1000f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#c9000d] disabled:opacity-60"
        >
          {confirmPending ? t.confirmPending : t.confirmButton}
        </button>
      </form>

      <p className="font-sdi-mono text-[10px] uppercase tracking-[0.04em] text-[#6b6b73]">
        {t.previewNote}
      </p>
      <input type="hidden" value={current.name} readOnly />
    </div>
  );
}

function FieldPreview({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-sdi-mono mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]">
        {label}
      </p>
      <div className="border border-[#c4e8d2] bg-[#eef9f3] p-3">
        {children}
      </div>
    </div>
  );
}
