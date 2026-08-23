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
 * Der Bestand kennt zwei Formen derselben Ursache — eine Überschrift, die beim
 * Übernehmen der alten Inhalte vor den Fliesstext geklebt wurde:
 *
 *   A) Die Überschrift wiederholt sich wortgleich — oft in einer Kurzform des
 *      Namens ("Denteo Denteo offers …" bei "Denteo AG") oder in einer
 *      übersetzten Form ("Dentsply Sirona Schweiz Dentsply Sirona Schweiz …"
 *      bei "Dentsply Sirona Switzerland").
 *   B) Die Überschrift trägt den vollen Namen, der Fliesstext beginnt mit
 *      derselben Firma ohne Rechtsform:
 *      "PX Dental SA PX DENTAL ist ein Unternehmen …"
 *      "Ivoclar Vivadent AG Ivoclar Vivadent zählt …"
 *
 * Beide Formen werden erkannt. Verlangt wird in beiden Fällen, dass der
 * abgeschnittene Teil aus Wörtern des Firmennamens besteht — eine einzelne
 * Nennung ("Edenta AG ist als Markenname bekannt …") bleibt damit unangetastet,
 * und normale Prosa kann nicht versehentlich gekürzt werden.
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

  // Deckel gegen Dreifachnennungen und gegen jede Endlosschleife.
  for (let round = 0; round < 5; round++) {
    const tokens = tokenize(value);
    let cut = -1;

    // B) Voller Name, danach fängt die Firma noch einmal an.
    if (
      tokens.length > nameTokens.length &&
      nameTokens.every((v, i) => tokens[i]?.value === v) &&
      tokens[nameTokens.length]?.value === nameTokens[0]
    ) {
      cut = tokens[nameTokens.length].start;
    }

    // A) Ein führender Wortlauf wiederholt sich unmittelbar und wortgleich,
    //    und er beginnt mit dem ersten Wort des Firmennamens.
    //
    //    Der Lauf muss NICHT dem eingetragenen Namen entsprechen: im Bestand
    //    steht die Überschrift auch als Kurzform ("Denteo" bei "Denteo AG")
    //    oder übersetzt ("Dentsply Sirona Schweiz" bei "Dentsply Sirona
    //    Switzerland"). Die wortgleiche Wiederholung ist das Signal; der
    //    Firmenname am Anfang stellt sicher, dass wir nichts anderes kürzen.
    //
    //    Vom längsten zum kürzesten Lauf, damit "PX Dental PX Dental" nicht
    //    nach dem ersten Wort abgeschnitten wird.
    if (cut < 0 && tokens[0]?.value === nameTokens[0]) {
      const maxRun = Math.min(8, Math.floor(tokens.length / 2));
      for (let k = maxRun; k >= 1; k--) {
        const repeats = Array.from({ length: k }).every(
          (_, i) => tokens[k + i]?.value === tokens[i].value,
        );
        if (repeats) {
          cut = tokens[k].start;
          break;
        }
      }
    }

    if (cut < 0) break;
    value = value.slice(cut);
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
