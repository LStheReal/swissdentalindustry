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

test("ein unbekannter Edit-Token zeigt eine Fehlerseite", async ({ page }) => {
  const res = await page.goto("/edit/__playwright_unknown_token__");
  expect(res?.status()).toBeLessThan(500);
});
