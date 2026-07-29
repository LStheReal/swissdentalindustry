"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import type { MembershipApplication } from "@/lib/types";

/**
 * Ein Antrag als Karte: links die Vorschau, wie die Firma im Verzeichnis
 * aussehen würde, rechts die vollständigen Angaben. Der Admin sieht damit vor
 * dem Annehmen genau das, was live geht.
 */
export function ApplicationCard({
  app,
  approveAction,
  rejectAction,
  archiveAction,
  deleteAction,
}: {
  app: MembershipApplication;
  approveAction: () => Promise<void>;
  rejectAction: (formData: FormData) => Promise<void>;
  archiveAction: () => Promise<void>;
  deleteAction: () => Promise<void>;
}) {
  const [rejecting, setRejecting] = useState(false);
  const p = app.payload;
  const isOpen = app.status === "new";

  const rows: [string, string | undefined][] = [
    ["Firma", p.company],
    ["Kontaktperson", p.contact_person],
    ["E-Mail", p.email],
    ["Telefon", p.phone],
    ["Website", p.website_url],
    ["Adresse", p.address],
    ["Beschreibung", p.description],
    ["Nachricht", p.message],
  ];

  return (
    <li className="overflow-hidden rounded-[3px] border border-[#e2e2e7] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e2e7] bg-[#fafaf8] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="font-sdi-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b6b73]">
            {new Date(app.created_at).toLocaleString("de-CH")}
          </span>
          <StatusBadge status={app.status} />
        </div>

        {isOpen && (
          <div className="flex flex-wrap gap-2">
            <form action={approveAction}>
              <SubmitButton
                pendingLabel="Wird angelegt …"
                className="rounded-[3px] bg-[#0a0a0b] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-black"
              >
                Annehmen &amp; Mitglied anlegen
              </SubmitButton>
            </form>
            <button
              type="button"
              onClick={() => setRejecting((v) => !v)}
              className="rounded-[3px] border border-[#e1000f] px-3.5 py-2 text-[12.5px] font-semibold text-[#e1000f] hover:bg-[#fdecec]"
            >
              Ablehnen
            </button>
            <form action={archiveAction}>
              <SubmitButton
                pendingLabel="Wird archiviert …"
                className="rounded-[3px] border border-[#c4c4cc] px-3.5 py-2 text-[12.5px] font-semibold hover:bg-[#f2f2f0]"
              >
                Archivieren
              </SubmitButton>
            </form>
          </div>
        )}

        {!isOpen && (
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

      {rejecting && (
        <form
          action={rejectAction}
          className="border-b border-[#e2e2e7] bg-[#fdecec]/40 px-5 py-4"
        >
          <label className="block">
            <span className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]">
              Begründung (optional — wird der Firma per E-Mail mitgeteilt)
            </span>
            <textarea
              name="reason"
              rows={3}
              className="mt-1.5 w-full rounded-[2px] border border-[#c4c4cc] bg-white px-3 py-2 text-[13.5px] outline-none focus:border-[#0a0a0b]"
              placeholder="z.B. Das Unternehmen erfüllt die Aufnahmekriterien nicht, weil …"
            />
          </label>
          <div className="mt-3 flex gap-2">
            <SubmitButton
              pendingLabel="Wird abgelehnt …"
              className="rounded-[3px] bg-[#e1000f] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-[#c9000d]"
            >
              Ablehnen &amp; benachrichtigen
            </SubmitButton>
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="rounded-[3px] border border-[#c4c4cc] px-3.5 py-2 text-[12.5px] font-semibold hover:bg-white"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-6 p-5 lg:grid-cols-[280px_1fr]">
        {/* Vorschau: so erscheint die Firma im Verzeichnis. */}
        <div>
          <div className="font-sdi-mono mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6b6b73]">
            Vorschau
          </div>
          <div className="overflow-hidden rounded-[3px] border border-[#e2e2e7]">
            <div className="flex h-[130px] items-center justify-center bg-[#fafaf8] p-4">
              {app.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={app.logo_url}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="font-sdi-mono text-[13px] font-bold text-[#c4c4cc]">
                  KEIN LOGO
                </span>
              )}
            </div>
            <div className="border-t border-[#e2e2e7] px-4 py-3">
              <div className="text-[14px] font-bold">{p.company || "—"}</div>
              <div className="mt-1 line-clamp-4 text-[12.5px] leading-relaxed text-[#6b6b73]">
                {p.description || "Keine Beschreibung"}
              </div>
            </div>
          </div>
        </div>

        {/* Vollständige Angaben aus dem Antrag. */}
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className={label === "Beschreibung" || label === "Nachricht" ? "sm:col-span-2" : ""}>
              <dt className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#9595a0]">
                {label}
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap break-words text-[#0a0a0b]">
                {value?.trim() ? value : <span className="text-[#c4c4cc]">—</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {app.status === "rejected" && app.rejection_reason && (
        <div className="border-t border-[#e2e2e7] bg-[#fdecec]/40 px-5 py-3 text-[13px]">
          <span className="font-semibold">Begründung: </span>
          {app.rejection_reason}
        </div>
      )}
    </li>
  );
}

function StatusBadge({ status }: { status: MembershipApplication["status"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: "Offen", cls: "bg-[#fff4d6] text-[#8a5a00]" },
    approved: { label: "Angenommen", cls: "bg-[#e6f6ec] text-[#1a7f43]" },
    converted: { label: "Angenommen (alt)", cls: "bg-[#e6f6ec] text-[#1a7f43]" },
    rejected: { label: "Abgelehnt", cls: "bg-[#fdecec] text-[#e1000f]" },
    archived: { label: "Archiviert", cls: "bg-[#f2f2f0] text-[#6b6b73]" },
  };
  const s = map[status] ?? { label: status, cls: "bg-[#f2f2f0] text-[#6b6b73]" };
  return (
    <span className={`rounded-[2px] px-2 py-1 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
  );
}
