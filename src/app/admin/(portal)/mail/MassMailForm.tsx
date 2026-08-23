"use client";

import { useActionState, useRef, useState } from "react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import {
  MASS_MAIL_PLACEHOLDERS,
  PLACEHOLDER_LABELS,
  placeholderToken,
} from "@/lib/mass-mail";
import { previewMassMail, sendMassMail, type MassMailState } from "./actions";

const input =
  "mt-2 w-full rounded-[2px] border border-[#c4c4cc] bg-white px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[#0a0a0b] focus:ring-2 focus:ring-[#e1000f]/20";
const label =
  "font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]";

export function MassMailForm() {
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
          <h2 className="text-[17px] font-bold text-[#0e5934]">Versand abgeschlossen</h2>
          <p className="mt-2 text-[14px] text-[#0e5934]">
            {sendState.sentCount} Mail{sendState.sentCount === 1 ? "" : "s"} übergeben
            {sendState.failedCount ? `, ${sendState.failedCount} fehlgeschlagen` : ""}.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#0e5934]">
            „Übergeben“ heisst vom Mailserver angenommen — ob zugestellt wurde, steht
            im Mail-Protokoll unter Einstellungen.
          </p>
        </div>

        {!!sendState.failures?.length && (
          <div className="rounded-[3px] border border-[#f2c4c4] bg-[#fdecec] p-4">
            <p className="text-[13px] font-bold text-[#b3000c]">Fehlgeschlagen</p>
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
          Neue Serienmail
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
            {p.recipients?.length} Empfänger — je Firma der Hauptkontakt
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#4a4a51]">
            Noch wurde nichts verschickt. Prüfen Sie die Vorschau und bestätigen Sie unten.
          </p>
        </div>

        {!!p.unknownTokens?.length && (
          <div className="rounded-[2px] border border-[#f0d9a8] bg-[#fdf6e7] px-4 py-3 text-[13px] text-[#7a4f00]">
            Unbekannte Platzhalter bleiben unersetzt im Text stehen:{" "}
            <span className="font-sdi-mono">{p.unknownTokens.join(", ")}</span>
          </div>
        )}

        {!!p.gaps?.length && (
          <div className="rounded-[2px] border border-[#f0d9a8] bg-[#fdf6e7] px-4 py-3 text-[13px] text-[#7a4f00]">
            <p className="font-semibold">
              Bei {p.gaps.length} Empfänger{p.gaps.length === 1 ? "" : "n"} bliebe ein
              Platzhalter leer:
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {p.gaps.slice(0, 10).map((g) => (
                <li key={g.company}>
                  {g.company} — {g.missing.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!p.skipped?.length && (
          <div className="rounded-[2px] border border-[#e2e2e7] bg-white px-4 py-3 text-[13px] text-[#4a4a51]">
            <p className="font-semibold">
              {p.skipped.length} Firma/Firmen werden übersprungen:
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
            <p className={label}>Vorschau für {sample.to}</p>
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
            Alle {p.recipients?.length} Empfänger anzeigen
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
              Ich habe die Vorschau geprüft und möchte diese Mail an{" "}
              <strong>{p.recipients?.length} Empfänger</strong> verschicken.
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <SubmitButton
              pendingLabel="Wird verschickt …"
              className="rounded-[3px] bg-[#e1000f] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#c9000d]"
            >
              Jetzt verschicken
            </SubmitButton>
            <a
              href="/admin/mail"
              className="rounded-[3px] border border-[#c4c4cc] px-4 py-2.5 text-[13px] font-semibold hover:bg-white"
            >
              Zurück zum Text
            </a>
          </div>
        </form>
        {sendPending && (
          <p className="text-[13px] text-[#6b6b73]">
            Der Versand läuft nacheinander — bitte das Fenster offen lassen.
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={previewAction} className="space-y-5">
      <label className="block">
        <span className={label}>Betreff</span>
        <input
          name="subject"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={input}
        />
      </label>

      <div className="block">
        <span className={label}>Text</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {MASS_MAIL_PLACEHOLDERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => insert(placeholderToken(key))}
              title={`${placeholderToken(key)} einfügen`}
              className="font-sdi-mono rounded-[2px] border border-[#c4c4cc] bg-white px-2.5 py-1.5 text-[11px] font-bold hover:bg-[#f2f2f0]"
            >
              + {PLACEHOLDER_LABELS[key]}
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
          placeholder={"Guten Tag {{first_name}} {{last_name}}\n\n…\n\nIhre Firmendaten können Sie hier aktualisieren:\n{{edit_link}}"}
        />
        <p className="mt-1.5 text-[12px] text-[#6b6b73]">
          Platzhalter werden je Empfänger ersetzt. Die Mail geht an den Hauptkontakt
          jeder Firma.
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
        {previewPending ? "Vorschau wird erstellt …" : "Vorschau anzeigen"}
      </button>
    </form>
  );
}
