// DB-Security-Test gegen die echte Supabase-Instanz: der anon-Key (steht im
// Browser-Bundle, ist also öffentlich) darf veröffentlichte Inhalte LESEN,
// aber nichts schreiben und keine internen Daten sehen.
//
// Das ist die Invariante aus Migration 0010 (restrict_anon_grants). Bricht sie
// — etwa weil eine neue Tabelle ohne RLS angelegt wird — kann jeder Besucher
// die Mitgliederdaten verändern.
//
// Überspringt sich selbst, wenn Supabase nicht erreichbar ist (pausiertes
// Free-Tier-Projekt oder CI ohne Credentials).

import { describe, it, expect } from "vitest";
import { isSupabaseUp, restUrl, supabaseHeaders } from "../setup";

const up = await isSupabaseUp();

describe.skipIf(!up)("anon-Key: Lesezugriff", () => {
  it("darf veröffentlichte Mitglieder lesen", async () => {
    const res = await fetch(restUrl("members?select=id,name,status&limit=50"), {
      headers: supabaseHeaders("anon"),
    });
    expect(res.status).toBe(200);
    const rows = (await res.json()) as { status: string }[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.status === "published")).toBe(true);
  });

  it("sieht keine Entwürfe", async () => {
    const res = await fetch(restUrl("members?select=id&status=eq.draft"), {
      headers: supabaseHeaders("anon"),
    });
    expect(await res.json()).toEqual([]);
  });

  it("darf News lesen", async () => {
    const res = await fetch(restUrl("news?select=id&limit=1"), {
      headers: supabaseHeaders("anon"),
    });
    expect(res.status).toBe(200);
  });
});

describe.skipIf(!up)("anon-Key: Schreibzugriff ist gesperrt", () => {
  const denied = (status: number) => status === 401 || status === 403 || status === 404;

  it("darf keine Mitglieder anlegen", async () => {
    const res = await fetch(restUrl("members"), {
      method: "POST",
      headers: supabaseHeaders("anon"),
      body: JSON.stringify({ name: `__vitest_should_not_exist_${Date.now()}` }),
    });
    expect(denied(res.status), `insert → ${res.status}`).toBe(true);
  });

  it("darf keine Mitglieder ändern", async () => {
    const res = await fetch(restUrl("members?id=neq.00000000-0000-0000-0000-000000000000"), {
      method: "PATCH",
      headers: supabaseHeaders("anon"),
      body: JSON.stringify({ name: "__vitest_pwned" }),
    });
    expect(denied(res.status), `update → ${res.status}`).toBe(true);
  });

  it("darf keine Mitglieder löschen", async () => {
    const res = await fetch(restUrl("members?id=neq.00000000-0000-0000-0000-000000000000"), {
      method: "DELETE",
      headers: supabaseHeaders("anon"),
    });
    expect(denied(res.status), `delete → ${res.status}`).toBe(true);
  });
});

describe.skipIf(!up)("anon-Key: interne Tabellen sind unsichtbar", () => {
  it.each([
    "admins",
    "member_edit_tokens",
    "member_internal_profiles",
    "member_change_requests",
    "membership_applications",
    "member_company_internal",
    "mail_log",
  ])("%s ist für anon nicht lesbar", async (table) => {
    const res = await fetch(restUrl(`${table}?select=*&limit=1`), {
      headers: supabaseHeaders("anon"),
    });
    if (res.status === 200) {
      // RLS darf statt eines Fehlers auch einfach 0 Zeilen liefern.
      expect(await res.json()).toEqual([]);
    } else {
      expect([401, 403, 404]).toContain(res.status);
    }
  });

  it("liefert keine internen Profilfelder über die members-Sicht", async () => {
    const res = await fetch(restUrl("members?select=*&limit=1"), {
      headers: supabaseHeaders("anon"),
    });
    const [row] = (await res.json()) as Record<string, unknown>[];
    // employee_count stand nach Migration 0015/0018 kurzzeitig auf `members`
    // und war damit öffentlich — 0019 hat es in die geschützte Tabelle
    // verschoben. Der Test hält fest, dass es nicht zurückwandert.
    for (const forbidden of [
      "membership_fee",
      "internal_notes",
      "employee_count",
      "direct_email",
    ]) {
      expect(row).not.toHaveProperty(forbidden);
    }
  });
});
