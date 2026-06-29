"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export type HeroContent = {
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

/* Pointer + scroll → background-only signals. Title never moves. */
function useParallax<T extends HTMLElement>(strength = 30) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
    };
    const onLeave = () => { tx = 0; ty = 0; };
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = Math.max(-1, Math.min(1, ((r.top + r.height / 2) / vh - 0.5) * -2));
      el.style.setProperty("--mx", (cx * strength).toFixed(2) + "px");
      el.style.setProperty("--my", (cy * strength).toFixed(2) + "px");
      el.style.setProperty("--cx", ((cx + 0.5) * 100).toFixed(2));
      el.style.setProperty("--cy", ((cy + 0.5) * 100).toFixed(2));
      el.style.setProperty("--p", p.toFixed(3));
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
  }, [strength]);
  return ref;
}

const SECTION =
  "relative isolate flex min-h-[clamp(560px,82vh,780px)] w-full items-center justify-center overflow-hidden bg-white";

function bg(mouse: number, scroll = 0): React.CSSProperties {
  return {
    transform: `translate3d(calc(var(--mx,0px) * ${mouse}), calc(var(--my,0px) * ${mouse} + var(--p,0) * ${scroll}px), 0)`,
    willChange: "transform",
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function Title({ content }: { content: HeroContent }) {
  return (
    <div className="relative z-20 mx-auto max-w-[840px] px-[clamp(20px,5vw,48px)] text-center">
      <div className="mb-6 inline-flex items-center gap-[10px]">
        <span className="h-[9px] w-[9px] bg-[color:var(--accent)]" />
        <span className="font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          {content.eyebrow}
        </span>
      </div>
      <h1
        className="text-[clamp(40px,6.4vw,84px)] font-extrabold leading-[0.96] tracking-[-0.035em]"
        style={{ color: "var(--ink-950)" }}
      >
        {content.titleA}
        <br />
        <span className="text-[color:var(--accent)]">{content.titleAccent}</span>{" "}
        {content.titleB}
      </h1>
      <p className="mx-auto mt-7 max-w-[560px] text-[clamp(15px,1.7vw,18px)] leading-[1.6] text-[color:var(--text-secondary)]">
        {content.intro}
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link
          href={content.primaryHref}
          className="inline-flex h-12 items-center justify-center rounded-[4px] bg-[color:var(--accent)] px-7 text-[15px] font-semibold text-white transition-colors hover:bg-[color:var(--accent-hover)]"
          style={{ color: "#fff" }}
        >
          {content.primaryLabel}
        </Link>
        <Link
          href={content.secondaryHref}
          className="inline-flex h-12 items-center justify-center rounded-[4px] border border-[color:var(--border-strong)] bg-white px-7 text-[15px] font-semibold text-[color:var(--text-primary)] transition-colors hover:bg-[color:var(--ink-50)]"
        >
          {content.secondaryLabel}
        </Link>
      </div>
    </div>
  );
}

function CornerMarks() {
  const c = "rgba(10,10,11,0.38)";
  return (
    <>
      <span className="absolute top-5 left-5 font-mono text-[11px] font-bold tracking-[0.16em]" style={{ color: c }}>SVDI / ASDI</span>
      <span className="absolute top-5 right-5 font-mono text-[11px] font-bold tracking-[0.16em]" style={{ color: c }}>EST. 1956</span>
      <span className="absolute bottom-5 left-5 font-mono text-[11px] font-bold tracking-[0.16em]" style={{ color: c }}>GÜMLIGEN · BERN</span>
      <span className="absolute right-5 bottom-5 font-mono text-[11px] font-bold tracking-[0.16em]" style={{ color: "var(--accent)" }}>SWISS MADE</span>
    </>
  );
}

const KEYFRAMES = `
@keyframes sdi-drift-1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(6px,-8px); } }
@keyframes sdi-drift-2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-9px,5px); } }
@keyframes sdi-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
@keyframes sdi-fall { 0% { transform: translateY(-12px); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(820px); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .sdi-anim { animation: none !important; } }
`;

/* ── 1 — Radial: dots radiate outward from the title ─────────────
   Movement: background only, very subtle. Hover deflects field. */
function HeroRadial({ content }: { content: HeroContent }) {
  const ref = useParallax<HTMLDivElement>(22);

  // Diagonal darkness gradient — top-left is darkest, bottom-right is lightest.
  // Direction vector tilted slightly off the pure 45° axis.
  const DX = -0.863, DY = -0.504; // points toward top-left
  const PMIN = -1388.4, PMAX = 0; // projection extents for the 1200×700 box

  const dots: { x: number; y: number; r: number; o: number; red: boolean }[] = [];
  for (let ring = 1; ring <= 18; ring++) {
    const count = 6 + ring * 2;
    const radius = ring * 32;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (ring % 2 ? 0.1 : 0);
      const x = r2(600 + Math.cos(a) * radius);
      const y = r2(350 + Math.sin(a) * radius * 0.78);
      const r = r2(Math.min(6.5, 0.8 + ring * 0.32));
      const t = (x * DX + y * DY - PMIN) / (PMAX - PMIN); // 0 (bottom-left) → 1 (top-right)
      const o = r2(0.04 + Math.pow(Math.max(0, Math.min(1, t)), 1.2) * 0.55);
      dots.push({ x, y, r, o, red: ring === 7 && i % 3 === 0 });
    }
  }
  return (
    <div ref={ref} className={SECTION}>
      <svg aria-hidden className="absolute inset-0 h-full w-full" style={bg(1.6, 24)} viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" fill="none">
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.red ? "var(--red-500)" : `rgba(10,10,11,${d.o})`} />
        ))}
      </svg>
      <CornerMarks />
      <Title content={content} />
    </div>
  );
}

