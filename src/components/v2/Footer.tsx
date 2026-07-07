import Link from "next/link";
import { getPublicLocale } from "@/lib/public-locale.server";
import { getPublicCopy } from "@/lib/public-copy";
import { withLocalePath } from "@/lib/public-i18n";

export async function V2Footer() {
  const locale = await getPublicLocale();
  const copy = getPublicCopy(locale);

  return (
    <footer className="v2-footer" id="kontakt">
      <div className="v2-container grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[clamp(32px,4vw,48px)] pt-[clamp(56px,7vw,88px)] pb-[clamp(16px,2vw,24px)]">
        <div className="min-w-[220px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sdi/logofordark.png" alt="Swiss Dental Industry" className="h-11 w-auto" />
          <p className="mt-5 max-w-[280px] text-[13.5px] leading-[1.65] text-white/45">
            {copy.footer.address}
          </p>
          <a
            href="mailto:info@swissdentalindustry.ch"
            className="mt-5 inline-flex items-center gap-2 font-mono text-[12.5px] tracking-[0.04em] text-[color:var(--red-400)] transition-colors hover:text-white"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="inline-block h-[6px] w-[6px] rounded-full bg-[color:var(--red-500)] v2-pulse" aria-hidden />
            info@swissdentalindustry.ch
          </a>
        </div>

        {copy.footer.cols.map((col) => (
          <div key={col.heading}>
            <div
              className="mb-5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/35"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {col.heading}
            </div>
            <div className="flex flex-col items-start gap-[12px]">
              {col.links.map((link) => (
                <Link key={link.label} href={withLocalePath(link.href, locale)} className="v2-footer__link">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="v2-container overflow-hidden">
        <span className="v2-footer__wordmark" aria-hidden>
          {copy.meta.siteTitle.toUpperCase()}
        </span>
      </div>

      <div className="border-t border-white/10">
        <div
          className="v2-container flex flex-wrap items-center justify-between gap-4 py-5 text-[11.5px] tracking-[0.04em] text-white/40"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span>{copy.footer.copyright}</span>
          <a href="#top" className="v2-totop" aria-label="Top">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 14V2M3.5 6.5 8 2l4.5 4.5" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
