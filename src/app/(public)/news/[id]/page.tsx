import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/sdi/Button";
import { Eyebrow } from "@/components/sdi/Card";
import { getPublicCopy } from "@/lib/public-copy";
import { createClient } from "@/lib/supabase/server";
import { getPublicLocale } from "@/lib/public-locale.server";
import { formatDate, withLocalePath } from "@/lib/public-i18n";
import { mlText, type News } from "@/lib/types";

function extractYoutubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname === "youtu.be") id = u.pathname.slice(1).split("?")[0] || null;
    else if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/embed/")[1].split("?")[0] || null;
      else id = u.searchParams.get("v");
    }
    if (id) return `https://www.youtube.com/embed/${id}`;
  } catch { /* ignore */ }
  return null;
}

export const revalidate = 60;

type Props = {
  params: Promise<{ id: string }>;
};

async function getNews(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .eq("is_active", true)
    .maybeSingle();

  return data as News | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [item, locale] = await Promise.all([getNews(id), getPublicLocale()]);
  if (!item) return {};
  const copy = getPublicCopy(locale);

  const title = mlText(item.title, locale) || copy.common.news;
  const description = mlText(item.body, locale).replace(/\s+/g, " ").slice(0, 155);

  return {
    title: `${title} — Swiss Dental Industry`,
    description,
    openGraph: {
      title,
      description,
      images: item.image_url ? [item.image_url] : undefined,
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const [item, locale] = await Promise.all([getNews(id), getPublicLocale()]);
  if (!item) notFound();
  const copy = getPublicCopy(locale);

  const title = mlText(item.title, locale) || copy.common.news;
  const body = mlText(item.body, locale);
  const date = formatDate(item.published_at || item.created_at, locale);

  return (
    <>
      <article className="overflow-x-hidden">
        <section className="border-b border-[color:var(--border-default)]">
          <div className="mx-auto max-w-[1000px] px-8 pt-16 pb-12">
            <Eyebrow>{copy.newsDetail.eyebrow}</Eyebrow>
            <p className="mt-4 font-mono text-[13px] font-bold tracking-[0.04em] text-[color:var(--accent)]">
              {date}
            </p>
            <h1
              className="mt-4 max-w-[820px] text-[clamp(38px,5vw,64px)] font-extrabold leading-[1.02]"
              style={{ letterSpacing: "-0.03em" }}
            >
              {title}
            </h1>
          </div>
        </section>

        {item.youtube_url ? (
          <div className="relative overflow-hidden bg-[color:var(--ink-950)]">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />
            <div className="relative mx-auto max-w-[1000px] px-8 py-10">
              <div className="relative w-full overflow-hidden rounded-[6px]" style={{ paddingBottom: "56.25%" }}>
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
          <div className="mx-auto max-w-[1000px] px-8 pt-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt=""
              className="max-h-[520px] w-full rounded-[6px] border border-[color:var(--border-default)] object-cover"
            />
          </div>
        ) : null}

        <section className="mx-auto max-w-[1000px] px-8 py-16">
          <div className="space-y-5 text-[18px] leading-[1.75] text-[color:var(--text-secondary)]">
            {body
              ? body.split(/\n{2,}/).map((paragraph) => (
                  <p key={paragraph} className="break-words [overflow-wrap:anywhere]">
                    {paragraph}
                  </p>
                ))
              : !item.youtube_url
              ? <p>{copy.newsDetail.moreSoon}</p>
              : null}
          </div>

          <div className="mt-12 flex flex-wrap gap-3 border-t border-[color:var(--border-subtle)] pt-8">
            <Link
              href={withLocalePath("/kontakt", locale)}
              className="inline-flex h-10 items-center text-[14px] font-semibold text-[color:var(--accent)] hover:text-[color:var(--accent-hover)]"
            >
              {copy.newsDetail.contact}
            </Link>
            <ButtonLink
              href={withLocalePath("/news", locale)}
              variant="primary"
            >
              {copy.newsDetail.back}
            </ButtonLink>
          </div>
        </section>
      </article>
    </>
  );
}
