// Statischer Schutz gegen doppelt ausgeführte Entscheidungen.
//
// Regression: ein Doppelklick auf "Annehmen & Mitglied anlegen" hat die Firma
// zweimal angelegt. Die Action las den Status, prüfte ihn in JavaScript und
// schrieb danach — zwei parallele Klicks lesen dabei beide 'new', bevor einer
// schreibt. Der Button-Pending-State allein hilft nicht: er greift erst nach
// der Hydration und nicht über zwei Tabs hinweg.
//
// Korrekt ist ein bedingtes Update, das den Datensatz beansprucht: die
// Bedingung `.eq("status", ...)` steht in derselben Anweisung wie das Update,
// also entscheidet die Datenbank, welcher Klick gewinnt.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "../..");

/** Actions, die einen Antrag/Änderungswunsch endgültig entscheiden. */
const GUARDED = [
  {
    file: "src/app/admin/(portal)/applications/actions.ts",
    actions: ["approveApplication", "rejectApplication"],
  },
  {
    file: "src/app/admin/(portal)/feed/actions.ts",
    actions: ["approveChange", "rejectChange"],
  },
];

/** Schneidet den Quelltext einer exportierten Funktion heraus. */
function functionBody(source: string, name: string): string {
  const start = source.indexOf(`export async function ${name}(`);
  if (start === -1) throw new Error(`Action ${name} nicht gefunden`);
  const next = source.indexOf("\nexport ", start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

/**
 * Alle `.update(...)`-Ketten einer Funktion, jeweils bis zum Semikolon.
 *
 * Entscheidend ist, dass `.eq("status", …)` in derselben Kette wie das Update
 * steht. Nur im Funktionsrumpf danach zu suchen reicht nicht: die Actions lesen
 * den Datensatz vorher ebenfalls mit `.eq("status", …)`, ein Test darauf wäre
 * also auch ohne jede Absicherung grün.
 */
function updateChains(body: string): string[] {
  const chains: string[] = [];
  let from = 0;
  for (;;) {
    const at = body.indexOf(".update(", from);
    if (at === -1) return chains;
    const end = body.indexOf(";", at);
    chains.push(body.slice(at, end === -1 ? undefined : end));
    from = at + 1;
  }
}

describe("Entscheidungs-Actions sind gegen Doppelklicks abgesichert", () => {
  for (const { file, actions } of GUARDED) {
    const source = readFileSync(join(ROOT, file), "utf8");

    it.each(actions)("%s beansprucht den Datensatz per bedingtem Update", (name) => {
      const chains = updateChains(functionBody(source, name));
      expect(chains.length, `${name}: kein .update(...) gefunden`).toBeGreaterThan(0);

      const guarded = chains.filter((chain) => /\.eq\(\s*["']status["']/.test(chain));
      expect(
        guarded.length,
        `${name}: keine .update()-Kette enthält .eq("status", …) — ` +
          `ein Doppelklick würde die Entscheidung zweimal ausführen`,
      ).toBeGreaterThan(0);
    });
  }
});
