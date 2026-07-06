import type { Metadata } from "next";
import { V2Card, V2PageHero } from "@/components/v2/ui";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { localeAlternates } from "@/lib/public-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return {
    title: copy.meta.privacyTitle,
    description: copy.meta.privacyDescription,
    alternates: localeAlternates("/datenschutz", locale),
  };
}

export default async function DatenschutzPage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return (
    <>
      <V2PageHero index="07" eyebrow={copy.privacy.eyebrow} title={copy.privacy.title} />

      <section className="mx-auto max-w-[880px] px-[var(--v2-gutter)] py-[clamp(48px,6vw,80px)]">
        <div data-v2-reveal>
          <V2Card ticks>
            <div className="space-y-5 text-[15px] leading-[1.8] text-[color:var(--text-secondary)]">
              <p>{copy.privacy.paragraphs[0]}</p>
              <p>{copy.privacy.paragraphs[1]}</p>
              <p>
                {copy.privacy.paragraphs[2].replace("info@swissdentalindustry.ch.", "")}
                <a
                  className="font-semibold text-[color:var(--red-500)] transition-colors hover:text-[color:var(--red-600)]"
                  href="mailto:info@swissdentalindustry.ch"
                >
                  info@swissdentalindustry.ch
                </a>
              </p>
            </div>
          </V2Card>
        </div>
      </section>
    </>
  );
}
