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
  it.each(["/", "/members", "/news", "/about", "/contact", "/join"])(
    "%s rendert HTML ohne 5xx",
    async (path) => {
      const r = await get(path);
      expect(r.status, `${path} → ${r.status}`).toBeLessThan(500);
      expect(r.status).toBe(200);
      expect(r.ct).toMatch(/html/i);
    },
  );

  it.each(["/de/members", "/fr/members", "/it/members"])(
    "%s liefert die übersetzte Variante",
    async (path) => {
      const r = await get(path);
      expect(r.status).toBe(200);
      expect(r.body).toMatch(/<html[^>]+lang="(de|fr|it)"/);
    },
  );

  it("die Mitgliederseite zeigt echte Mitglieder", async () => {
    const r = await get("/members");
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

  // Ein GET auf eine reine POST-Route muss 405 liefern. Ein 5xx heisst: das
  // Modul der Route lässt sich gar nicht erst laden. So war es 2026-09-16 bei
  // /api/forms/join — sharp fand auf Vercel seine native Bibliothek nicht
  // (siehe tests/meta/sharp-native-deploy.test.ts). Derselbe Ladefehler legte
  // das Admin-Portal lahm, ist dort aber ohne Session nicht sichtbar, weil der
  // Proxy vorher auf den Login umleitet. Diese Route ist der sessionfreie
  // Kanarienvogel dafür.
  it.each(["/api/forms/join", "/api/forms/contact"])(
    "%s lässt sich laden (GET → 405 statt 5xx)",
    async (path) => {
      const res = await fetch(`${PROD_URL}${path}`, {
        redirect: "manual",
        signal: AbortSignal.timeout(20_000),
      });
      expect(res.status, `${path} → ${res.status}`).toBe(405);
    },
  );

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
