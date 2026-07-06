import Link from "next/link";
import { V2BtnLink, V2PageHero } from "@/components/v2/ui";
import { v2Path } from "@/components/v2/nav";
import { createClient } from "@/lib/supabase/server";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { mlText, type Member } from "@/lib/types";

export const revalidate = 60;

export async function generateMetadata() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return {
    title: copy.meta.membersTitle,
    description: copy.meta.membersDescription,
  };
}

export default async function V2MitgliederPage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("status", "published")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const members = (data ?? []) as Member[];

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
          <V2BtnLink href={v2Path("/mitglied-werden", locale)} magnetic>
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
          <span
            className="rounded-full bg-[color:var(--accent-soft)] px-3 py-[3px] text-[10.5px] font-bold uppercase tracking-[0.08em] text-[color:var(--red-500)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {copy.members.badge}
          </span>
          </div>
        </div>
      </V2PageHero>

      <section className="v2-container py-[clamp(48px,6vw,80px)]">
        {members.length === 0 ? (
          <p className="text-[15px] text-[color:var(--text-muted)]">{copy.common.noMembers}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-v2-stagger>
            {members.map((member) => {
              const description = mlText(member.description, locale);
              return (
                <Link
                  key={member.id}
                  href={v2Path(`/mitglieder/${member.id}`, locale)}
                  className="v2-member-card"
                  aria-label={`${member.name} ${copy.members.openProfile}`}
                  data-v2-spot
                >
                  <span className="v2-member-card__logo">
                    {member.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.logo_url} alt="" loading="lazy" />
                    ) : (
                      <span className="text-center text-[24px] font-extrabold tracking-[-0.03em] text-[color:var(--ink-600)]">
                        {member.name}
                      </span>
                    )}
                  </span>
                  <span className="v2-member-card__meta">
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-bold tracking-[-0.01em]">{member.name}</span>
                      <span
                        className="mt-[2px] block truncate text-[10.5px] uppercase tracking-[0.1em] text-[color:var(--text-muted)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {member.canton || (description ? copy.members.viewProfile : copy.members.fallbackOrg)}
                      </span>
                    </span>
                    <span className="v2-member-card__arrow" aria-hidden>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" />
                      </svg>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
