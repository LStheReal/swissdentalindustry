// Schema-Drift-Test: die Live-DB muss die Tabellen und Spalten haben, die der
// Code voraussetzt. Fängt "Migration lokal, aber nie auf Prod angewendet" ab —
// der Fehler, der sonst erst beim Speichern im Admin-Portal auffällt.
//
// Überspringt sich selbst ohne erreichbare Supabase-Instanz.

import { describe, it, expect } from "vitest";
import { isSupabaseUp, restUrl, supabaseHeaders } from "../setup";
import { MEMBER_INTERNAL_PROFILE_KEYS } from "@/lib/types";

const up = await isSupabaseUp();

async function selectOne(table: string, columns: string) {
  const res = await fetch(restUrl(`${table}?select=${columns}&limit=1`), {
    headers: supabaseHeaders("service"),
  });
  return { status: res.status, body: await res.text() };
}

describe.skipIf(!up)("Live-Schema entspricht dem Code", () => {
  it("members hat alle vom Code gelesenen Spalten", async () => {
    const { status, body } = await selectOne(
      "members",
      "id,name,logo_url,description,address,phone,email,website_url,lat,lng,canton,member_since,source_lang,status,is_active,created_at,updated_at",
    );
    expect(status, body).toBe(200);
  });

  it("member_internal_profiles hat alle Profilfelder", async () => {
    const { status, body } = await selectOne(
      "member_internal_profiles",
      ["member_id", ...MEMBER_INTERNAL_PROFILE_KEYS].join(","),
    );
    expect(status, body).toBe(200);
  });

  it.each([
    ["news", "id,title,body,image_url,source_lang,is_published,published_at,link_url,youtube_url"],
    ["member_edit_tokens", "token,member_id,is_active"],
    ["member_change_requests", "id,member_id,proposed,status,submitted_at"],
    ["membership_applications", "id,payload,status"],
    ["admins", "user_id"],
    ["app_settings", "id,mitwirken_email,membership_email,admin_notification_email"],
  ])("%s existiert mit den erwarteten Spalten", async (table, columns) => {
    const { status, body } = await selectOne(table, columns);
    expect(status, `${table}: ${body}`).toBe(200);
  });

  it("is_admin() ist als RPC vorhanden", async () => {
    const res = await fetch(`${restUrl("rpc/is_admin")}`, {
      method: "POST",
      headers: supabaseHeaders("service"),
      body: "{}",
    });
    expect([200, 401, 403]).toContain(res.status);
    expect(res.status).not.toBe(404);
  });

  it("enthält echte Mitgliederdaten (kein leerer Restore)", async () => {
    const res = await fetch(restUrl("members?select=id"), {
      headers: { ...supabaseHeaders("service"), Prefer: "count=exact" },
    });
    const count = Number(res.headers.get("content-range")?.split("/")[1] ?? 0);
    expect(count).toBeGreaterThan(20);
  });
});
