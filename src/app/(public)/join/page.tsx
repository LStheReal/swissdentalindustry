import type { Metadata } from "next";
import { MembershipApplicationForm } from "@/app/(public)/join/MembershipApplicationForm";
import { V2Card, V2Eyebrow, V2PageHero } from "@/components/v2/ui";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { localeAlternates } from "@/lib/public-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return {
    title: copy.meta.joinTitle,
    description: copy.meta.joinDescription,
    alternates: localeAlternates("/join", locale),
  };
}

export default async function MitgliedWerdenPage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return (
    <>
      <V2PageHero index="05" eyebrow={copy.join.eyebrow} title={copy.join.title} intro={copy.join.intro} />

      <section className="v2-container grid items-start gap-6 py-[clamp(48px,6vw,88px)] lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-[110px]" data-v2-reveal="left">
          <div className="v2-dark rounded-[14px] p-[clamp(24px,3vw,36px)]">
            <div className="v2-dark__grid rounded-[14px]" aria-hidden />
            <div className="relative">
              <V2Eyebrow light>{copy.join.processEyebrow}</V2Eyebrow>
              <ol className="mt-6 flex flex-col gap-6">
                {copy.join.steps.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-[12px] font-bold text-[color:var(--red-300)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                      aria-hidden
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[14.5px] leading-[1.65] text-white/60">
                      <strong className="block pb-1 text-[15px] font-bold text-white">{step.title}</strong>
                      {step.body}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <div data-v2-reveal>
          <V2Card ticks>
            <MembershipApplicationForm locale={locale} />
          </V2Card>
        </div>
      </section>
    </>
  );
}
