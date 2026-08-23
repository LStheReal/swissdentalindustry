<!-- Managed with AIOS · brain/projects/swissdentalindustry.md -->
# TODO — swissdentalindustry

## Done
- [x] Members visible: .env.local now points at the production Supabase (read-only anon key, see docs/backend-anbindung.md) — 36 published members load in v1 & v2; seeding no longer needed
- [x] 2026-07-06 Full project review (security, architecture, UI/UX, features, hygiene) — see next actions below
- [x] 2026-07-06 Fixed broken production build: next.config.ts `import.meta.dirname`, declared `sharp` in package.json, fixed `.sharpen({sigma,m1,m2})` API in storage.ts. `next build` now green (39 routes). NOTE: all edits still uncommitted.

## Done in review session (2026-07-06) — sequence A → D → C → B, all committed
- [x] A: committed build fix; noindex + robots for preview routes; committed v2/docs; gitignored settings.local; CI (tsc+lint+build) in .github/workflows/ci.yml
- [x] D: promoted v2 to main site in place (URLs unchanged). Shared data layer (src/lib/public-data.ts), canonical+hreflang on every page (localeAlternates), getSiteUrl() single source, Header copy via props (no full copy in client bundle). Deleted src/app/v2, styles/sdi, dead sdi components, gsap dep.
- [x] C: edit-token mass-assignment whitelist (confirmChange+approveChange); membership_fee/internal_notes hidden from /edit; sanitizeExternalUrl on write+render (blocks javascript:); rate-limit + honeypot + field caps on /api/forms/*; security headers; xlsx file guard; migration 0010; SECURITY.md
- [x] B: deleted original-upload, scaffold svgs, unused sdi assets, forms-test. Build green at 30 routes.

## Still open — needs YOU (manual / decisions), see SECURITY.md
- [x] Replace vulnerable `xlsx@0.18.5` → official SheetJS 0.20.3 (CDN tarball, integrity-pinned in lockfile; both CVEs fixed; manual updates — see SECURITY.md)
- [x] 2026-07-12 Applied `0010_restrict_anon_grants.sql` via supabase CLI (history repaired 0001–0009 as applied; verified anon read OK / write denied).
- [x] 2026-07-10 Pushed main to github.com/LStheReal/swissdentalindustry (old freshnowch remote dead); deployed to Vercel project `swissdentalindustry`.
- [x] 2026-07-12 Admin access restored: added superadmin louise.schuele@gmail.com (existing admins hello@freshnow.ch + mael.ilai@gmail.com untouched); SUPABASE_SERVICE_ROLE_KEY in .env.local + Vercel envs.
- [x] 2026-07-29 Auto-Übersetzung + Mitglieder-Import laufen jetzt über Claude (Anthropic SDK, `src/lib/ai.ts`) statt DeepSeek; `openai`-Paket entfernt.
- [ ] **DU:** `ANTHROPIC_API_KEY` setzen — lokal in `.env.local`, auf Vercel für Production + Preview (danach redeploy). Ohne Key bleiben Beschreibungen unübersetzt (kein Fehler).
- [ ] **DU:** SMTP-Zugang neu erstellen (SMTP_HOST/PORT/USER/PASS + MAIL_FROM) — lokal und auf Vercel. Bis dahin verschickt die Seite keine Mails.

## 2026-08-23 — Change Request (13 Abschnitte) komplett umgesetzt
Ein Commit je Abschnitt, Migrationen 0013–0019 auf Prod angewendet und verifiziert.
- [x] §1 Personen bei einer Mitgliedsfirma heissen „Kontakte". DB-Spaltennamen bewusst NICHT umbenannt (kein funktionaler Gewinn, hätte das laufende Deployment im Fenster zwischen Migration und Deploy gebrochen). Nebenbefund: interne Feldbeschriftungen waren nur deutsch, wurden aber auf der viersprachigen Edit-Seite gerendert → jetzt mehrsprachig.
- [x] §2 Adresse in Strasse/Nr./PLZ/Ort zerlegt (0013), Land ersatzlos gestrichen. Backfill bevorzugt die bereits zerlegte Adresse aus dem ASDI-Import (33 von 36), Parser nur für den Rest. 36/36 aufgelöst, 0 zur Handprüfung.
- [x] §3 Doppelte Firmennamen entfernt. Ursache NICHT in Übersetzung/Import — kam mit den WordPress-Altdaten. Schutz an jeder Schreibstelle + Reparaturskript mit unabhängigem Detektor (fand die Dentsply-Variante).
- [x] §4 Popup: Label und E-Mail raus, Website-URL rein.
- [x] §5 Edit-Link: Intro, Bestätigungsschritt entfernt (Speichern reicht), kein Datenverlust mehr (sessionStorage), Logo-Darstellung und Responsive repariert. Zwei hartkodierte deutsche Strings auf einer viersprachigen Seite gefunden.
- [x] §6 Entwurf/Veröffentlicht getrennt (0014). Alle Schreibpfade laufen über lib/member-write.ts; nur „Veröffentlichen" macht etwas öffentlich. Test fand dabei einen echten Bypass in der Antrags-Anreicherung.
- [x] §7 Mitglied-werden-Formular exakt nach Feldliste, inkl. „Entspricht der Firmenadresse". Logo nicht mehr Pflicht.
- [x] §8 Logo-Upload-Fehler werden gespeichert und angezeigt; Mail-Protokoll (0016) + Admin-Ansicht.
- [x] §9 Kontakt-Rollen main/billing/marketing (0017), höchstens ein Hauptkontakt je Firma.
- [x] §10 Firmen-interne Felder in eigene geschützte Tabelle (0019) — der erste Versuch (0018, Spalten auf `members`) war ein Datenleck, das der anon-Test sofort meldete.
- [x] §11 Serienmail mit Platzhaltern, Vorschau und Bestätigung.
- [x] §12 Excel-Export mit Filter Haupt-/Rechnungs-/alle Kontakte.
- [x] §13 „EST. 1956" und Footer-Schriftzug entfernt; echter Mobile-Bug im Accordion-Grid behoben; Tap-Ziele 16 → 0 zu klein.

### DU — offen, braucht Zugänge die ich nicht habe
- [ ] **DKIM für freshnow.ch veröffentlichen.** Das ist die Ursache der nicht ankommenden Mails: SPF ist korrekt, DMARC steht auf `p=reject`, DKIM fehlt ganz. Ohne DKIM hängt die Zustellung allein an der SPF-Ausrichtung; bricht die (Weiterleitung, Alias, Relay), verwirft der Empfänger stumm — nachdem Infomaniak schon „250 queued" gemeldet hat.
- [ ] **`rua=` in den DMARC-Record aufnehmen**, sonst entstehen weiterhin keine Reports und niemand erfährt warum.
- [ ] Danach: einen Antrag annehmen und prüfen, ob die Zusage ankommt (Mail-Protokoll unter Einstellungen zeigt jetzt Antwort und Fehler je Nachricht).
- [ ] Fachlich prüfen: Rechnungs- und Marketingkontakte sind noch nirgends vergeben (der Billing-Export ist deshalb leer in den Kontaktspalten).
- [ ] Nur 2 von 36 Mitgliedern haben eine Website-URL hinterlegt — die neue Zeile im Popup bleibt sonst leer.
- [ ] Entscheiden: im Popup stehen jetzt die URL als Text UND der Knopf „Open website". Soll der Knopf weg?

## Tests (2026-07-29)
- [x] Testsuite nach Vorbild EusiApp/Funity: Vitest (`tests/lib|security|db|migrations|meta`) + Playwright (`tests-e2e`), `run-tests.sh`, `npm test` in CI. 128 Vitest- + 10 Browser-Tests, alle grün. Details: `docs/testing.md`.
- [x] Backend verifiziert: 36 Mitglieder lesbar, anon-Schreibzugriff gesperrt, Schema deckt sich mit dem Code, Admin-Portal ohne Session gesperrt, alle Admin-Actions rufen `requireAdmin()`.
- [x] Bug gefunden+behoben: `/api/forms/mitwirken` warf 500 und **verwarf die Einsendung**, wenn SMTP fehlt. Speichert jetzt zuerst in `membership_applications` (wie die anderen Formulare) und behandelt Mailfehler als unkritisch.

## Backlog (not yet done — from architecture review)
- [ ] Caching: pages are still fully dynamic (revalidate=60 is a no-op because headers() forces dynamic). Wrap public-data.ts in unstable_cache/use cache with tags + revalidateTag from admin actions.
- [ ] Robustness: root not-found.tsx + error.tsx (localized); convert admin CRUD actions from throw to typed SubmitState; zod on forms.
- [ ] Data/content (prod DB): remove "Rick Roll" test news; some member descriptions show English on /de (backfill German). FR hero "suisse.Dans" spacing — verify in v2 Hero word-split (may already be fine).
- [ ] Optional: rename "Swistzerland Map.png" (typo) + update SwissMap.tsx; refresh README (still says public site is a later phase).
- [ ] Optional: edit-token hashing + expiry; Content-Security-Policy.

## 2026-07-29 (Fortsetzung)
- [x] Öffentliche URLs englisch: /members, /about, /contact, /join, /privacy, /legal-notice (+ /news). Alte deutsche Slugs und die /en/…-Pfade der alten WordPress-Seite als 301 in next.config.ts.
- [x] Mitglieder-Grid: Reveal blendet 35% Viewport früher ein, Stagger von 9 auf 3 Schritte gekappt, Failsafe für hängengebliebene Karten (wirkte, als sei die Seite zu Ende).
- [x] Passwort-Reset im Admin: /admin/forgot + /admin/reset-password, rate-limited, anti-enumerierend. Supabase verschickt die Mail selbst — kein eigener SMTP nötig.
- [ ] **DU:** In Supabase → Authentication → URL Configuration die Redirect-URL `https://<deine-domain>/admin/reset-password` freigeben (sonst lehnt Supabase den Link ab). Site URL ebenfalls auf die Vercel-/Live-Domain setzen.
- [x] API-Routen englisch: `/api/forms/join`, `/api/forms/collaborate`.

## 2026-07-29 (3) — Antrags-Review-Flow
- [x] Migration `0011_application_review_flow.sql` (angewendet auf Prod): `kind` trennt Anträge von Kontaktanfragen, `logo_url`/`rejection_reason`/`reviewed_at`/`member_id` für die Entscheidung.
- [x] `/join`-Formular erhebt alle öffentlich sichtbaren Felder + Firmenlogo (max 4 MB, PNG/JPG/SVG/WebP) und schickt die Sprache mit.
- [x] Admin → Anträge: Karte pro Antrag mit Vorschau; **Annehmen** legt das Mitglied an, füllt das interne Profil, erzeugt den Self-Service-Link und mailt die Zusage; **Ablehnen** mailt die Begründung. Mailfehler machen die Entscheidung nicht rückgängig.
- [x] Entscheidungsmails gehen in der Sprache raus, in der der Antrag gestellt wurde.
- [x] Tests: jede im Frontend gefetchte /api-URL muss als Route existieren (genau der Bug, der nach der Umbenennung Einsendungen still verschluckte); Probe-Requests lösen den Honeypot aus (keine Müll-Anträge mehr in Prod); Schema-Test deckt die neuen Spalten ab. 122 Vitest-Tests grün, Build grün (32 Routen).
- [x] 2026-08-11 SMTP steht: Infomaniak (hello@freshnow.ch) lokal in `.env.local` und auf Vercel (Production + Preview). Mails gehen raus.

## 2026-08-11 — Mail-Flow end-to-end repariert
- [x] **Zusage-Mail ging verloren.** Sie stand am Ende eines `after()`-Blocks hinter Übersetzung + Geocoding. Beweis: `members.updated_at` lag 6.6s nach dem Anlegen (Anreicherung lief also durch), die Mail danach kam trotzdem nie an — während Absage und manueller Link-Versand, die synchron schicken, ankamen. Fünf Probe-Deployments (after+redirect, +revalidatePath, echtes Template mit Logo-Anhang) liefen alle grün, liessen sich also nicht nachstellen. Konsequenz: kritischer Versand läuft jetzt **synchron vor dem Redirect**, nur Übersetzung/Geocoding bleiben in `after()`. Gleiche Stelle in `createMember` mitgefixt.
- [x] **Edit-Link war ungültig.** `sendEditLinkToMember` rotierte bei jedem Klick den Token und widerrief den alten — zweimal "Link senden" machte den Link aus der ersten Mail tot. Nutzt jetzt `activeEditTokenFor` (wiederverwenden statt rotieren); zum bewussten Rotieren gibt es weiterhin `generateEditLink` / `revokeEditLink`.
- [x] **Locale-Präfix aus Edit-URLs entfernt.** `/en/edit/<token>` ist keine Route und lief nur über einen 307-Umweg; die Seite bestimmt die Sprache ohnehin aus `member.source_lang`.
- [x] Die "zwei Mails, eine deutsch eine englisch" waren **kein Bug**: beide Absagen waren englisch (nur der von Louise getippte Grund war deutsch), und die zweite war eine Test-Mail von 08:04 — Gmail hat sie wegen gleichem Betreff in einen Thread gelegt.
- [x] Regressionstest `tests/lib/critical-mail-delivery.test.ts` hält fest: Zusage-/Willkommens-Mail nie in `after()`, Link-Versand rotiert nicht, keine Locale-Präfixe in Edit-URLs. 172 Vitest-Tests grün, tsc grün.
## 2026-08-11 (2) — Mailversand liegt beim Provider, nicht am Code
- [x] Bewiesen: die App übergibt die Mail erfolgreich, Infomaniak quittiert mit `250 2.0.0 Ok: queued as …` — und stellt sie trotzdem nicht zu. Dieselbe Zusage-Vorlage von zwei verschiedenen Rechnern (Laptop 09:59, Vercel 09:52/09:55) kam nie an, während eine schlichte Testmail um 09:57 dazwischen ankam. Fünf Probe-Deployments (after+redirect, revalidatePath, echtes Template mit Logo) liefen alle grün. Limit laut Infomaniak: 100 Mails/24h (Free/Starter), 1440 (bezahlt) — wir lagen unter 20, es sieht eher nach Ausgangs-Content-Filter aus.
- [ ] **DU/Nächster Schritt:** auf einen Transaktions-Dienst wechseln (Resend oder Postmark) mit verifizierter Absenderdomain. Entscheidender Vorteil: Zustellprotokoll pro Nachricht statt Raten. Betrifft nur `src/lib/email.ts`.

## 2026-08-13/14 — Testdaten aufgeräumt, alles deployed
- [x] 13 Test-Mitglieder gelöscht (u.a. 10 leere "Neue Firma"-Zeilen, die live auf der Seite standen, sowie "TEst" und "asdg") + 5 Test-Anträge. Stand jetzt: **35 Mitglieder, alle published, 0 Entwürfe**, 33 Ansprechpersonen, keine verwaisten Profile.
- [x] **Echter Fund:** die Testsuite schrieb bei *jedem* Lauf eine leere Kontaktanfrage in die **Produktionsdatenbank**. `isDevServerUp()` in `tests/setup.ts` schickte ein leeres `{}` an `/api/forms/contact`; der Honeypot griff nicht, also wurde `{"source":"public_contact"}` gespeichert — vier solcher Geister-Anfragen lagen im Admin. Der Probe füllt jetzt das Honeypot-Feld: gleiche Antwort, aber nichts wird gespeichert. Die vier Zeilen sind gelöscht (0 Anfragen).
- [x] Regressionstest `tests/meta/probe-writes-nothing.test.ts` — verifiziert scharf: mit dem alten `{}`-Body schlägt er fehl, mit dem Fix ist er grün.
- [x] 175 Vitest-Tests grün (inkl. der 12 Security-Tests, die vorher still übersprungen wurden), tsc exit 0, Build grün (32 Routen). Prod deployed aus `65e55eb`.
- [ ] Notiz: In `.next` tauchen wiederholt macOS-Duplikate auf (`routes.d 3.ts`), die `tsc` mit falschen Fehlern rot machen. Bei Bedarf: `find .next -name "* [0-9].ts" -delete`.

## 2026-08-11 (3) — Mehrere Ansprechpersonen pro Partner
- [x] Migration `0012_multiple_contact_persons.sql` auf Prod angewendet: `member_internal_profiles` hat jetzt eigene `id` + `position`, `member_id` ist nicht mehr Primary Key, unique `(member_id, position)`. Alle 36 Bestandszeilen erhalten, alle auf Position 1 — vorher/nachher verglichen.
- [x] Neue Helfer `listContactPersons` / `addContactPerson` / `updateContactPerson` / `deleteContactPerson`. Die alten Einzelprofil-Funktionen arbeiten weiterhin auf Position 1, damit Self-Service-Formular, Feed, Import und Mails unverändert funktionieren.
- [x] Admin → Mitglied: Abschnitt „Mitglieder" mit Liste der Ansprechpersonen und Knopf „+ Mitglied hinzufügen"; Nummer läuft automatisch (1, 2, 3 je Firma). Firmenfelder (Adresse, PLZ, Ort, Beitrag, Notizen) bleiben im Firmenformular.
- [x] Firmenformular speichert jetzt zusammenführend statt überschreibend — sonst hätte ein Speichern Person 1 geleert.
- [x] Zusage legt die Kontaktperson aus dem Antrag als Mitglied 1 an; die Adresse wird bewusst NICHT auf die Person kopiert.
- [x] `member_since` wird beim Annehmen automatisch auf das Aufnahmedatum gesetzt.
- [x] Gegen die echte Prod-DB verifiziert: 3 Personen anlegen → Nummerierung 1/2/3, Firmenformular-Speichern lässt alle bestehen, Einzelprofil liefert weiterhin Person 1. Anon kann interne Profile weiterhin nicht lesen (RLS nach Migration geprüft). 172 Tests + Build grün, deployed.
- [x] Test-Mitglieder „TEst" und „asdg" auf draft gesetzt (waren im öffentlichen Verzeichnis) — 46 veröffentlichte Mitglieder. Reversibel.
- [ ] **DU:** Einmal im Admin einen Antrag annehmen und prüfen, dass die Zusage-Mail ankommt — geht erst zuverlässig nach dem Provider-Wechsel.
