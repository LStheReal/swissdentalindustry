import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, V2BtnLink, V2Eyebrow } from "@/components/v2/ui";
import { getPublishedNewsItem, extractYoutubeEmbedUrl } from "@/lib/public-data";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { formatDate, localeAlternates, withLocalePath } from "@/lib/public-i18n";
import { mlText } from "@/lib/types";

export const revalidate = 60;

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [item, locale] = await Promise.all([getPublishedNewsItem(id), getPublicLocale()]);
  if (!item) return {};
  const copy = getPublicCopy(locale);

  const title = mlText(item.title, locale) || copy.common.news;
  const description = mlText(item.body, locale).replace(/\s+/g, " ").slice(0, 155);

  return {
    title: `${title} — Swiss Dental Industry`,
    description,
    alternates: localeAlternates(`/news/${id}`, locale),
    openGraph: {
      title,
      description,
      images: item.image_url ? [item.image_url] : undefined,
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const [item, locale] = await Promise.all([getPublishedNewsItem(id), getPublicLocale()]);
  if (!item) notFound();
  const copy = getPublicCopy(locale);

  const title = mlText(item.title, locale) || copy.common.news;
  const body = mlText(item.body, locale);
  const date = formatDate(item.published_at || item.created_at, locale);

  return (
    <article className="overflow-x-hidden">
      <section className="v2-page-hero">
        <div className="v2-page-hero__grid" aria-hidden />
        <div className="relative mx-auto max-w-[900px] px-[var(--v2-gutter)] pt-[clamp(48px,7vw,88px)] pb-[clamp(36px,5vw,64px)]">
          <div className="flex flex-wrap items-center gap-5" data-v2-reveal>
            <V2Eyebrow>{copy.newsDetail.eyebrow}</V2Eyebrow>
            <span
              className="text-[13px] font-bold tracking-[0.06em] text-[color:var(--red-500)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {date}
            </span>
          </div>
          <h1
            className="mt-6 break-words text-[clamp(34px,4.8vw,60px)] font-extrabold leading-[1.04] tracking-[-0.03em]"
            data-v2-reveal
            style={{ "--v2-d": 1 } as React.CSSProperties}
          >
            {title}
          </h1>
        </div>
      </section>

      {item.youtube_url ? (
        <div className="v2-dark">
          <div className="v2-dark__grid" aria-hidden />
          <div className="relative mx-auto max-w-[900px] px-[var(--v2-gutter)] py-[clamp(36px,5vw,56px)]">
            <div
              className="relative w-full overflow-hidden rounded-[14px] shadow-[var(--shadow-lg)]"
              style={{ paddingBottom: "56.25%" }}
              data-v2-reveal="scale"
            >
              <iframe
                className="absolute inset-0 h-full w-full"
                src={extractYoutubeEmbedUrl(item.youtube_url) ?? ""}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : item.image_url ? (
        <div className="mx-auto max-w-[900px] px-[var(--v2-gutter)] pt-[clamp(28px,4vw,44px)]">
          <div className="v2-card overflow-hidden p-0" data-v2-reveal="scale">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image_url} alt="" className="max-h-[520px] w-full object-cover" />
          </div>
        </div>
      ) : null}

      <section className="mx-auto max-w-[900px] px-[var(--v2-gutter)] py-[clamp(44px,6vw,80px)]">
        <div className="space-y-6 text-[clamp(16.5px,1.9vw,19px)] leading-[1.75] text-[color:var(--ink-700)]" data-v2-reveal>
          {body ? (
            body.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph} className="break-words [overflow-wrap:anywhere]">
                {paragraph}
              </p>
            ))
          ) : !item.youtube_url ? (
            <p>{copy.newsDetail.moreSoon}</p>
          ) : null}
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-6 border-t border-[color:var(--border-default)] pt-8">
          <V2BtnLink href={withLocalePath("/news", locale)} variant="ghost">
            {copy.newsDetail.back}
          </V2BtnLink>
          <Link href={withLocalePath("/contact", locale)} className="v2-arrow-link">
            {copy.newsDetail.contact}
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </article>
  );
}
