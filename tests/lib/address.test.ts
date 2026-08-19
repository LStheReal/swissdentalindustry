import { describe, it, expect } from "vitest";
import {
  emptyAddress,
  formatAddress,
  formatAddressOneLine,
  hasAddress,
  normalizeAddress,
  parseAddress,
} from "@/lib/address";

describe("parseAddress", () => {
  it("zerlegt das Standardmuster Strasse / PLZ Ort / Land", () => {
    const { address, parsed } = parseAddress("Weststrasse 16\r\n3672 Oberdiessbach\r\nCH");
    expect(parsed).toBe(true);
    expect(address).toEqual({
      street_name: "Weststrasse",
      street_number: "16",
      postal_code: "3672",
      city: "Oberdiessbach",
    });
  });

  it("kommt ohne Länderzeile aus", () => {
    const { address, parsed } = parseAddress("Route de Frontenex 41A\r\n1207 Genève");
    expect(parsed).toBe(true);
    expect(address.street_number).toBe("41A");
    expect(address.city).toBe("Genève");
  });

  it("versteht ein CH-Präfix vor der PLZ", () => {
    const { address, parsed } = parseAddress("Rue Jardinière 153\r\nCH-2300 La Chaux-de-Fonds");
    expect(parsed).toBe(true);
    expect(address.postal_code).toBe("2300");
    expect(address.city).toBe("La Chaux-de-Fonds");
    expect(address.street_number).toBe("153");
  });

  it("trennt auch eine einzeilige Adresse auf", () => {
    const { address, parsed } = parseAddress("Rebhalde 16 8903 Birmensdorf");
    expect(parsed).toBe(true);
    expect(address).toEqual({
      street_name: "Rebhalde",
      street_number: "16",
      postal_code: "8903",
      city: "Birmensdorf",
    });
  });

  it("behält Kommas in der Strasse und findet die Hausnummer trotzdem", () => {
    const { address } = parseAddress("Y-PARC Technopole, Av. Sciences 11\r\n1400 Yverdon\r\nCH");
    expect(address.street_name).toBe("Y-PARC Technopole, Av. Sciences");
    expect(address.street_number).toBe("11");
  });

  it("akzeptiert eine Strasse ohne Hausnummer", () => {
    const { address, parsed } = parseAddress("Grabetsmattweg\r\n4106 Therwil\r\nCH");
    expect(parsed).toBe(true);
    expect(address.street_name).toBe("Grabetsmattweg");
    expect(address.street_number).toBeNull();
  });

  it("erkennt Buchstabenzusätze an der Hausnummer", () => {
    expect(parseAddress("Frankenstrasse 7a\n6003 Luzern").address.street_number).toBe("7a");
    expect(parseAddress("Champs-Montants 16a\n2074 Marin").address.street_number).toBe("16a");
  });

  it("markiert Unzerlegbares statt es zu verstümmeln", () => {
    for (const raw of ["", null, undefined, "Postfach", "irgendein Freitext ohne PLZ"]) {
      expect(parseAddress(raw).parsed).toBe(false);
    }
  });

  it("verwirft keine Ortsnamen mit Ziffern in der Strasse", () => {
    const { address } = parseAddress("Crêt-du-Locle 4\n2304 La Chaux-De-Fond\nCH");
    expect(address.street_name).toBe("Crêt-du-Locle");
    expect(address.street_number).toBe("4");
    expect(address.city).toBe("La Chaux-De-Fond");
  });
});

describe("formatAddress", () => {
  it("baut die Briefform aus den Teilen", () => {
    expect(
      formatAddress({
        street_name: "Weststrasse",
        street_number: "16",
        postal_code: "3672",
        city: "Oberdiessbach",
      }),
    ).toBe("Weststrasse 16\n3672 Oberdiessbach");
  });

  it("lässt fehlende Teile weg, ohne Lücken zu hinterlassen", () => {
    expect(formatAddress({ street_name: "Grabetsmattweg", postal_code: "4106", city: "Therwil" }))
      .toBe("Grabetsmattweg\n4106 Therwil");
    expect(formatAddress({ city: "Zürich" })).toBe("Zürich");
    expect(formatAddress(emptyAddress())).toBe("");
    expect(formatAddress(null)).toBe("");
  });

  it("liefert einzeilig für Geocoding und Tabellen", () => {
    expect(
      formatAddressOneLine({
        street_name: "Weststrasse",
        street_number: "16",
        postal_code: "3672",
        city: "Oberdiessbach",
      }),
    ).toBe("Weststrasse 16, 3672 Oberdiessbach");
  });
});

describe("normalizeAddress / hasAddress", () => {
  it("trimmt und macht Leerstrings zu null", () => {
    const out = normalizeAddress({ street_name: "  Weststrasse ", city: "   " });
    expect(out.street_name).toBe("Weststrasse");
    expect(out.city).toBeNull();
  });

  it("ignoriert unbekannte Felder", () => {
    const out = normalizeAddress({ street_name: "A", country: "CH" } as never);
    expect(Object.keys(out).sort()).toEqual(["city", "postal_code", "street_name", "street_number"]);
  });

  it("erkennt leere Adressen", () => {
    expect(hasAddress(null)).toBe(false);
    expect(hasAddress(emptyAddress())).toBe(false);
    expect(hasAddress({ city: "Bern" })).toBe(true);
  });
});
