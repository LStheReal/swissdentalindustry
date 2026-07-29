// getSiteUrl speist Sitemap, Canonical-Tags und E-Mail-Links. Ein localhost-
// Fallback in Produktion erzeugt tote Links in versendeten Mails.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getSiteUrl } from "@/lib/site-url";

const saved = { ...process.env };

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
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

  it("nutzt VERCEL_URL als zweite Wahl", () => {
    process.env.VERCEL_URL = "sdi-preview.vercel.app";
    expect(getSiteUrl()).toBe("https://sdi-preview.vercel.app");
  });

  it("fällt nie auf localhost zurück", () => {
    expect(getSiteUrl()).toBe("https://swissdentalindustry.ch");
    expect(getSiteUrl()).not.toContain("localhost");
  });
});
