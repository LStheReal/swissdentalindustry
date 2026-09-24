import type { Member } from "@/lib/types";

/** Infinite logo marquee — greyscale at rest, colour on hover, pauses on hover. */
export function V2Marquee({ members }: { members: Member[] }) {
  if (members.length === 0) return null;

  // Eine Hälfte des Bands muss breiter sein als der breiteste Bildschirm,
  // sonst sieht man die Naht der Schleife. Items haben feste Breiten (CSS),
  // ~16 Logos pro Hälfte reichen dafür. Mehr nicht: sehr breite animierte
  // Ebenen verwirft iOS Safari stückweise, dann bleiben Lücken im Band.
  const repeat = Math.max(1, Math.ceil(16 / members.length));
  const track = Array.from({ length: repeat }, () => members).flat();

  return (
    <div className="v2-marquee" aria-hidden>
      <div className="v2-marquee__track">
        {[...track, ...track].map((member, i) => (
          <div key={`${member.id}-${i}`} className="v2-marquee__item">
            {member.logo_url ? (
              // Kein loading="lazy": Die Logos kommen per transform ins Bild, das
              // erkennt Safari nicht als "sichtbar" und lädt sie zu spät oder nie.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.logo_url} alt={member.name} decoding="async" />
            ) : (
              <span className="line-clamp-2 text-center text-[14px] font-bold leading-tight tracking-[-0.01em] text-[color:var(--ink-600)]">
                {member.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
