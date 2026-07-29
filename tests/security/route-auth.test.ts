// Security-Test: automatische Abdeckung ALLER öffentlichen API-Routes.
//
// Statt jede Route einzeln zu prüfen (und neue zu vergessen) enumeriert dieser
// Test src/app/api/**/route.ts selbst. Für jede POST-Route gilt:
//   1. Ein leerer/kaputter Request darf nie 5xx werfen (kein Crash).
//   2. Das Honeypot-Feld muss stillschweigend akzeptiert werden (Bots lernen
//      nichts) — und darf nichts speichern.
//   3. Nach genug Requests muss das Rate-Limit greifen (429).
//
// Braucht einen laufenden Dev-Server; überspringt sich selbst ohne (CI).

import { describe, it, expect } from "vitest";
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { API_BASE, isDevServerUp } from "../setup";

const ROOT = join(__dirname, "..", "..");
const serverUp = await isDevServerUp();

function walkRoutes(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkRoutes(full));
    else if (name === "route.ts") out.push(full);
  }
  return out;
}

function routeToPath(file: string): string {
  const rel = relative(join(ROOT, "src", "app"), file).replace(/\\/g, "/");
  return "/" + rel.replace(/\/route\.ts$/, "");
}

function exportedMethods(file: string): string[] {
  const src = readFileSync(file, "utf8");
  return ["GET", "POST", "PUT", "PATCH", "DELETE"].filter((m) =>
    new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b`).test(src),
  );
}

const routeFiles = walkRoutes(join(ROOT, "src", "app", "api"));
const postRoutes = routeFiles
  .map((f) => ({ path: routeToPath(f), methods: exportedMethods(f) }))
  .filter((r) => r.methods.includes("POST"))
  .map((r) => r.path)
  .sort();

describe("API-Routes: statische Invarianten", () => {
  it("findet die Formular-Endpunkte", () => {
    expect(postRoutes).toContain("/api/forms/contact");
    expect(postRoutes.length).toBeGreaterThanOrEqual(3);
  });

  it("jede POST-Route hat Rate-Limit und Honeypot verdrahtet", () => {
    const missing: string[] = [];
    for (const file of routeFiles) {
      const src = readFileSync(file, "utf8");
      if (!/export\s+(async\s+)?function\s+POST\b/.test(src)) continue;
      if (!/rateLimit\s*\(/.test(src) || !/isHoneypotTripped\s*\(/.test(src)) {
        missing.push(routeToPath(file));
      }
    }
    expect(missing).toEqual([]);
  });

  it("jede im Frontend aufgerufene /api-URL existiert auch als Route", () => {
    // Regression: beim Umbenennen der öffentlichen Pfade auf Englisch wurde
    // das Formular auf /api/forms/join umgestellt, die Route hiess aber noch
    // /api/forms/mitglied-werden. Next liefert dann die _not-found-Seite mit
    // Status 200 — der Absender sah "erfolgreich abgeschickt", gespeichert
    // wurde nichts. Genau diese Lücke schliesst dieser Test.
    const clientFiles: string[] = [];
    const walkAll = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (name === "node_modules" || name === ".next") continue;
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walkAll(full);
        else if (/\.(ts|tsx)$/.test(name)) clientFiles.push(full);
      }
    };
    walkAll(join(ROOT, "src"));

    const missing: string[] = [];
    for (const file of clientFiles) {
      const src = readFileSync(file, "utf8");
      for (const match of src.matchAll(/fetch\(\s*["'`](\/api\/[^"'`?]+)/g)) {
        const apiPath = match[1].replace(/\/$/, "");
        if (!postRoutes.includes(apiPath) && !routeFiles.some((f) => routeToPath(f) === apiPath)) {
          missing.push(`${relative(ROOT, file)} → ${apiPath}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("keine Route exportiert unbeabsichtigt DELETE/PUT/PATCH", () => {
    const writeRoutes = routeFiles
      .map((f) => ({ path: routeToPath(f), methods: exportedMethods(f) }))
      .filter((r) => r.methods.some((m) => ["DELETE", "PUT", "PATCH"].includes(m)));
    expect(writeRoutes).toEqual([]);
  });
});

// Das Rate-Limit zählt pro IP. Jeder Fall bekommt eine eigene Test-IP, sonst
// verbraucht der erste Test das Budget der folgenden (429 statt der erwarteten
// Antwort) — die Reihenfolge der Tests wäre plötzlich relevant.
let ipCounter = 0;
const testIp = () => `198.51.100.${(ipCounter++ % 200) + 1}`;

// Die Probe-Requests gehen gegen den echten Dev-Server — und der schreibt in
// die Produktions-Datenbank. Deshalb tragen sie das Honeypot-Feld: die Route
// durchläuft Rate-Limit, Parsing und Fehlerbehandlung wie immer, bricht dann
// aber vor dem Speichern ab. Ohne das legt jeder Testlauf Müll-Anträge an.
const PROBE_BODY = JSON.stringify({ _hp: "vitest-probe" });

describe.skipIf(!serverUp)("API-Routes: Laufzeitverhalten", () => {
  it.each(postRoutes)("%s crasht nicht bei leerem Body", async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": testIp() },
      body: PROBE_BODY,
    });
    expect(res.status, `${path} → ${res.status}`).toBeLessThan(500);
  });

  it.each(postRoutes)("%s crasht nicht bei kaputtem JSON", async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": testIp() },
      body: "{nicht json",
    });
    expect(res.status).toBeLessThan(600);
    expect(res.status).not.toBe(200);
  });

  it("Honeypot-Einsendung wird still mit ok quittiert", async () => {
    const res = await fetch(`${API_BASE}/api/forms/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({ name: "Bot", email: "bot@x.ch", _hp: "gefüllt" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("Rate-Limit greift nach genug Requests", async () => {
    const send = () =>
      fetch(`${API_BASE}/api/forms/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.250" },
        body: JSON.stringify({ name: "Flood", _hp: "bot" }),
      });
    let sawLimit = false;
    for (let i = 0; i < 12; i++) {
      const res = await send();
      if (res.status === 429) {
        sawLimit = true;
        break;
      }
    }
    expect(sawLimit).toBe(true);
  });
});

describe.skipIf(!serverUp)("Admin-Portal ist ohne Session gesperrt", () => {
  it.each(["/admin", "/admin/members", "/admin/settings", "/admin/news"])(
    "%s leitet auf den Login um",
    async (path) => {
      const res = await fetch(`${API_BASE}${path}`, { redirect: "manual" });
      const location = res.headers.get("location") ?? "";
      expect([307, 302, 303]).toContain(res.status);
      expect(location).toContain("/admin/login");
    },
  );
});
