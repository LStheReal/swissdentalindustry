import { V2BtnLink, V2Card, V2Eyebrow, V2PageHero } from "@/components/v2/ui";
import { v2Path } from "@/components/v2/nav";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";

export async function generateMetadata() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return {
    title: copy.meta.associationTitle,
    description: copy.meta.associationDescription,
  };
}

export default async function V2VerbandPage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);

  return (
    <>
      <V2PageHero
        index="01"
        eyebrow={copy.association.eyebrow}
        title={copy.association.title}
        intro={copy.association.intro}
      />

      <section className="v2-container grid gap-[clamp(28px,4vw,48px)] py-[clamp(56px,7vw,96px)] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="order-2 lg:order-1">
          <div data-v2-reveal>
            <p className="max-w-[640px] text-[clamp(17px,1.9vw,20px)] leading-[1.7] tracking-[-0.005em] text-[color:var(--ink-800)]">
              {copy.association.paragraphs[0]}
            </p>
          </div>

          <ul className="mt-10 flex flex-col" data-v2-stagger>
            {copy.association.facts.map((fact, i) => (
              <li
                key={fact}
                className="flex items-start gap-4 border-t border-[color:var(--border-default)] py-[18px] text-[15.5px] leading-[1.6] text-[color:var(--text-secondary)]"
              >
                <span
                  className="mt-[3px] shrink-0 text-[12px] font-bold text-[color:var(--red-500)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {fact}
              </li>
            ))}
          </ul>

          <div className="mt-12" data-v2-reveal>
            <p className="max-w-[640px] text-[clamp(16px,1.8vw,18px)] leading-[1.7] text-[color:var(--text-secondary)]">
              {copy.association.paragraphs[1]}
            </p>
          </div>

          <ul className="mt-10 flex flex-col" data-v2-stagger>
            {copy.association.commitments.map((item, i) => (
              <li
                key={item}
                className="flex items-start gap-4 border-t border-[color:var(--border-default)] py-[18px] text-[15.5px] leading-[1.6] text-[color:var(--text-secondary)]"
              >
                <span
                  className="mt-[3px] shrink-0 text-[12px] font-bold text-[color:var(--red-500)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="order-1 flex flex-col gap-6 lg:order-2">
          <div className="v2-card overflow-hidden" data-v2-reveal="right">
            <div className="group overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/sdi/stand_F3748.jpg"
                alt={copy.association.imageAlt}
                className="block h-[280px] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] sm:h-[340px] lg:h-[400px]"
              />
            </div>
          </div>

          <V2Card ticks className="lg:sticky lg:top-[110px]">
            <div data-v2-reveal>
              <V2Eyebrow>{copy.association.cardEyebrow}</V2Eyebrow>
              <h2 className="mt-4 text-[24px] font-bold tracking-[-0.015em]">{copy.association.cardTitle}</h2>
              <p className="mt-4 text-[15px] leading-[1.7] text-[color:var(--text-secondary)]">
                {copy.association.cardText}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <V2BtnLink href={v2Path("/mitglied-werden", locale)} size="sm">
                  {copy.association.joinCta}
                </V2BtnLink>
                <V2BtnLink href={v2Path("/mitglieder", locale)} variant="ghost" size="sm">
                  {copy.association.membersCta}
                </V2BtnLink>
              </div>
            </div>
          </V2Card>
        </div>
      </section>
    </>
  );
}
