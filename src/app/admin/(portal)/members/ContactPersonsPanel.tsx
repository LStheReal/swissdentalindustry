"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import {
  CONTACT_PERSON_KEYS,
  type MemberInternalProfileFields,
  type MemberInternalProfileKey,
} from "@/lib/types";

export interface ContactPersonRow extends MemberInternalProfileFields {
  id: string;
  position: number;
}

/**
 * Übersetzte Beschriftungen als Prop — so bleibt das viersprachige
 * Wörterbuch des Portals aus dem Client-Bundle.
 */
export interface ContactPersonsCopy {
  title: string;
  notPublic: string;
  intro: string;
  empty: string;
  item: string;
  add: string;
  saveNew: string;
  save: string;
  cancel: string;
  remove: string;
  removing: string;
  saving: string;
  creating: string;
  fieldLabels: Record<MemberInternalProfileKey, string>;
}

const input =
  "mt-1 w-full rounded-[2px] border border-[#c4c4cc] bg-white px-3 py-2 text-[13.5px] outline-none focus:border-[#0a0a0b]";
const label =
  "font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#6b6b73]";

/**
 * Die Kontakte einer Mitgliedsfirma. Eine Firma kann mehrere haben; die Nummer
 * ist der laufende Index innerhalb der Firma (erster, zweiter Kontakt).
 * Firmendaten wie Adresse und Logo hängen weiterhin an der Firma selbst.
 */
export function ContactPersonsPanel({
  people,
  copy,
  addAction,
  updateAction,
  deleteAction,
}: {
  people: ContactPersonRow[];
  copy: ContactPersonsCopy;
  addAction: (formData: FormData) => Promise<void>;
  updateAction: (contactId: string, formData: FormData) => Promise<void>;
  deleteAction: (contactId: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <section className="rounded-[3px] border border-[#e2e2e7] bg-white p-5 sm:p-7">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold">{copy.title}</h2>
        <span className="font-sdi-mono rounded-[2px] bg-[#0a0a0b] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
          {copy.notPublic}
        </span>
      </div>
      <p className="mb-5 text-[13px] leading-relaxed text-[#6b6b73]">
        {copy.intro}
      </p>

      {people.length === 0 && !adding && (
        <p className="mb-4 rounded-[2px] bg-[#fafaf8] px-4 py-3 text-[13.5px] text-[#6b6b73]">
          {copy.empty}
        </p>
      )}

      <ul className="space-y-4">
        {people.map((person) => (
          <li key={person.id} className="rounded-[2px] border border-[#e2e2e7] bg-[#fafaf8] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="font-sdi-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]">
                {copy.item} {person.position}
              </span>
              <form action={deleteAction.bind(null, person.id)}>
                <SubmitButton
                  pendingLabel={copy.removing}
                  className="rounded-[3px] border border-[#e1000f] px-3 py-1.5 text-[12px] font-semibold text-[#e1000f] hover:bg-[#fdecec]"
                >
                  {copy.remove}
                </SubmitButton>
              </form>
            </div>
            <form action={updateAction.bind(null, person.id)} className="grid gap-3 sm:grid-cols-2">
              {CONTACT_PERSON_KEYS.map((key) => (
                <label key={key} className="block">
                  <span className={label}>{copy.fieldLabels[key]}</span>
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
                  pendingLabel={copy.saving}
                  className="rounded-[3px] bg-[#0a0a0b] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-black"
                >
                  {copy.save}
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
              {copy.item} {(people.at(-1)?.position ?? 0) + 1}
            </span>
          </div>
          {CONTACT_PERSON_KEYS.filter((key) => key !== "member_number").map((key) => (
            <label key={key} className="block">
              <span className={label}>{copy.fieldLabels[key]}</span>
              <input
                name={`contact_${key}`}
                type={key === "direct_email" ? "email" : "text"}
                className={input}
              />
            </label>
          ))}
          <div className="flex gap-2 sm:col-span-2">
            <SubmitButton
              pendingLabel={copy.creating}
              className="rounded-[3px] bg-[#0a0a0b] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-black"
            >
              {copy.saveNew}
            </SubmitButton>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-[3px] border border-[#c4c4cc] px-3.5 py-2 text-[12.5px] font-semibold hover:bg-[#f2f2f0]"
            >
              {copy.cancel}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 rounded-[3px] border border-[#0a0a0b] px-3.5 py-2 text-[12.5px] font-semibold hover:bg-[#f2f2f0]"
        >
          {copy.add}
        </button>
      )}
    </section>
  );
}
