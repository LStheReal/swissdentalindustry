import { SubmitButton } from "@/components/admin/SubmitButton";
import { buildInquiryReplyHref } from "@/lib/inquiry-reply";
import type { MembershipApplication } from "@/lib/types";

/**
 * Eine Kontaktanfrage. Bewusst anders gebaut als die Antrags-Karte: hier gibt
 * es nichts zu prüfen und nichts anzulegen — es ist eine Nachricht, auf die man
 * antwortet. Die einzige inhaltliche Aktion ist deshalb "Antworten", das den
 * Mailclient mit Empfänger, Betreff und zitierter Nachricht öffnet.
 */
export function InquiryCard({
  app,
  archiveAction,
  deleteAction,
}: {
  app: MembershipApplication;
  archiveAction: () => Promise<void>;
  deleteAction: () => Promise<void>;
}) {
  const p = app.payload;
  const sender = (p.name || p.contact_person || "").trim();
  const company = (p.company || "").trim();
  const email = (p.email || "").trim();
  const phone = (p.phone || "").trim();
  const subject = (p.subject || "").trim();
  const message = (p.message || "").trim();
  const isOpen = app.status === "new";

  // Herkunft: das Kontaktformular und das Mitwirken-Formular landen beide hier.
  const origin =
    p.source === "public_mitwirken" ? "Mitwirken-Formular" : "Kontaktformular";

  const replyHref = buildInquiryReplyHref(p);

  return (
    <li className="overflow-hidden rounded-[3px] border border-[#e2e2e7] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e2e7] bg-[#f4f6f8] px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-[2px] bg-[#e7edf3] px-2 py-1 text-[11px] font-bold text-[#3c5a75]">
            {origin}
          </span>
          <span className="font-sdi-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b6b73]">
            {new Date(app.created_at).toLocaleString("de-CH")}
          </span>
          {!isOpen && (
            <span className="rounded-[2px] bg-[#f2f2f0] px-2 py-1 text-[11px] font-bold text-[#6b6b73]">
              Erledigt
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {replyHref ? (
            <a
              href={replyHref}
              className="rounded-[3px] bg-[#0a0a0b] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-black"
            >
              Antworten
            </a>
          ) : (
            <span
              className="rounded-[3px] border border-[#e2e2e7] px-3.5 py-2 text-[12.5px] font-semibold text-[#9595a0]"
              title="Diese Anfrage enthält keine E-Mail-Adresse."
            >
              Keine E-Mail-Adresse
            </span>
          )}
          {isOpen ? (
            <form action={archiveAction}>
              <SubmitButton
                pendingLabel="Moment …"
                className="rounded-[3px] border border-[#c4c4cc] px-3.5 py-2 text-[12.5px] font-semibold hover:bg-[#f2f2f0]"
              >
                Als erledigt markieren
              </SubmitButton>
            </form>
          ) : (
            <form action={deleteAction}>
              <SubmitButton
                pendingLabel="Wird gelöscht …"
                className="rounded-[3px] border border-[#e1000f] px-3.5 py-2 text-[12.5px] font-semibold text-[#e1000f] hover:bg-[#fdecec]"
              >
                Löschen
              </SubmitButton>
            </form>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[15px] font-bold">{sender || email || "Unbekannt"}</span>
          {company && <span className="text-[13.5px] text-[#6b6b73]">{company}</span>}
        </div>

        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          {email && (
            <a href={`mailto:${email}`} className="text-[#3c5a75] underline">
              {email}
            </a>
          )}
          {phone && (
            <a href={`tel:${phone.replace(/\s+/g, "")}`} className="text-[#3c5a75] underline">
              {phone}
            </a>
          )}
        </div>

        {subject && (
          <div className="mt-3 text-[14px] font-semibold text-[#0a0a0b]">{subject}</div>
        )}
        <div className="mt-1.5 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-[#0a0a0b]">
          {message || <span className="text-[#c4c4cc]">Keine Nachricht</span>}
        </div>

        <ExtraFields payload={p} />
      </div>
    </li>
  );
}

/**
 * Felder, die das Formular zusätzlich mitgeschickt hat. Nichts verstecken: ein
 * neues Feld im Formular soll im Portal sichtbar sein, ohne Code-Änderung.
 */
const SHOWN_KEYS = new Set([
  "name",
  "contact_person",
  "company",
  "email",
  "phone",
  "subject",
  "message",
  "source",
  "locale",
  "_hp",
]);

function ExtraFields({ payload }: { payload: MembershipApplication["payload"] }) {
  const extra = Object.entries(payload).filter(
    ([key, value]) => !SHOWN_KEYS.has(key) && value?.trim(),
  );
  if (extra.length === 0) return null;

  return (
    <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-[#f0f0ee] pt-3 text-[13px] sm:grid-cols-2">
      {extra.map(([key, value]) => (
        <div key={key}>
          <dt className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#9595a0]">
            {key}
          </dt>
          <dd className="mt-0.5 whitespace-pre-wrap break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