/* ── 2 — Wave: sinusoidal dot rows, very animated ────────────────
   Movement: rows gently drift in opposite directions, hover deflects field. */
function HeroWave({ content }: { content: HeroContent }) {
  const ref = useParallax<HTMLDivElement>(18);
  const rows = 14;
  const cols = 36;
  return (
    <div ref={ref} className={SECTION}>
      <svg aria-hidden className="absolute inset-0 h-full w-full" style={bg(1.2, 18)} viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" fill="none">
        {Array.from({ length: rows }).map((_, ri) => {
          const y = r2(50 + ri * 45);
          const amp = 14 + (ri % 4) * 4;
          return (
            <g key={ri} className="sdi-anim" style={{ animation: `${ri % 2 ? "sdi-drift-1" : "sdi-drift-2"} ${14 + (ri % 3) * 4}s ease-in-out infinite` }}>
              {Array.from({ length: cols }).map((_, ci) => {
                const x = r2((ci / (cols - 1)) * 1200);
                const yy = r2(y + Math.sin((ci / cols) * Math.PI * 3 + ri * 0.6) * amp);
                const r = r2(1.2 + (Math.sin(ci * 0.55 + ri) + 1) * 1.6);
                const red = ri === 6 && ci % 9 === 0;
                return <circle key={ci} cx={x} cy={yy} r={r} fill={red ? "var(--red-500)" : "rgba(10,10,11,0.16)"} />;
              })}
            </g>
          );
        })}
      </svg>
      <CornerMarks />
      <Title content={content} />
    </div>
  );
}

/* ── 3 — Aperture: dots clear the title centre via radial mask ───
   Movement: minimal — purely static, with optional hover drift on background. */
function HeroAperture({ content }: { content: HeroContent }) {
  const ref = useParallax<HTMLDivElement>(14);
  const cols = 44, rows = 26;
  return (
    <div ref={ref} className={SECTION}>
      <svg aria-hidden className="absolute inset-0 h-full w-full" style={{ ...bg(0.8, 12), maskImage: "radial-gradient(ellipse at center, transparent 24%, black 56%)", WebkitMaskImage: "radial-gradient(ellipse at center, transparent 24%, black 56%)" }} viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" fill="none">
          {Array.from({ length: cols * rows }).map((_, i) => {
            const cx = i % cols, cy = Math.floor(i / cols);
            const x = r2((cx / (cols - 1)) * 1200);
            const y = r2((cy / (rows - 1)) * 700);
            const offRow = cy % 2 ? 14 : 0;
            const red = cy === 13 && cx % 11 === 0;
            return <circle key={i} cx={r2(x + offRow)} cy={y} r={2.4} fill={red ? "var(--red-500)" : "rgba(10,10,11,0.22)"} />;
          })}
      </svg>
      <span aria-hidden className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--accent)]" style={bg(0.8, 12)} />
      <CornerMarks />
      <Title content={content} />
    </div>
  );
}

