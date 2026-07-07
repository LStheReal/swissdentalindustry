import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/* ── Icons ─────────────────────────────────────────────────── */

export function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" />
    </svg>
  );
}

/* ── Eyebrow ───────────────────────────────────────────────── */

export function V2Eyebrow({
  children,
  light = false,
  className = "",
}: {
  children: ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <span className={["v2-eyebrow", light ? "v2-eyebrow--light" : "", className].join(" ").trim()}>
      {children}
    </span>
  );
}

/* ── Buttons ───────────────────────────────────────────────── */

type BtnVariant = "primary" | "ghost" | "light" | "outline-light";
type BtnSize = "sm" | "md" | "lg";

export function V2BtnLink({
  href,
  children,
  variant = "primary",
  size = "md",
  external = false,
  magnetic = false,
  className = "",
  style,
}: {
  href: string;
  children: ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  external?: boolean;
  magnetic?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const cls = [
    "v2-btn",
    `v2-btn--${variant}`,
    size !== "md" ? `v2-btn--${size}` : "",
    className,
  ]
    .join(" ")
    .trim();
  // Some shared copy strings end in "→"; the v2 button renders its own
  // animated arrow, so drop the literal one.
  const label =
    typeof children === "string" ? children.replace(/\s*(?:→|->)\s*$/, "") : children;
  const inner = (
    <>
      <span className="v2-btn__label">{label}</span>
      <span className="v2-btn__arrow" aria-hidden>
        <ArrowRight />
        <ArrowRight />
      </span>
    </>
  );
  const magneticProps = magnetic ? { "data-v2-magnetic": "" } : {};
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style} {...magneticProps}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} style={style} {...magneticProps}>
      {inner}
    </Link>
  );
}

/* ── Section header (index number + eyebrow + title) ───────── */

export function V2SectionHead({
  index,
  eyebrow,
  title,
  lead,
  light = false,
  className = "",
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {/* Gleiches Muster wie Abschnitt 01: Eyebrow und /Nummer nebeneinander. */}
      <div className="flex items-center justify-between gap-6 lg:justify-start lg:gap-8" data-v2-reveal>
        <V2Eyebrow light={light}>{eyebrow}</V2Eyebrow>
        <span className="v2-index" style={light ? { color: "rgba(255,255,255,0.35)" } : undefined}>
          <em>/</em> {index}
        </span>
      </div>
      <h2
        className="mt-5 max-w-[760px] text-[clamp(30px,4vw,52px)] font-extrabold leading-[1.02] tracking-[-0.03em]"
        data-v2-reveal
        style={{ "--v2-d": 1 } as CSSProperties}
      >
        {title}
      </h2>
      {lead ? (
        <p
          className="mt-6 max-w-[680px] text-[clamp(15px,1.7vw,18px)] leading-[1.65]"
          style={
            {
              color: light ? "rgba(255,255,255,0.6)" : "var(--text-secondary)",
              "--v2-d": 2,
            } as CSSProperties
          }
          data-v2-reveal
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}

/* ── Inner-page hero ───────────────────────────────────────── */

export function V2PageHero({
  index,
  eyebrow,
  title,
  intro,
  children,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <section className="v2-page-hero">
      <div className="v2-page-hero__grid" aria-hidden />
      <div className="v2-container relative pt-[clamp(52px,7vw,96px)] pb-[clamp(40px,5vw,72px)]">
        <div className="flex items-center justify-between gap-6 lg:justify-start lg:gap-8" data-v2-reveal>
          <V2Eyebrow>{eyebrow}</V2Eyebrow>
          <span className="v2-index">
            <em>/</em> {index}
          </span>
        </div>
        <h1
          className="mt-6 max-w-[900px] text-[clamp(40px,6vw,76px)] font-extrabold leading-[0.98] tracking-[-0.035em]"
          data-v2-reveal
          style={{ "--v2-d": 1 } as CSSProperties}
        >
          {title}
        </h1>
        {intro ? (
          <p
            className="mt-7 max-w-[720px] text-[clamp(16px,1.8vw,19px)] leading-[1.65] text-[color:var(--text-secondary)]"
            data-v2-reveal
            style={{ "--v2-d": 2 } as CSSProperties}
          >
            {intro}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}

/* ── Card with corner ticks ────────────────────────────────── */

export function V2Card({
  children,
  className = "",
  hover = false,
  ticks = false,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  ticks?: boolean;
  padded?: boolean;
}) {
  return (
    <div
      className={[
        "v2-card",
        hover ? "v2-card--hover" : "",
        ticks ? "v2-ticks" : "",
        padded ? "p-[clamp(24px,3vw,36px)]" : "",
        className,
      ]
        .join(" ")
        .trim()}
    >
      {ticks ? <span className="v2-tick" aria-hidden /> : null}
      {children}
    </div>
  );
}
