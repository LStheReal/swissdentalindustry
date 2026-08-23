// Der Diff entscheidet, was im Admin-Review als Änderung angezeigt wird.
// Ein falsch "leerer" Diff heisst: Admin approved blind eine Änderung.

import { describe, it, expect } from "vitest";
import { diffMemberChange, wordDiff } from "@/lib/diff";
import { emptyMultilingual, type Member } from "@/lib/types";

function member(overrides: Partial<Member> = {}): Member {
  return {
    id: "m1",
    name: "Testfirma AG",
    logo_url: null,
    description: { ...emptyMultilingual(), de: "Alt" },
    street_name: "Bahnhofstrasse",
    street_number: "1",
    postal_code: "3000",
    city: "Bern",
    address: "Bahnhofstrasse 1\n3000 Bern",
    address_needs_review: false,
    phone: "+41 44 000 00 00",
    email: "info@test.ch",
    website_url: "https://test.ch/",
    lat: null,
    lng: null,
    canton: null,
    member_since: null,
    employee_count: null,
    source_lang: "de",
    status: "published",
    draft: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("wordDiff", () => {
  it("markiert gleiche, hinzugefügte und entfernte Wörter", () => {
    const ops = wordDiff("wir bauen zahnräder", "wir bauen gute zahnräder");
    expect(ops.filter((o) => o.type === "added").map((o) => o.text)).toEqual(["gute"]);
    expect(ops.filter((o) => o.type === "removed")).toHaveLength(0);
    expect(ops.filter((o) => o.type === "same").map((o) => o.text)).toEqual([
      "wir",
      "bauen",
      "zahnräder",
    ]);
  });

  it("erkennt Löschungen", () => {
    const ops = wordDiff("a b c", "a c");
    expect(ops.filter((o) => o.type === "removed").map((o) => o.text)).toEqual(["b"]);
  });

  it("kommt mit leeren Texten klar", () => {
    expect(wordDiff("", "")).toEqual([]);
    expect(wordDiff("", "neu").every((o) => o.type === "added")).toBe(true);
  });
});

describe("diffMemberChange", () => {
  it("liefert nichts, wenn sich nichts ändert", () => {
    const current = member();
    expect(diffMemberChange(current, { phone: current.phone })).toEqual([]);
    expect(diffMemberChange(current, { description: current.description })).toEqual([]);
  });

  it("erkennt geänderte einfache Felder", () => {
    const diffs = diffMemberChange(member(), { phone: "+41 31 111 11 11" });
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ field: "phone", kind: "text", after: "+41 31 111 11 11" });
  });

  it("markiert Beschreibung als mehrsprachig und Logo als Bild", () => {
    const diffs = diffMemberChange(member(), {
      description: { ...emptyMultilingual(), de: "Neu" },
      logo_url: "https://cdn/logo.png",
    });
    expect(diffs.find((d) => d.field === "description")?.kind).toBe("multilingual");
    expect(diffs.find((d) => d.field === "logo_url")?.kind).toBe("image");
  });

  it("splittet interne Profildaten in Einzelfelder auf", () => {
    const current = { ...member(), internal_profile: null };
    const diffs = diffMemberChange(current, {
      internal_profile: { city: "Bern" } as never,
    });
    expect(diffs.map((d) => d.field)).toContain("internal_profile.city");
    expect(diffs.find((d) => d.field === "internal_profile.city")).toMatchObject({
      before: null,
      after: "Bern",
    });
  });

  it("ignoriert reine Whitespace-Änderungen in internen Feldern", () => {
    const current = { ...member(), internal_profile: { city: "Bern" } as never };
    const diffs = diffMemberChange(current, {
      internal_profile: { city: "  Bern  " } as never,
    });
    expect(diffs).toEqual([]);
  });
});
