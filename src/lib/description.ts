// Schutz gegen die doppelte Firmennennung am Anfang einer Beschreibung.
//
// Im Bestand standen vier Beschreibungen als
//   "BPR Swiss GmbH BPR Swiss GmbH ist ein weltweiter Innovationsführer …"
// da — in allen vier Sprachen identisch verdoppelt.
//
// Die Ursache liegt NICHT in der Übersetzung oder im Spreadsheet-Import:
// beide fassen den Firmennamen nie an (translate.ts reicht den Text
// unverändert an Claude, member-import.ts schreibt überhaupt keine
// Beschreibung). Der Text kam schon verdoppelt herein — beim ursprünglichen
// Übernehmen der alten WordPress-Inhalte, wo die Firmenüberschrift und der
// Fliesstext zusammengeklebt wurden. Ab da hat die Pipeline die Verdopplung
// nur noch treu weitergereicht und in alle vier Sprachen übersetzt.
//
// Deshalb sitzt die Reparatur hier, an der Schreibstelle: egal ob eine
// Beschreibung aus dem Antrag, dem Admin-Formular, dem Self-Service oder einem
// erneuten Import kommt — die Verdopplung wird entfernt, bevor sie gespeichert
// wird. Der Fehler kann damit nicht wieder auftauchen, auch nicht wenn die
// Texte neu übersetzt oder neu importiert werden.

import { LOCALES, type Multilingual } from "./types";

/** Escaped den Namen für einen Regex und macht Whitespace tolerant. */
function namePattern(name: string): string {
  return name
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
}

/**
 * Entfernt eine führende Doppelnennung des Firmennamens.
 *
 * Nur die *Verdopplung* fliegt raus. Eine einzelne Nennung am Anfang
 * ("Edenta AG ist als Markenname bekannt …") ist normale Prosa und bleibt
 * unangetastet — sonst würde die Reparatur mehr kaputt machen als sie heilt.
 */
export function stripDuplicatedName(
  name: string | null | undefined,
  text: string | null | undefined,
): string {
  const value = text ?? "";
  const company = (name ?? "").trim();
  if (!company || !value.trim()) return value;

  const escaped = namePattern(company);
  // Erste Nennung nur dann wegschneiden, wenn direkt danach dieselbe Nennung
  // wieder anfängt. Trennzeichen dazwischen (Bindestrich, Doppelpunkt, Komma)
  // sind erlaubt.
  const duplicate = new RegExp(`^\\s*${escaped}\\s*[-–—:,.]?\\s*(?=${escaped})`, "i");

  let out = value;
  // Dreifachnennungen gab es nicht, aber eine Schleife mit Deckel ist billiger
  // als die Annahme, dass es sie nie geben wird.
  for (let i = 0; i < 5 && duplicate.test(out); i++) {
    out = out.replace(duplicate, "");
  }
  return out.trimStart();
}

/** Wendet den Schutz auf alle vier Sprachslots an. */
export function cleanDescription(
  name: string | null | undefined,
  ml: Multilingual,
): Multilingual {
  const out = { ...ml };
  for (const locale of LOCALES) {
    out[locale] = stripDuplicatedName(name, out[locale]);
  }
  return out;
}
