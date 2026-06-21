import Link from "next/link";
import { getPublicLocale } from "@/lib/public-locale.server";
import { getPublicCopy } from "@/lib/public-copy";
import { withLocalePath } from "@/lib/public-i18n";

export async function SiteFooter() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);
  return (
    <footer
      id="kontakt"
      className="border-t border-[color:var(--ink-700)] bg-[color:var(--ink-950)] text-white"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[clamp(28px,3vw,40px)] px-[clamp(20px,5vw,48px)] pt-[clamp(48px,6vw,72px)] pb-[clamp(28px,3vw,40px)]">
        <div className="min-w-[200px]">
          <div className="mb-[18px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sdi/logofordark.png"
              alt="Swiss Dental Industry"
              className="h-11 w-auto"
            />
          </div>
          <p className="m-0 max-w-[260px] text-[13.5px] leading-[1.6] text-white/50">
            {copy.footer.address}
          </p>
          <a
            href="mailto:info@swissdentalindustry.ch"
            className="mt-4 inline-block font-mono text-[12.5px] tracking-[0.04em] text-[color:var(--red-400)] transition-colors hover:text-white"
          >
            info@swissdentalindustry.ch
          </a>
        </div>

        {copy.footer.cols.map((col) => (
          <div key={col.heading}>
            <div className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
              {col.heading}
            </div>
            <div className="flex flex-col gap-[11px]">
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  href={withLocalePath(link.href, locale)}
                  className="text-[14px] text-white/70 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[color:var(--ink-700)]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-3 px-[clamp(20px,5vw,48px)] py-[18px] font-mono text-[11.5px] tracking-[0.04em] text-white/40">
          <span>{copy.footer.copyright}</span>
          <span>{copy.footer.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
