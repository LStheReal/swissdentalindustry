import type { Metadata } from "next";
import { ContactForm } from "@/app/(public)/kontakt/ContactForm";
import { V2Card, V2Eyebrow, V2PageHero } from "@/components/v2/ui";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { localeAlternates } from "@/lib/public-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return {
    title: copy.meta.contactTitle,
    description: copy.meta.contactDescription,
    alternates: localeAlternates("/kontakt", locale),
  };
}

export default async function KontaktPage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return (
    <>
      <V2PageHero index="04" eyebrow={copy.contact.eyebrow} title={copy.contact.title} intro={copy.contact.intro} />

      <section className="v2-container grid gap-6 py-[clamp(48px,6vw,88px)] md:grid-cols-[1.15fr_0.85fr]">
        <div data-v2-reveal>
          <V2Card ticks>
            <V2Eyebrow>{copy.contact.formEyebrow}</V2Eyebrow>
            <div className="mt-6">
              <ContactForm locale={locale} />
            </div>
          </V2Card>
        </div>

        <div className="flex flex-col gap-6">
          <div data-v2-reveal="right">
            <div className="v2-dark rounded-[14px] p-[clamp(24px,3vw,36px)]">
              <div className="v2-dark__grid rounded-[14px]" aria-hidden />
              <div className="relative">
                <V2Eyebrow light>{copy.contact.officeEyebrow}</V2Eyebrow>
                <h2 className="mt-4 text-[22px] font-bold leading-[1.25] tracking-[-0.015em]">
                  ASDI — Association of the Swiss Dental Industry
                </h2>
                <p
                  className="mt-5 text-[14.5px] leading-[1.8] text-white/70"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Moosstrasse 2
                  <br />
                  CH&nbsp;–&nbsp;3073 Gümligen, Bern
                  <br />
                  {copy.contact.officeCountry}
                </p>
                <a
                  href="mailto:info@swissdentalindustry.ch"
                  className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-[color:var(--red-300)] transition-colors hover:text-white"
                >
                  <span className="inline-block h-[6px] w-[6px] rounded-full bg-[color:var(--red-500)] v2-pulse" aria-hidden />
                  info@swissdentalindustry.ch
                </a>
              </div>
            </div>
          </div>

          <div data-v2-reveal="right" style={{ "--v2-d": 1 } as React.CSSProperties}>
            <V2Card hover>
              <span id="vorstand" className="block scroll-mt-[100px]" />
              <V2Eyebrow>{copy.contact.boardEyebrow}</V2Eyebrow>
              <p className="mt-4 text-[15px] leading-[1.7] text-[color:var(--text-secondary)]">
                {copy.contact.boardText}
              </p>
            </V2Card>
          </div>

          <div data-v2-reveal="right" style={{ "--v2-d": 2 } as React.CSSProperties}>
            <V2Card hover>
              <span id="medien" className="block scroll-mt-[100px]" />
              <V2Eyebrow>{copy.contact.mediaEyebrow}</V2Eyebrow>
              <p className="mt-4 text-[15px] leading-[1.7] text-[color:var(--text-secondary)]">
                {copy.contact.mediaText}
              </p>
            </V2Card>
          </div>
        </div>
      </section>
    </>
  );
}
