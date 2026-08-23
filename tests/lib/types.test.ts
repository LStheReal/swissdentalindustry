// Mehrsprachige Texte + interne Profilfelder: die Normalisierer entscheiden,
// was in der DB landet und was die Website anzeigt.

import { describe, it, expect } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALES,
  MEMBER_INTERNAL_PROFILE_KEYS,
  MEMBER_SELF_SERVICE_PROFILE_KEYS,
  emptyMultilingual,
  mlText,
  normalizeMemberInternalProfile,
} from "@/lib/types";

describe("Multilingual", () => {
  it("emptyMultilingual enthält alle vier Sprachen", () => {
    expect(Object.keys(emptyMultilingual()).sort()).toEqual([...LOCALES].sort());
  });

  it("mlText nimmt die gewünschte Sprache", () => {
    expect(mlText({ ...emptyMultilingual(), de: "Hallo", en: "Hi" }, "de")).toBe("Hallo");
  });

  it("mlText fällt auf die erste nicht-leere Sprache zurück", () => {
    expect(mlText({ ...emptyMultilingual(), fr: "Bonjour" }, "de")).toBe("Bonjour");
    expect(mlText({ ...emptyMultilingual(), de: "   ", it: "Ciao" }, "de")).toBe("Ciao");
  });

  it("mlText liefert nie undefined", () => {
    expect(mlText(null, "de")).toBe("");
    expect(mlText(emptyMultilingual(), "en")).toBe("");
  });
});

describe("normalizeMemberInternalProfile", () => {
  it("füllt alle Schlüssel und trimmt Werte", () => {
    const out = normalizeMemberInternalProfile({ city: "  Bern  " });
    expect(Object.keys(out).sort()).toEqual([...MEMBER_INTERNAL_PROFILE_KEYS].sort());
    expect(out.city).toBe("Bern");
  });

  it("macht aus leeren Strings null", () => {
    const out = normalizeMemberInternalProfile({ city: "   ", street_name: "" });
    expect(out.city).toBeNull();
    expect(out.street_name).toBeNull();
  });

  it("verträgt null/undefined", () => {
    expect(normalizeMemberInternalProfile(null).city).toBeNull();
    expect(normalizeMemberInternalProfile(undefined).direct_email).toBeNull();
  });
});

describe("Self-Service-Whitelist", () => {
  // Mitgliedsbeitrag und interne Notizen dürfen im /edit-Formular weder
  // sichtbar noch schreibbar sein — sie sind rein intern.
  it("schliesst membership_fee und internal_notes aus", () => {
    // Seit Migration 0018 liegen Beitrag und interne Notizen an der Firma,
    // nicht mehr am Kontakt — sie können hier gar nicht mehr auftauchen.
    expect(MEMBER_INTERNAL_PROFILE_KEYS).not.toContain("membership_fee");
    expect(MEMBER_INTERNAL_PROFILE_KEYS).not.toContain("internal_notes");
  });

  it("ist eine echte Teilmenge der internen Felder", () => {
    for (const key of MEMBER_SELF_SERVICE_PROFILE_KEYS) {
      expect(MEMBER_INTERNAL_PROFILE_KEYS).toContain(key);
    }
  });
});

describe("Default-Sprache", () => {
  it("ist Englisch (präfixlose URLs)", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });
});
