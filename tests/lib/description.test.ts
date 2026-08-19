import { describe, it, expect } from "vitest";
import { cleanDescription, stripDuplicatedName } from "@/lib/description";
import { emptyMultilingual } from "@/lib/types";

describe("stripDuplicatedName", () => {
  it("entfernt die doppelte Firmennennung am Anfang", () => {
    expect(
      stripDuplicatedName(
        "BPR Swiss GmbH",
        "BPR Swiss GmbH BPR Swiss GmbH ist ein weltweiter Innovationsführer.",
      ),
    ).toBe("BPR Swiss GmbH ist ein weltweiter Innovationsführer.");
  });

  it("lässt eine einzelne Nennung in Ruhe", () => {
    const text = "Edenta AG ist als Markenname für höchste Präzision bekannt.";
    expect(stripDuplicatedName("Edenta AG", text)).toBe(text);
  });

  it("kommt mit Sonderzeichen im Firmennamen klar", () => {
    expect(
      stripDuplicatedName(
        "Cendres + Métaux S.A.",
        "Cendres + Métaux S.A. Cendres + Métaux S.A. fertigt Präzisionsteile.",
      ),
    ).toBe("Cendres + Métaux S.A. fertigt Präzisionsteile.");
  });

  it("ignoriert Gross-/Kleinschreibung und Trennzeichen", () => {
    expect(stripDuplicatedName("Esro AG", "ESRO AG — Esro AG bietet Pflegeprodukte."))
      .toBe("Esro AG bietet Pflegeprodukte.");
  });

  it("verträgt mehrfache Zeilenumbrüche zwischen den Nennungen", () => {
    expect(stripDuplicatedName("Jota AG", "Jota AG\n Jota AG stellt Instrumente her."))
      .toBe("Jota AG stellt Instrumente her.");
  });

  // Die zweite Nennung darf von der ersten abweichen — genau so steht es im
  // Bestand, wo die Wiederholung die Rechtsform weglässt.
  it("erkennt eine verkürzte zweite Nennung ohne Rechtsform", () => {
    expect(
      stripDuplicatedName(
        "Ivoclar Vivadent AG",
        "Ivoclar Vivadent AG Ivoclar Vivadent zählt zu den weltweit führenden Unternehmen.",
      ),
    ).toBe("Ivoclar Vivadent zählt zu den weltweit führenden Unternehmen.");
  });

  it("gleicht Rechtsform-Schreibweisen an (S.A. vs SA)", () => {
    expect(
      stripDuplicatedName(
        "Bien-Air Dental S.A.",
        "Bien-Air Dental SA Bien-Air Dental bietet ein umfassendes Produktsortiment.",
      ),
    ).toBe("Bien-Air Dental bietet ein umfassendes Produktsortiment.");
    expect(
      stripDuplicatedName("PX Dental S.A.", "PX Dental SA PX DENTAL ist ein Unternehmen der PX GROUP."),
    ).toBe("PX DENTAL ist ein Unternehmen der PX GROUP.");
  });

  it("greift nicht, wenn nach dem Namen etwas anderes folgt", () => {
    const text = "Denteo AG entwickelt Software für Zahnarztpraxen.";
    expect(stripDuplicatedName("Denteo AG", text)).toBe(text);
    const other = "Denteo AG gehört zur Gruppe Denteo Holding.";
    expect(stripDuplicatedName("Denteo AG", other)).toBe(other);
  });

  it("verträgt leere und fehlende Werte", () => {
    expect(stripDuplicatedName(null, "irgendwas")).toBe("irgendwas");
    expect(stripDuplicatedName("Firma", null)).toBe("");
    expect(stripDuplicatedName("", "Firma Firma tut etwas.")).toBe("Firma Firma tut etwas.");
  });

  it("löst auch eine Dreifachnennung auf", () => {
    expect(stripDuplicatedName("Ergodent AG", "Ergodent AG Ergodent AG Ergodent AG liefert."))
      .toBe("Ergodent AG liefert.");
  });
});

describe("cleanDescription", () => {
  it("räumt alle vier Sprachen auf", () => {
    const ml = {
      ...emptyMultilingual(),
      de: "Esro AG Esro AG bietet Pflegeprodukte.",
      en: "Esro AG Esro AG offers care products.",
      fr: "Esro AG Esro AG propose des produits.",
      it: "Esro AG Esro AG offre prodotti.",
    };
    const out = cleanDescription("Esro AG", ml);
    expect(out.de).toBe("Esro AG bietet Pflegeprodukte.");
    expect(out.en).toBe("Esro AG offers care products.");
    expect(out.fr).toBe("Esro AG propose des produits.");
    expect(out.it).toBe("Esro AG offre prodotti.");
  });

  it("lässt saubere Beschreibungen unverändert", () => {
    const ml = { ...emptyMultilingual(), de: "Wir bauen Zahnräder." };
    expect(cleanDescription("Firma AG", ml)).toEqual(ml);
  });
});
