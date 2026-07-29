// Prod-Smoke gegen das echte Deployment: erreichbar, kein 5xx, und die
// Inhalte werden tatsächlich gerendert (fängt "Seite lädt, aber leer" ab —
// genau der Zustand, den ein pausiertes Supabase-Projekt erzeugt).
//
// URL über TEST_PROD_URL überschreibbar, mit "" deaktivierbar.

import { describe, it, expect } from "vitest";
import { PROD_URL } from "../setup";

const enabled = Boolean(PROD_URL);

async function get(path: string) {
  const res = await fetch(`${PROD_URL}${path}`, {
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  return { status: res.status, ct: res.headers.get("content-type") ?? "", body: await res.text() };
}

describe.skipIf(!enabled)("Prod-Smoke: öffentliche Seiten", () => {
  it.each(["/", "/mitglieder", "/news", "/verband", "/kontakt", "/mitglied-werden"])(
    "%s rendert HTML ohne 5xx",
    async (path) => {
      const r = await get(path);
      expect(r.status, `${path} → ${r.status}`).toBeLessThan(500);
      expect(r.status).toBe(200);
      expect(r.ct).toMatch(/html/i);
    },
  );

  it.each(["/de/mitglieder", "/fr/mitglieder", "/it/mitglieder"])(
    "%s liefert die übersetzte Variante",
    async (path) => {
      const r = await get(path);
      expect(r.status).toBe(200);
      expect(r.body).toMatch(/<html[^>]+lang="(de|fr|it)"/);
    },
  );

  it("die Mitgliederseite zeigt echte Mitglieder", async () => {
    const r = await get("/mitglieder");
    // Kein Mitgliedsname im HTML = DB weg, RLS kaputt oder Fetch fehlgeschlagen.
    expect(r.body).toMatch(/Bien-Air|Axis Dental|Coltène|Nobel Biocare|Straumann/i);
  });

  it("liefert Sitemap und robots.txt", async () => {
    const sitemap = await get("/sitemap.xml");
    expect(sitemap.status).toBe(200);
    expect(sitemap.body).toContain("<urlset");

    const robots = await get("/robots.txt");
    expect(robots.status).toBe(200);
  });

  it("setzt Security-Header", async () => {
    const res = await fetch(`${PROD_URL}/`, { redirect: "follow" });
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("referrer-policy")).toBeTruthy();
    expect(res.headers.get("x-frame-options") ?? "").toMatch(/DENY|SAMEORIGIN/i);
  });
});

describe.skipIf(!enabled)("Prod-Smoke: Admin und Self-Service", () => {
  it("der Admin-Login ist erreichbar", async () => {
    const r = await get("/admin/login");
    expect(r.status).toBe(200);
    expect(r.ct).toMatch(/html/i);
  });

  it("das Portal ist ohne Session gesperrt", async () => {
    const res = await fetch(`${PROD_URL}/admin/members`, { redirect: "manual" });
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location") ?? "").toContain("/admin/login");
  });

  it("ein unbekannter Edit-Token zeigt eine Fehlerseite statt 5xx", async () => {
    const r = await get("/edit/__vitest_unknown_token__");
    expect(r.status).toBeLessThan(500);
  });

  it("robots.txt sperrt Admin, API und Edit-Links für Crawler", async () => {
    const r = await get("/robots.txt");
    for (const path of ["/admin/", "/api/", "/edit/"]) {
      expect(r.body, `robots.txt ohne ${path}`).toContain(`Disallow: ${path}`);
    }
  });
});
