# Backend-Anbindung: Swiss Dental Industry

Diese Anleitung beschreibt, wie eine neue Website an das bestehende Backend
(Supabase-Datenbank + Admin-Portal von swissdentalindustry.ch) angebunden wird.

---

## Was das Backend liefert

Das Admin-Portal pflegt Inhalte in einer **Supabase**-Datenbank. Die neue
Website liest diese Inhalte direkt aus Supabase (nur Lesen) und schickt
Formulare an bestehende API-Endpunkte des Portals.

Öffentlich lesbare Inhalte:

| Tabelle  | Inhalt                          | Sichtbar wenn                     |
|----------|---------------------------------|-----------------------------------|
| `members`| Mitglieder-Firmen               | `status = 'published'` & `is_active = true` |
| `news`   | News-Beiträge                   | `is_published = true`             |

Bilder liegen in öffentlichen Storage-Buckets: `logos` (Firmenlogos) und
`news` (News-Bilder). Die `logo_url` / `image_url` in der Datenbank sind bereits
fertige öffentliche URLs.

Mehrsprachige Felder (`description`, `title`, `body`) sind **JSONB** mit den
Schlüsseln `de`, `fr`, `it`, `en`, z. B.:

```json
{ "de": "Beschreibung", "fr": "Description", "it": "...", "en": "..." }
```

---

## Zugangsdaten

Diese zwei Werte sind für den Browser bestimmt und dürfen in der neuen Website
verwendet werden:

```
NEXT_PUBLIC_SUPABASE_URL=https://uexcdcyufgdugsjbqirt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVleGNkY3l1ZmdkdWdzamJxaXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NDUyNjYsImV4cCI6MjA5NzUyMTI2Nn0.0gUYIY6meors1bpTEOjppqz1Ej3kajGUI0vS6WFUQfI
```

> ⚠️ **NIEMALS** den `SUPABASE_SERVICE_ROLE_KEY`, SMTP-Zugangsdaten oder
> DeepSeek-Key in die neue Website aufnehmen. Der anon-Key oben reicht für den
> Lesezugriff völlig aus. Der Service-Role-Key umgeht alle Sicherheitsregeln
> und darf ausschliesslich im Admin-Portal bleiben.

---

## Schritt-für-Schritt

### 1. Supabase-Client installieren

```bash
npm install @supabase/supabase-js
```

### 2. Zugangsdaten als Umgebungsvariablen ablegen

Datei `.env.local` (bzw. `.env`) im Projekt der neuen Website:

```
NEXT_PUBLIC_SUPABASE_URL=https://uexcdcyufgdugsjbqirt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVleGNkY3l1ZmdkdWdzamJxaXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NDUyNjYsImV4cCI6MjA5NzUyMTI2Nn0.0gUYIY6meors1bpTEOjppqz1Ej3kajGUI0vS6WFUQfI
```

Bei einem anderen Framework als Next.js entsprechend das dortige Präfix
verwenden (z. B. `VITE_` bei Vite). Der Wert bleibt identisch.

### 3. Supabase-Client anlegen

```js
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
```

### 4. Mitglieder auslesen

```js
const { data: members, error } = await supabase
  .from("members")
  .select("id, name, logo_url, description, address, phone, email, website_url, lat, lng, canton")
  .order("name");
// Nur veröffentlichte, aktive Firmen kommen zurück (durch Sicherheitsregeln).
// Beschreibung in gewünschter Sprache: members[0].description.de
```

### 5. News auslesen

```js
const { data: news } = await supabase
  .from("news")
  .select("id, title, body, image_url, published_at")
  .order("published_at", { ascending: false });
// Titel/Text mehrsprachig: news[0].title.de, news[0].body.de
```

### 6. Bilder anzeigen

`logo_url` und `image_url` sind fertige öffentliche URLs — direkt als
`src` verwenden:

```html
<img src="{member.logo_url}" alt="{member.name}" />
```

### 7. Formulare absenden (Kontakt / Mitwirken / Mitglied werden)

Formulare gehen **nicht** direkt an Supabase, sondern an die API-Endpunkte des
Portals (dort läuft Speichern + E-Mail-Versand). Basis-URL ist die Domain, unter
der das Admin-Portal / die Next.js-App deployt ist (produktiv:
`https://swissdentalindustry.ch`, lokal `http://localhost:3000`).

| Zweck            | Endpunkt (POST)                  | Speichert in DB | Sendet E-Mail |
|------------------|----------------------------------|-----------------|---------------|
| Kontaktformular  | `/api/forms/contact`             | ja              | ja            |
| Mitwirken        | `/api/forms/mitwirken`           | nein            | ja            |
| Mitglied werden  | `/api/forms/mitglied-werden`     | ja              | ja            |

Sendet ein flaches JSON-Objekt (beliebige Felder; `email` wird als Reply-To
genutzt):

```js
await fetch("https://swissdentalindustry.ch/api/forms/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Max Muster",
    email: "max@example.ch",
    message: "Hallo …",
  }),
});
// Antwort: { ok: true } bei Erfolg, sonst { error: "..." } mit Status 4xx/5xx
```

> Hinweis: Läuft die neue Website auf einer anderen Domain als das Portal, muss
> für diese POST-Endpunkte ggf. CORS im Portal freigegeben werden. Falls die
> Requests im Browser mit einem CORS-Fehler abbrechen, beim Portal-Betreiber
> melden — dann wird dort ein passender CORS-Header ergänzt.

---

## Testen (Checkpunkt)

1. `members`-Query gibt eine Liste zurück (ggf. leer, wenn noch nichts
   veröffentlicht ist – dann im Admin-Portal eine Firma auf „published" setzen).
2. `news`-Query liefert Beiträge.
3. Ein Logo-Bild lädt über seine `logo_url`.
4. Ein Test-POST an `/api/forms/contact` liefert `{ ok: true }`.

Wenn eine Query leer bleibt, obwohl im Portal Daten vorhanden sind: prüfen, ob
die Einträge wirklich veröffentlicht/aktiv sind — der anon-Key sieht nur
freigegebene Daten (Row Level Security).

---

## Wichtig / Grenzen

- **Nur Lesen** ist mit dem anon-Key möglich. Schreiben in der Datenbank läuft
  ausschliesslich über das Admin-Portal.
- Werden weitere Tabellen/Felder auf der Website benötigt, die aktuell nicht
  öffentlich lesbar sind, muss der Portal-Betreiber die Freigabe (RLS-Policy)
  ergänzen.
- Der anon-Key ist bewusst öffentlich (er steckt im Browser-Code) — die
  Sicherheit kommt aus den Row-Level-Security-Regeln, nicht aus dem Geheimhalten
  des Keys.
