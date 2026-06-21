import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow, Badge } from "@/components/sdi/Card";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { withLocalePath } from "@/lib/public-i18n";
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

export default async function MitgliederPage() {
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
      <section className="border-b border-[color:var(--border-default)]">
        <div className="mx-auto max-w-[1200px] px-8 pt-16 pb-12">
          <Eyebrow>{copy.members.eyebrow}</Eyebrow>
          <h1
            className="mt-4 text-[56px] font-extrabold leading-[1.02]"
            style={{ letterSpacing: "-0.03em" }}
          >
            {copy.members.title}
          </h1>
          <p className="mt-5 max-w-[720px] text-[17px] leading-[1.6] text-[color:var(--text-secondary)]">
            {copy.members.intro}
          </p>
          <div
            className="mt-7 flex flex-wrap items-center gap-3"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12.5,
              color: "var(--text-secondary)",
            }}
          >
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
              {members.length.toString().padStart(2, "0")}
            </span>
            <span>{copy.members.activeLabel}</span>
            <Badge variant="soft">{copy.members.badge}</Badge>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-8 py-16">
        {members.length === 0 ? (
          <p className="text-[15px] text-[color:var(--text-muted)]">
            {copy.common.noMembers}
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {members.map((member) => {
              const description = mlText(member.description, locale);
              return (
                <Link
                  key={member.id}
                  href={withLocalePath(`/mitglieder/${member.id}`, locale)}
                  aria-label={`${member.name} ${copy.members.openProfile}`}
                >
                <div className="group flex h-full flex-col border border-[color:var(--border-default)] bg-[#efeff1] transition-all hover:border-[color:var(--accent)] hover:shadow-[var(--shadow-sm)]">
                  <div className="flex min-h-[210px] items-center justify-center p-8">
                    {member.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.logo_url}
                        alt={member.name}
                        className="max-h-[84px] max-w-[85%] object-contain"
                      />
                    ) : (
                      <div
                        className="text-center text-[28px] font-extrabold text-[color:var(--text-primary)]"
                        style={{ letterSpacing: "-0.03em" }}
                      >
                        {member.name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-white/80 bg-white px-4 py-3">
                    <div className="min-w-0">
                      <p
                        className="truncate text-[15px] font-bold text-[color:var(--text-primary)]"
                        style={{ letterSpacing: "-0.01em" }}
                      >
                        {member.name}
                      </p>
                      <p
                        className="truncate text-[11px] uppercase text-[color:var(--text-muted)]"
                        style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}
                      >
                        {member.canton || (description ? copy.members.viewProfile : copy.members.fallbackOrg)}
                      </p>
                    </div>
                    <span
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--border-default)] bg-white text-[20px] leading-none text-[color:var(--text-muted)] transition-colors group-hover:border-[color:var(--accent)] group-hover:text-[color:var(--accent)]"
                    >
                      +
                    </span>
                  </div>
                </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
