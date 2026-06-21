import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/sdi/Button";
import { Card, Eyebrow } from "@/components/sdi/Card";
import { SwissMap } from "@/components/sdi/SwissMap";
import { getPublicCopy } from "@/lib/public-copy";
import { createClient } from "@/lib/supabase/server";
import { getPublicLocale } from "@/lib/public-locale.server";
import { withLocalePath } from "@/lib/public-i18n";
import { mlText, type Member } from "@/lib/types";

export const revalidate = 60;

type Props = {
  params: Promise<{ id: string }>;
};

async function getMember(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .eq("is_active", true)
    .maybeSingle();

  return data as Member | null;
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [member, locale] = await Promise.all([getMember(id), getPublicLocale()]);
  if (!member) return {};

  return {
    title: `${member.name} — Swiss Dental Industry`,
    description: mlText(member.description, locale).replace(/\s+/g, " ").slice(0, 155),
  };
}

export default async function MemberDetailPage({ params }: Props) {
  const { id } = await params;
  const [member, locale] = await Promise.all([getMember(id), getPublicLocale()]);
  if (!member) notFound();
  const copy = getPublicCopy(locale);

  const description = mlText(member.description, locale);
  const googleMapsUrl =
    member.lat != null && member.lng != null
      ? `https://www.google.com/maps?q=${member.lat},${member.lng}`
      : member.address
        ? `https://www.google.com/maps/search/${encodeURIComponent(member.address)}`
        : null;

  const mapPin =
    member.lat != null && member.lng != null
      ? [{ id: member.id, name: member.name, lat: member.lat, lng: member.lng, canton: member.canton, href: googleMapsUrl ?? undefined }]
      : [];

  return (
    <>
      <section className="border-b border-[color:var(--border-default)]">
        <div className="mx-auto flex max-w-[1200px] items-center gap-10 px-8 py-12">
          {member.logo_url ? (
            <div className="flex h-[164px] w-[240px] shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--surface-subtle)] p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={member.logo_url}
                alt={member.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : null}
          <div className="min-w-0">
            <Eyebrow>{copy.memberDetail.eyebrow}</Eyebrow>
            <h1
              className="mt-3 text-[clamp(40px,5vw,72px)] font-extrabold leading-[1.02]"
              style={{ letterSpacing: "-0.03em" }}
            >
              {member.name}
            </h1>
            <div className="mt-6 flex flex-wrap gap-3">
              {member.website_url ? (
                <a
                  href={member.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-[4px] border border-[color:var(--accent)] bg-[color:var(--accent)] px-5 text-[15px] font-semibold text-white hover:bg-[color:var(--accent-hover)]"
                  style={{ color: "#ffffff" }}
                >
                  {copy.memberDetail.openWebsite}
                </a>
              ) : null}
              <ButtonLink href={withLocalePath("/mitglieder", locale)} variant="secondary">
                {copy.memberDetail.allMembers}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {description ? (
        <div className="relative overflow-hidden border-b border-[color:var(--ink-700)] bg-[color:var(--ink-950)]">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="relative mx-auto max-w-[1200px] px-8 py-10">
            <Eyebrow className="text-red-300">{copy.memberDetail.descriptionEyebrow}</Eyebrow>
            <p className="mt-3 text-[22px] font-medium leading-[1.7] text-white break-words [overflow-wrap:anywhere]">
              {description}
            </p>
          </div>
        </div>
      ) : null}

      <section className="mx-auto grid max-w-[1200px] gap-8 px-8 py-16 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <Card accent>
            <Eyebrow>{copy.memberDetail.contactEyebrow}</Eyebrow>
            <div className="mt-4 space-y-3 text-[15px] leading-[1.7] text-[color:var(--text-secondary)]">
              {member.address ? (
                <p className="break-words [overflow-wrap:anywhere]" style={{ whiteSpace: "pre-line" }}>
                  {member.address}
                </p>
              ) : null}
              {member.canton ? <p>{copy.memberDetail.canton}: {member.canton}</p> : null}
              {member.phone ? <p><a href={`tel:${member.phone}`}>{member.phone}</a></p> : null}
              {member.email ? (
                <p>
                  <a className="font-semibold text-[color:var(--accent)]" href={`mailto:${member.email}`}>
                    {member.email}
                  </a>
                </p>
              ) : null}
              {!member.address && !member.phone && !member.email ? (
                <p>{copy.memberDetail.noContact}</p>
              ) : null}
            </div>
          </Card>

          <Card>
            <Eyebrow>{copy.memberDetail.profileEyebrow}</Eyebrow>
            <dl className="mt-4 grid gap-3 text-[14px]">
              <div className="flex justify-between gap-4 border-b border-[color:var(--border-subtle)] pb-3">
                <dt className="text-[color:var(--text-muted)]">{copy.memberDetail.status}</dt>
                <dd className="font-semibold">{copy.memberDetail.activeMember}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[color:var(--border-subtle)] pb-3">
                <dt className="text-[color:var(--text-muted)]">{copy.memberDetail.memberSince}</dt>
                <dd className="font-semibold">
                  {member.member_since
                    ? new Date(member.member_since).toLocaleDateString(
                        locale === "fr"
                          ? "fr-CH"
                          : locale === "it"
                            ? "it-CH"
                            : locale === "en"
                              ? "en-CH"
                              : "de-CH",
                        {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        },
                      )
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[color:var(--border-subtle)] pb-3">
                <dt className="text-[color:var(--text-muted)]">{copy.memberDetail.language}</dt>
                <dd className="font-semibold uppercase">{member.source_lang}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <Card padded={false} className="overflow-hidden">
          {mapPin.length > 0 ? (
            <div className="p-6">
              <SwissMap pins={mapPin} />
            </div>
          ) : (
            <div className="flex h-[460px] items-center justify-center bg-[color:var(--surface-subtle)] p-8 text-center text-[15px] text-[color:var(--text-muted)]">
              {copy.memberDetail.noMap}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-[color:var(--border-subtle)] px-6 py-4 font-mono text-[12px]">
            <span className="text-[color:var(--text-muted)]">{member.address || copy.memberDetail.addressFallback}</span>
            {googleMapsUrl ? (
              <Link
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[color:var(--accent)] hover:text-[color:var(--accent-hover)]"
              >
                {copy.memberDetail.googleMaps}
              </Link>
            ) : null}
          </div>
        </Card>
      </section>
    </>
  );
}
