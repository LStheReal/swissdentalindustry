"use client";

import { useEffect, useRef } from "react";

export function MarkerAccent({ children }: { children: React.ReactNode }) {
  const bgRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const bg = bgRef.current;
    if (!bg) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      bg.style.transform = "scaleX(1)";
      return;
    }

    const timer = setTimeout(() => {
      bg.style.transition = "transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)";
      bg.style.transform = "scaleX(1)";
    }, 80);

    return () => clearTimeout(timer);
  }, []);

  return (
    <span className="relative inline-block">
      {/* Highlighter background — scales from left to right */}
      <span
        ref={bgRef}
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          inset: "0.06em -0.12em",
          background: "var(--accent)",
          borderRadius: "3px",
          transform: "scaleX(0)",
          transformOrigin: "left center",
        }}
      />
      <span className="relative text-white">{children}</span>
    </span>
  );
}
