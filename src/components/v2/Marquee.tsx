import type { Member } from "@/lib/types";

/**
 * Logo-Band der Startseite: alle Mitglieder als weisse Kacheln auf zwei
 * gegenläufigen Reihen. Jede Reihe hat eigene Logos und ist pro Runde breiter
 * als jeder Bildschirm — dasselbe Logo steht nie zweimal gleichzeitig im Bild.
 *
 * Kacheln mit fester Grösse und ohne loading="lazy": Die Logos kommen per
 * transform ins Bild, das erkennt Safari nicht als "sichtbar" und lädt sie
 * zu spät oder nie; ohne feste Breite springt das Band beim Nachladen.
 */
export function V2LogoRows({ members }: { members: Member[] }) {
  if (members.length === 0) return null;

  const rows = [members.filter((_, i) => i % 2 === 0), members.filter((_, i) => i % 2 === 1)].filter(
    (row) => row.length > 0,
  );

  return (
    <div className="v2-logo-rows" aria-hidden>
      {rows.map((row, r) => (
        <div key={r} className={`v2-logo-rows__track${r === 1 ? " v2-logo-rows__track--reverse" : ""}`}>
          {/* Zweite Kopie nur für die nahtlose Schleife; bei reduzierter
              Bewegung ausgeblendet, dann steht ein ruhiges Raster. */}
          {[...row, ...row].map((member, i) => (
            <div
              key={`${member.id}-${i}`}
              className={`v2-logo-rows__tile${i >= row.length ? " v2-logo-rows__tile--dup" : ""}`}
            >
              {member.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.logo_url} alt={member.name} decoding="async" />
              ) : (
                <span className="line-clamp-2 text-center text-[12.5px] font-bold leading-tight tracking-[-0.01em] text-[color:var(--ink-700)]">
                  {member.name}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
