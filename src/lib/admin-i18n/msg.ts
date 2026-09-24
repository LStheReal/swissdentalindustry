import type { Locale } from "../types";

/** Ein Text in allen vier Portal-Sprachen. */
export type Msg = Record<Locale, string>;

/** Kurzform für Einträge: m(de, fr, it, en) — Reihenfolge wie LOCALES. */
export function m(de: string, fr: string, it: string, en: string): Msg {
  return { de, fr, it, en };
}
