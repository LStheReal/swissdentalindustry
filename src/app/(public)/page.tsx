import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { V2Hero } from "@/components/v2/Hero";
import { V2Marquee } from "@/components/v2/Marquee";
import { V2ExpertiseAccordion } from "@/components/v2/ExpertiseAccordion";
import { ArrowRight, V2BtnLink, V2Eyebrow, V2SectionHead } from "@/components/v2/ui";
import { getPublishedMembers, getPublishedNews, excerpt, newsFaviconUrl, youtubeThumbnailUrl } from "@/lib/public-data";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { sanitizeExternalUrl } from "@/lib/url";
import { formatDate, localeAlternates, withLocalePath } from "@/lib/public-i18n";
import { mlText, type Locale, type News } from "@/lib/types";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPublicLocale();
  return { alternates: localeAlternates("/", locale) };
}

function NewsThumb({ item }: { item: News }) {
  const ytThumbUrl = item.youtube_url ? youtubeThumbnailUrl(item.youtube_url) : null;
  const faviconUrl = item.link_url ? newsFaviconUrl(item.link_url) : null;
  return (
    <span className="v2-news-row__thumb">
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt="" className="cover" loading="lazy" />
      ) : ytThumbUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ytThumbUrl} alt="" className="cover" loading="lazy" />
          <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--red-500)] shadow-lg">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </>
      ) : faviconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={faviconUrl} alt="" className="h-12 w-12 object-contain opacity-80" loading="lazy" />
      ) : (
        <svg width="22" height="22" viewBox="0 0 100 100" aria-hidden>
          <path d="M36 6h28v30h30v28H64v30H36V64H6V36h30V6Z" fill="none" stroke="var(--ink-300)" strokeWidth="6" />
        </svg>
      )}
    </span>
  );
}

