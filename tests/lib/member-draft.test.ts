import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DRAFTABLE_KEYS,
  draftedFields,
  effectiveMember,
  hasDraft,
  pickDraftable,
  pickNonDraftable,
} from "@/lib/member-draft";
import { emptyMultilingual, type Member } from "@/lib/types";

function member(overrides: Partial<Member> = {}): Member {
  return {
    id: "m1",
    name: "Testfirma AG",
    logo_url: null,
    description: { ...emptyMultilingual(), de: "Live-Text" },
    street_name: "Bahnhofstrasse",
    street_number: "1",
    postal_code: "3000",
    city: "Bern",
    address: "Bahnhofstrasse 1\n3000 Bern",
    address_needs_review: false,
    phone: null,
    email: null,
    website_url: null,
    lat: null,
    lng: null,
    canton: null,
    member_since: null,
    source_lang: "de",
    status: "published",
    draft: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("Entwurf und veröffentlichter Stand", () => {
  it("ohne Entwurf ist der Live-Stand der bearbeitete Stand", () => {
    const m = member();
    expect(hasDraft(m)).toBe(false);
    expect(effectiveMember(m)).toEqual(m);
    expect(draftedFields(m)).toEqual([]);
  });

  it("überlagert nur die Felder, die im Entwurf stehen", () => {
    const m = member({ draft: { name: "Neuer Name", city: "Zürich" } });
    const view = effectiveMember(m);
    expect(view.name).toBe("Neuer Name");
    expect(view.city).toBe("Zürich");
    // unangetastet
    expect(view.street_name).toBe("Bahnhofstrasse");
    expect(view.description.de).toBe("Live-Text");
    // Der Live-Stand selbst bleibt unverändert — das ist, was die Website liest.
    expect(m.name).toBe("Testfirma AG");
    expect(m.city).toBe("Bern");
  });

  it("meldet nur die Felder als geändert, die wirklich abweichen", () => {
    const m = member({ draft: { name: "Testfirma AG", city: "Zürich" } });
    expect(draftedFields(m)).toEqual(["city"]);
  });

  it("ein leerer Entwurf gilt nicht als Änderung", () => {
    expect(hasDraft(member({ draft: {} }))).toBe(false);
  });

  it("trennt entwurfsfähige von abgeleiteten Feldern", () => {
    const patch = { name: "X", city: "Y", lat: 1, lng: 2, canton: "BE", status: "published" };
    expect(pickDraftable(patch)).toEqual({ name: "X", city: "Y" });
    expect(pickNonDraftable(patch)).toEqual({ lat: 1, lng: 2, canton: "BE", status: "published" });
  });

  it("Koordinaten und Status sind bewusst nicht entwurfsfähig", () => {
    for (const key of ["lat", "lng", "canton", "status", "is_active", "id"]) {
      expect(DRAFTABLE_KEYS as readonly string[]).not.toContain(key);
    }
  });
});

/**
 * Abschnitt 6 der Anforderung: nichts darf ohne ausdrückliches Veröffentlichen
 * online gehen. Diese Prüfung hält das an der Quelle fest — sie schlägt fehl,
 * sobald wieder irgendwo direkt auf `published` geschaltet oder an
 * applyMemberPatch vorbei in `members` geschrieben wird.
 */
const ROOT = join(__dirname, "..", "..");

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe("Veröffentlichen passiert nur an einer Stelle", () => {
  const files = sourceFiles(join(ROOT, "src"));

  it('setzt status: "published" ausschliesslich in member-write.ts', () => {
    const offenders = files.filter(
      (f) =>
        !f.endsWith(join("lib", "member-write.ts")) &&
        /status:\s*["']published["']/.test(readFileSync(f, "utf8")),
    );
    expect(offenders.map((f) => f.replace(ROOT + "/", ""))).toEqual([]);
  });

  it("schreibt Firmeninhalte nur über applyMemberPatch oder beim Anlegen", () => {
    // Direkte .from("members").update(...) sind nur dort erlaubt, wo sie
    // nachweislich nichts veröffentlichen können.
    const allowed = [
      join("lib", "member-write.ts"),
      join("lib", "geocode.ts"),
      join("lib", "after-response.ts"),
    ];
    const offenders: string[] = [];
    for (const f of files) {
      if (allowed.some((a) => f.endsWith(a))) continue;
      const src = readFileSync(f, "utf8");
      if (/\.from\(["']members["']\)\s*\n?\s*\.update\(/.test(src)) {
        offenders.push(f.replace(ROOT + "/", ""));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("die Zusage legt die Firma als Entwurf an", () => {
    const src = readFileSync(
      join(ROOT, "src/app/admin/(portal)/applications/actions.ts"),
      "utf8",
    );
    expect(src).toMatch(/status:\s*["']draft["']/);
  });

  it("neu angelegte Firmen sind Entwurf", () => {
    const src = readFileSync(
      join(ROOT, "src/app/admin/(portal)/members/actions.ts"),
      "utf8",
    );
    expect(src).toMatch(/status:\s*["']draft["']/);
  });
});

/**
 * Der Schreibpfad selbst, gegen einen Stub der Supabase-Kette. Hier hängt die
 * Zusicherung aus Abschnitt 6 dran: Speichern schreibt in den Entwurf,
 * Veröffentlichen — und nur das — macht ihn öffentlich.
 */
type Row = Record<string, unknown>;

function stubClient(row: Row) {
  const updates: Row[] = [];
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return { maybeSingle: async () => ({ data: row, error: null }) };
            },
          };
        },
        update(patch: Row) {
          updates.push(patch);
          Object.assign(row, patch);
          return { eq: async () => ({ error: null }) };
        },
      };
    },
  };
  return { client, updates, row };
}

describe("applyMemberPatch", () => {
  it("schreibt bei einer veröffentlichten Firma in den Entwurf, nicht live", async () => {
    const { applyMemberPatch } = await import("@/lib/member-write");
    const { client, updates, row } = stubClient({
      status: "published",
      draft: null,
      name: "Alt AG",
    });

    const result = await applyMemberPatch(client as never, "m1", { name: "Neu AG", lat: 47 });

    expect(result.wentLive).toBe(false);
    expect(updates[0].draft).toEqual({ name: "Neu AG" });
    // Koordinaten sind abgeleitet und gehen direkt in die Spalte.
    expect(updates[0].lat).toBe(47);
    // Der veröffentlichte Name ist unangetastet.
    expect(row.name).toBe("Alt AG");
  });

  it("ergänzt einen bestehenden Entwurf, statt ihn zu ersetzen", async () => {
    const { applyMemberPatch } = await import("@/lib/member-write");
    const { client, updates } = stubClient({
      status: "published",
      draft: { name: "Neu AG" },
    });

    await applyMemberPatch(client as never, "m1", { city: "Zürich" });

    expect(updates[0].draft).toEqual({ name: "Neu AG", city: "Zürich" });
  });

  it("schreibt direkt, solange die Firma nie online war", async () => {
    const { applyMemberPatch } = await import("@/lib/member-write");
    const { client, updates, row } = stubClient({ status: "draft", draft: null, name: "Alt AG" });

    const result = await applyMemberPatch(client as never, "m1", { name: "Neu AG" });

    expect(result.wentLive).toBe(true);
    expect(updates[0]).toEqual({ name: "Neu AG" });
    expect(row.name).toBe("Neu AG");
    expect(updates[0].draft).toBeUndefined();
  });
});

describe("publishMemberRow", () => {
  it("übernimmt den Entwurf, leert ihn und schaltet online", async () => {
    const { publishMemberRow } = await import("@/lib/member-write");
    const { client, updates } = stubClient({
      ...member({ status: "draft" }),
      draft: { name: "Neu AG", city: "Zürich", postal_code: "8000" },
    } as unknown as Row);

    const result = await publishMemberRow(client as never, "m1");

    expect(result.published).toBe(true);
    expect(updates[0].name).toBe("Neu AG");
    expect(updates[0].city).toBe("Zürich");
    expect(updates[0].draft).toBeNull();
    expect(updates[0].status).toBe("published");
    // Adresse hat sich geändert → Koordinaten verwerfen und neu holen.
    expect(result.addressChanged).toBe(true);
    expect(updates[0].lat).toBeNull();
  });

  it("lässt Koordinaten stehen, wenn die Adresse gleich bleibt", async () => {
    const { publishMemberRow } = await import("@/lib/member-write");
    const { client, updates } = stubClient({
      ...member({ status: "published", lat: 47, lng: 7 }),
      draft: { name: "Nur der Name" },
    } as unknown as Row);

    const result = await publishMemberRow(client as never, "m1");

    expect(result.addressChanged).toBe(false);
    expect(updates[0].lat).toBeUndefined();
  });
});
