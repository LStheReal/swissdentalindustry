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
- [ ] Optional: API-Routen heissen noch deutsch (/api/forms/mitglied-werden, /api/forms/mitwirken) — rein intern, kein Nutzer sieht sie.
