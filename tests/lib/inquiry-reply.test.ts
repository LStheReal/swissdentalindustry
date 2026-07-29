import { describe, it, expect } from "vitest";
import { buildInquiryReplyBody, buildInquiryReplyHref } from "@/lib/inquiry-reply";

describe("buildInquiryReplyBody", () => {
  it("zitiert die Originalnachricht Zeile für Zeile", () => {
    const body = buildInquiryReplyBody({
      sender: "Anna Muster",
      message: "Erste Zeile\nZweite Zeile",
    });
    expect(body).toContain("Guten Tag Anna Muster");
    expect(body).toContain("> Erste Zeile");
    expect(body).toContain("> Zweite Zeile");
  });

  it("grüsst ohne Namen, wenn keiner mitgeschickt wurde", () => {
    expect(buildInquiryReplyBody({ message: "Hallo" })).toMatch(/^Guten Tag\n/);
  });

  it("lässt das Zitat weg, wenn keine Nachricht da ist", () => {
    expect(buildInquiryReplyBody({ sender: "Anna", message: "" })).not.toContain(">");
  });
});

describe("buildInquiryReplyHref", () => {
  it("adressiert die Mail an den Absender", () => {
    const href = buildInquiryReplyHref({ email: "anna@example.ch" });
    expect(href?.startsWith("mailto:anna@example.ch?")).toBe(true);
  });

  it("liefert null ohne E-Mail-Adresse — dann gibt es nichts zu antworten", () => {
    expect(buildInquiryReplyHref({ message: "Hallo" })).toBeNull();
    expect(buildInquiryReplyHref({ email: "   " })).toBeNull();
  });

  it("stellt dem Betreff 'Re:' voran", () => {
    const href = buildInquiryReplyHref({
      email: "a@b.ch",
      subject: "Frage zur Mitgliedschaft",
    });
    const subject = new URL(href!).searchParams.get("subject");
    expect(subject).toBe("Re: Frage zur Mitgliedschaft");
  });

  it("setzt einen Standardbetreff, wenn das Formular keinen hatte", () => {
    const href = buildInquiryReplyHref({ email: "a@b.ch" });
    expect(new URL(href!).searchParams.get("subject")).toBe(
      "Ihre Anfrage an Swiss Dental Industry",
    );
  });

  it("kodiert Leerzeichen als %20, nicht als +", () => {
    // Mit "+" stehen im Mailclient Plus-Zeichen statt Leerzeichen im Text.
    const href = buildInquiryReplyHref({ email: "a@b.ch", message: "zwei Wörter" });
    expect(href).not.toContain("+");
    expect(href).toContain("%20");
  });

  it("übersteht Sonderzeichen im Betreff, ohne den Body abzuschneiden", () => {
    // Ein unkodiertes "&" würde den Rest des Links als neuen Parameter lesen.
    const href = buildInquiryReplyHref({
      email: "a@b.ch",
      subject: "Preise & Konditionen",
      message: "Bitte um Auskunft",
    });
    const params = new URL(href!).searchParams;
    expect(params.get("subject")).toBe("Re: Preise & Konditionen");
    expect(params.get("body")).toContain("> Bitte um Auskunft");
  });

  it("nimmt den Namen aus contact_person, wenn kein name da ist", () => {
    const href = buildInquiryReplyHref({ email: "a@b.ch", contact_person: "Beat Muster" });
    expect(new URL(href!).searchParams.get("body")).toContain("Guten Tag Beat Muster");
  });
});
