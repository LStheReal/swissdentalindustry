"use client";

import { useState } from "react";

interface Props {
  url: string | null;
  hasEmail: boolean;
  onGenerate: () => Promise<void>;
  onRevoke: () => Promise<void>;
  onSendMail: () => Promise<{ error?: string } | void>;
}

export function EditLinkPanel({
  url,
  hasEmail,
  onGenerate,
  onRevoke,
  onSendMail,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [mailStatus, setMailStatus] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setPending(true);
    try {
      await fn();
    } finally {
      setPending(false);
    }
  }

  async function runSend() {
    setPending(true);
    setMailStatus(null);
    try {
      const res = await onSendMail();
      if (res && "error" in res && res.error) {
        setMailStatus(`Fehler: ${res.error}`);
      } else {
        setMailStatus("Link an Firma gesendet");
      }
    } catch (err) {
      setMailStatus(`Fehler: ${err instanceof Error ? err.message : "unbekannt"}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="font-sdi-mono mb-2 text-[10px] font-bold uppercase tracking-[0.14em]">
        Self-Service-Link
      </div>
      {url ? (
        <>
          <div className="font-sdi-mono break-all rounded-[2px] bg-[#0a0a0b] px-3 py-2.5 text-[10.5px] leading-relaxed text-white">
            {url}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded-[3px] border border-[#c4c4cc] bg-white px-3 py-1.5 text-[11.5px] font-semibold"
            >
              {copied ? "Kopiert" : "Kopieren"}
            </button>
            <button
              type="button"
              disabled={pending || !hasEmail}
              title={hasEmail ? "" : "Keine E-Mail-Adresse hinterlegt"}
              onClick={runSend}
              className="rounded-[3px] border border-[#c4c4cc] bg-white px-3 py-1.5 text-[11.5px] font-semibold disabled:opacity-60"
            >
              Mailen
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(onGenerate)}
              className="rounded-[3px] border border-[#c4c4cc] bg-white px-3 py-1.5 text-[11.5px] font-semibold disabled:opacity-60"
            >
              Neu
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(onRevoke)}
              className="rounded-[3px] border border-[#e1000f] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#e1000f] disabled:opacity-60"
            >
              Widerrufen
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(onGenerate)}
            className="rounded-[3px] bg-[#0a0a0b] px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            Link erstellen
          </button>
          <button
            type="button"
            disabled={pending || !hasEmail}
            title={hasEmail ? "" : "Keine E-Mail-Adresse hinterlegt"}
            onClick={runSend}
            className="rounded-[3px] border border-[#c4c4cc] bg-white px-3.5 py-2 text-xs font-semibold disabled:opacity-60"
          >
            Erstellen und mailen
          </button>
        </div>
      )}

      {mailStatus && (
        <p
          className={`font-sdi-mono mt-2 text-[10.5px] uppercase tracking-[0.04em] ${
            mailStatus.startsWith("Fehler") ? "text-[#e1000f]" : "text-[#1f8a5b]"
          }`}
        >
          {mailStatus}
        </p>
      )}
    </div>
  );
}
