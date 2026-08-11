"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import {
  CONTACT_PERSON_KEYS,
  MEMBER_INTERNAL_PROFILE_LABELS,
  type MemberInternalProfileFields,
} from "@/lib/types";

export interface ContactPersonRow extends MemberInternalProfileFields {
  id: string;
  position: number;
}

const input =
  "mt-1 w-full rounded-[2px] border border-[#c4c4cc] bg-white px-3 py-2 text-[13.5px] outline-none focus:border-[#0a0a0b]";
const label =
  "font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#6b6b73]";

/**
 * Die Ansprechpersonen eines Partners. Ein Partner kann mehrere haben; die
 * Nummer ist der laufende Index innerhalb der Firma (erste, zweite Person).
 * Firmendaten wie Adresse und Logo hängen weiterhin an der Firma selbst.
 */
export function ContactPersonsPanel({
  people,
  addAction,
  updateAction,
  deleteAction,
}: {
  people: ContactPersonRow[];
  addAction: (formData: FormData) => Promise<void>;
  updateAction: (contactId: string, formData: FormData) => Promise<void>;
  deleteAction: (contactId: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <section className="rounded-[3px] border border-[#e2e2e7] bg-white p-5 sm:p-7">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold">Mitglieder</h2>
        <span className="font-sdi-mono rounded-[2px] bg-[#0a0a0b] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
          Nicht öffentlich
        </span>
      </div>
      <p className="mb-5 text-[13px] leading-relaxed text-[#6b6b73]">
        Ansprechpersonen dieses Partners. Die Nummer ergibt sich fortlaufend —
        erste, zweite, dritte Person. Adresse und Logo gehören zur Firma und
        stehen oben.
      </p>

      {people.length === 0 && !adding && (
        <p className="mb-4 rounded-[2px] bg-[#fafaf8] px-4 py-3 text-[13.5px] text-[#6b6b73]">
          Noch keine Person erfasst.
        </p>
      )}

      <ul className="space-y-4">
        {people.map((person) => (
          <li key={person.id} className="rounded-[2px] border border-[#e2e2e7] bg-[#fafaf8] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="font-sdi-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]">
                Mitglied {person.position}
              </span>
              <form action={deleteAction.bind(null, person.id)}>
                <SubmitButton
                  pendingLabel="Wird entfernt …"
                  className="rounded-[3px] border border-[#e1000f] px-3 py-1.5 text-[12px] font-semibold text-[#e1000f] hover:bg-[#fdecec]"
                >
                  Entfernen
                </SubmitButton>
              </form>
            </div>
            <form action={updateAction.bind(null, person.id)} className="grid gap-3 sm:grid-cols-2">
              {CONTACT_PERSON_KEYS.map((key) => (
                <label key={key} className="block">
                  <span className={label}>{MEMBER_INTERNAL_PROFILE_LABELS[key]}</span>
                  <input
                    name={`contact_${key}`}
                    type={key === "direct_email" ? "email" : "text"}
                    defaultValue={person[key] ?? ""}
                    className={input}
                  />
                </label>
              ))}
              <div className="sm:col-span-2">
                <SubmitButton
                  pendingLabel="Wird gespeichert …"
                  className="rounded-[3px] bg-[#0a0a0b] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-black"
                >
                  Speichern
                </SubmitButton>
              </div>
            </form>
          </li>
        ))}
      </ul>

      {adding ? (
        <form
          action={async (formData: FormData) => {
            await addAction(formData);
            setAdding(false);
          }}
          className="mt-4 grid gap-3 rounded-[2px] border border-dashed border-[#c4c4cc] p-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <span className="font-sdi-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]">
              Mitglied {(people.at(-1)?.position ?? 0) + 1}
            </span>
          </div>
          {CONTACT_PERSON_KEYS.filter((key) => key !== "member_number").map((key) => (
            <label key={key} className="block">
              <span className={label}>{MEMBER_INTERNAL_PROFILE_LABELS[key]}</span>
              <input
                name={`contact_${key}`}
                type={key === "direct_email" ? "email" : "text"}
                className={input}
              />
            </label>
          ))}
          <div className="flex gap-2 sm:col-span-2">
            <SubmitButton
              pendingLabel="Wird angelegt …"
              className="rounded-[3px] bg-[#0a0a0b] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-black"
            >
              Mitglied speichern
            </SubmitButton>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-[3px] border border-[#c4c4cc] px-3.5 py-2 text-[12.5px] font-semibold hover:bg-[#f2f2f0]"
            >
              Abbrechen
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 rounded-[3px] border border-[#0a0a0b] px-3.5 py-2 text-[12.5px] font-semibold hover:bg-[#f2f2f0]"
        >
          + Mitglied hinzufügen
        </button>
      )}
    </section>
  );
}
