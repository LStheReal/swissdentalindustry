import type { Metadata } from "next";
import { V2BtnLink, V2PageHero } from "@/components/v2/ui";
import { MembersGrid } from "@/components/v2/MembersGrid";
import { getPublishedMembers } from "@/lib/public-data";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { localeAlternates, withLocalePath } from "@/lib/public-i18n";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return {
    title: copy.meta.membersTitle,
    description: copy.meta.membersDescription,
    alternates: localeAlternates("/members", locale),
  };
}

export default async function MitgliederPage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  const members = await getPublishedMembers();

  return (
    <>
      <V2PageHero
        index="02"
        eyebrow={copy.members.eyebrow}
        title={copy.members.title}
        intro={copy.members.intro}
      >
        <div
          className="mt-8 flex flex-wrap items-center gap-4"
          data-v2-reveal
          style={{ "--v2-d": 3 } as React.CSSProperties}
        >
          <V2BtnLink href={withLocalePath("/join", locale)} magnetic>
            {copy.association.joinCta}
          </V2BtnLink>
          <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--border-default)] bg-white px-5 py-[10px]">
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-[color:var(--red-500)] v2-pulse" aria-hidden />
            <span
              className="text-[12.5px] font-bold tracking-[0.06em]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {String(members.length).padStart(2, "0")}
            </span>
            <span className="text-[13px] text-[color:var(--text-secondary)]">{copy.members.activeLabel}</span>
          </div>
        </div>
      </V2PageHero>

      <section className="v2-container py-[clamp(48px,6vw,80px)]">
        {members.length === 0 ? (
          <p className="text-[15px] text-[color:var(--text-muted)]">{copy.common.noMembers}</p>
        ) : (
          <MembersGrid
            members={members}
            locale={locale}
            copy={{
              openProfile: copy.members.openProfile,
              viewProfile: copy.members.viewProfile,
              fallbackOrg: copy.members.fallbackOrg,
              close: copy.members.close,
              detail: {
                eyebrow: copy.memberDetail.eyebrow,
                openWebsite: copy.memberDetail.openWebsite,
                canton: copy.memberDetail.canton,
                noContact: copy.memberDetail.noContact,
                googleMaps: copy.memberDetail.googleMaps,
              },
            }}
          />
        )}
      </section>
    </>
  );
}
