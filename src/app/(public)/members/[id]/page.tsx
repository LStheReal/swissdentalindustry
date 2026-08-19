import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SwissMap } from "@/components/sdi/SwissMap";
import { V2BtnLink, V2Card, V2Eyebrow } from "@/components/v2/ui";
import { getPublishedMember } from "@/lib/public-data";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { localeAlternates, withLocalePath } from "@/lib/public-i18n";
import { sanitizeExternalUrl } from "@/lib/url";
import { mlText } from "@/lib/types";
import { formatAddress, formatAddressOneLine } from "@/lib/address";

export const revalidate = 60;

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [member, locale] = await Promise.all([getPublishedMember(id), getPublicLocale()]);
  if (!member) return {};

  return {
    title: `${member.name} — Swiss Dental Industry`,
    description: mlText(member.description, locale).replace(/\s+/g, " ").slice(0, 155),
    alternates: localeAlternates(`/members/${id}`, locale),
  };
}

export default async function MemberDetailPage({ params }: Props) {
  const { id } = await params;
  const [member, locale] = await Promise.all([getPublishedMember(id), getPublicLocale()]);
  if (!member) notFound();
  const copy = getPublicCopy(locale);

  const description = mlText(member.description, locale);
  const websiteUrl = sanitizeExternalUrl(member.website_url);
  const address = formatAddress(member);
  const addressOneLine = formatAddressOneLine(member);
  const googleMapsUrl =
    member.lat != null && member.lng != null
      ? `https://www.google.com/maps?q=${member.lat},${member.lng}`
      : addressOneLine
        ? `https://www.google.com/maps/search/${encodeURIComponent(addressOneLine)}`
        : null;

  const mapPin =
    member.lat != null && member.lng != null
      ? [
          {
            id: member.id,
            name: member.name,
            lat: member.lat,
            lng: member.lng,
            canton: member.canton,
            href: googleMapsUrl ?? undefined,
          },
        ]
      : [];

  const dateLocale =
    locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : locale === "en" ? "en-CH" : "de-CH";

  return (
    <>
      <section className="v2-page-hero">
        <div className="v2-page-hero__grid" aria-hidden />
        <div className="v2-container relative flex flex-col gap-10 pt-[clamp(44px,6vw,72px)] pb-[clamp(40px,5vw,64px)] md:flex-row md:items-center">
          {member.logo_url ? (
            <div
              className="v2-card flex h-[150px] w-[230px] shrink-0 items-center justify-center p-6"
              data-v2-reveal="left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={member.logo_url} alt={member.name} className="max-h-full max-w-full object-contain" />
            </div>
          ) : null}
          <div className="min-w-0">
            <div data-v2-reveal>
              <V2Eyebrow>{copy.memberDetail.eyebrow}</V2Eyebrow>
            </div>
            <h1
              className="mt-4 break-words text-[clamp(36px,5.4vw,68px)] font-extrabold leading-[1.0] tracking-[-0.035em]"
              data-v2-reveal
              style={{ "--v2-d": 1 } as React.CSSProperties}
            >
              {member.name}
            </h1>
            <div className="mt-7 flex flex-wrap gap-3" data-v2-reveal style={{ "--v2-d": 2 } as React.CSSProperties}>
              {websiteUrl ? (
                <V2BtnLink href={websiteUrl} external magnetic>
                  {copy.memberDetail.openWebsite}
                </V2BtnLink>
              ) : null}
              <V2BtnLink href={withLocalePath("/members", locale)} variant="ghost">
                {copy.memberDetail.allMembers}
              </V2BtnLink>
            </div>
          </div>
        </div>
      </section>

      {description ? (
        <div className="v2-dark">
          <div className="v2-dark__grid" aria-hidden />
          <div className="v2-container relative py-[clamp(40px,5vw,64px)]">
            <div data-v2-reveal>
              <V2Eyebrow light>{copy.memberDetail.descriptionEyebrow}</V2Eyebrow>
            </div>
            <p
              className="v2-serif mt-5 max-w-[900px] break-words text-[clamp(21px,2.6vw,30px)] leading-[1.5] text-white/90 [overflow-wrap:anywhere]"
              data-v2-reveal
              style={{ "--v2-d": 1 } as React.CSSProperties}
            >
              {description}
            </p>
          </div>
        </div>
      ) : null}

      <section className="v2-container grid gap-6 py-[clamp(48px,6vw,88px)] lg:grid-cols-[0.85fr_1.15fr]">
        <div className="flex flex-col gap-6">
          <V2Card ticks>
            <div data-v2-reveal>
              <V2Eyebrow>{copy.memberDetail.contactEyebrow}</V2Eyebrow>
              <div className="mt-5 space-y-3 text-[15px] leading-[1.7] text-[color:var(--text-secondary)]">
                {address ? (
                  <p className="break-words [overflow-wrap:anywhere]" style={{ whiteSpace: "pre-line" }}>
                    {address}
                  </p>
                ) : null}
                {member.canton ? (
                  <p>
                    {copy.memberDetail.canton}: {member.canton}
                  </p>
                ) : null}
                {member.phone ? (
                  <p>
                    <a href={`tel:${member.phone}`} className="transition-colors hover:text-[color:var(--ink-950)]">
                      {member.phone}
                    </a>
                  </p>
                ) : null}
                {member.email ? (
                  <p>
                    <a
                      className="font-semibold text-[color:var(--red-500)] transition-colors hover:text-[color:var(--red-600)]"
                      href={`mailto:${member.email}`}
                    >
                      {member.email}
                    </a>
                  </p>
                ) : null}
                {!address && !member.phone && !member.email ? <p>{copy.memberDetail.noContact}</p> : null}
              </div>
            </div>
          </V2Card>

          <V2Card>
            <div data-v2-reveal>
              <V2Eyebrow>{copy.memberDetail.profileEyebrow}</V2Eyebrow>
              <dl className="mt-5 grid gap-3 text-[14px]">
                {[
                  [copy.memberDetail.status, copy.memberDetail.activeMember],
                  [
                    copy.memberDetail.memberSince,
                    member.member_since
                      ? new Date(member.member_since).toLocaleDateString(dateLocale, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "—",
                  ],
                  [copy.memberDetail.language, member.source_lang?.toUpperCase() ?? "—"],
                ].map(([dt, dd]) => (
                  <div
                    key={dt}
                    className="flex justify-between gap-4 border-b border-[color:var(--border-subtle)] pb-3 last:border-b-0 last:pb-0"
                  >
                    <dt className="text-[color:var(--text-muted)]">{dt}</dt>
                    <dd className="font-semibold">{dd}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </V2Card>
        </div>

        <div className="v2-card overflow-hidden" data-v2-reveal>
          {mapPin.length > 0 ? (
            <div className="p-6">
              <SwissMap pins={mapPin} />
            </div>
          ) : (
            <div className="flex h-[420px] items-center justify-center bg-[color:var(--surface-subtle)] p-8 text-center text-[15px] text-[color:var(--text-muted)]">
              {copy.memberDetail.noMap}
            </div>
          )}
          <div
            className="flex items-center justify-between gap-4 border-t border-[color:var(--border-subtle)] px-6 py-4 text-[12px]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="min-w-0 truncate text-[color:var(--text-muted)]">
              {addressOneLine || copy.memberDetail.addressFallback}
            </span>
            {googleMapsUrl ? (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 font-bold text-[color:var(--red-500)] transition-colors hover:text-[color:var(--red-600)]"
              >
                {copy.memberDetail.googleMaps}
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
