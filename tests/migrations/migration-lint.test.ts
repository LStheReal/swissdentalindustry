// Statischer Lint über supabase/migrations/*.sql.
//
// Migrationen laufen auf der Produktions-DB — ein Fehler dort ist teuer und
// oft nur manuell zu reparieren. Diese Regeln fangen die typischen Fälle ab,
// bevor eine Migration je eingespielt wird.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const MIGRATIONS_DIR = path.join(__dirname, "..", "..", "supabase", "migrations");

type Migration = { file: string; sql: string };

function loadMigrations(): Migration[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((file) => ({ file, sql: readFileSync(path.join(MIGRATIONS_DIR, file), "utf8") }));
}

/** Dollar-Quoted-Bodies (plpgsql) und Kommentare entfernen. */
function cleanSql(sql: string): string {
  return sql.replace(/\$\$[\s\S]*?\$\$/g, " '<body>' ").replace(/--[^\n]*/g, "");
}

function statementsOf(sql: string): string[] {
  return cleanSql(sql)
    .split(";")
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, " "))
    .filter(Boolean);
}

const migrations = loadMigrations();

describe("Migrations-Dateien", () => {
  it("existieren und sind fortlaufend nummeriert", () => {
    expect(migrations.length).toBeGreaterThan(0);
    const numbers = migrations.map((m) => Number(m.file.slice(0, 4)));
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("folgen dem Namensschema NNNN_beschreibung.sql", () => {
    const bad = migrations.filter((m) => !/^\d{4}_[a-z0-9_]+\.sql$/.test(m.file));
    expect(bad.map((m) => m.file)).toEqual([]);
  });
});

describe("Migrations-Inhalt", () => {
  it("droppt keine Tabelle ohne if exists (Schutz vor Halbzuständen)", () => {
    const offenders: string[] = [];
    for (const m of migrations) {
      for (const stmt of statementsOf(m.sql)) {
        if (/^drop table (?!if exists)/.test(stmt)) offenders.push(`${m.file}: ${stmt}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("dropt keine Spalte, ohne abhängige Views vorher zu droppen", () => {
    // Buchhaltung über alle Migrationen hinweg: welche Views existieren gerade
    // auf welcher Tabelle?
    const viewsOnTable = new Map<string, Set<string>>();
    const offenders: string[] = [];

    for (const m of migrations) {
      const droppedHere = new Set<string>();
      for (const stmt of statementsOf(m.sql)) {
        const dropView = stmt.match(/^drop view (?:if exists )?([\w."]+)/);
        if (dropView) {
          droppedHere.add(dropView[1]);
          for (const set of viewsOnTable.values()) set.delete(dropView[1]);
          continue;
        }
        const createView = stmt.match(
          /^create (?:or replace )?view ([\w."]+) as select [\s\S]*? from ([\w."]+)/,
        );
        if (createView) {
          const [, view, table] = createView;
          if (!viewsOnTable.has(table)) viewsOnTable.set(table, new Set());
          viewsOnTable.get(table)!.add(view);
          continue;
        }
        const dropColumn = stmt.match(/^alter table ([\w."]+) drop column/);
        if (dropColumn) {
          const remaining = [...(viewsOnTable.get(dropColumn[1]) ?? [])].filter(
            (v) => !droppedHere.has(v),
          );
          if (remaining.length) {
            offenders.push(`${m.file}: drop column on ${dropColumn[1]} while ${remaining} exist`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("legt jede in derselben Migration gedroppte View wieder an", () => {
    const offenders: string[] = [];
    for (const m of migrations) {
      const dropped = new Set<string>();
      const created = new Set<string>();
      for (const stmt of statementsOf(m.sql)) {
        const d = stmt.match(/^drop view (?:if exists )?([\w."]+)/);
        if (d) dropped.add(d[1]);
        const c = stmt.match(/^create (?:or replace )?view ([\w."]+)/);
        if (c) created.add(c[1]);
      }
      for (const v of dropped) if (!created.has(v)) offenders.push(`${m.file}: ${v}`);
    }
    expect(offenders).toEqual([]);
  });

  it("aktiviert RLS für jede neu angelegte Tabelle", () => {
    const created: { file: string; table: string }[] = [];
    const rlsEnabled = new Set<string>();
    for (const m of migrations) {
      for (const stmt of statementsOf(m.sql)) {
        const c = stmt.match(/^create table (?:if not exists )?(?:public\.)?([\w"]+)/);
        if (c) created.push({ file: m.file, table: c[1].replace(/"/g, "") });
        const r = stmt.match(/^alter table (?:public\.)?([\w"]+) enable row level security/);
        if (r) rlsEnabled.add(r[1].replace(/"/g, ""));
      }
    }
    expect(created.length).toBeGreaterThan(0);
    const missing = created.filter((c) => !rlsEnabled.has(c.table));
    expect(missing.map((m) => `${m.file}: ${m.table}`)).toEqual([]);
  });

  it("die anon-Härtung (0010) entzieht Schreibrechte", () => {
    const hardening = migrations.find((m) => m.file.startsWith("0010"));
    expect(hardening).toBeDefined();
    const sql = hardening!.sql.toLowerCase();
    expect(sql).toMatch(/revoke/);
    expect(sql).toMatch(/anon/);
  });
});
