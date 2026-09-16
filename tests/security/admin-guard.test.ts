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

function walkSources(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkSources(full));
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

/** Datei ist ein Server-Action-Modul: "use server" als erste Anweisung. */
function isServerActionModule(src: string): boolean {
  const withoutComments = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  return /^\s*["']use server["']/.test(withoutComments);
}

// Früher: nur Dateien mit dem Namen "actions.ts". Damit fiel
// (portal)/locale-actions.ts durch den Scan — eine Action-Datei mit anderem
// Namen war unsichtbar. Massgeblich ist die Direktive, nicht der Dateiname.
function walk(dir: string): string[] {
  return walkSources(dir).filter((f) => isServerActionModule(readFileSync(f, "utf8")));
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

  it("der Passwort-Reset nutzt implicit flow (funktioniert geräteübergreifend)", () => {
    // PKCE braucht einen code_verifier-Cookie im anfragenden Browser — bricht,
    // sobald die Mail auf einem anderen Gerät/Browser geöffnet wird. Regression
    // für genau diesen Bug: "PKCE code verifier not found in storage".
    const src = readFileSync(join(PORTAL, "forgot", "actions.ts"), "utf8");
    expect(src).toMatch(/flowType:\s*["']implicit["']/);
  });

  it("das Setzen des neuen Passworts braucht die Recovery-Session", () => {
    const src = readFileSync(join(PORTAL, "reset-password", "actions.ts"), "utf8");
    expect(src).toMatch(/auth\.getUser\(\)/);
    expect(src).toMatch(/auth\.updateUser\(/);
    // Kein Service-Role-Client: sonst könnte die Action fremde Konten ändern.
    expect(src).not.toMatch(/createAdminClient/);
  });

  it("findet auch Action-Dateien, die nicht actions.ts heissen", () => {
    const names = actionFiles.map((f) => relative(ROOT, f));
    expect(names).toContain("src/app/admin/(portal)/locale-actions.ts");
  });

  it("jede Route unter /admin ruft requireAdmin() in jedem Handler auf", () => {
    // Route-Handler laufen wie Server Actions NICHT durch das Portal-Layout.
    const routes = walkSources(PORTAL).filter((f) => /\/route\.ts$/.test(f));
    expect(routes.length).toBeGreaterThan(0);
    const unguarded: string[] = [];
    for (const file of routes) {
      const src = readFileSync(file, "utf8");
      const re = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        const end = src.indexOf("\n}", m.index);
        const body = src.slice(m.index, end === -1 ? undefined : end);
        if (!/requireAdmin\s*\(/.test(body)) unguarded.push(`${relative(ROOT, file)}::${m[1]}`);
      }
    }
    expect(unguarded).toEqual([]);
  });

  it("Inline-Actions in Seiten rufen nur selbst geschützte Actions auf", () => {
    // z.B. members/[id]/page.tsx: onPublish={async () => { "use server"; await publishMember(id) }}
    // Die Closure selbst hat keinen Guard — sie ist nur sicher, weil das, was
    // sie aufruft, einen hat.
    const guarded = new Set<string>();
    for (const file of actionFiles) {
      const rel = relative(ROOT, file);
      for (const { name, body } of exportedActions(readFileSync(file, "utf8"))) {
        if (!PUBLIC_ACTIONS.has(`${rel}::${name}`) && /requireAdmin\s*\(/.test(body)) {
          guarded.add(name);
        }
      }
    }

    const offenders: string[] = [];
    for (const file of walkSources(join(PORTAL, "(portal)"))) {
      const src = readFileSync(file, "utf8");
      if (isServerActionModule(src)) continue;
      const re = /["']use server["'];?/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        // Körper bis zur schliessenden Klammer derselben Ebene.
        let depth = 1;
        let i = m.index;
        while (i < src.length && depth > 0) {
          i++;
          if (src[i] === "{") depth++;
          else if (src[i] === "}") depth--;
        }
        const body = src.slice(m.index, i);
        const calls = [...body.matchAll(/await\s+(\w+)\s*\(/g)].map((c) => c[1]);
        if (calls.length === 0 || !calls.every((c) => guarded.has(c) || c === "requireAdmin")) {
          const line = src.slice(0, m.index).split("\n").length;
          offenders.push(`${relative(ROOT, file)}:${line} → ${calls.join(", ") || "(kein Aufruf)"}`);
        }
      }
    }
    expect(offenders).toEqual([]);
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
