"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * V2 motion runtime — one lightweight client component per page view.
 *
 *  [data-v2-reveal]            scroll-triggered fade/slide reveal
 *  [data-v2-stagger]           auto-assigns --v2-d delays to children
 *  [data-v2-count="1956"]      count-up number when scrolled into view
 *  [data-v2-magnetic]          cursor-magnetic hover (fine pointers only)
 *  [data-v2-spot]              pointer-tracking spotlight (--sx / --sy)
 *
 * Everything respects prefers-reduced-motion and cleans up on navigation.
 */
export function V2Fx() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: (() => void)[] = [];

    // --- Stagger delays --------------------------------------------------
    document.querySelectorAll<HTMLElement>("[data-v2-stagger]").forEach((container) => {
      Array.from(container.children).forEach((child, i) => {
        // Cap the delay so long grids don't trickle in forever.
        (child as HTMLElement).style.setProperty("--v2-d", String(Math.min(i, 9)));
        if (!(child as HTMLElement).hasAttribute("data-v2-reveal")) {
          (child as HTMLElement).setAttribute("data-v2-reveal", "");
        }
      });
    });

    // --- Scroll reveals ---------------------------------------------------
    const revealTargets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-v2-reveal]:not(.v2-in)"),
    );
    if (reduced) {
      revealTargets.forEach((el) => el.classList.add("v2-in"));
    } else if (revealTargets.length) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("v2-in");
              io.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
      );
      revealTargets.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    // --- Count-up numbers -------------------------------------------------
    const counters = Array.from(document.querySelectorAll<HTMLElement>("[data-v2-count]"));
    if (counters.length && !reduced) {
      const animate = (el: HTMLElement) => {
        const raw = el.dataset.v2Count ?? el.textContent ?? "";
        const match = raw.match(/^(\d+)(.*)$/);
        if (!match) return;
        const target = parseInt(match[1], 10);
        const suffix = match[2] ?? "";
        // Years shouldn't spin from zero — start close to the target.
        const from = target >= 1000 ? target - 64 : 0;
        const duration = 1400;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = String(Math.round(from + (target - from) * eased)) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              animate(entry.target as HTMLElement);
              io.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.4 },
      );
      counters.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    // --- Magnetic buttons (fine pointer only) -----------------------------
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (finePointer && !reduced) {
      document.querySelectorAll<HTMLElement>("[data-v2-magnetic]").forEach((el) => {
        const strength = 0.22;
        const onMove = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
        };
        const onLeave = () => {
          el.style.transition = "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
          el.style.transform = "";
          window.setTimeout(() => {
            el.style.transition = "";
          }, 500);
        };
        el.addEventListener("mousemove", onMove);
        el.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          el.removeEventListener("mousemove", onMove);
          el.removeEventListener("mouseleave", onLeave);
          el.style.transform = "";
        });
      });
    }

    // --- Spotlight cards --------------------------------------------------
    if (finePointer) {
      document.querySelectorAll<HTMLElement>("[data-v2-spot]").forEach((el) => {
        el.classList.add("v2-spot");
        const onMove = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          el.style.setProperty("--sx", (((e.clientX - r.left) / r.width) * 100).toFixed(2));
          el.style.setProperty("--sy", (((e.clientY - r.top) / r.height) * 100).toFixed(2));
        };
        el.addEventListener("mousemove", onMove);
        cleanups.push(() => el.removeEventListener("mousemove", onMove));
      });
    }

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [pathname]);

  return null;
}
