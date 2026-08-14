// Globales Test-Setup. Läuft einmal vor allen Tests.
//
// Lädt echte .env.local-Werte (ohne dotenv-Dependency), damit die Live-Suites
// (DB-Grants, Schema-Drift, Prod-Smoke) gegen die echte Supabase-Instanz
// laufen. Fehlt die Datei (z.B. in CI), greifen die Dummy-Defaults unten und
// die Live-Suites überspringen sich selbst.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { HONEYPOT_FIELD } from "../src/lib/forms";

try {
  const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key && val && process.env[key] === undefined) process.env[key] = val;
  }
} catch {
  /* keine .env.local — Live-Tests überspringen sich selbst */
}

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";

/** Lokaler Dev-Server (npm run dev) für die Route-Tests. */
export const API_BASE = process.env.TEST_API_BASE ?? "http://localhost:3000";

/** Deployment für den Prod-Smoke. Leerer String = deaktiviert. */
export const PROD_URL =
  process.env.TEST_PROD_URL ??
  "https://swissdentalindustry-louiseschuele-5811s-projects.vercel.app";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseHeaders = (role: "anon" | "service" = "anon") => {
  const key = role === "service" ? SERVICE_KEY : ANON_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
};

export const restUrl = (path: string) => `${SUPABASE_URL}/rest/v1/${path}`;

/**
 * True, wenn die echte Supabase-Instanz erreichbar ist. Fängt insbesondere den
 * pausierten Free-Tier-Zustand ab (Cloudflare 521), damit die DB-Suiten sich
 * überspringen statt rot zu werden.
 */
export async function isSupabaseUp(): Promise<boolean> {
  if (SUPABASE_URL.includes("localhost")) return false;
  try {
    const res = await fetch(restUrl("members?select=id&limit=1"), {
      headers: supabaseHeaders("anon"),
      signal: AbortSignal.timeout(8000),
    });
    return res.status < 500;
  } catch {
    return false;
  }
}

/**
 * True, wenn lokal ein Dev-Server dieser App antwortet.
 *
 * Der Probe-Request füllt bewusst das Honeypot-Feld: die Route quittiert dann
 * mit demselben JSON, speichert aber nichts. Ohne das legte jeder Testlauf
 * eine leere Kontaktanfrage in der (produktiven) Datenbank an.
 */
export async function isDevServerUp(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/forms/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [HONEYPOT_FIELD]: "liveness-probe" }),
      signal: AbortSignal.timeout(5000),
    });
    return (res.headers.get("content-type") ?? "").includes("application/json");
  } catch {
    return false;
  }
}
