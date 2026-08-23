import type { Metadata } from "next";
import Image from "next/image";
import {
  getInternalProfileByMemberId,
  getLatestPendingProposal,
  getMemberByToken,
} from "@/lib/edit-token";
import { getPublicLocale } from "@/lib/public-locale.server";
import { getPublicCopy } from "@/lib/public-copy";
import { EditForm } from "./EditForm";

type Props = { params: Promise<{ token: string }> };

// Der Titel stand fest auf Deutsch, auch wenn die Firma französisch ist.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const [member, urlLocale] = await Promise.all([getMemberByToken(token), getPublicLocale()]);
  const locale = member?.source_lang ?? urlLocale;
  return { title: getPublicCopy(locale).editForm.metaTitle, robots: { index: false } };
}

export default async function EditPage({ params }: Props) {
  const { token } = await params;
  const [member, urlLocale] = await Promise.all([
    getMemberByToken(token),
    getPublicLocale(),
  ]);
  const [pending, internalProfile] = member
    ? await Promise.all([
        getLatestPendingProposal(member.id),
        getInternalProfileByMemberId(member.id),
      ])
    : [null, null];
  // Die Sprache der Firma schlägt die URL-Sprache: der Link trägt kein
  // Sprachpräfix, weil er direkt aus einer Mail heraus geöffnet wird.
  const locale = member?.source_lang ?? urlLocale;
  const t = getPublicCopy(locale).editForm;

  return (
    <main className="min-h-screen bg-[#e7e5df] px-3 py-4 text-[#0a0a0b] sm:px-4 sm:py-6 lg:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="overflow-hidden rounded-[3px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="h-[3px] bg-[#e1000f]" />
          <div className="flex items-center justify-between gap-4 border-b border-[#e2e2e7] px-4 py-4 sm:px-7 lg:px-9">
            <Image
              src="/sdi/logo.png"
              alt="Swiss Dental Industry"
              width={1819}
              height={591}
              className="h-[26px] w-auto sm:h-[30px]"
              preload
            />
            <span className="font-sdi-mono text-[11px] font-bold uppercase text-[#6b6b73]">
              {locale}
            </span>
          </div>

          <div className="px-4 py-6 sm:px-7 sm:py-8 lg:px-9 lg:py-10">
            {!member ? (
              <div className="py-8 text-center">
                <h1 className="text-[20px] font-bold">{t.invalidTitle}</h1>
                <p className="mx-auto mt-3 max-w-prose text-[14px] leading-relaxed text-[#6b6b73]">
                  {t.invalidText}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="h-2 w-2 shrink-0 bg-[#e1000f]" />
                  <span className="font-sdi-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#6b6b73]">
                    {t.eyebrow}
                  </span>
                </div>
                <h1 className="mb-5 text-[clamp(24px,5vw,32px)] font-extrabold leading-[1.08] tracking-[-0.025em]">
                  {t.pageTitle}
                </h1>

                {/* Wer den Link zum ersten Mal öffnet, weiss sonst nicht, was
                    ihn erwartet — und vor allem nicht, dass nichts sofort
                    online geht. */}
                <section className="mb-7 rounded-[3px] border border-[#e2e2e7] bg-[#fafaf8] p-4 sm:p-5">
                  <h2 className="font-sdi-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]">
                    {t.introTitle}
                  </h2>
                  <ul className="mt-3 space-y-2.5 text-[13.5px] leading-relaxed text-[#4a4a51]">
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 bg-[#6b6b73]" />
                      <span>{t.introWhat}</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 bg-[#6b6b73]" />
                      <span>{t.introHow}</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 bg-[#e1000f]" />
                      <span className="font-medium text-[#0a0a0b]">{t.introReview}</span>
                    </li>
                  </ul>
                </section>

                <EditForm
                  token={token}
                  locale={locale}
                  hasPending={!!pending}
                  initial={{
                    name: member.name,
                    description:
                      (pending?.description ?? member.description)[member.source_lang] ||
                      (pending?.description ?? member.description).de,
                    source_lang: member.source_lang,
                    logo_url: pending?.logo_url ?? member.logo_url,
                    street_name:
                      pending && "street_name" in pending
                        ? (pending.street_name ?? null)
                        : member.street_name,
                    street_number:
                      pending && "street_number" in pending
                        ? (pending.street_number ?? null)
                        : member.street_number,
                    postal_code:
                      pending && "postal_code" in pending
                        ? (pending.postal_code ?? null)
                        : member.postal_code,
                    city:
                      pending && "city" in pending ? (pending.city ?? null) : member.city,
                    phone:
                      pending && "phone" in pending ? (pending.phone ?? null) : member.phone,
                    email:
                      pending && "email" in pending ? (pending.email ?? null) : member.email,
                    website_url:
                      pending && "website_url" in pending
                        ? (pending.website_url ?? null)
                        : member.website_url,
                    // Beitrag und interne Notizen liegen seit Migration 0018
                    // an der Firma und sind hier gar nicht mehr erreichbar.
                    internal_profile: pending?.internal_profile ?? internalProfile,
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
