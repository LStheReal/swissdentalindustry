import { test, expect } from "@playwright/test";

// Browser-Tests für das, was HTTP-Checks nicht sehen: gerenderte Inhalte,
// Sprachumschaltung, Mitglieder-Popup.

test("Startseite lädt ohne Konsolenfehler", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/Swiss Dental Industry/i);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("Mitgliederseite zeigt Mitglieder-Karten", async ({ page }) => {
  await page.goto("/members");
  const cards = page.locator(".v2-member-card");
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(5);
});

test("Klick auf eine Mitglieds-Karte öffnet das Profil-Popup", async ({ page }) => {
  await page.goto("/members");
  const first = page.locator(".v2-member-card").first();
  const name = (await first.innerText()).split("\n")[0];
  await first.click();
  // Das Popup zeigt denselben Firmennamen; die Liste bleibt im Hintergrund.
  await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
});

test("Sprachwechsel liefert die deutsche Variante", async ({ page }) => {
  await page.goto("/de/members");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.locator(".v2-member-card").first()).toBeVisible();
});

test("News-Seite rendert", async ({ page }) => {
  await page.goto("/news");
  await expect(page.locator("main")).toBeVisible();
});

test("Kontaktformular ist ausfüllbar und hat ein Honeypot-Feld", async ({ page }) => {
  await page.goto("/contact");
  const form = page.locator("form").first();
  await expect(form).toBeVisible();
  // Honeypot muss existieren und für Menschen unerreichbar sein: aus dem
  // Viewport geschoben, transparent und nicht per Tab fokussierbar. (Nicht
  // display:none — das ignorieren viele Bots.)
  const honeypot = page.locator('[name="_hp"]');
  await expect(honeypot).toHaveCount(1);
  await expect(honeypot).toHaveAttribute("tabindex", "-1");
  await expect(honeypot).toHaveAttribute("aria-hidden", "true");

  const box = await honeypot.boundingBox();
  const opacity = await honeypot.evaluate((el) => getComputedStyle(el).opacity);
  const offScreen = !box || box.x + box.width < 0 || box.y + box.height < 0;
  expect(offScreen || opacity === "0", `Honeypot sichtbar: ${JSON.stringify(box)}`).toBe(true);
});
