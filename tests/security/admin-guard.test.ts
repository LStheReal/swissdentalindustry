// Security-Test: jede Server-Action im Admin-Portal muss selbst requireAdmin()
// aufrufen.
//
// Warum nicht auf das Layout verlassen: ein Layout schützt nur das Rendern der
// Seite. Server Actions sind eigene POST-Endpunkte, die Next.js unter einer
// generierten Action-ID exponiert — die laufen NICHT durch das Layout. Ohne
// eigenen Guard könnte jeder Besucher mit der Action-ID Mitglieder anlegen,
// ändern oder löschen.
//
// Statischer Scan über die Funktionskörper — neue ungeschützte Action → rot.

import { describe, it, expect } from "vitest";
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(__dirname, "..", "..");
const PORTAL = join(ROOT, "src", "app", "admin");

// Bewusste Ausnahmen — jede hier ist eine begründete Entscheidung.
const PUBLIC_ACTIONS = new Set<string>([
  "src/app/admin/login/actions.ts::login", // der Login selbst (vor der Session)
  "src/app/admin/login/actions.ts::logout", // Abmelden braucht keine Admin-Rolle
  // Eingeladene Person setzt ihr erstes Passwort: läuft in der Invite-Session
  // (getUser() erforderlich) und ändert ausschliesslich das eigene Passwort —
  // requireAdmin() wäre hier unmöglich, die Person ist noch kein Admin.
  "src/app/admin/accept-invite/actions.ts::setInvitedPassword",
  // Passwort-Reset anfordern: naturgemäss ohne Session. Selbst rate-limited
  // und anti-enumerierend (Antwort immer gleich).
  "src/app/admin/forgot/actions.ts::requestPasswordReset",
  // Neues Passwort setzen: läuft in der Recovery-Session aus dem Mail-Link
  // (getUser() erforderlich) und ändert nur das eigene Konto.
  "src/app/admin/reset-password/actions.ts::setNewPassword",
]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name === "actions.ts") out.push(full);
  }
  return out;
}

/** Grobe, aber ausreichende Zerlegung: Top-Level-Funktionen enden auf "\n}". */
function exportedActions(src: string): { name: string; body: string }[] {
  const out: { name: string; body: string }[] = [];
  const re = /export\s+async\s+function\s+(\w+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(src))) {
    const start = match.index;
    const end = src.indexOf("\n}", start);
    out.push({ name: match[1], body: src.slice(start, end === -1 ? undefined : end) });
  }
  return out;
}

const actionFiles = walk(PORTAL);

describe("Admin Server Actions sind auth-geschützt", () => {
  it("findet überhaupt Action-Dateien (Scan greift)", () => {
    expect(actionFiles.length).toBeGreaterThan(0);
  });

  it("ruft in jeder exportierten Action requireAdmin() auf", () => {
    const unguarded: string[] = [];
    for (const file of actionFiles) {
      const rel = relative(ROOT, file);
      const src = readFileSync(file, "utf8");
      for (const { name, body } of exportedActions(src)) {
        const id = `${rel}::${name}`;
        if (PUBLIC_ACTIONS.has(id)) continue;
        if (!/requireAdmin\s*\(/.test(body)) unguarded.push(id);
      }
    }
    expect(unguarded).toEqual([]);
  });

  it("die Invite-Action fordert eine bestehende Session und ändert nur das eigene Passwort", () => {
    const src = readFileSync(join(PORTAL, "accept-invite", "actions.ts"), "utf8");
    expect(src).toMatch(/auth\.getUser\(\)/);
    expect(src).toMatch(/auth\.updateUser\(/);
    // Kein Service-Role-Client: sonst könnte die Action fremde Konten ändern.
    expect(src).not.toMatch(/createAdminClient/);
  });

  it("der Passwort-Reset verrät nicht, welche Adressen existieren", () => {
    const src = readFileSync(join(PORTAL, "forgot", "actions.ts"), "utf8");
    // Rate-Limit pro IP und pro Adresse, und kein Zweig, der bei unbekannter
    // Adresse etwas anderes zurückgibt als bei bekannter.
    expect(src).toMatch(/rateLimit\(`forgot:ip:/);
    expect(src).toMatch(/rateLimit\(`forgot:mail:/);
    expect(src).not.toMatch(/user (not found|existiert nicht)/i);
    expect(src).not.toMatch(/createAdminClient/);
  });

  it("das Setzen des neuen Passworts braucht die Recovery-Session", () => {
    const src = readFileSync(join(PORTAL, "reset-password", "actions.ts"), "utf8");
    expect(src).toMatch(/auth\.getUser\(\)/);
    expect(src).toMatch(/auth\.updateUser\(/);
    // Kein Service-Role-Client: sonst könnte die Action fremde Konten ändern.
    expect(src).not.toMatch(/createAdminClient/);
  });

  it("schützt das Portal-Layout zusätzlich", () => {
    const layout = readFileSync(
      join(PORTAL, "(portal)", "layout.tsx"),
      "utf8",
    );
    expect(layout).toMatch(/requireAdmin\s*\(/);
  });
});

describe("Self-Service-Actions (/edit/[token]) schreiben keine Live-Daten", () => {
  // Der Token-Flow darf nur Änderungsvorschläge erzeugen, nie direkt die
  // members-Tabelle aktualisieren — Freigabe passiert im Admin-Review.
  it("schreibt nur in member_change_requests", () => {
    const src = readFileSync(join(ROOT, "src", "app", "edit", "[token]", "actions.ts"), "utf8");
    const writesToMembers = /from\("members"\)[\s\S]{0,120}\.(update|insert|delete|upsert)\(/.test(
      src,
    );
    expect(writesToMembers).toBe(false);
    expect(src).toMatch(/member_change_requests/);
  });
});
