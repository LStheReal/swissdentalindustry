import { defineConfig } from "@playwright/test";
import { readFileSync } from "node:fs";

// Playwright lädt .env.local nicht automatisch.
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* keine .env.local — Env kann bereits gesetzt sein */
}

// Browser-Tests für das, was die HTTP-Suiten nicht abdecken: gerenderte
// Inhalte, Sprachumschalter, Mitglieder-Popup, Login-Formular.
//
// Voraussetzung: Dev-Server auf :3000 (npm run dev) oder APP_URL setzen.
export default defineConfig({
  testDir: "./tests-e2e",
  fullyParallel: true,
  workers: 2,
  timeout: 30_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.APP_URL ?? "http://localhost:3000",
    channel: "chromium",
    headless: true,
    launchOptions: { args: ["--no-sandbox"] },
  },
});
