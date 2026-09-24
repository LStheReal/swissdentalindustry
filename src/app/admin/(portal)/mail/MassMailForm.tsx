"use client";

import { useActionState, useRef, useState } from "react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { MASS_MAIL_PLACEHOLDERS, placeholderToken } from "@/lib/mass-mail";
import type { AdminI18nKey } from "@/lib/admin-i18n";
import { useAdminT } from "@/components/admin/AdminI18n";
import { previewMassMail, sendMassMail, type MassMailState } from "./actions";

const input =
  "mt-2 w-full rounded-[2px] border border-[#c4c4cc] bg-white px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#0a0a0b] focus:ring-2 focus:ring-[#e1000f]/20";
const label =
  "font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]";

export function MassMailForm() {
  const { t } = useAdminT();
  const phLabel = (key: string) => t(`mail.ph.${key}` as AdminI18nKey);
  const [previewState, previewAction, previewPending] = useActionState<
    MassMailState,
    FormData
  >(previewMassMail, { step: "compose" });
  const [sendState, sendAction, sendPending] = useActionState<MassMailState, FormData>(
    sendMassMail,
    {},
  );

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  /** Platzhalter an der Cursorposition einsetzen. */
  function insert(token: string) {
    const el = bodyRef.current;
    if (!el) {
      setBody((b) => b + token);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  if (sendState.step === "sent") {
    return (
      <div className="space-y-5">
        <div className="rounded-[3px] border border-[#c4e8d2] bg-[#eef9f3] p-6">
          <h2 className="text-[17px] font-bold text-[#0e5934]">{t("mail.sentTitle")}</h2>
          <p className="mt-2 text-[14px] text-[#0e5934]">
            {t("mail.sentCount", { count: sendState.sentCount ?? 0 })}
            {sendState.failedCount ? t("mail.failedCount", { count: sendState.failedCount }) : ""}.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#0e5934]">
            {t("mail.handedOverExplain")}
          </p>
        </div>

        {!!sendState.failures?.length && (
          <div className="rounded-[3px] border border-[#f2c4c4] bg-[#fdecec] p-4">
            <p className="text-[13px] font-bold text-[#b3000c]">{t("mail.failed")}</p>
            <ul className="mt-2 space-y-1 text-[12.5px] text-[#b3000c]">
              {sendState.failures.map((f) => (
                <li key={f.email}>
                  {f.company} ({f.email}) — {f.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <a
          href="/admin/mail"
          className="inline-block rounded-[3px] border border-[#c4c4cc] px-4 py-2.5 text-[13px] font-semibold hover:bg-[#fafaf8]"
        >
          {t("mail.newMail")}
        </a>
      </div>
    );
  }

  if (previewState.step === "preview" && previewState.samplePreview) {
    const p = previewState;
    const sample = previewState.samplePreview;
    return (
      <div className="space-y-5">
        <div className="rounded-[3px] border-l-2 border-[#e1000f] bg-[#fafaf8] p-4">
          <p className="text-[14px] font-bold">
            {t("mail.recipientsSummary", { count: p.recipients?.length ?? 0 })}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#4a4a51]">
            {t("mail.nothingSentYet")}
          </p>
        </div>

        {!!p.unknownTokens?.length && (
          <div className="rounded-[2px] border border-[#f0d9a8] bg-[#fdf6e7] px-4 py-3 text-[13px] text-[#7a4f00]">
            {t("mail.unknownPlaceholders")}{" "}
            <span className="font-sdi-mono">{p.unknownTokens.join(", ")}</span>
          </div>
        )}

        {!!p.gaps?.length && (
          <div className="rounded-[2px] border border-[#f0d9a8] bg-[#fdf6e7] px-4 py-3 text-[13px] text-[#7a4f00]">
            <p className="font-semibold">
              {t("mail.gaps", { count: p.gaps.length })}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {p.gaps.slice(0, 10).map((g) => (
                <li key={g.company}>
                  {g.company} — {g.missing.map(phLabel).join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!p.skipped?.length && (
          <div className="rounded-[2px] border border-[#e2e2e7] bg-white px-4 py-3 text-[13px] text-[#4a4a51]">
            <p className="font-semibold">
              {t("mail.skipped", { count: p.skipped.length })}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {p.skipped.map((s) => (
                <li key={s.company}>
                  {s.company} — {s.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-[3px] border border-[#e2e2e7] bg-white">
          <div className="border-b border-[#e2e2e7] px-4 py-3">
            <p className={label}>{t("mail.previewFor", { email: sample.to })}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[14px] font-bold">{sample.subject}</p>
            <p className="mt-3 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[#4a4a51]">
              {sample.text}
            </p>
          </div>
        </div>

        <details className="rounded-[3px] border border-[#e2e2e7] bg-white px-4 py-3">
          <summary className="cursor-pointer text-[13px] font-semibold">
            {t("mail.showAllRecipients", { count: p.recipients?.length ?? 0 })}
          </summary>
          <ul className="mt-3 space-y-1 text-[12.5px] text-[#4a4a51]">
            {p.recipients?.map((r) => (
              <li key={r.memberId}>
                {r.company} — {r.firstName} {r.lastName} &lt;{r.email}&gt;
              </li>
            ))}
          </ul>
        </details>

        {sendState.error && (
          <p className="rounded-[2px] border border-[#f2c4c4] bg-[#fdecec] px-3.5 py-3 text-[13px] text-[#b3000c]">
            {sendState.error}
          </p>
        )}

        <form action={sendAction} className="space-y-4 rounded-[3px] border border-[#e2e2e7] bg-[#fafaf8] p-4">
          <input type="hidden" name="subject" value={p.subject ?? ""} />
          <input type="hidden" name="body" value={p.body ?? ""} />
          <label className="flex items-start gap-2.5 text-[13.5px]">
            <input
              type="checkbox"
              name="confirm"
              value="1"
              required
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#e1000f]"
            />
            <span>
              {t("mail.confirmBefore")}{" "}
              <strong>{t("mail.confirmRecipients", { count: p.recipients?.length ?? 0 })}</strong>
              {t("mail.confirmAfter") === "." ? "" : " "}
              {t("mail.confirmAfter")}
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <SubmitButton
              pendingLabel={t("mail.sending")}
              className="rounded-[3px] bg-[#e1000f] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#c9000d]"
            >
              {t("mail.sendNow")}
            </SubmitButton>
            <a
              href="/admin/mail"
              className="rounded-[3px] border border-[#c4c4cc] px-4 py-2.5 text-[13px] font-semibold hover:bg-white"
            >
              {t("mail.backToText")}
            </a>
          </div>
        </form>
        {sendPending && (
          <p className="text-[13px] text-[#6b6b73]">
            {t("mail.keepOpen")}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={previewAction} className="space-y-5">
      <label className="block">
        <span className={label}>{t("field.subject")}</span>
        <input
          name="subject"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={input}
        />
      </label>

      <div className="block">
        <span className={label}>{t("news.text")}</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {MASS_MAIL_PLACEHOLDERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => insert(placeholderToken(key))}
              title={t("mail.insertPlaceholder", { token: placeholderToken(key) })}
              className="font-sdi-mono rounded-[2px] border border-[#c4c4cc] bg-white px-2.5 py-1.5 text-[11px] font-bold hover:bg-[#f2f2f0]"
            >
              + {phLabel(key)}
            </button>
          ))}
        </div>
        <textarea
          ref={bodyRef}
          name="body"
          required
          rows={14}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={`${input} leading-relaxed`}
          placeholder={t("mail.bodyPlaceholder")}
        />
        <p className="mt-1.5 text-[12px] text-[#6b6b73]">
          {t("mail.placeholderHelp")}
        </p>
      </div>

      {previewState.error && (
        <p className="rounded-[2px] border border-[#f2c4c4] bg-[#fdecec] px-3.5 py-3 text-[13px] text-[#b3000c]">
          {previewState.error}
        </p>
      )}

      <button
        type="submit"
        disabled={previewPending}
        className="rounded-[3px] bg-[#0a0a0b] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-black disabled:opacity-60"
      >
        {previewPending ? t("mail.previewing") : t("mail.showPreview")}
      </button>
    </form>
  );
}
