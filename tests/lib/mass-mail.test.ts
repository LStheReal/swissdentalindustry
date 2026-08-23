import { describe, it, expect } from "vitest";
import {
  MASS_MAIL_PLACEHOLDERS,
  placeholderToken,
  recipientsWithGaps,
  renderMassMailHtml,
  renderMassMailText,
  unknownPlaceholders,
  type MassMailRecipient,
} from "@/lib/mass-mail";

function recipient(overrides: Partial<MassMailRecipient> = {}): MassMailRecipient {
  return {
    memberId: "m1",
    company: "Denteo AG",
    email: "loic@denteo.com",
    firstName: "Loïc",
    lastName: "Muster",
    editUrl: "https://example.ch/edit/abc123",
    ...overrides,
  };
}

describe("Serienmail-Platzhalter", () => {
  it("ersetzt alle vier Platzhalter", () => {
    const text = "Hallo {{first_name}} {{last_name}} von {{company}}: {{edit_link}}";
    expect(renderMassMailText(text, recipient())).toBe(
      "Hallo Loïc Muster von Denteo AG: https://example.ch/edit/abc123",
    );
  });

  it("ersetzt mehrfach vorkommende Platzhalter", () => {
    expect(renderMassMailText("{{company}} — {{company}}", recipient())).toBe(
      "Denteo AG — Denteo AG",
    );
  });

  it("lässt unbekannte Platzhalter stehen, statt sie zu verschlucken", () => {
    const text = "Hallo {{vorname}}";
    expect(renderMassMailText(text, recipient())).toBe("Hallo {{vorname}}");
    expect(unknownPlaceholders(text)).toEqual(["{{vorname}}"]);
  });

  it("meldet keine falschen Unbekannten für gültige Platzhalter", () => {
    const text = MASS_MAIL_PLACEHOLDERS.map(placeholderToken).join(" ");
    expect(unknownPlaceholders(text)).toEqual([]);
  });

  it("escaped HTML aus dem Text und aus den Werten", () => {
    const html = renderMassMailHtml("<b>{{company}}</b>", recipient({ company: "A & <B>" }));
    expect(html).toContain("&lt;b&gt;");
    expect(html).toContain("A &amp; &lt;B&gt;");
    expect(html).not.toContain("<b>");
  });

  it("macht aus dem Bearbeitungs-Link einen echten Link", () => {
    const html = renderMassMailHtml("{{edit_link}}", recipient());
    expect(html).toContain('href="https://example.ch/edit/abc123"');
  });

  it("übersetzt Zeilenumbrüche in <br>", () => {
    expect(renderMassMailHtml("a\nb", recipient())).toBe("a<br>b");
  });

  it("findet Empfänger, bei denen ein benutzter Platzhalter leer bliebe", () => {
    const gaps = recipientsWithGaps("Hallo {{first_name}}", [
      recipient(),
      recipient({ memberId: "m2", company: "Leer AG", firstName: "" }),
    ]);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].recipient.company).toBe("Leer AG");
    expect(gaps[0].missing).toEqual(["first_name"]);
  });

  it("meldet keine Lücke für Platzhalter, die gar nicht benutzt werden", () => {
    expect(recipientsWithGaps("Hallo", [recipient({ firstName: "" })])).toEqual([]);
  });
});
