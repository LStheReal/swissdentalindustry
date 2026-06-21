import { Card, Eyebrow } from "@/components/sdi/Card";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";

export async function generateMetadata() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return {
    title: copy.meta.imprintTitle,
    description: copy.meta.imprintDescription,
  };
}

export default async function ImpressumPage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return (
    <>
      <section className="border-b border-[color:var(--border-default)]">
        <div className="mx-auto max-w-[1000px] px-8 pt-16 pb-12">
          <Eyebrow>{copy.imprint.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-[clamp(40px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Swiss Dental Industry
          </h1>
        </div>
      </section>
      <section className="mx-auto max-w-[900px] px-8 py-16">
        <Card>
          <div className="space-y-5 text-[15px] leading-[1.75] text-[color:var(--text-secondary)]">
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
              <a className="font-semibold text-[color:var(--accent)]" href="mailto:info@swissdentalindustry.ch">
                info@swissdentalindustry.ch
              </a>
            </p>
            <p>
              {copy.imprint.content}
            </p>
          </div>
        </Card>
      </section>
    </>
  );
}
