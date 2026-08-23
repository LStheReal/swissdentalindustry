"use client";

import { SubmitButton } from "@/components/admin/SubmitButton";

/**
 * Der einzige Ort, an dem eine Firma öffentlich wird.
 *
 * Speichern, das Freigeben einer Self-Service-Änderung und das Annehmen eines
 * Antrags ändern nichts an der Website — sie schreiben in den Entwurf. Erst
 * hier geht etwas live, und das steht auch so da.
 */
export function PublishPanel({
  status,
  hasDraft,
  pendingFields,
  onPublish,
  onUnpublish,
  onDiscard,
}: {
  status: "draft" | "published";
  hasDraft: boolean;
  pendingFields: string[];
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  onDiscard: () => Promise<void>;
}) {
  const online = status === "published";
  const nothingToPublish = online && !hasDraft;

  return (
    <section className="rounded-[3px] border border-[#e2e2e7] bg-white p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">Website</h2>
        <span
          className={`font-sdi-mono rounded-[2px] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
            online ? "bg-[#1f8a5b] text-white" : "bg-[#a66a00] text-white"
          }`}
        >
          {online ? "Online" : "Nicht online"}
        </span>
      </div>

      <p className="mb-4 text-[13px] leading-relaxed text-[#6b6b73]">
        {nothingToPublish
          ? "Der veröffentlichte Stand ist aktuell — es liegen keine ungeprüften Änderungen vor."
          : hasDraft
            ? "Es liegen Änderungen vor, die noch niemand auf der Website sieht. Sie gehen erst mit „Veröffentlichen“ online."
            : "Diese Firma steht noch nicht im öffentlichen Verzeichnis."}
      </p>

      {hasDraft && pendingFields.length > 0 && (
        <p className="mb-4 rounded-[2px] border-l-2 border-[#a66a00] bg-[#fdf6e7] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#7a4f00]">
          Geändert: {pendingFields.join(", ")}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(hasDraft || !online) && (
          <form action={onPublish}>
            <SubmitButton
              pendingLabel="Wird veröffentlicht …"
              className="rounded-[3px] bg-[#1f8a5b] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-[#18724b]"
            >
              {online ? "Änderungen veröffentlichen" : "Online schalten"}
            </SubmitButton>
          </form>
        )}
        {hasDraft && (
          <form action={onDiscard}>
            <SubmitButton
              pendingLabel="Wird verworfen …"
              className="rounded-[3px] border border-[#c4c4cc] px-3.5 py-2 text-[12.5px] font-semibold hover:bg-[#f2f2f0]"
            >
              Änderungen verwerfen
            </SubmitButton>
          </form>
        )}
        {online && (
          <form action={onUnpublish}>
            <SubmitButton
              pendingLabel="Wird offline genommen …"
              className="rounded-[3px] border border-[#e1000f] px-3.5 py-2 text-[12.5px] font-semibold text-[#e1000f] hover:bg-[#fdecec]"
            >
              Von der Website nehmen
            </SubmitButton>
          </form>
        )}
      </div>
    </section>
  );
}
