"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  as?: "div" | "section";
  className?: string;
  id?: string;
};

export function Reveal({ children, delay = 0, as = "div", className = "", id }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(
    () => typeof window !== "undefined" && typeof window.IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  const style = {
    opacity: shown ? 1 : 0,
    transform: shown ? "translateY(0)" : "translateY(12px)",
    transition: `opacity 600ms var(--ease-out, ease-out) ${delay}ms, transform 600ms var(--ease-out, ease-out) ${delay}ms`,
    willChange: "opacity, transform",
  } as const;

  if (as === "section") {
    return (
      <section ref={ref as React.RefObject<HTMLElement>} id={id} className={className} style={style}>
        {children}
      </section>
    );
  }
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} id={id} className={className} style={style}>
      {children}
    </div>
  );
}
