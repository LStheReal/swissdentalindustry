import { Card, Eyebrow } from "@/components/sdi/Card";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { MembershipApplicationForm } from "./MembershipApplicationForm";

export async function generateMetadata() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return {
    title: copy.meta.joinTitle,
    description: copy.meta.joinDescription,
  };
}

export default async function MitgliedWerdenPage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return (
    <>
      <section className="border-b border-[color:var(--border-default)]">
        <div className="mx-auto max-w-[1200px] px-8 pt-16 pb-12">
          <Eyebrow>{copy.join.eyebrow}</Eyebrow>
          <h1
            className="mt-4 max-w-[820px] text-[clamp(40px,5vw,64px)] font-extrabold leading-[1.02]"
            style={{ letterSpacing: "-0.03em" }}
          >
            {copy.join.title}
          </h1>
          <p className="mt-5 max-w-[700px] text-[17px] leading-[1.6] text-[color:var(--text-secondary)]">
            {copy.join.intro}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-10 px-8 py-16 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="space-y-6">
          <Card accent>
            <Eyebrow>{copy.join.processEyebrow}</Eyebrow>
            <ol className="mt-4 space-y-4 text-[15px] leading-[1.65] text-[color:var(--text-secondary)]">
              {copy.join.steps.map((step) => (
                <li key={step.title}>
                  <strong className="text-[color:var(--text-primary)]">{step.title}</strong>
                  <br />
                  {step.body}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <Card>
          <MembershipApplicationForm locale={locale} />
        </Card>
      </section>
    </>
  );
}
