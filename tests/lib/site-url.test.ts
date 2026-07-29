// getSiteUrl speist Sitemap, Canonical-Tags und E-Mail-Links. Ein localhost-
// Fallback in Produktion erzeugt tote Links in versendeten Mails.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getSiteUrl } from "@/lib/site-url";

const saved = { ...process.env };

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.VERCEL_URL;
});
afterEach(() => {
  process.env = { ...saved };
});

describe("getSiteUrl", () => {
  it("bevorzugt NEXT_PUBLIC_SITE_URL und entfernt den Slash am Ende", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://swissdentalindustry.ch/";
    expect(getSiteUrl()).toBe("https://swissdentalindustry.ch");
  });

  it("akzeptiert auch NEXT_PUBLIC_APP_URL (den Namen, der auf Vercel gesetzt ist)", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://sdi.vercel.app/";
    expect(getSiteUrl()).toBe("https://sdi.vercel.app");
  });

  it("bevorzugt eine konfigurierte URL vor VERCEL_URL", () => {
    // VERCEL_URL ist die Hostname PRO DEPLOYMENT und ändert sich ständig —
    // als Redirect-Ziel für den Passwort-Reset unbrauchbar.
    process.env.NEXT_PUBLIC_APP_URL = "https://sdi.vercel.app";
    process.env.VERCEL_URL = "sdi-abc123-xyz.vercel.app";
    expect(getSiteUrl()).toBe("https://sdi.vercel.app");
  });

  it("nutzt VERCEL_URL als zweite Wahl", () => {
    process.env.VERCEL_URL = "sdi-preview.vercel.app";
    expect(getSiteUrl()).toBe("https://sdi-preview.vercel.app");
  });

  it("fällt nie auf localhost zurück", () => {
    expect(getSiteUrl()).toBe("https://swissdentalindustry.ch");
    expect(getSiteUrl()).not.toContain("localhost");
  });
});
