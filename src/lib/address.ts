// Strukturierte Adresse: Strasse, Hausnummer, PLZ, Ort.
//
// Vorher lag die Firmenadresse als ein einziges Freitextfeld in
// `members.address`. Für Export, Serienbriefe und die Anzeige brauchen wir die
// Bestandteile einzeln — und ein Freitextfeld lässt sich nicht zuverlässig
// nachträglich zerlegen, wenn es einmal falsch erfasst wurde.
//
// Ein Land gibt es bewusst nicht mehr: der Verband ist schweizerisch, das Feld
// war in 32 von 33 Fällen "CH" und hat nur Platz gekostet.

import { internalFieldLabel, type Locale } from "./types";

export const ADDRESS_KEYS = [
  "street_name",
  "street_number",
  "postal_code",
  "city",
] as const;

export type AddressKey = (typeof ADDRESS_KEYS)[number];

export type Address = Record<AddressKey, string | null>;

export function emptyAddress(): Address {
  return { street_name: null, street_number: null, postal_code: null, city: null };
}

export function normalizeAddress(value: Partial<Address> | null | undefined): Address {
  const out = emptyAddress();
  for (const key of ADDRESS_KEYS) {
    const raw = value?.[key];
    out[key] = typeof raw === "string" && raw.trim() ? raw.trim() : null;
  }
  return out;
}

/** Hat die Adresse überhaupt einen Inhalt? */
export function hasAddress(value: Partial<Address> | null | undefined): boolean {
  const a = normalizeAddress(value);
  return ADDRESS_KEYS.some((key) => a[key]);
}

/** Beschriftung eines Adressfeldes — teilt sich das Wörterbuch mit den übrigen Feldern. */
export function addressFieldLabel(key: AddressKey, locale: Locale): string {
  return internalFieldLabel(key, locale);
}

/** Zweizeilig, wie auf einem Briefumschlag: "Strasse 12\n8000 Ort". */
export function formatAddress(value: Partial<Address> | null | undefined): string {
  const a = normalizeAddress(value);
  const street = [a.street_name, a.street_number].filter(Boolean).join(" ");
  const locality = [a.postal_code, a.city].filter(Boolean).join(" ");
  return [street, locality].filter(Boolean).join("\n");
}

/** Einzeilig — für Geocoding, Karten-Links und Tabellenzellen. */
export function formatAddressOneLine(value: Partial<Address> | null | undefined): string {
  return formatAddress(value).replace(/\n/g, ", ");
}

// Länderzeilen, die der Altbestand am Ende der Adresse führt. Sie fliegen beim
// Zerlegen raus — ein Land speichern wir nicht mehr.
const COUNTRY_LINE =
  /^(ch|che|fl|li|schweiz|suisse|svizzera|switzerland|liechtenstein)$/i;

// "8000 Zürich", "CH-2300 La Chaux-de-Fonds"
const LOCALITY = /^(?:[a-z]{2}-)?(\d{4,5})\s+(.+)$/i;

// Hausnummer am Ende der Strassenzeile: "12", "7a", "41A", "16a".
const HOUSE_NUMBER = /^(.*?)[,\s]+(\d+\s*[a-zA-Z]?)$/;

export interface ParsedAddress {
  address: Address;
  /** PLZ und Ort konnten bestimmt werden — nur dann ist die Zerlegung brauchbar. */
  parsed: boolean;
}

/**
 * Zerlegt eine gewachsene Freitext-Adresse.
 *
 * Der Bestand folgt fast durchgehend dem Muster
 *   "Strasse 12\n8000 Ort\nCH"
 * mit ein paar Ausreissern: ohne Länderzeile, mit "CH-" vor der PLZ, oder
 * alles auf einer Zeile. Alles davon wird abgedeckt.
 *
 * Wichtig: `parsed` ist nur true, wenn PLZ **und** Ort erkannt wurden. Alles
 * andere wird zur Handprüfung markiert, statt es zu verstümmeln. Eine fehlende
 * Hausnummer ist dagegen kein Fehler — es gibt Adressen ohne ("Grabetsmattweg").
 */
export function parseAddress(raw: string | null | undefined): ParsedAddress {
  const address = emptyAddress();
  const text = (raw ?? "").replace(/\r\n?/g, "\n").trim();
  if (!text) return { address, parsed: false };

  let lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !COUNTRY_LINE.test(l));

  // Alles auf einer Zeile: an der PLZ auftrennen.
  if (lines.length === 1) {
    const single = lines[0].match(/^(.*?)[,\s]+((?:[a-z]{2}-)?\d{4,5}\s+.+)$/i);
    if (single) lines = [single[1].trim(), single[2].trim()];
  }

  const localityLine = lines.length > 1 ? lines[lines.length - 1] : null;
  const locality = localityLine?.match(LOCALITY) ?? null;

  if (locality) {
    address.postal_code = locality[1];
    address.city = locality[2].trim();
    lines = lines.slice(0, -1);
  }

  const streetLine = lines.join(", ").trim();
  if (streetLine) {
    const withNumber = streetLine.match(HOUSE_NUMBER);
    if (withNumber) {
      address.street_name = withNumber[1].trim() || null;
      address.street_number = withNumber[2].replace(/\s+/g, "");
    } else {
      address.street_name = streetLine;
    }
  }

  return { address, parsed: Boolean(address.postal_code && address.city) };
}
