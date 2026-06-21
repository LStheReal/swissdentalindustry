"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/types";
import {
  editorHintClass,
  editorInputClass,
  editorLabelClass,
  editorSectionTitleClass,
} from "./editorStyles";

interface Props {
  action: (formData: FormData) => Promise<void>;
  initial?: {
    title: string;
    body: string;
    source_lang: Locale;
    image_url: string | null;
  };
}

export function NewsForm({ action, initial }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const imageInputId = useId();

  async function onSubmit(formData: FormData) {
    setPending(true);
    try {
      await action(formData);
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="border border-[#e2e2e7] bg-white">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6 p-5 sm:p-7 lg:border-r lg:border-[#e2e2e7]">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="h-2 w-2 bg-[#e1000f]" />
              <span className={editorSectionTitleClass}>01 — Inhalt</span>
            </div>

            <label className="block">
              <span className={editorLabelClass}>Ausgangssprache</span>
              <select
                name="source_lang"
                defaultValue={initial?.source_lang ?? "de"}
                className={editorInputClass}
              >
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_LABELS[l]}
                  </option>
                ))}
              </select>
              <span className={editorHintClass}>
                Wird beim Speichern automatisch in DE · FR · IT · EN übersetzt
              </span>
            </label>
          </div>

          <label className="block">
            <span className={editorLabelClass}>Titel</span>
            <input name="title" required defaultValue={initial?.title} className={editorInputClass} />
          </label>

          <label className="block">
            <span className={editorLabelClass}>Text</span>
            <textarea
              name="body"
              rows={10}
              required
              defaultValue={initial?.body}
              className={`${editorInputClass} leading-relaxed`}
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-[3px] bg-[#e1000f] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[#c9000d] disabled:opacity-60"
            >
              {pending ? "Speichern ..." : "Speichern"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/news")}
              className="rounded-[3px] border border-[#c4c4cc] bg-white px-4 py-2 text-[12.5px] font-semibold hover:bg-[#fafaf8]"
            >
              Abbrechen
            </button>
          </div>
        </div>

        <aside className="bg-[#fafaf8] p-5 sm:p-6">
          <div className={editorLabelClass}>Bild</div>
          <div className="mt-3 flex min-h-[160px] items-center justify-center rounded-[2px] border border-[#e2e2e7] bg-white">
            {initial?.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={initial.image_url}
                alt=""
                className="max-h-[160px] w-full object-cover"
              />
            ) : (
              <span className="font-sdi-mono px-4 text-center text-[11px] uppercase tracking-[0.14em] text-[#6b6b73]">
                Kein Bild ausgewählt
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label
              htmlFor={imageInputId}
              className="inline-flex cursor-pointer items-center gap-2 rounded-[3px] border border-[#c4c4cc] bg-white px-4 py-2 text-[12.5px] font-semibold transition hover:bg-[#f2f2f0]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="h-4 w-4 text-[#6b6b73]"
              >
                <path
                  d="M10 13V4m0 0 3 3m-3-3L7 7M4 13.5V15a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Bild hochladen</span>
            </label>
            <span className="text-xs text-[#6b6b73]">
              {selectedFileName || "Keine Datei ausgewählt"}
            </span>
          </div>
          <input
            id={imageInputId}
            name="image"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? "")}
          />
          <p className={editorHintClass}>Titelbild für den News-Eintrag</p>
          {initial?.image_url ? (
            <p className="mt-5 text-xs leading-relaxed text-[#6b6b73]">
              Ohne neue Datei bleibt das aktuelle Bild erhalten.
            </p>
          ) : null}
        </aside>
      </div>
    </form>
  );
}
