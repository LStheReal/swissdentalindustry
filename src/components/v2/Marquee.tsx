import type { Member } from "@/lib/types";

/** Infinite logo marquee — greyscale at rest, colour on hover, pauses on hover. */
export function V2Marquee({ members }: { members: Member[] }) {
  if (members.length === 0) return null;

  // Ensure the track is long enough for a seamless loop.
  const repeat = Math.max(2, Math.ceil(30 / members.length));
  const track = Array.from({ length: repeat }, () => members).flat();

  return (
    <div className="v2-marquee" aria-hidden>
      <div className="v2-marquee__track">
        {[...track, ...track].map((member, i) => (
          <div key={`${member.id}-${i}`} className="v2-marquee__item">
            {member.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.logo_url} alt={member.name} loading="lazy" />
            ) : (
              <span className="whitespace-nowrap text-[15px] font-bold tracking-[-0.01em] text-[color:var(--ink-600)]">
                {member.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
