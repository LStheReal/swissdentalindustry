import type { Metadata } from "next";
import { V2Card, V2PageHero } from "@/components/v2/ui";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { localeAlternates } from "@/lib/public-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return {
    title: copy.meta.imprintTitle,
    description: copy.meta.imprintDescription,
    alternates: localeAlternates("/impressum", locale),
  };
}

export default async function ImpressumPage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return (
    <>
      <V2PageHero index="06" eyebrow={copy.imprint.eyebrow} title="Swiss Dental Industry" />

      <section className="mx-auto max-w-[880px] px-[var(--v2-gutter)] py-[clamp(48px,6vw,80px)]">
        <div data-v2-reveal>
          <V2Card ticks>
            <div className="space-y-5 text-[15px] leading-[1.8] text-[color:var(--text-secondary)]">
              <p>
                <strong className="text-[color:var(--text-primary)]">
                  ASDI — Association of the Swiss Dental Industry
                </strong>
                <br />
                Moosstrasse 2
                <br />
                CH-3073 Gumligen, Bern
                <br />
                Schweiz
              </p>
              <p>
                E-Mail:{" "}
                <a
                  className="font-semibold text-[color:var(--red-500)] transition-colors hover:text-[color:var(--red-600)]"
                  href="mailto:info@swissdentalindustry.ch"
                >
                  info@swissdentalindustry.ch
                </a>
              </p>
              <p>{copy.imprint.content}</p>
            </div>
          </V2Card>
        </div>
      </section>
    </>
  );
}
