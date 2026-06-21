import Image from "next/image";
import {
  getInternalProfileByMemberId,
  getLatestPendingProposal,
  getMemberByToken,
} from "@/lib/edit-token";
import { getPublicLocale } from "@/lib/public-locale.server";
import { getPublicCopy } from "@/lib/public-copy";
import { EditForm } from "./EditForm";

export const metadata = { title: "Firmendaten bearbeiten – Swiss Dental Industry" };

export default async function EditPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
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
  // Prefer the member's own source_lang over the URL-based locale so the form
  // displays correctly even when the link has no locale prefix (e.g. copied from admin portal).
  const locale = member?.source_lang ?? urlLocale;
  const t = getPublicCopy(locale).editForm;

  return (
    <main className="min-h-screen bg-[#e7e5df] p-4 text-[#0a0a0b] lg:p-6">
      <div className="mx-auto w-full max-w-[min(1280px,calc(100vw-2rem))] py-6 sm:py-10 lg:max-w-[min(1360px,calc(100vw-3rem))]">
        <div className="overflow-hidden rounded-[2px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="h-[3px] bg-[#e1000f]" />
          <div className="flex items-center justify-between border-b border-[#e2e2e7] px-5 py-4 sm:px-7 lg:px-10">
            <Image
              src="/sdi/logo.png"
              alt="Swiss Dental Industry"
              width={1819}
              height={591}
              className="h-[30px] w-auto"
              preload
            />
            <span className="font-sdi-mono text-[11px] font-bold uppercase text-[#6b6b73]">
              {locale}
            </span>
          </div>
          <div className="p-5 sm:p-9 lg:p-10 xl:p-14">
          {!member ? (
            <div className="text-center">
              <h1 className="text-xl font-bold">
                {t.invalidTitle}
              </h1>
              <p className="mt-2 text-sm text-[#6b6b73]">{t.invalidText}</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2.5">
                <span className="h-2 w-2 bg-[#e1000f]" />
                <span className="font-sdi-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b6b73]">
                  Mitgliederbereich · Self-Service
                </span>
              </div>
              <h1 className="mb-4 text-[32px] font-extrabold leading-[1.05] tracking-[-0.025em]">
                {t.pageTitle}
              </h1>
              <EditForm
                token={token}
                locale={locale}
                hasPending={!!pending}
                initial={{
                  name: member.name,
                  description:
                    (pending?.description ?? member.description)[
                      member.source_lang
                    ] ||
                    (pending?.description ?? member.description).de,
                  source_lang: member.source_lang,
                  logo_url: pending?.logo_url ?? member.logo_url,
                  address:
                    pending && "address" in pending
                      ? (pending.address ?? null)
                      : member.address,
                  phone:
                    pending && "phone" in pending
                      ? (pending.phone ?? null)
                      : member.phone,
                  email:
                    pending && "email" in pending
                      ? (pending.email ?? null)
                      : member.email,
                  website_url:
                    pending && "website_url" in pending
                      ? (pending.website_url ?? null)
                      : member.website_url,
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
