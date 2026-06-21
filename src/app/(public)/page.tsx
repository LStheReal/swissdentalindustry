import Link from "next/link";
import { ButtonLink } from "@/components/sdi/Button";
import { Eyebrow } from "@/components/sdi/Card";
import { MarkerAccent } from "@/components/sdi/MarkerAccent";
import { createClient } from "@/lib/supabase/server";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { formatDate, withLocalePath } from "@/lib/public-i18n";
import { mlText, type Locale, type Member, type News } from "@/lib/types";

export const revalidate = 60;

function excerpt(text: string, length = 160) {
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

function NewsCard({
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

  const className =
    "grid grid-cols-[112px_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-[6px] border border-[color:var(--border-default)] bg-white px-[clamp(16px,2vw,28px)] py-[clamp(16px,2vw,24px)] transition hover:border-[color:var(--accent)] md:grid-cols-[148px_minmax(0,1fr)_auto] md:items-start md:gap-x-[clamp(16px,3vw,40px)]";

  const inner = (
    <>
      <span className="relative flex h-[92px] items-center justify-center overflow-hidden rounded-[4px] bg-[color:var(--surface-subtle)] md:h-[108px]">
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
            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 shadow-lg">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </>
        ) : faviconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={faviconUrl} alt="" className="h-20 w-20 object-contain" />
        ) : null}
      </span>
      <span className="min-w-0">
        <span className="block text-[clamp(18px,2.2vw,24px)] font-bold tracking-[-0.015em]">
          {title}
        </span>
        {body ? (
          <span className="mt-1 block break-words text-[14px] leading-[1.5] text-[color:var(--text-secondary)] [overflow-wrap:anywhere]">
            {excerpt(body, 140)}
          </span>
        ) : isLink ? (
          <span className="mt-1 block break-all text-[14px] leading-[1.5] text-[color:var(--text-secondary)]">
            {item.link_url}
          </span>
        ) : null}
      </span>
      <span className="col-span-2 font-mono text-[15px] font-bold tracking-[0.02em] text-[color:var(--accent)] md:col-span-1 md:justify-self-end md:pt-1 md:text-right">
        {formatDate(item.published_at || item.created_at, locale)}
      </span>
    </>
  );

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

