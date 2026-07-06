# Swiss Dental Industry — Admin-Portal & Backend

Next.js + Supabase Backend für **swissdentalindustry.ch**. Diese Phase enthält
das **Superadmin-Portal** und alle **Funktionen** (Mitglieder, News, Self-Service
mit Freigabe-Workflow, Formulare, Auto-Übersetzung, Geocoding). Die gestaltete
öffentliche Website folgt in einer späteren Phase.

## Funktionsumfang

- **`/admin`** — Superadmin-Portal (Login nötig), mehrsprachig (DE/FR/IT/EN):
  - **Mitglieder** anlegen/bearbeiten/löschen, Logo-Upload, Beschreibung wird
    automatisch in 4 Sprachen übersetzt, Kartenstandort wird aus der Adresse
    berechnet (Geocoding). Pro Firma ein **permanenter, widerrufbarer Edit-Link**.
    Zusätzlich können Firmen per Spreadsheet-Import gesammelt als Entwürfe
    angelegt werden.
  - **News** mit Bild + Auto-Übersetzung; sofort live.
  - **Änderungs-Feed** — Vorschläge von Firmen mit Diff „aktuell ↔ vorgeschlagen",
    Freigeben/Ablehnen. Bei Freigabe E-Mail an die Firma.
  - **Anträge** — „Mitglied werden"-Einsendungen, per Klick in Mitglied umwandelbar.
  - **Einstellungen** — Portal-Sprache, Empfänger-E-Mails der Formulare.
- **`/edit/[token]`** — Self-Service ohne Login: Firma ändert Logo/Beschreibung/
  Kontakt; Änderungen gehen als Vorschlag in den Feed (nicht direkt live).
- **Öffentliche Website** — statische Inhalte in DE/FR/IT/EN; dynamische News-
  und Mitgliedertexte kommen weiterhin aus den mehrsprachigen Datenfeldern.
- **`/api/forms/mitwirken`**, **`/api/forms/mitglied-werden`** — Formular-Endpoints
  (E-Mail-Versand; „Mitglied werden" zusätzlich gespeichert).

## Setup

### 1. Abhängigkeiten
```bash
npm install
```

### 2. Supabase-Projekt
1. Projekt auf [supabase.com](https://supabase.com) anlegen.
2. SQL-Editor öffnen und **`supabase/migrations/0001_init.sql`** ausführen
   (legt Tabellen, RLS-Policies und Storage-Buckets an).
3. Optional Beispieldaten: **`supabase/seed.sql`** ausführen.

### 3. Ersten Superadmin anlegen
1. Supabase → **Authentication → Users → Add user** (E-Mail + Passwort).
2. Im SQL-Editor die User-ID in die `admins`-Tabelle eintragen:
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'DEINE@EMAIL.ch';
   ```

### 4. Umgebungsvariablen
`.env.example` nach `.env.local` kopieren und ausfüllen:
```bash
cp .env.example .env.local
```
Benötigt: Supabase URL + anon + service-role Key, DeepSeek API-Key,
SMTP-Zugangsdaten, `NEXT_PUBLIC_APP_URL`.

### 5. Starten
```bash
npm run dev
```
Portal: <http://localhost:3000/admin>

## Übersetzung & Geocoding

- **Übersetzung:** DeepSeek (OpenAI-kompatibel) via `src/lib/translate.ts`.
  Verwendet `DEEPSEEK_API_KEY` beim Erstellen von News sowie beim Anlegen oder
  Ändern von Mitgliederbeschreibungen. Schlägt der Aufruf fehl, wird der
  Originaltext als Fallback gespeichert.
- **Geocoding:** OpenStreetMap Nominatim via `src/lib/geocode.ts` (kostenlos,
  kein Key). Liefert Koordinaten + Kanton aus der Adresse.

## Architektur (Kurz)

- `src/lib/` — wiederverwendbare Bausteine: `translate`, `geocode`, `email`,
  `diff`, `storage`, `auth`, `i18n-admin`, `supabase/*`, `types`.
- `src/app/admin/(portal)/` — geschütztes Portal (Layout prüft Superadmin).
- `src/app/admin/login/` — Login (Supabase Auth).
- `src/app/edit/[token]/` — Self-Service.
- `src/app/api/forms/` — Formular-Endpoints.
- `src/proxy.ts` — schützt `/admin`-Routen (Next.js 16 „proxy").

Schreibvorgänge laufen serverseitig über den **Service-Role-Key**; Lesezugriff
ist per **Row-Level-Security** geregelt (öffentlich nur veröffentlichte Daten,
Superadmins sehen alles).

## Noch offen (spätere Phase)

- Gestaltete öffentliche Website (Startseite, Verzeichnis + Schweizer Karte,
  News-Anzeige, designte Formular-Seiten, Browser-Sprach-Erkennung).
- Genaue Formularfelder + finale Empfänger-E-Mail-Adressen.
