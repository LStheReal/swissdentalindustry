"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/types";
import { useAdminT } from "@/components/admin/AdminI18n";
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
    link_url: string;
    source_lang: Locale;
  };
}

export function LinkNewsForm({ action, initial }: Props) {
  const router = useRouter();
  const { t } = useAdminT();
  const [pending, setPending] = useState(false);
  const [url, setUrl] = useState(initial?.link_url ?? "");

  let faviconDomain = "";
  try {
    if (url) faviconDomain = new URL(url).hostname;
  } catch {
    // invalid URL, ignore
  }

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
              <span className={editorSectionTitleClass}>{t("news.sectionLink")}</span>
            </div>

            <label className="block">
              <span className={editorLabelClass}>{t("news.sourceLang")}</span>
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
                {t("news.autoTranslateTitle")}
              </span>
            </label>
          </div>

          <label className="block">
            <span className={editorLabelClass}>{t("field.title")}</span>
            <input name="title" required defaultValue={initial?.title} className={editorInputClass} />
          </label>

          <label className="block">
            <span className={editorLabelClass}>{t("news.linkUrl")}</span>
            <input
              name="link_url"
              type="url"
              required
              placeholder={t("news.linkPlaceholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={editorInputClass}
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-[3px] bg-[#e1000f] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[#c9000d] disabled:opacity-60"
            >
              {pending ? t("common.saving") : t("common.save")}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/news")}
              className="rounded-[3px] border border-[#c4c4cc] bg-white px-4 py-2 text-[12.5px] font-semibold hover:bg-[#fafaf8]"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>

        <aside className="bg-[#fafaf8] p-5 sm:p-6">
          <div className={editorLabelClass}>{t("news.preview")}</div>
          <div className="mt-3 rounded-[2px] border border-[#e2e2e7] bg-white p-4">
            {faviconDomain ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${faviconDomain}&sz=64`}
                  alt=""
                  className="h-10 w-10 rounded-[2px] object-contain"
                />
                <div className="min-w-0">
                  <p className="font-sdi-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6b73]">
                    {t("news.domain")}
                  </p>
                  <p className="break-all text-sm font-semibold text-[#0a0a0b]">{faviconDomain}</p>
                </div>
              </div>
            ) : (
              <p className="font-sdi-mono text-[11px] uppercase tracking-[0.08em] text-[#6b6b73]">
                {t("news.linkPreviewEmpty")}
              </p>
            )}
          </div>
          <p className={editorHintClass}>{t("news.linkHint")}</p>
        </aside>
      </div>
    </form>
  );
}
