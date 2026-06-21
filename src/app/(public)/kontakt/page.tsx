import { Eyebrow, Card } from "@/components/sdi/Card";
import { getPublicCopy } from "@/lib/public-copy";
import { getPublicLocale } from "@/lib/public-locale.server";
import { ContactForm } from "./ContactForm";

export async function generateMetadata() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return {
    title: copy.meta.contactTitle,
    description: copy.meta.contactDescription,
  };
}

export default async function KontaktPage() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return (
    <>
      <section className="border-b border-[color:var(--border-default)]">
        <div className="mx-auto max-w-[1200px] px-8 pt-16 pb-12">
          <Eyebrow>{copy.contact.eyebrow}</Eyebrow>
          <h1
            className="mt-4 text-[56px] font-extrabold leading-[1.02]"
            style={{ letterSpacing: "-0.03em" }}
          >
            {copy.contact.title}
          </h1>
          <p className="mt-5 max-w-[640px] text-[17px] leading-[1.6] text-[color:var(--text-secondary)]">
            {copy.contact.intro}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-10 px-8 py-16 md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <Eyebrow>{copy.contact.formEyebrow}</Eyebrow>
            <div className="mt-5">
              <ContactForm locale={locale} />
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card accent>
            <Eyebrow>{copy.contact.officeEyebrow}</Eyebrow>
            <h2 className="mt-3 text-[24px] font-bold" style={{ letterSpacing: "-0.01em" }}>
              ASDI — Association of the Swiss Dental Industry
            </h2>
            <p
              className="mt-4 text-[15px] leading-[1.7]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Moosstrasse 2<br />
              CH&nbsp;–&nbsp;3073 Gümligen, Bern<br />
              {copy.contact.officeCountry}
            </p>
            <div className="mt-5 flex flex-col gap-2 text-[15px]">
              <a
                href="mailto:info@swissdentalindustry.ch"
                className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accent-hover)]"
              >
                info@swissdentalindustry.ch
              </a>
            </div>
          </Card>

          <Card>
            <span id="vorstand" />
            <Eyebrow>{copy.contact.boardEyebrow}</Eyebrow>
            <p className="mt-3 text-[15px] leading-[1.65] text-[color:var(--text-secondary)]">
              {copy.contact.boardText}
            </p>
          </Card>

          <Card>
            <Eyebrow>{copy.contact.mediaEyebrow}</Eyebrow>
            <p className="mt-3 text-[15px] leading-[1.65] text-[color:var(--text-secondary)]">
              {copy.contact.mediaText}
            </p>
          </Card>
        </div>
      </section>
    </>
  );
}
