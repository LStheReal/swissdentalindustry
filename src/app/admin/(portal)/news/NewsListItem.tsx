"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { deleteNews, setNewsActive } from "./actions";

const BODY_PREVIEW_LENGTH = 260;

function truncateText(value: string, maxLength: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trim()}...`;
}

interface Props {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  youtubeUrl: string | null;
  thumbnail: string | null;
  isActive: boolean;
}

export function NewsListItem({
  id,
  title,
  body,
  linkUrl,
  youtubeUrl,
  thumbnail,
  isActive,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const isTextNews = !youtubeUrl && !linkUrl;
  const trimmedBody = useMemo(() => body.trim(), [body]);
  const previewBody = useMemo(
    () => truncateText(trimmedBody, BODY_PREVIEW_LENGTH),
    [trimmedBody],
  );
  const canExpand = isTextNews && trimmedBody.length > BODY_PREVIEW_LENGTH;

  return (
    <li className="flex items-start gap-4 border border-[#e2e2e7] bg-white p-4 sm:p-5">
      {thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt=""
          className={
            linkUrl
              ? "mt-1 h-10 w-10 shrink-0 rounded-[2px] object-contain"
              : youtubeUrl
              ? "h-16 w-28 shrink-0 rounded-[2px] object-cover"
              : "h-16 w-16 shrink-0 rounded-[2px] object-cover"
          }
        />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="break-words text-[15px] font-bold tracking-[-0.01em] [overflow-wrap:anywhere]">
            {title}
          </p>
          <span
            className={`font-sdi-mono text-[10px] font-bold uppercase tracking-[0.1em] ${
              isActive ? "text-[#1f8a5b]" : "text-[#a66a00]"
            }`}
          >
            ● {isActive ? "Aktiv" : "Pausiert"}
          </span>
        </div>

        {youtubeUrl ? (
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-[13.5px] text-[#6b6b73] [overflow-wrap:anywhere]"
          >
            ▶ {youtubeUrl}
          </a>
        ) : linkUrl ? (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-[13.5px] text-[#255dff] [overflow-wrap:anywhere]"
          >
            {linkUrl}
          </a>
        ) : (
          <div className="space-y-2">
            <p className="whitespace-pre-line break-words text-[13.5px] leading-7 text-[#6b6b73] [overflow-wrap:anywhere]">
              {expanded ? trimmedBody : previewBody}
            </p>
            {canExpand ? (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="font-sdi-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[#e1000f] hover:text-[#c9000d]"
              >
                {expanded ? "Weniger anzeigen" : "Ausklappen"}
              </button>
            ) : null}
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={`/admin/news/${id}`}
          className="rounded-[3px] border border-[#c4c4cc] px-3 py-1.5 text-[12.5px] font-semibold hover:bg-[#fafaf8]"
        >
          Bearbeiten
        </Link>
        <form action={setNewsActive.bind(null, id, !isActive)}>
          <button
            type="submit"
            className={`rounded-[3px] border px-3 py-1.5 text-[12.5px] font-semibold ${
              isActive
                ? "border-[#f0cf8b] text-[#a66a00] hover:bg-[#fff8e8]"
                : "border-[#b9dcbf] text-[#1f8a5b] hover:bg-[#eefaf1]"
            }`}
          >
            {isActive ? "Pausieren" : "Aktivieren"}
          </button>
        </form>
        <form action={deleteNews.bind(null, id)}>
          <button
            type="submit"
            className="rounded-[3px] border border-[#ffb6b6] px-3 py-1.5 text-[12.5px] font-semibold text-[#ff1d1d] hover:bg-[#fff1f1]"
          >
            Löschen
          </button>
        </form>
      </div>
    </li>
  );
}