function NewsRow({ item, locale }: { item: News; locale: Locale }) {
  const copy = getPublicCopy(locale);
  const title = mlText(item.title, locale) || copy.common.news;
  const body = mlText(item.body, locale);
  const date = formatDate(item.published_at || item.created_at, locale);

  const inner = (
    <>
      <span className="v2-news-row__date" style={{ fontFamily: "var(--font-mono)" }}>
        {date}
      </span>
      <NewsThumb item={item} />
      <span className="min-w-0">
        <span className="v2-news-row__title block">{title}</span>
        {body ? (
          <span className="v2-news-row__excerpt block">{excerpt(body)}</span>
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

export default async function HomePage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);

  // Alle aktiven Mitglieder laden: die Statistik zeigt die echte Anzahl,
  // das Logo-Band nur die ersten acht.
  const [members, news] = await Promise.all([getPublishedMembers(), getPublishedNews(12)]);
  const marqueeMembers = members.slice(0, 8);
  const visibleNews = news.slice(0, 2);
  const hiddenNews = news.slice(2);

  const associationFacts = copy.home.associationFacts.map(([n, label]) => [
    n === "__MEMBER_COUNT__" ? String(members.length) : n,
    label,
  ]) as [string, string][];

  return (
    <>
      <V2Hero
        content={{
          eyebrow: copy.home.introEyebrow,
          titleA: copy.home.titleA,
          titleAccent: copy.home.titleAccent,
          titleB: copy.home.titleB,
          intro: copy.home.intro,
          primaryLabel: copy.home.primaryCta,
          primaryHref: withLocalePath("/contact", locale),
          secondaryLabel: copy.home.secondaryCta,
          secondaryHref: withLocalePath("/members", locale),
        }}
      />

      {/* 01 — About */}
      <section id="about" className="scroll-mt-[90px]">
        <div className="v2-container grid gap-[clamp(32px,5vw,80px)] py-[clamp(72px,9vw,130px)] lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="flex items-center justify-between gap-6 lg:justify-start lg:gap-8" data-v2-reveal>
              <V2Eyebrow>{copy.home.aboutEyebrow}</V2Eyebrow>
              <span className="v2-index">
                <em>/</em> 01
              </span>
            </div>
            <h2
              className="mt-5 text-[clamp(30px,4vw,52px)] font-extrabold leading-[1.02] tracking-[-0.03em] lg:sticky lg:top-[110px]"
              data-v2-reveal
              style={{ "--v2-d": 1 } as CSSProperties}
            >
              {copy.home.aboutTitle}
            </h2>
          </div>
          <div>
            <p
              className="text-[clamp(17px,2vw,22px)] leading-[1.6] tracking-[-0.01em] text-[color:var(--ink-800)]"
              data-v2-reveal
            >
              {copy.home.aboutText}
            </p>
            <ul className="mt-10 flex flex-col" data-v2-stagger>
              {copy.home.aboutFacts.map((fact, i) => (
                <li
                  key={fact}
                  className="flex items-start gap-4 border-t border-[color:var(--border-default)] py-5 text-[15.5px] font-semibold leading-[1.5]"
                >
                  <span
                    className="mt-[3px] text-[12px] font-bold text-[color:var(--red-500)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 02 — Expertise */}
      <section id="expertise" className="scroll-mt-[90px] border-t border-[color:var(--border-default)] bg-white">
        <div className="v2-container py-[clamp(72px,9vw,130px)]">
          <V2SectionHead
            index="02"
            eyebrow={copy.home.expertiseEyebrow}
            title={copy.home.expertiseTitle}
            lead={copy.home.expertiseLead}
          />
          <div className="mt-[clamp(40px,5vw,64px)]">
            <V2ExpertiseAccordion items={copy.home.expertise} />
          </div>
        </div>
      </section>

      {/* 03 — Association (dark) */}
      <section id="verband" className="v2-dark scroll-mt-[90px]">
        <div className="v2-dark__grid" aria-hidden />
        <div className="v2-container relative py-[clamp(72px,9vw,130px)]">
          <V2SectionHead
            index="03"
            eyebrow={copy.home.associationEyebrow}
            title={copy.home.associationTitle}
            light
          />
          <p
            className="mt-7 max-w-[760px] text-[clamp(16px,1.8vw,19px)] leading-[1.7] text-white/60"
            data-v2-reveal
          >
            {copy.home.associationText}
          </p>
          <div className="mt-[clamp(48px,6vw,72px)] grid grid-cols-2 gap-[clamp(28px,4vw,44px)] xl:grid-cols-4" data-v2-stagger>
            {associationFacts.map(([n, label]) => {
              const numeric = /^\d/.test(n);
              return (
                <div key={label} className="v2-stat">
                  <b style={{ fontFamily: "var(--font-mono)" }} {...(numeric ? { "data-v2-count": n } : {})}>
                    {n}
                  </b>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-[clamp(48px,6vw,64px)]" data-v2-reveal>
            <V2BtnLink href={withLocalePath("/join", locale)} variant="outline-light" size="lg" magnetic>
              {copy.home.associationCta}
            </V2BtnLink>
          </div>
        </div>
      </section>

      {/* 04 — Members */}
      <section id="mitglieder" className="scroll-mt-[90px] py-[clamp(72px,9vw,130px)]">
        <div className="v2-container mb-[clamp(36px,4vw,56px)] flex flex-wrap items-end justify-between gap-8">
          <V2SectionHead index="04" eyebrow={copy.home.membersEyebrow} title={copy.home.membersTitle} />
          <div data-v2-reveal>
            <V2BtnLink href={withLocalePath("/members", locale)} variant="ghost">
              {copy.home.membersCta}
            </V2BtnLink>
          </div>
        </div>

        {marqueeMembers.length > 0 ? (
          <div data-v2-reveal>
            <V2Marquee members={marqueeMembers} />
          </div>
        ) : (
          <div className="v2-container">
            <p className="text-[15px] text-[color:var(--text-muted)]">{copy.common.noMembers}</p>
          </div>
        )}
      </section>

      {/* 05 — News */}
      <section id="news" className="scroll-mt-[90px] border-t border-[color:var(--border-default)] bg-white">
        <div className="v2-container py-[clamp(72px,9vw,120px)]">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <V2SectionHead index="05" eyebrow={copy.common.news} title={copy.home.newsTitle} />
            <div data-v2-reveal>
              <V2BtnLink href={withLocalePath("/news", locale)} variant="ghost">
                {copy.home.allNews}
              </V2BtnLink>
            </div>
          </div>

          {news.length > 0 ? (
            <div className="mt-[clamp(36px,4vw,56px)] border-t border-[color:var(--border-default)]" data-v2-reveal>
              {visibleNews.map((item) => (
                <NewsRow key={item.id} item={item} locale={locale} />
              ))}
              {hiddenNews.length > 0 ? (
                <details className="group">
                  <summary className="mt-7 inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-[color:var(--border-strong)] bg-white px-6 py-3 text-[14px] font-semibold transition-colors hover:border-[color:var(--ink-950)] [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">{copy.home.moreNews}</span>
                    <span className="hidden group-open:inline">{copy.home.lessNews}</span>
                    <span className="text-[color:var(--red-500)] transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <div className="mt-4 border-t border-[color:var(--border-default)]">
                    {hiddenNews.map((item) => (
                      <NewsRow key={item.id} item={item} locale={locale} />
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          ) : (
            <p className="mt-10 text-[15px] text-[color:var(--text-muted)]">{copy.common.noNews}</p>
          )}
        </div>
      </section>

      {/* 06 — Join (Swiss red) */}
      <section id="vorteile" className="v2-red scroll-mt-[90px]">
        <div className="v2-container relative flex flex-wrap items-center justify-between gap-12 py-[clamp(72px,10vw,140px)]">
          <div className="max-w-[640px]">
            <span className="v2-index" style={{ color: "rgba(255,255,255,0.55)" }} data-v2-reveal>
              <em style={{ color: "#fff" }}>/</em> 06
            </span>
            <h2
              className="mt-6 text-[clamp(34px,5vw,64px)] font-extrabold leading-[1.0] tracking-[-0.035em]"
              data-v2-reveal
              style={{ "--v2-d": 1 } as CSSProperties}
            >
              {copy.home.joinTitle}
            </h2>
            <p
              className="mt-6 max-w-[520px] text-[clamp(15px,1.7vw,18px)] leading-[1.65] text-white/75"
              data-v2-reveal
              style={{ "--v2-d": 2 } as CSSProperties}
            >
              {copy.home.joinText}
            </p>
          </div>
          <div data-v2-reveal style={{ "--v2-d": 3 } as CSSProperties}>
            <V2BtnLink href={withLocalePath("/join", locale)} variant="light" size="lg" magnetic>
              {copy.home.joinCta}
            </V2BtnLink>
          </div>
        </div>
      </section>
    </>
  );
}
