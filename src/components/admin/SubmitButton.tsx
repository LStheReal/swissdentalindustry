"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit-Button, der während der laufenden Server-Action blockiert und das
 * auch zeigt.
 *
 * Ohne diese Rückmeldung wirkte jeder Klick im Admin-Portal wie ein Fehlklick,
 * solange die Action lief — und Mehrfachklicks lösten die Action mehrfach aus.
 * Der Schutz hier ist Komfort; verlassen darf man sich darauf nicht, deshalb
 * beanspruchen die kritischen Actions ihren Datensatz zusätzlich in der
 * Datenbank (bedingtes Update auf den Status).
 *
 * Muss innerhalb eines `<form>` stehen — `useFormStatus` liest den Zustand des
 * umgebenden Formulars.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className = "",
  title,
  confirm,
}: {
  children: React.ReactNode;
  /** Text während der Action, z.B. "Wird gespeichert …" */
  pendingLabel: string;
  className?: string;
  title?: string;
  /**
   * Rückfrage vor dem Absenden. Pflicht für alles, was sich nicht rückgängig
   * machen lässt (Löschen, Entfernen, Verwerfen …) — siehe
   * tests/security/destructive-confirm.test.ts. Vorher löschte ein einziger
   * Fehlklick in der Mitgliederliste eine Firma samt Kontakten, Beitrag und
   * Notizen.
   */
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      title={title}
      onClick={
        confirm
          ? (event) => {
              if (!window.confirm(confirm)) event.preventDefault();
            }
          : undefined
      }
      className={`${className} disabled:cursor-progress disabled:opacity-60`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
