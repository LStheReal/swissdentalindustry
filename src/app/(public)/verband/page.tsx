import { ButtonLink } from "@/components/sdi/Button";
import { Card, Eyebrow } from "@/components/sdi/Card";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { withLocalePath } from "@/lib/public-i18n";

export async function generateMetadata() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return {
    title: copy.meta.associationTitle,
    description: copy.meta.associationDescription,
  };
}

export default async function VerbandPage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);

  return (
    <>
      <section className="border-b border-[color:var(--border-default)]">
        <div className="mx-auto max-w-[1200px] px-8 pt-16 pb-12">
          <Eyebrow>{copy.association.eyebrow}</Eyebrow>
          <h1
            className="mt-4 max-w-[820px] text-[clamp(40px,5vw,64px)] font-extrabold leading-[1.02]"
            style={{ letterSpacing: "-0.03em" }}
          >
            {copy.association.title}
          </h1>
          <p className="mt-5 max-w-[760px] text-[17px] leading-[1.6] text-[color:var(--text-secondary)]">
            {copy.association.intro}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-10 px-8 py-16 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="order-2 space-y-6 lg:order-1">
          <Card data-gsap-fade>
            <p className="text-[16px] leading-[1.75] text-[color:var(--text-secondary)]">
              {copy.association.paragraphs[0]}
            </p>

            <ul className="mt-8 space-y-3 text-[16px] leading-[1.7] text-[color:var(--text-secondary)]">
              {copy.association.facts.map((fact) => (
                <li key={fact} className="flex gap-3">
                  <span className="pt-[2px] text-[color:var(--accent)]">-</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>

            <p className="mt-10 text-[16px] leading-[1.75] text-[color:var(--text-secondary)]">
              {copy.association.paragraphs[1]}
            </p>

            <ul className="mt-8 space-y-3 text-[16px] leading-[1.7] text-[color:var(--text-secondary)]">
              {copy.association.commitments.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="pt-[2px] text-[color:var(--accent)]">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          <Card padded={false} className="overflow-hidden" data-gsap-fade>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sdi/stand_F3748.jpg"
              alt={copy.association.imageAlt}
              className="block h-[280px] w-full object-cover sm:h-[340px] lg:h-[420px]"
            />
          </Card>

          <Card data-gsap-fade>
            <Eyebrow>{copy.association.cardEyebrow}</Eyebrow>
            <h2 className="mt-3 text-[24px] font-bold" style={{ letterSpacing: "-0.01em" }}>
              {copy.association.cardTitle}
            </h2>
            <p className="mt-4 text-[15px] leading-[1.7] text-[color:var(--text-secondary)]">
              {copy.association.cardText}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                href={withLocalePath("/mitglieder", locale)}
                variant="secondary"
                size="md"
              >
                {copy.association.membersCta}
              </ButtonLink>
              <ButtonLink
                href={withLocalePath("/mitglied-werden", locale)}
                size="md"
              >
                {copy.association.joinCta}
              </ButtonLink>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
