"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight } from "./ui";

export type V2HeroContent = {
  eyebrow: string;
  titleA: string;
  titleAccent: string;
  titleB: string;
  intro: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

/** Smoothed pointer parallax — writes --mx / --my in [-0.5, 0.5]. */
function useParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };
    const loop = () => {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      el.style.setProperty("--mx", cx.toFixed(4));
      el.style.setProperty("--my", cy.toFixed(4));
      raf = requestAnimationFrame(loop);
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);
  return ref;
}

/**
 * Split a phrase into masked words for the rise-in reveal.
 * The joining space must stay OUTSIDE the overflow-hidden mask,
 * otherwise it is trimmed and soft-wrap opportunities disappear.
 */
function Words({ text, from = 0 }: { text: string; from?: number }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`}>
          <span className="v2-word">
            <span style={{ "--v2-d": from + i } as React.CSSProperties}>{word}</span>
          </span>{" "}
        </span>
      ))}
    </>
  );
}

export function V2Hero({ content }: { content: V2HeroContent }) {
  const ref = useParallax<HTMLElement>();
  const wordsA = content.titleA.split(" ").length;

  return (
    <section ref={ref} className="v2-hero" aria-label={content.eyebrow}>
      {/* Backdrop: blueprint grid, ghost Swiss cross, scan line */}
      <div className="v2-hero__grid" aria-hidden />
      <svg className="v2-hero__cross" viewBox="0 0 100 100" fill="none" aria-hidden>
        <path
          d="M36 6h28v30h30v28H64v30H36V64H6V36h30V6Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="M42 14h16v28h28v16H58v28H42V58H14V42h28V14Z"
          stroke="currentColor"
          strokeWidth="0.6"
        />
      </svg>
      <span className="v2-hero__scan" aria-hidden />

      {/* Technical corner marks */}
      <span className="v2-hero__corner top-5 left-5" style={{ fontFamily: "var(--font-mono)" }}>SVDI / ASDI</span>
      <span className="v2-hero__corner top-5 right-5" style={{ fontFamily: "var(--font-mono)" }}>EST. 1956</span>
      <span className="v2-hero__corner bottom-5 left-5 hidden sm:block" style={{ fontFamily: "var(--font-mono)" }}>GÜMLIGEN · BERN</span>
      <span className="v2-hero__corner bottom-5 right-5 hidden sm:block" style={{ fontFamily: "var(--font-mono)", color: "var(--red-500)" }}>
        SWISS MADE
      </span>

      <div className="v2-container flex flex-1 flex-col justify-center pt-[clamp(56px,9vh,110px)] pb-10">
        <div className="v2-eyebrow v2-load" style={{ "--v2-d": 0 } as React.CSSProperties}>
          {content.eyebrow}
        </div>

        <h1 className="mt-7 max-w-[1040px] text-[clamp(44px,7.4vw,104px)] font-extrabold leading-[0.96] tracking-[-0.04em]">
          <Words text={content.titleA} />
          <br />
          <span className="v2-word">
            <span
              className="v2-serif v2-underline pr-[0.06em] text-[color:var(--red-500)] tracking-[-0.01em]"
              style={{ "--v2-d": wordsA } as React.CSSProperties}
            >
              {content.titleAccent}
              <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden>
                <path d="M2 7 C 25 3, 70 3, 98 6" pathLength={120} />
              </svg>
            </span>
          </span>{" "}
          <Words text={content.titleB} from={wordsA + 1} />
        </h1>

        <div className="mt-9 flex flex-col gap-9 md:flex-row md:items-end md:justify-between">
          <p
            className="v2-load max-w-[560px] text-[clamp(15.5px,1.7vw,18px)] leading-[1.65] text-[color:var(--text-secondary)]"
            style={{ "--v2-d": 1 } as React.CSSProperties}
          >
            {content.intro}
          </p>
          <div className="v2-load flex flex-wrap items-center gap-4" style={{ "--v2-d": 2 } as React.CSSProperties}>
            <Link href={content.primaryHref} className="v2-btn v2-btn--primary" data-v2-magnetic>
              <span className="v2-btn__label">{content.primaryLabel}</span>
              <span className="v2-btn__arrow" aria-hidden>
                <ArrowRight />
                <ArrowRight />
              </span>
            </Link>
            <Link href={content.secondaryHref} className="v2-btn v2-btn--ghost">
              <span className="v2-btn__label">{content.secondaryLabel}</span>
            </Link>
          </div>
        </div>
      </div>

    </section>
  );
}
