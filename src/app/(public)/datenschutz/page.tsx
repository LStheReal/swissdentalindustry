import { Card, Eyebrow } from "@/components/sdi/Card";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";

export async function generateMetadata() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return {
    title: copy.meta.privacyTitle,
    description: copy.meta.privacyDescription,
  };
}

export default async function DatenschutzPage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return (
    <>
      <section className="border-b border-[color:var(--border-default)]">
        <div className="mx-auto max-w-[1000px] px-8 pt-16 pb-12">
          <Eyebrow>{copy.privacy.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-[clamp(40px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            {copy.privacy.title}
          </h1>
        </div>
      </section>
      <section className="mx-auto max-w-[900px] px-8 py-16">
        <Card>
          <div className="space-y-5 text-[15px] leading-[1.75] text-[color:var(--text-secondary)]">
            <p>{copy.privacy.paragraphs[0]}</p>
            <p>{copy.privacy.paragraphs[1]}</p>
            <p>
              {copy.privacy.paragraphs[2].replace("info@swissdentalindustry.ch.", "")}
              <a className="font-semibold text-[color:var(--accent)]" href="mailto:info@swissdentalindustry.ch">
                info@swissdentalindustry.ch
              </a>
            </p>
          </div>
        </Card>
      </section>
    </>
  );
}
