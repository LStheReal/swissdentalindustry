import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, V2PageHero } from "@/components/v2/ui";
import { getPublishedNews, excerpt, newsFaviconUrl, youtubeThumbnailUrl } from "@/lib/public-data";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { sanitizeExternalUrl } from "@/lib/url";
import { formatDate, localeAlternates, withLocalePath } from "@/lib/public-i18n";
import { mlText, type Locale, type News } from "@/lib/types";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return {
    title: copy.meta.newsTitle,
    description: copy.meta.newsDescription,
    alternates: localeAlternates("/news", locale),
  };
}

function NewsListRow({ item, locale }: { item: News; locale: Locale }) {
  const copy = getPublicCopy(locale);
  const title = mlText(item.title, locale) || copy.common.news;
  const body = mlText(item.body, locale);
  const ytThumbUrl = item.youtube_url ? youtubeThumbnailUrl(item.youtube_url) : null;
  const faviconUrl = item.link_url ? newsFaviconUrl(item.link_url) : null;

  const inner = (
    <>
      <span className="v2-news-row__date" style={{ fontFamily: "var(--font-mono)" }}>
        {formatDate(item.published_at || item.created_at, locale)}
      </span>
      <span className="v2-news-row__thumb">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt="" className="cover" loading="lazy" />
        ) : ytThumbUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ytThumbUrl} alt="" className="cover" loading="lazy" />
            <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--red-500)] shadow-lg">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </>
        ) : faviconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={faviconUrl} alt="" className="h-14 w-14 object-contain opacity-80" loading="lazy" />
        ) : (
          <svg width="24" height="24" viewBox="0 0 100 100" aria-hidden>
            <path d="M36 6h28v30h30v28H64v30H36V64H6V36h30V6Z" fill="none" stroke="var(--ink-300)" strokeWidth="6" />
          </svg>
        )}
      </span>
      <span className="min-w-0">
        <span className="v2-news-row__title block">{title}</span>
        {body ? (
          <span className="v2-news-row__excerpt block">{excerpt(body, 200)}</span>
        ) : item.link_url ? (
          <span className="v2-news-row__excerpt block break-all">{item.link_url}</span>
        ) : null}
      </span>
      <span className="v2-news-row__go" aria-hidden>
        <ArrowRight size={15} />
      </span>
    </>
  );

  const safeLinkUrl = sanitizeExternalUrl(item.link_url);
  if (safeLinkUrl) {
    return (
      <a href={safeLinkUrl} target="_blank" rel="noopener noreferrer" className="v2-news-row">
        {inner}
      </a>
    );
  }
  return (
    <Link href={withLocalePath(`/news/${item.id}`, locale)} className="v2-news-row">
      {inner}
    </Link>
  );
}

export default async function NewsPage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  const news = await getPublishedNews(100);

  return (
    <>
      <V2PageHero
        index="03"
        eyebrow={copy.newsPage.eyebrow}
        title={copy.newsPage.title}
        intro={copy.newsPage.intro}
      />

      <section className="v2-container py-[clamp(40px,5vw,72px)]">
        {news.length > 0 ? (
          <div className="border-t border-[color:var(--border-default)]" data-v2-reveal>
            {news.map((item) => (
              <NewsListRow key={item.id} item={item} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="text-[15px] text-[color:var(--text-muted)]">{copy.common.noNews}</p>
        )}
      </section>
    </>
  );
}
