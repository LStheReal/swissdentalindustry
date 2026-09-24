import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { ADMIN_DICT, ADMIN_DICT_PARTS, makeT, type AdminI18nKey } from "@/lib/admin-i18n";
import { CONTACT_ROLES, LOCALES } from "@/lib/types";
import { EXPORT_FILTERS } from "@/lib/member-export";
import { MASS_MAIL_PLACEHOLDERS } from "@/lib/mass-mail";

/**
 * Das Admin-Portal war bis 2026-09-16 nur in Navigation, Dashboard und dem
 * Kontakte-Panel übersetzt — der Sprachwechsel änderte das Menü, der Rest der
 * Seite blieb Deutsch. Diese Tests halten fest, dass das Wörterbuch vollständig
 * und in sich stimmig ist, und dass keine festen Texte zurückkommen.
 */

const entries = Object.entries(ADMIN_DICT) as [AdminI18nKey, Record<string, string>][];

describe("Admin-Wörterbuch", () => {
  it("kein Schlüssel ist in zwei Bereichsdateien doppelt (würde still überschrieben)", () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    for (const [part, dict] of Object.entries(ADMIN_DICT_PARTS)) {
      for (const key of Object.keys(dict)) {
        if (seen.has(key)) duplicates.push(`${key} (${seen.get(key)} + ${part})`);
        seen.set(key, part);
      }
    }
    expect(duplicates).toEqual([]);
  });

  it("jeder Eintrag hat alle vier Sprachen, keine leer", () => {
    const missing: string[] = [];
    for (const [key, msg] of entries) {
      for (const locale of LOCALES) {
        if (!msg[locale]?.trim()) missing.push(`${key}.${locale}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("Platzhalter {name} sind in allen Sprachen dieselben", () => {
    const placeholders = (text: string) =>
      [...text.matchAll(/(?<!\{)\{(\w+)\}(?!\})/g)].map((m) => m[1]).sort().join(",");
    const mismatched: string[] = [];
    for (const [key, msg] of entries) {
      const de = placeholders(msg.de);
      for (const locale of LOCALES) {
        if (placeholders(msg[locale]) !== de) {
          mismatched.push(`${key}: de={${de}} ${locale}={${placeholders(msg[locale])}}`);
        }
      }
    }
    expect(mismatched).toEqual([]);
  });

  it("fremdsprachige Einträge sind nicht einfach der deutsche Text", () => {
    // Gleich lautende Wörter sind erlaubt (Logo, Website, Status …) — aber ein
    // ganzer Satz, der in FR/IT/EN wörtlich dem Deutschen entspricht, ist fast
    // sicher vergessen worden.
    const untranslated = entries
      .filter(([, msg]) => msg.de.split(/\s+/).length >= 4)
      .flatMap(([key, msg]) =>
        (["fr", "it", "en"] as const).filter((l) => msg[l] === msg.de).map((l) => `${key}.${l}`),
      );
    expect(untranslated).toEqual([]);
  });

  it("dynamisch zusammengesetzte Schlüssel existieren", () => {
    const dynamic = [
      ...(["text", "image", "multilingual"] as const).map((k) => `feed.kind.${k}`),
      ...(["sent", "failed", "dropped_test_mode"] as const).map((k) => `mailLog.status.${k}`),
      ...MASS_MAIL_PLACEHOLDERS.map((k) => `mail.ph.${k}`),
      ...EXPORT_FILTERS.map((k) => `export.filter.${k}`),
    ];
    expect(dynamic.filter((k) => !(k in ADMIN_DICT))).toEqual([]);
    expect(CONTACT_ROLES.length).toBeGreaterThan(0);
  });

  it("t() setzt Platzhalter ein und fällt nie in einen Absturz", () => {
    const t = makeT("fr");
    expect(t("members.since", { date: "2020" })).toBe("Depuis 2020");
    expect(t("nope.unknown" as AdminI18nKey)).toBe("nope.unknown");
    // Fehlende Variable bleibt sichtbar stehen statt "undefined".
    expect(t("members.since")).toBe("Depuis {date}");
  });
});

describe("Keine festen Texte in der Admin-Oberfläche", () => {
  const ROOT = join(__dirname, "..", "..");
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".tsx")) files.push(full);
    }
  };
  walk(join(ROOT, "src", "app", "admin"));
  walk(join(ROOT, "src", "components", "admin"));

  // Bewusste Ausnahmen: Eigennamen und Sprachnamen in ihrer eigenen Sprache.
  const ALLOWED = new Set([
    "Deutsch",
    "Français",
    "Italiano",
    "English",
    "Swiss Dental Industry",
    "SDI",
  ]);

  /** Kommentare entfernen, Zeilennummern erhalten. */
  const stripComments = (src: string) =>
    src
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, " "))
      .replace(/(^|[^:"'`])\/\/.*$/gm, (m, p: string) => p + " ".repeat(m.length - p.length));

  it("kein Wort-Text zwischen JSX-Tags und keine deutschen Beschriftungs-Attribute", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = stripComments(readFileSync(file, "utf8"));
      src.split("\n").forEach((line, index) => {
        const where = `${relative(ROOT, file)}:${index + 1}`;
        // Text zwischen > und < auf einer Zeile, z. B. <span>Speichern</span>.
        for (const m of line.matchAll(/>\s*([A-Za-zÄÖÜäöü][^<>{}]*[A-Za-zÄÖÜäöü.:?!])\s*</g)) {
          const text = m[1].trim();
          // TypeScript-Generics (Promise<void>) sehen aus wie JSX-Text.
          if (/^(Promise|Record|Partial|Array|Set|Map)$/.test(text) || /[=&|]/.test(text)) continue;
          if (!ALLOWED.has(text)) offenders.push(`${where} → ${text}`);
        }
        // Zeile, die nur aus Text besteht (mehrzeiliger JSX-Textknoten).
        if (
          /^\s+[A-ZÄÖÜ„][a-zäöüß]+(?:[ ,.–—-]+[A-Za-zÄÖÜäöüß„“]+)+[.:?!“]?\s*$/.test(line) &&
          !/^\s*(import|export|return|const|let|type|interface|case|default|await)\b/.test(line) &&
          !ALLOWED.has(line.trim())
        ) {
          offenders.push(`${where} → ${line.trim()}`);
        }
        // Beschriftungs-Attribute mit festem Text.
        for (const m of line.matchAll(
          /\b(?:title|placeholder|aria-label|pendingLabel|confirm|label)=["']([^"']*[A-Za-zÄÖÜäöü]{3,}[^"']*)["']/g,
        )) {
          if (!/^(https?:|mailto:|[\w.-]+@[\w.-]+)/.test(m[1]) && !ALLOWED.has(m[1])) {
            offenders.push(`${where} → ${m[0]}`);
          }
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});
