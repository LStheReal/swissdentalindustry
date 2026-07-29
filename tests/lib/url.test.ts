// sanitizeExternalUrl ist die einzige Verteidigung gegen Stored XSS über
// Mitglieder-Websites: React blockiert javascript:-hrefs NICHT.

import { describe, it, expect } from "vitest";
import { sanitizeExternalUrl } from "@/lib/url";

describe("sanitizeExternalUrl", () => {
  it("ergänzt fehlendes Schema mit https", () => {
    expect(sanitizeExternalUrl("firma.ch")).toBe("https://firma.ch/");
    expect(sanitizeExternalUrl("  www.firma.ch/pfad  ")).toBe("https://www.firma.ch/pfad");
  });

  it("behält http und https", () => {
    expect(sanitizeExternalUrl("https://firma.ch/x?a=1")).toBe("https://firma.ch/x?a=1");
    expect(sanitizeExternalUrl("http://firma.ch")).toBe("http://firma.ch/");
  });

  it("blockt gefährliche Schemata", () => {
    for (const raw of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "  javascript:alert(document.cookie)",
      "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
    ]) {
      expect(sanitizeExternalUrl(raw), raw).toBeNull();
    }
  });

  it("gibt null für leer/ungültig zurück", () => {
    expect(sanitizeExternalUrl(null)).toBeNull();
    expect(sanitizeExternalUrl(undefined)).toBeNull();
    expect(sanitizeExternalUrl("   ")).toBeNull();
    expect(sanitizeExternalUrl("http://")).toBeNull();
  });
});
