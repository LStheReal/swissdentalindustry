"use client";

import { useState } from "react";

type Item = { n: string; t: string; d: string };

/**
 * Numbered accordion for the four expertise pillars.
 * Hover previews (desktop), click/tap toggles, keyboard accessible.
 */
export function V2ExpertiseAccordion({ items }: { items: readonly Item[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="v2-acc" data-v2-reveal>
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `v2-exp-panel-${i}`;
        return (
          <div
            key={item.n}
            className={`v2-acc__row ${isOpen ? "is-open" : ""}`}
            onMouseEnter={() => setOpen(i)}
          >
            <button
              type="button"
              className="v2-acc__head"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span className="v2-acc__num" style={{ fontFamily: "var(--font-mono)" }}>
                {item.n}
              </span>
              <span className="v2-acc__title">{item.t}</span>
              <span className="v2-acc__icon" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M7 1v12M1 7h12" />
                </svg>
              </span>
            </button>
            <div id={panelId} className="v2-acc__body" role="region" aria-hidden={!isOpen}>
              <div>
                <p className="v2-acc__text">{item.d}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
