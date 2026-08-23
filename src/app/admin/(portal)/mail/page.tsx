import { MassMailForm } from "./MassMailForm";

export const metadata = { title: "Serienmail – Admin" };

export default function MassMailPage() {
  return (
    <div className="overflow-hidden border border-[#e2e2e7] bg-white">
      <div className="border-b border-[#e2e2e7] px-5 py-5 sm:px-8">
        <div className="font-sdi-mono mb-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#6b6b73]">
          Serienmail
        </div>
        <h1 className="text-[26px] font-extrabold tracking-[-0.025em]">
          Mail an alle Mitglieder
        </h1>
        <p className="mt-2 max-w-prose text-[13.5px] leading-relaxed text-[#6b6b73]">
          Geht an den Hauptkontakt jeder aktiven Mitgliedsfirma. Vor dem Versand
          gibt es eine Vorschau mit der vollständigen Empfängerliste und eine
          ausdrückliche Bestätigung.
        </p>
      </div>
      <div className="px-5 py-6 sm:px-8">
        <MassMailForm />
      </div>
    </div>
  );
}