/* ── 4 — Rainfall: vertical dot columns falling, very animated ───
   Movement: continuous downward fall, varying speed per column. */
function HeroRainfall({ content }: { content: HeroContent }) {
  const ref = useParallax<HTMLDivElement>(16);
  const cols = 26;
  return (
    <div ref={ref} className={SECTION}>
      {/* faint baseline grid */}
      <div aria-hidden className="absolute inset-0" style={{ ...bg(0.4, 8), backgroundImage: "linear-gradient(rgba(10,10,11,0.04) 1px,transparent 1px)", backgroundSize: "100% 60px" }} />
      <div aria-hidden className="absolute inset-0" style={bg(1.2, 18)}>
        {Array.from({ length: cols }).map((_, i) => {
          const left = r2((i / (cols - 1)) * 100);
          const dur = 8 + ((i * 7) % 9);
          const delay = -((i * 1.7) % 8);
          const isRed = i === 7 || i === 19;
          const count = 5 + (i % 3);
          return (
            <div key={i} className="absolute top-0 h-full" style={{ left: `${left}%`, width: "2px" }}>
              {Array.from({ length: count }).map((_, j) => {
                const size = 4 + ((i + j) % 3);
                return (
                  <span
                    key={j}
                    className="sdi-anim absolute left-1/2 -translate-x-1/2 rounded-full"
                    style={{
                      width: size,
                      height: size,
                      background: isRed && j === 0 ? "var(--red-500)" : "rgba(10,10,11,0.18)",
                      animation: `sdi-fall ${dur}s linear ${delay - j * (dur / count)}s infinite`,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      <CornerMarks />
      <Title content={content} />
    </div>
  );
}

/* ── 5 — Spotlight: cursor reveals a dense halftone patch ────────
   Movement: dot pattern moves only at hover, plus localised highlight that
   follows the pointer (radial-gradient using --cx/--cy). */
function HeroSpotlight({ content }: { content: HeroContent }) {
  const ref = useParallax<HTMLDivElement>(28);
  const cols = 60, rows = 36;
  return (
    <div ref={ref} className={SECTION} style={{ background: "var(--ink-50)" }}>
      <svg aria-hidden className="absolute inset-0 h-full w-full" style={bg(0.9, 14)} viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" fill="none">
        {Array.from({ length: cols * rows }).map((_, i) => {
          const cx = i % cols, cy = Math.floor(i / cols);
          const x = r2((cx / (cols - 1)) * 1200);
          const y = r2((cy / (rows - 1)) * 700);
          const stagger = cy % 2 ? 10 : 0;
          const red = (cx * 11 + cy * 7) % 173 === 0;
          return <circle key={i} cx={r2(x + stagger)} cy={y} r={1.4} fill={red ? "var(--red-500)" : "rgba(10,10,11,0.14)"} />;
        })}
      </svg>
      {/* pointer-following highlight */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(360px circle at calc(var(--cx,50)*1%) calc(var(--cy,50)*1%), rgba(225,0,15,0.18), transparent 70%)",
          transition: "background 60ms linear",
        }}
      />
      {/* subtle ring around the pointer */}
      <div
        aria-hidden
        className="absolute h-[120px] w-[120px] rounded-full border border-[color:var(--accent)]/50"
        style={{
          left: "calc(var(--cx,50)*1%)",
          top: "calc(var(--cy,50)*1%)",
          transform: "translate(-50%, -50%)",
        }}
      />
      <CornerMarks />
      <Title content={content} />
    </div>
  );
}

const MAP = {
  1: HeroRadial,
  2: HeroWave,
  3: HeroAperture,
  4: HeroRainfall,
  5: HeroSpotlight,
} as const;

export function HeroVariant({
  variant,
  content,
}: {
  variant: 1 | 2 | 3 | 4 | 5;
  content: HeroContent;
}) {
  const Cmp = MAP[variant] ?? HeroRadial;
  return (
    <>
      <style>{KEYFRAMES}</style>
      <Cmp content={content} />
    </>
  );
}
