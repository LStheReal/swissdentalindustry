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

/**
 * Zerlegt einen Text in vergleichbare Tokens und merkt sich, wo jedes im
 * Original anfängt.
 *
 * Satzzeichen INNERHALB eines Namens werden übersprungen statt getrennt:
 * "S.A." und "SA" sowie "Bien-Air" und "BienAir" müssen als dasselbe gelten,
 * sonst greift der Filter genau bei den Firmen nicht, die eine Rechtsform im
 * Namen führen.
 */
function tokenize(text: string): { value: string; start: number }[] {
  const out: { value: string; start: number }[] = [];
  let current = "";
  let start = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/[\p{L}\p{N}]/u.test(ch)) {
      if (start < 0) start = i;
      current += ch.toLowerCase();
    } else if (/[.\-&'\u2019]/.test(ch)) {
      // Bindestrich/Punkt/Apostroph im Namen: Token offen lassen.
      continue;
    } else {
      if (current) out.push({ value: current, start });
      current = "";
      start = -1;
    }
  }
  if (current) out.push({ value: current, start });
  return out;
}

/**
 * Entfernt eine führende Doppelnennung des Firmennamens.
 *
 * Erkannt wird das Muster "<Firmenname><Firmenname…>" am Textanfang — also
 * die alte Überschrift, die beim Übernehmen der Inhalte vor den Fliesstext
 * geklebt wurde. Die zweite Nennung darf dabei abweichen: der Bestand enthält
 * "PX Dental SA PX DENTAL ist …" und "Ivoclar Vivadent AG Ivoclar Vivadent
 * zählt …", wo die Wiederholung die Rechtsform weglässt. Verlangt wird
 * deshalb: der Text beginnt mit dem vollständigen Namen, und direkt danach
 * beginnt er noch einmal mit dessen erstem Wort.
 *
 * Eine einzelne Nennung am Anfang ("Edenta AG ist als Markenname bekannt …")
 * ist normale Prosa und bleibt unangetastet — sonst würde die Reparatur mehr
 * kaputt machen als sie heilt.
 */
export function stripDuplicatedName(
  name: string | null | undefined,
  text: string | null | undefined,
): string {
  let value = text ?? "";
  const company = (name ?? "").trim();
  if (!company || !value.trim()) return value;

  const nameTokens = tokenize(company).map((t) => t.value);
  if (!nameTokens.length) return value;

  // Dreifachnennungen gab es nicht, aber eine Schleife mit Deckel ist billiger
  // als die Annahme, dass es sie nie geben wird.
  for (let round = 0; round < 5; round++) {
    const textTokens = tokenize(value);
    if (textTokens.length <= nameTokens.length) break;

    const startsWithName = nameTokens.every((t, i) => textTokens[i]?.value === t);
    if (!startsWithName) break;

    const next = textTokens[nameTokens.length];
    if (!next || next.value !== nameTokens[0]) break;

    value = value.slice(next.start);
  }

  return value.trimStart();
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
