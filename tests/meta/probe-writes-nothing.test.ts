import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { HONEYPOT_FIELD } from "../../src/lib/forms";

/**
 * `.env.local` zeigt auf die PRODUKTIVE Supabase-Instanz. Der Liveness-Probe in
 * tests/setup.ts schickte deshalb bei jedem Testlauf eine echte, leere
 * Kontaktanfrage in die Produktionsdatenbank — vier solcher Geister-Anfragen
 * ({"source":"public_contact"}, ohne Name, Mail oder Nachricht) lagen im Admin,
 * und jeder weitere `npm test`-Lauf legte die nächste an.
 *
 * Der Probe füllt jetzt das Honeypot-Feld: die Route antwortet mit demselben
 * JSON, verwirft die Einsendung aber, bevor irgendetwas gespeichert wird.
 * Dieser Test hält das fest.
 */
const setupSource = readFileSync(join(__dirname, "..", "setup.ts"), "utf8");

/** Der fetch-Aufruf des Liveness-Probes, von `fetch(` bis zur schliessenden `)`. */
function probeCall(): string {
  const start = setupSource.indexOf("/api/forms/contact");
  expect(start, "Liveness-Probe ruft /api/forms/contact nicht mehr auf").toBeGreaterThan(-1);
  return setupSource.slice(start, start + 400);
}

describe("Liveness-Probe schreibt nichts in die Datenbank", () => {
  it("füllt das Honeypot-Feld", () => {
    // Entweder über die Konstante (bevorzugt) oder als Literal.
    const call = probeCall();
    expect(
      call.includes("HONEYPOT_FIELD") || call.includes(`"${HONEYPOT_FIELD}"`),
      "Liveness-Probe füllt das Honeypot-Feld nicht — er würde wieder eine leere Anfrage speichern",
    ).toBe(true);
  });

  it("schickt keinen leeren Body, der als echte Anfrage gespeichert würde", () => {
    expect(probeCall()).not.toContain("JSON.stringify({})");
  });

  it("die Kontakt-Route verwirft Honeypot-Einsendungen vor dem Speichern", () => {
    const route = readFileSync(
      join(__dirname, "..", "..", "src", "app", "api", "forms", "contact", "route.ts"),
      "utf8",
    );
    const honeypotCheck = route.indexOf("isHoneypotTripped");
    const insert = route.indexOf(".insert(");
    expect(honeypotCheck).toBeGreaterThan(-1);
    expect(insert).toBeGreaterThan(-1);
    expect(honeypotCheck).toBeLessThan(insert);
  });
});
