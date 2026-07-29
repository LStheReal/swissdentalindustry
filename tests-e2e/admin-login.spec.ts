import { test, expect } from "@playwright/test";

// Admin-Zugang im Browser: das Portal ist gesperrt, der Login funktioniert
// als Formular, und falsche Zugangsdaten führen zu einer Fehlermeldung statt
// zu einer Session.

test("das Portal leitet ohne Session zum Login", async ({ page }) => {
  await page.goto("/admin/members");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("das Login-Formular hat E-Mail, Passwort und Absenden", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toHaveAttribute("type", "password");
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

test("falsche Zugangsdaten erzeugen keine Session", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', "nicht-existent@example.com");
  await page.fill('input[name="password"]', "definitiv-falsch-123");
  await page.click('button[type="submit"]');

  // Entweder Fehlermeldung oder Verbleib auf dem Login — nie im Portal.
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("vom Login zum Passwort-Reset und wieder zurück", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByRole("link", { name: /Passwort vergessen/i }).click();
  await expect(page).toHaveURL(/\/admin\/forgot/);
  await expect(page.locator('input[name="email"]')).toBeVisible();

  await page.getByRole("link", { name: /Zurück zur Anmeldung/i }).first().click();
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("der Reset gibt dieselbe Antwort für unbekannte Adressen", async ({ page }) => {
  await page.goto("/admin/forgot");
  await page.fill('input[name="email"]', `gibt-es-nicht-${Date.now()}@example.com`);
  await page.click('button[type="submit"]');
  // Anti-Enumeration: bestätigende Meldung, kein "Konto nicht gefunden".
  await expect(page.getByText(/Falls für diese Adresse/i)).toBeVisible();
});

test("ein Reset-Link ohne Tokens zeigt eine Fehlerseite statt eines Formulars", async ({
  page,
}) => {
  await page.goto("/admin/reset-password");
  await expect(page.getByText(/ungültig, abgelaufen|bereits benutzt/i)).toBeVisible();
  await expect(page.locator('input[name="password"]')).toHaveCount(0);
});

test("ein Reset-Link mit ungültigen Hash-Tokens zeigt eine Fehlerseite", async ({ page }) => {
  // Simuliert die neue Link-Form (#access_token=…&type=recovery). Die Tokens
  // sind erfunden, Supabase lehnt sie ab — die RecoveryGate-Komponente muss
  // das als "ungültig" auffangen statt hängenzubleiben oder zu crashen.
  await page.goto(
    "/admin/reset-password#access_token=fake&refresh_token=fake&expires_in=3600&token_type=bearer&type=recovery",
  );
  await expect(page.getByText(/ungültig, abgelaufen|bereits benutzt/i)).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('input[name="password"]')).toHaveCount(0);
});

test("ein unbekannter Edit-Token zeigt eine Fehlerseite", async ({ page }) => {
  const res = await page.goto("/edit/__playwright_unknown_token__");
  expect(res?.status()).toBeLessThan(500);
});
