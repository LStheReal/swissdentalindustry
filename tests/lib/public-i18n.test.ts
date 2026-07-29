// Sprach-Routing: Englisch lebt ohne Präfix ("/"), de/fr/it unter "/de" etc.
// Ein Fehler hier bricht Canonical-/hreflang-Tags und damit SEO.

import { describe, it, expect } from "vitest";
import {
  formatDate,
  getLocaleFromPath,
  isLocale,
  localeAlternates,
  stripLocaleFromPath,
  withLocalePath,
} from "@/lib/public-i18n";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/types";

describe("isLocale / getLocaleFromPath", () => {
  it("erkennt die vier unterstützten Sprachen", () => {
    for (const l of LOCALES) expect(isLocale(l)).toBe(true);
    expect(isLocale("es")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("liest die Sprache aus dem Pfad, sonst Default", () => {
    expect(getLocaleFromPath("/de/mitglieder")).toBe("de");
    expect(getLocaleFromPath("/mitglieder")).toBe(DEFAULT_LOCALE);
    expect(getLocaleFromPath("/")).toBe(DEFAULT_LOCALE);
  });
});

describe("stripLocaleFromPath", () => {
  it("entfernt nur ein führendes Sprachsegment", () => {
    expect(stripLocaleFromPath("/de/mitglieder")).toBe("/mitglieder");
    expect(stripLocaleFromPath("/mitglieder")).toBe("/mitglieder");
    expect(stripLocaleFromPath("/de")).toBe("/");
    expect(stripLocaleFromPath("/")).toBe("/");
  });
});

describe("withLocalePath", () => {
  it("präfixt nicht-Default-Sprachen und lässt Default präfixlos", () => {
    expect(withLocalePath("/mitglieder", "de")).toBe("/de/mitglieder");
    expect(withLocalePath("/mitglieder", DEFAULT_LOCALE)).toBe("/mitglieder");
    expect(withLocalePath("/", "fr")).toBe("/fr");
    expect(withLocalePath("/", DEFAULT_LOCALE)).toBe("/");
  });

  it("wechselt die Sprache eines bereits präfixten Pfads", () => {
    expect(withLocalePath("/de/mitglieder", "it")).toBe("/it/mitglieder");
    expect(withLocalePath("/de/mitglieder", DEFAULT_LOCALE)).toBe("/mitglieder");
  });

  it("erhält Query und Hash", () => {
    expect(withLocalePath("/verband?x=1#team", "fr")).toBe("/fr/verband?x=1#team");
    expect(withLocalePath("/verband#membership-benefits", DEFAULT_LOCALE)).toBe(
      "/verband#membership-benefits",
    );
  });

  it("lässt externe Links unangetastet", () => {
    for (const href of ["https://x.ch", "mailto:a@b.ch", "tel:+41"]) {
      expect(withLocalePath(href, "de")).toBe(href);
    }
  });
});

describe("localeAlternates", () => {
  it("liefert canonical + alle Sprachen + x-default", () => {
    const alt = localeAlternates("/mitglieder", "de");
    expect(alt.canonical).toBe("/de/mitglieder");
    expect(alt.languages).toMatchObject({
      de: "/de/mitglieder",
      fr: "/fr/mitglieder",
      it: "/it/mitglieder",
      en: "/mitglieder",
      "x-default": "/mitglieder",
    });
  });

  it("x-default zeigt immer auf die Default-Sprache", () => {
    for (const l of LOCALES) {
      expect(localeAlternates("/news", l).languages["x-default"]).toBe("/news");
    }
  });
});

describe("formatDate", () => {
  it("formatiert pro Sprache und toleriert null", () => {
    expect(formatDate(null, "de")).toBe("");
    const de = formatDate("2026-03-05", "de");
    const en = formatDate("2026-03-05", "en");
    expect(de).toMatch(/2026/);
    expect(en).toMatch(/2026/);
    expect(de).toMatch(/^05/);
  });
});
