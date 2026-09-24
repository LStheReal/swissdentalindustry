"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAdminT } from "@/components/admin/AdminI18n";

/**
 * Auffangnetz für das gesamte Admin-Portal.
 *
 * Ohne diese Datei nimmt ein einzelner unerwarteter Fehler beim Rendern
 * (z.B. eine Beschriftungs-Suche ohne Rückfallwert — siehe
 * lib/member-draft.ts) die komplette Portal-Oberfläche mit: Next.js zeigt
 * dann seine generische Fehlerseite, ohne Navigation und ohne die Möglichkeit,
 * zurückzukommen. Mit dieser Datei bleibt der Fehler auf den betroffenen
 * Bereich begrenzt und es gibt einen Weg zurück.
 *
 * Das behebt keinen Fehler — es verhindert nur, dass ein einzelner Fehler zum
 * Totalausfall wird.
 */
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useAdminT();
  useEffect(() => {
    console.error("Admin-Portal-Fehler:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
      <span className="h-2 w-2 bg-[#e1000f]" />
      <h1 className="mt-4 text-[22px] font-extrabold tracking-[-0.02em]">
        {t("error.title")}
      </h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[#6b6b73]">
        {t("error.body")}
      </p>
      {error.message && (
        <code className="mt-4 max-w-lg break-words rounded-[2px] border border-[#e2e2e7] bg-[#fafaf8] px-3 py-2 text-[12px] text-[#4a4a51]">
          {error.message}
        </code>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-[3px] bg-[#0a0a0b] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-black"
        >
          {t("error.retry")}
        </button>
        <Link
          href="/admin/members"
          className="rounded-[3px] border border-[#c4c4cc] px-4 py-2.5 text-[13px] font-semibold hover:bg-[#f2f2f0]"
        >
          {t("error.toMembers")}
        </Link>
      </div>
    </div>
  );
}
