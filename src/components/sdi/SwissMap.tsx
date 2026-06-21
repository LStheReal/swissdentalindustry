"use client";

import { useState } from "react";

export interface SwissMapPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** Externes href (z.B. Google Maps) – öffnet in neuem Tab. */
  href?: string;
  canton?: string | null;
}

interface Props {
  pins: SwissMapPin[];
  imageSrc?: string;
  bounds?: { minLng: number; maxLng: number; minLat: number; maxLat: number };
  className?: string;
}

const DEFAULT_BOUNDS = {
  minLng: 5.96,
  maxLng: 10.49,
  minLat: 45.82,
  maxLat: 47.81,
};

export function SwissMap({
  pins,
  imageSrc = "/sdi/Swistzerland Map.png",
  bounds = DEFAULT_BOUNDS,
  className,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const project = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { x, y };
  };

  const valid = pins.filter(
    (p) =>
      typeof p.lat === "number" &&
      typeof p.lng === "number" &&
      p.lat >= bounds.minLat &&
      p.lat <= bounds.maxLat &&
      p.lng >= bounds.minLng &&
      p.lng <= bounds.maxLng,
  );

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", aspectRatio: "1633 / 1153" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt="Karte der Schweiz"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          pointerEvents: "none",
          userSelect: "none",
        }}
        draggable={false}
      />

      {valid.map((pin) => {
        const { x, y } = project(pin.lat, pin.lng);
        const isHover = hover === pin.id;
        return (
          <a
            key={pin.id}
            href={pin.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${pin.name} auf Google Maps öffnen`}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -100%)",
              zIndex: isHover ? 3 : 1,
              cursor: "pointer",
              textDecoration: "none",
            }}
            onMouseEnter={() => setHover(pin.id)}
            onMouseLeave={() => setHover((v) => (v === pin.id ? null : v))}
          >
            {/* Teardrop-Pin als inline SVG */}
            <svg
              aria-hidden
              width={isHover ? 28 : 24}
              height={isHover ? 40 : 34}
              viewBox="0 0 24 34"
              style={{ display: "block", transition: "width 120ms ease, height 120ms ease", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}
            >
              <path
                d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 17 9 17s9-10.25 9-17c0-4.97-4.03-9-9-9z"
                fill="#d32f2f"
              />
              <circle cx="12" cy="9" r="3.5" fill="#fff" />
            </svg>

            {isHover ? (
              <span
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 4px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                  background: "#111",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 8px",
                  borderRadius: 4,
                  pointerEvents: "none",
                }}
              >
                {pin.name}
                {pin.canton ? ` · ${pin.canton}` : ""}
              </span>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}
