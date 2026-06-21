"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/types";
import {
  editorHintClass,
  editorInputClass,
  editorLabelClass,
  editorSectionTitleClass,
} from "./editorStyles";

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0] || null;
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/embed/")[1].split("?")[0] || null;
      return u.searchParams.get("v");
    }
  } catch {
    // invalid URL
  }
  return null;
}

interface Props {
  action: (formData: FormData) => Promise<void>;
  initial?: {
    title: string;
    youtube_url: string;
    body?: string;
    source_lang: Locale;
  };
}

export function YoutubeNewsForm({ action, initial }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [url, setUrl] = useState(initial?.youtube_url ?? "");

  const videoId = extractYoutubeId(url);

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
      <div className="p-5 sm:p-7">
        <div className="space-y-6">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="h-2 w-2 bg-[#e1000f]" />
              <span className={editorSectionTitleClass}>01 — Videodaten</span>
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
                Titel und Beschreibung werden automatisch in DE · FR · IT · EN übersetzt
              </span>
            </label>
          </div>

          <label className="block">
            <span className={editorLabelClass}>Titel</span>
            <input name="title" required defaultValue={initial?.title} className={editorInputClass} />
          </label>

          <label className="block">
            <span className={editorLabelClass}>Beschreibung (optional)</span>
            <textarea
              name="body"
              rows={6}
              defaultValue={initial?.body}
              placeholder="Kurze Beschreibung zum Video ..."
              className={`${editorInputClass} leading-relaxed`}
            />
            <span className={editorHintClass}>Wird unter dem Video angezeigt</span>
          </label>

          <label className="block">
            <span className={editorLabelClass}>YouTube-URL</span>
            <input
              name="youtube_url"
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={editorInputClass}
            />
          </label>

        </div>
      </div>

      <div className="border-t border-[#e2e2e7] bg-[#fafaf8] p-5 sm:p-7">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="h-2 w-2 bg-[#e1000f]" />
          <span className={editorSectionTitleClass}>02 — Vorschau</span>
        </div>
        <div className="overflow-hidden rounded-[2px] border border-[#e2e2e7] bg-white">
          {videoId ? (
            <div className="relative w-full overflow-hidden" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube Vorschau"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center">
              <span className="font-sdi-mono text-[11px] uppercase tracking-[0.08em] text-[#6b6b73]">
                URL eingeben, um die Video-Vorschau zu sehen
              </span>
            </div>
          )}
        </div>
        <p className={editorHintClass}>YouTube-Embed im News-Feed</p>

        <div className="flex flex-wrap gap-2 pt-5">
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
            className="rounded-[3px] border border-[#c4c4cc] bg-white px-4 py-2 text-[12.5px] font-semibold hover:bg-[#f2f2f0]"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </form>
  );
}
