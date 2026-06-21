"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function GsapAnimations() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("gsap-ready");
      return;
    }

    let cleanup: (() => void) | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        const ease = "power3.out";
        const fadeIn = { opacity: 1, y: 0 };
        const fadeFrom = { opacity: 0, y: 24 };

        // Pin every scroll-animated target to its hidden start state via inline
        // styles. Once we drop the .gsap-ready CSS gate, the inline styles keep
        // off-screen elements invisible until their ScrollTrigger fires.
        gsap.set(
          gsap.utils.toArray<HTMLElement>(
            "main h2, main h3, [data-gsap-fade], [data-gsap-stagger] > *",
          ),
          { opacity: 0, y: 24 },
        );

        // Hero entrance — h1, the lead paragraph, and CTA row.
        const heroTargets = gsap.utils.toArray<HTMLElement>(
          "main h1, main h1 ~ p, main h1 ~ div",
        );
        if (heroTargets.length) {
          gsap.fromTo(
            heroTargets,
            { opacity: 0, y: 28 },
            { ...fadeIn, duration: 0.9, ease, stagger: 0.08, clearProps: "transform" },
          );
        }

        // Section headings — fade up on scroll.
        ScrollTrigger.batch("main h2, main h3", {
          start: "top 88%",
          onEnter: (els) =>
            gsap.fromTo(
              els,
              fadeFrom,
              { ...fadeIn, duration: 0.7, ease, stagger: 0.06, overwrite: "auto", clearProps: "transform" },
            ),
        });

        // Generic fade-up elements.
        ScrollTrigger.batch("[data-gsap-fade]", {
          start: "top 90%",
          onEnter: (els) =>
            gsap.fromTo(
              els,
              fadeFrom,
              { ...fadeIn, duration: 0.7, ease, stagger: 0.08, overwrite: "auto", clearProps: "transform" },
            ),
        });

        // Staggered children inside marked containers.
        const staggerContainers = gsap.utils.toArray<HTMLElement>("[data-gsap-stagger]");
        staggerContainers.forEach((container) => {
          const children = Array.from(container.children) as HTMLElement[];
          if (!children.length) return;
          ScrollTrigger.create({
            trigger: container,
            start: "top 85%",
            once: true,
            onEnter: () =>
              gsap.fromTo(
                children,
                { opacity: 0, y: 28 },
                { ...fadeIn, duration: 0.7, ease, stagger: 0.08, overwrite: "auto", clearProps: "transform" },
              ),
          });
        });

        // Subtle parallax on hero image.
        const heroImage = document.querySelector<HTMLElement>("[data-gsap-parallax]");
        if (heroImage) {
          gsap.to(heroImage, {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: heroImage,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        }
      });

      // Reveal the page now that animations are registered — anything off-screen
      // is still kept invisible by gsap's inline styles until its ScrollTrigger fires.
      root.classList.add("gsap-ready");
      ScrollTrigger.refresh();

      cleanup = () => {
        ctx.revert();
        ScrollTrigger.getAll().forEach((t) => t.kill());
        root.classList.remove("gsap-ready");
      };
    })();

    return () => {
      cleanup?.();
    };
  }, [pathname]);

  return null;
}
