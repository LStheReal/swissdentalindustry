// Jede Aktion im Admin, die sich nicht rückgängig machen lässt, fragt vorher
// nach.
//
// Bis 2026-09-16 hatte KEIN einziger Lösch-Button eine Rückfrage. Ein
// Fehlklick auf „Löschen“ in der Mitgliederliste entfernte eine Firma samt
// Kontakten, Mitgliederbeitrag, internen Notizen und Bearbeitungs-Link
// (on delete cascade) — ohne Papierkorb.
//
// Statischer Scan: ein SubmitButton, dessen pendingLabel nach Löschen,
// Entfernen, Verwerfen oder Offline-Nehmen klingt, braucht `confirm=`. Seit
// die Oberfläche übersetzt ist, steht dort meist ein Wörterbuch-Schlüssel statt
// eines deutschen Textes — beides wird erkannt.

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(__dirname, "..", "..");
const ADMIN = join(ROOT, "src", "app", "admin");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : name.endsWith(".tsx") ? [full] : [];
  });
}

const DESTRUCTIVE_KEYS = [
  "common.deleting",
  "contacts.removing",
  "admins.removing",
  "publish.discarding",
  "publish.takingOffline",
];
const DESTRUCTIVE_PENDING = new RegExp(
  String.raw`pendingLabel=(?:"[^"]*(?:gelöscht|entfernt|verworfen|offline)|\{copy\.removing\}|\{t\("(?:` +
    DESTRUCTIVE_KEYS.map((k) => k.replace(".", "\\.")).join("|") +
    String.raw`)"\)\})`,
  "i",
);

describe("Unumkehrbare Admin-Aktionen fragen nach", () => {
  const files = walk(ADMIN);

  it("jeder zerstörerische SubmitButton hat confirm=", () => {
    const offenders: string[] = [];
    let found = 0;
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      const re = /<SubmitButton\b[\s\S]*?>/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        const tag = m[0];
        if (!DESTRUCTIVE_PENDING.test(tag)) continue;
        found++;
        if (!/\bconfirm=/.test(tag)) {
          const line = src.slice(0, m.index).split("\n").length;
          offenders.push(`${relative(ROOT, file)}:${line}`);
        }
      }
    }
    // Scan greift überhaupt: Mitglied, News, Antrag, Anfrage, Admin, Kontakt,
    // Entwurf verwerfen, offline nehmen.
    expect(found).toBeGreaterThanOrEqual(8);
    expect(offenders).toEqual([]);
  });

  it("Bearbeitungs-Link widerrufen und neu erzeugen fragen nach", () => {
    const src = readFileSync(join(ADMIN, "(portal)", "members", "EditLinkPanel.tsx"), "utf8");
    expect(src).toMatch(/window\.confirm\(t\("editLink\.revokeConfirm"\)\)\)\s*run\(onRevoke\)/);
    // "Neu" bei bestehendem Link macht den verschickten Link ungültig.
    expect(src).toMatch(/window\.confirm\(t\("editLink\.newConfirm"\)\)\)\s*run\(onGenerate\)/);
  });

  it("SubmitButton bricht das Absenden ab, wenn die Rückfrage verneint wird", () => {
    const src = readFileSync(join(ROOT, "src", "components", "admin", "SubmitButton.tsx"), "utf8");
    expect(src).toMatch(/if\s*\(!window\.confirm\(confirm\)\)\s*event\.preventDefault\(\)/);
  });
});