export default async function HomePage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  const supabase = await createClient();

  const [membersResult, newsResult] = await Promise.all([
    supabase
      .from("members")
      .select("*")
      .eq("status", "published")
      .eq("is_active", true)
      .order("name", { ascending: true })
      .limit(8),
    supabase
      .from("news")
      .select("*")
      .eq("is_published", true)
      .eq("is_active", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(12),
  ]);

  const members = (membersResult.data ?? []) as Member[];
  const news = (newsResult.data ?? []) as News[];
  const visibleNews = news.slice(0, 2);
  const hiddenNews = news.slice(2);
  const stats = copy.home.stats.map(([n, label]) => [
    n === "__MEMBER_COUNT__" ? members.length.toString().padStart(2, "0") : n,
    label,
  ]);

  return (
    <>
      <section className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,48px)] pt-[clamp(48px,7vw,92px)] pb-[clamp(40px,5vw,72px)]">
        <div className="grid items-stretch gap-[clamp(32px,5vw,56px)] xl:grid-cols-[1fr_1.1fr]">
          <div className="self-center text-center xl:text-left">
            <div className="mb-[22px] flex items-center justify-center gap-[10px] xl:justify-start">
              <span className="h-[9px] w-[9px] bg-[color:var(--accent)]" />
              <span className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                {copy.home.introEyebrow}
              </span>
            </div>
            <h1 className="text-[clamp(38px,5.6vw,74px)] font-extrabold leading-none tracking-[-0.03em]">
              {copy.home.titleA}
              <br />
              <MarkerAccent>{copy.home.titleAccent}</MarkerAccent>{" "}
              {copy.home.titleB}
            </h1>
            <p className="mt-[26px] text-center text-[clamp(16px,1.7vw,19px)] leading-[1.6] text-[color:var(--text-secondary)] xl:max-w-[540px] xl:text-left">
              {copy.home.intro}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3 xl:justify-start">
              <ButtonLink href={withLocalePath("/mitglied-werden", locale)} size="lg">
                {copy.home.primaryCta}
              </ButtonLink>
              <ButtonLink href={withLocalePath("/mitglieder", locale)} variant="secondary" size="lg">
                {copy.home.secondaryCta}
              </ButtonLink>
            </div>
          </div>

          <div data-gsap-fade className="relative flex min-h-[clamp(260px,50vw,620px)] items-center justify-center overflow-hidden rounded-[6px] bg-[color:var(--ink-950)] p-6 text-white xl:min-h-[clamp(320px,42vw,620px)]">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)",
                backgroundSize: "38px 38px",
              }}
            />
            <span className="absolute top-[18px] left-5 font-mono text-[11px] font-bold tracking-[0.14em] text-white/50">
              SVDI / ASDI
            </span>
            <span className="absolute top-[18px] right-5 font-mono text-[11px] font-bold tracking-[0.14em] text-white/50">
              EST. 1965
            </span>
            <span className="absolute bottom-[18px] left-5 font-mono text-[11px] font-bold tracking-[0.14em] text-white/50">
              GUMLIGEN · BERN
            </span>
            <span className="absolute right-5 bottom-[18px] font-mono text-[11px] font-bold tracking-[0.14em] text-[color:var(--red-400)]">
              SWISS MADE
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sdi/titelbild.jpg"
              alt={copy.home.heroImageAlt}
              className="absolute inset-0 h-full w-full rounded-[6px] object-cover"
              data-gsap-parallax
            />
          </div>
        </div>
      </section>

      <section className="border-t border-[color:var(--ink-700)] bg-[color:var(--ink-950)] text-white">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-[clamp(24px,4vw,40px)] px-[clamp(20px,5vw,48px)] py-[clamp(40px,5vw,64px)] xl:grid-cols-4" data-gsap-stagger>
          {stats.map(([n, label]) => (
            <div key={label} className="border-l-2 border-[color:var(--accent)] pl-[18px]">
              <div className="font-mono text-[clamp(34px,4.4vw,52px)] font-bold leading-none tracking-[-0.02em]">
                {n}
              </div>
              <div className="mt-[10px] text-[14px] leading-[1.4] text-white/60">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[color:var(--ink-950)] text-white">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative mx-auto max-w-[1200px] px-[clamp(20px,5vw,48px)] py-[clamp(56px,7vw,96px)]">
          <div className="mx-auto max-w-[900px]">
            <div data-gsap-fade className="relative w-full overflow-hidden rounded-[6px]" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 h-full w-full"
                src="https://www.youtube.com/embed/zUHznpWmwXc?si=rQxEICVUr3JjsyD4"
                title="Swiss Dental Industry"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      <section id="dentalindustrie" className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,48px)] py-[clamp(56px,7vw,104px)]">
        <Eyebrow>{copy.home.valuesEyebrow}</Eyebrow>
        <h2 className="mt-4 mb-[clamp(64px,8vw,112px)] max-w-[620px] text-[clamp(28px,3.6vw,46px)] font-extrabold leading-[1.04] tracking-[-0.025em]">
          {copy.home.valuesTitle}
        </h2>
        <div className="mt-6 grid border border-[color:var(--border-default)] bg-[color:var(--border-default)] [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] gap-px" data-gsap-stagger>
          {copy.home.values.map((value) => (
            <div key={value.n} className="bg-white px-[clamp(22px,2.5vw,30px)] py-[clamp(24px,3vw,36px)] transition-colors hover:bg-[color:var(--ink-50)]">
              <span className="font-mono text-[13px] font-bold text-[color:var(--accent)]">{value.n}</span>
              <h3 className="mt-[14px] text-[clamp(20px,2.2vw,25px)] font-bold tracking-[-0.015em]">
                {value.t}
              </h3>
              <p className="mt-[14px] text-[15px] leading-[1.55] text-[color:var(--text-secondary)]">
                {value.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="verband" className="border-y border-[color:var(--border-default)] bg-[color:var(--surface-subtle)]">
        <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,48px)] py-[clamp(56px,7vw,100px)]">
          <Eyebrow>{copy.home.associationEyebrow}</Eyebrow>
          <h2 className="mt-4 mb-[clamp(64px,8vw,112px)] max-w-[820px] text-[clamp(28px,3.6vw,46px)] font-extrabold leading-[1.04] tracking-[-0.025em]">
            {copy.home.associationTitle}
          </h2>
          <div className="grid gap-4 pt-4 sm:gap-9 sm:pt-6 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]" data-gsap-stagger>
            {copy.home.pillars.map((pillar, index) => (
              <Link
                key={pillar.n}
                href={withLocalePath(
                  index === 0 ? "/verband" : index === 2 ? "/mitglied-werden" : "/mitglieder",
                  locale,
                )}
                className="flex flex-col rounded-[6px] border border-[color:var(--border-default)] bg-white px-[clamp(26px,3vw,34px)] py-[24px] transition hover:border-[color:var(--accent)] hover:shadow-[var(--shadow-sm)] sm:min-h-[240px] sm:p-[clamp(26px,3vw,34px)]"
              >
                <span className="font-mono text-[13px] font-bold text-[color:var(--accent)]">
                  {pillar.n}
                </span>
                <h3 className="mt-4 text-[clamp(20px,2.3vw,26px)] font-bold tracking-[-0.015em]">
                  {pillar.t}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.55] text-[color:var(--text-secondary)]">
                  {pillar.d}
                </p>
                <span className="inline-flex items-center gap-2 pt-6 text-[14px] font-semibold sm:mt-auto">
                  {pillar.cta}
                  <span className="text-[color:var(--accent)]">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="mitglieder" className="py-[clamp(56px,7vw,104px)]">
        <div className="mx-auto mb-[clamp(28px,3vw,44px)] max-w-[1200px] px-[clamp(20px,5vw,48px)]">
          <Eyebrow>{copy.home.membersEyebrow}</Eyebrow>
          <h2 className="mt-4 max-w-[560px] text-[clamp(28px,3.6vw,46px)] font-extrabold leading-[1.04] tracking-[-0.025em]">
            {copy.home.membersTitle}
          </h2>
        </div>

        {members.length > 0 ? (
          (() => {
            const repeatCount = Math.max(2, Math.ceil(40 / members.length));
            const track = Array.from({ length: repeatCount }, () => members).flat();
            return (
              <div
                className="overflow-hidden"
                style={{ maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)" }}
              >
                <div
                  className="flex w-max items-center gap-[clamp(56px,7vw,96px)]"
                  style={{ animation: "scroll-left 80s linear infinite" }}
                >
                  {[...track, ...track].map((member, i) => (
                    <div
                      key={`${member.id}-${i}`}
                      className="flex h-[72px] max-w-[220px] shrink-0 items-center justify-center"
                    >
                      {member.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.logo_url}
                          alt={member.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[14px] font-bold leading-[1.3] tracking-[-0.01em] text-[color:var(--text-secondary)]">
                          {member.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,48px)]">
            <p className="text-[15px] text-[color:var(--text-muted)]">
              {copy.common.noMembers}
            </p>
          </div>
        )}

        <div className="mx-auto mt-[clamp(28px,3vw,44px)] max-w-[1200px] px-[clamp(20px,5vw,48px)]">
          <ButtonLink href={withLocalePath("/mitglieder", locale)} variant="secondary" size="lg">
            {copy.home.membersCta}
          </ButtonLink>
        </div>
      </section>

      <section id="news" className="border-y border-[color:var(--border-default)] bg-[color:var(--surface-subtle)]">
        <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,48px)] pt-[clamp(32px,4vw,56px)] pb-[clamp(56px,7vw,100px)]">
          <h2 className="text-[clamp(20px,2.2vw,28px)] font-extrabold tracking-[0.08em] uppercase text-[color:var(--accent)]" style={{ marginBottom: "clamp(40px,5vw,64px)" }}>
            {copy.home.newsTitle}
          </h2>
          {news.length > 0 ? (
            <div className="flex flex-col gap-[clamp(10px,1.2vw,16px)]" data-gsap-stagger>
              {visibleNews.map((item) => (
                <NewsCard key={item.id} item={item} locale={locale} />
              ))}
              {hiddenNews.length > 0 ? (
                <details className="group flex flex-col gap-[clamp(10px,1.2vw,16px)]">
                  <summary className="order-1 mt-2 inline-flex cursor-pointer list-none items-center gap-2 self-start rounded-[4px] border border-[color:var(--accent)] bg-white px-4 py-3 text-[14px] font-semibold text-[color:var(--accent)] transition hover:bg-[color:var(--red-50)] group-open:order-3 [&::-webkit-details-marker]:hidden">
                    <span className="group-open:hidden">{copy.home.moreNews}</span>
                    <span className="hidden group-open:inline">{copy.home.lessNews}</span>
                    <span className="transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <div className="order-2 flex flex-col gap-[clamp(10px,1.2vw,16px)]">
                    {hiddenNews.map((item) => (
                      <NewsCard key={item.id} item={item} locale={locale} />
                    ))}
                  </div>
                </details>
              ) : null}
              <div className="pt-3">
                <ButtonLink href={withLocalePath("/news", locale)} variant="secondary">
                  {copy.home.allNews}
                </ButtonLink>
              </div>
            </div>
          ) : (
            <p className="text-[15px] text-[color:var(--text-muted)]">
              {copy.common.noNews}
            </p>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[color:var(--ink-950)] text-white">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-8 px-[clamp(20px,5vw,48px)] py-[clamp(56px,7vw,96px)]">
          <div className="max-w-[620px]">
            <svg width="44" height="44" viewBox="0 0 100 100" className="mb-6">
              <rect width="100" height="100" rx="6" fill="#e1000f" />
              <rect x="42" y="20" width="16" height="60" fill="#fff" />
              <rect x="20" y="42" width="60" height="16" fill="#fff" />
            </svg>
            <h2 className="text-[clamp(30px,4vw,52px)] font-extrabold leading-[1.02] tracking-[-0.03em]">
              {copy.home.joinTitle}
            </h2>
            <p className="mt-5 max-w-[520px] text-[clamp(15px,1.7vw,18px)] leading-[1.6] text-white/60">
              {copy.home.joinText}
            </p>
          </div>
          <ButtonLink
            href={withLocalePath("/mitglied-werden", locale)}
            size="lg"
            className="h-[72px] px-12 text-[22px] font-bold"
          >
            {copy.home.joinCta}
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
