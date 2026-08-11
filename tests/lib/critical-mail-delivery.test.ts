import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Die Zusage-Mail und die Willkommens-Mail enthalten den einzigen Link, über
 * den eine Firma je an ihr Profil kommt. Beide gingen einmal verloren, weil sie
 * in einem `after()`-Block hinter Übersetzung/Geocoding standen: die
 * Anreicherung lief durch, die Mail danach kam nie an.
 *
 * Diese Tests halten die Reihenfolge fest — kritischer Versand läuft synchron,
 * nur die Anreicherung darf nach der Antwort weiterlaufen.
 */
const ROOT = join(__dirname, "..", "..");

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

/** Grobe, aber ausreichende Prüfung: liegt `needle` innerhalb eines after()-Blocks? */
function insideAfterBlock(source: string, needle: string): boolean {
  const idx = source.indexOf(needle);
  if (idx === -1) throw new Error(`not found in source: ${needle}`);
  const before = source.slice(0, idx);
  const afterStarts = (before.match(/\bafter\(async \(\) => \{/g) || []).length;
  if (afterStarts === 0) return false;
  // Zählt, ob der letzte after()-Block vor der Fundstelle schon geschlossen ist.
  const lastAfter = before.lastIndexOf("after(async () => {");
  const segment = before.slice(lastAfter);
  let depth = 0;
  for (const ch of segment) {
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
  }
  return depth > 0;
}

describe("kritische Mails laufen nicht in after()", () => {
  it("Zusage-Mail wird synchron verschickt", () => {
    const src = read("src/app/admin/(portal)/applications/actions.ts");
    expect(insideAfterBlock(src, "sendApplicationApprovedMail(")).toBe(false);
  });

  it("Willkommens-Mail beim Anlegen wird synchron verschickt", () => {
    const src = read("src/app/admin/(portal)/members/actions.ts");
    expect(insideAfterBlock(src, "sendMemberWelcomeMail(")).toBe(false);
  });

  it("Übersetzung/Geocoding dürfen weiterhin nach der Antwort laufen", () => {
    const src = read("src/app/admin/(portal)/applications/actions.ts");
    expect(insideAfterBlock(src, "translateToAll(")).toBe(true);
  });
});

describe("Edit-Links bleiben gültig", () => {
  it("erneutes Senden rotiert den Token nicht", () => {
    const src = read("src/app/admin/(portal)/members/actions.ts");
    const fn = src.slice(src.indexOf("export async function sendEditLinkToMember"));
    const body = fn.slice(0, fn.indexOf("\nexport "));
    // Muss den aktiven Token wiederverwenden, nicht einen neuen erzwingen.
    expect(body).toContain("activeEditTokenFor(");
    expect(body).not.toContain("createEditTokenFor(");
  });

  it("Edit-URLs tragen keinen Locale-Präfix", () => {
    // /en/edit/<token> existiert nicht als Route und läuft nur über einen
    // 307-Umweg; die Seite bestimmt die Sprache ohnehin aus member.source_lang.
    for (const rel of [
      "src/app/admin/(portal)/applications/actions.ts",
      "src/app/admin/(portal)/members/actions.ts",
    ]) {
      expect(read(rel)).not.toContain("${localePrefix}edit/");
    }
  });
});
