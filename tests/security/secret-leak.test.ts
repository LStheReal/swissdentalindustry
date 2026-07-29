// Security-Test: serverseitige Secrets dürfen nie im Client-Bundle landen.
//
// Next.js bündelt jede Datei mit "use client" (und alles, was sie importiert)
// ins Browser-JS. Wird dort der Service-Role-Key, ein SMTP-Passwort oder der
// Anthropic-Key gelesen, ist er öffentlich abgreifbar. Genauso darf der
// Service-Role-Supabase-Client (umgeht RLS) nie im Client importiert werden.
//
// Reiner statischer Scan — kein Server, keine DB nötig. Läuft immer mit.

import { describe, it, expect } from "vitest";
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(__dirname, "..", "..");
const SRC = join(ROOT, "src");

// Env-Namen, die NUR serverseitig existieren dürfen. NEXT_PUBLIC_* ist
// absichtlich öffentlich und hier erlaubt.
const SERVER_ONLY_ENV = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "MAIL_FROM",
];

// Module, die RLS umgehen bzw. nur serverseitig laufen dürfen.
const SERVER_ONLY_IMPORTS = [
  "@/lib/supabase/admin", // Service-Role, umgeht RLS
  "@/lib/ai", // Anthropic-Client
  "@/lib/email", // nodemailer/SMTP
  "@/lib/auth", // Session-/Admin-Prüfung
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

function isClientFile(src: string): boolean {
  // "use client" steht vor den Imports, in den ersten Zeilen.
  const head = src.split("\n").slice(0, 5).join("\n");
  return /^\s*["']use client["']/m.test(head);
}

const files = walk(SRC).map((f) => ({
  path: relative(ROOT, f),
  src: readFileSync(f, "utf8"),
}));
const clientFiles = files.filter((f) => isClientFile(f.src));

describe("Client-Bundle enthält keine Server-Secrets", () => {
  it("findet überhaupt Client-Komponenten (Scan greift)", () => {
    expect(clientFiles.length).toBeGreaterThan(0);
  });

  it.each(SERVER_ONLY_ENV)("liest %s in keiner Client-Datei", (envName) => {
    const offenders = clientFiles
      .filter((f) => f.src.includes(`process.env.${envName}`))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it.each(SERVER_ONLY_IMPORTS)("importiert %s in keiner Client-Datei", (mod) => {
    const offenders = clientFiles
      .filter((f) => new RegExp(`from\\s+["']${mod}["']`).test(f.src))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("enthält keine hartcodierten Supabase-/Anthropic-Keys im Quellcode", () => {
    const offenders = files
      .filter((f) => /(sk-ant-[a-zA-Z0-9_-]{20})|(service_role"[^\n]{0,40}eyJ)/.test(f.src))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });
});

describe(".env-Dateien sind nicht eingecheckt", () => {
  it("gitignore deckt .env.local ab", () => {
    const ignore = readFileSync(join(ROOT, ".gitignore"), "utf8");
    expect(ignore).toMatch(/\.env/);
  });
});
