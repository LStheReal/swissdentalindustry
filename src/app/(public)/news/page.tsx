import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/sdi/Card";
import { createClient } from "@/lib/supabase/server";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { formatDate, withLocalePath } from "@/lib/public-i18n";
import { mlText, type Locale, type News } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return {
    title: copy.meta.newsTitle,
    description: copy.meta.newsDescription,
  };
}

export const revalidate = 60;

function excerpt(text: string, length = 220) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length).trim()}...` : clean;
}

function newsFaviconUrl(linkUrl: string): string | null {
  try {
    const { hostname } = new URL(linkUrl);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return null;
  }
}

function youtubeThumbnailUrl(youtubeUrl: string): string | null {
  try {
    const u = new URL(youtubeUrl);
    let id: string | null = null;
    if (u.hostname === "youtu.be") id = u.pathname.slice(1).split("?")[0] || null;
    else if (u.hostname.includes("youtube.com")) id = u.searchParams.get("v");
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  } catch { /* ignore */ }
  return null;
}

function NewsListItem({
  item,
  locale,
}: {
  item: News;
  locale: Locale;
}) {
  const copy = getPublicCopy(locale);
  const title = mlText(item.title, locale) || copy.common.news;
  const body = mlText(item.body, locale);
  const isLink = !!item.link_url;
  const isYoutube = !!item.youtube_url;
  const faviconUrl = isLink ? newsFaviconUrl(item.link_url!) : null;
  const ytThumbUrl = isYoutube ? youtubeThumbnailUrl(item.youtube_url!) : null;

  const inner = (
    <>
      <span className="relative flex h-[140px] items-center justify-center overflow-hidden rounded-[4px] bg-[color:var(--surface-subtle)] md:h-[120px]">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : ytThumbUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ytThumbUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-red-600 shadow-lg">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </>
        ) : faviconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={faviconUrl}
            alt=""
            className="h-28 w-28 object-contain"
          />
        ) : null}
      </span>

      <span className="min-w-0">
        <span className="block text-[clamp(22px,2.4vw,30px)] font-bold tracking-[-0.02em]">
          {title}
        </span>
        {body ? (
          <span className="mt-3 block text-[15px] leading-[1.65] text-[color:var(--text-secondary)]">
            {excerpt(body)}
          </span>
        ) : isLink ? (
          <span className="mt-3 block text-[15px] leading-[1.65] text-[color:var(--text-secondary)] break-all">
            {item.link_url}
          </span>
        ) : null}
      </span>

      <span className="font-mono text-[13px] font-bold uppercase tracking-[0.08em] text-[color:var(--accent)] md:pt-1 md:text-right">
        {formatDate(item.published_at || item.created_at, locale)}
      </span>
    </>
  );

  const className =
    "grid gap-4 rounded-[6px] border border-[color:var(--border-default)] bg-white p-[clamp(18px,2vw,28px)] transition hover:border-[color:var(--accent)] hover:shadow-[var(--shadow-sm)] md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-start md:gap-[clamp(18px,3vw,32px)]";

  if (isLink) {
    return (
      <a href={item.link_url!} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={withLocalePath(`/news/${item.id}`, locale)} className={className}>
      {inner}
    </Link>
  );
}

export default async function NewsPage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("*")
    .eq("is_published", true)
    .eq("is_active", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(100);

  const news = (data ?? []) as News[];

  return (
    <>
      <section className="border-b border-[color:var(--border-default)] bg-[color:var(--surface-subtle)]">
        <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,48px)] pt-[clamp(48px,7vw,86px)] pb-[clamp(40px,5vw,72px)]">
          <Eyebrow>{copy.newsPage.eyebrow}</Eyebrow>
          <h1 className="mt-4 max-w-[820px] text-[clamp(38px,5vw,68px)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            {copy.newsPage.title}
          </h1>
          <p className="mt-6 max-w-[720px] text-[clamp(16px,1.8vw,19px)] leading-[1.65] text-[color:var(--text-secondary)]">
            {copy.newsPage.intro}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,48px)] py-[clamp(40px,5vw,72px)]">
        {news.length > 0 ? (
          <div className="flex flex-col gap-[clamp(14px,1.8vw,20px)]">
            {news.map((item) => (
              <NewsListItem key={item.id} item={item} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="text-[15px] text-[color:var(--text-muted)]">
            {copy.common.noNews}
          </p>
        )}
      </section>
    </>
  );
}
