# Tests

Aufbau wie im Funity/EusiApp-Projekt: Vitest für Unit-, Integrations-,
Security- und DB-Tests, Playwright für die Browser-Ebene.

```bash
npm test              # alles, was ohne laufenden Server geht (+ Live-DB, wenn erreichbar)
bash run-tests.sh     # startet den Dev-Server automatisch und läuft dann alles
bash run-tests.sh --e2e   # zusätzlich die Browser-Tests
npm run test:coverage # Coverage über src/lib und src/app/api
npm run test:e2e      # nur Playwright (Dev-Server muss laufen)
```

## Was wo getestet wird

| Ordner | Braucht | Inhalt |
| --- | --- | --- |
| `tests/lib/` | nichts | Reine Funktionen: URL-Sanitizing, Sprach-Routing, Formular-Parsing, Rate-Limit, Diff, Typen, Site-URL |
| `tests/security/` | teils Dev-Server | Secrets nie im Client-Bundle, jede Admin-Action ruft `requireAdmin()`, jede API-Route hat Rate-Limit + Honeypot, Portal ohne Session gesperrt |
| `tests/db/` | Live-Supabase | anon darf lesen, aber nicht schreiben (Migration 0010); interne Tabellen unsichtbar; Schema-Drift gegen den Code |
| `tests/migrations/` | nichts | Statischer SQL-Lint: Nummerierung, RLS für neue Tabellen, View-/Spalten-Abhängigkeiten |
| `tests/meta/` | Internet | Prod-Smoke gegen das Deployment: Seiten rendern, Security-Header, robots.txt |
| `tests-e2e/` | Dev-Server + Chromium | Mitglieder-Karten, Popup, Sprachwechsel, Login-Formular, Honeypot |

## Selbst-Überspringen statt Rot

Suiten, die einen Dev-Server oder eine erreichbare Datenbank brauchen,
überspringen sich selbst (`describe.skipIf`). So läuft `npm test` in CI ohne
Credentials durch und schlägt lokal trotzdem an, wenn etwas kaputt ist.

Wichtiger Sonderfall: ein **pausiertes Supabase-Projekt** (Free Tier) sieht wie
ein Ausfall aus. `isSupabaseUp()` erkennt das und überspringt die DB-Suiten,
statt sie rot zu färben — der Prod-Smoke schlägt in dem Fall aber bewusst an,
weil die Website dann leer ist.

## Konventionen

- Jede Testdatei beginnt mit einem Kommentar, **warum** es sie gibt — was
  kaputtgehen kann, wenn die Invariante bricht.
- Security-Tests enumerieren den Code selbst (Routes, Actions, Client-Dateien),
  statt eine Liste zu pflegen. Neue ungeschützte Action → Test wird rot.
- Bewusste Ausnahmen stehen in einer benannten Menge im Test (z.B.
  `PUBLIC_ACTIONS`) und brauchen eine Begründung im Kommentar.

## Env

`tests/setup.ts` lädt `.env.local` (ohne dotenv) und setzt sonst Dummy-Werte.
Überschreibbar:

- `TEST_API_BASE` — Dev-Server (Standard `http://localhost:3000`)
- `TEST_PROD_URL` — Ziel des Prod-Smoke; leerer String deaktiviert ihn
- `APP_URL` — Basis-URL für Playwright
