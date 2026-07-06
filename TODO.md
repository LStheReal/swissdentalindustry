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
- [ ] Replace vulnerable `xlsx@0.18.5` — CDN install was blocked by the sandbox; choose source (SheetJS CDN tarball / `@e965/xlsx` npm mirror / exceljs) and run install, then update import in member-import.ts. In-code file guard added as interim mitigation.
- [ ] Apply `supabase/migrations/0010_restrict_anon_grants.sql` in the Supabase SQL editor (revokes anon writes + fail-open default privileges).
- [ ] Push branch + open PR; watch CI go green.

## Backlog (not yet done — from architecture review)
- [ ] Caching: pages are still fully dynamic (revalidate=60 is a no-op because headers() forces dynamic). Wrap public-data.ts in unstable_cache/use cache with tags + revalidateTag from admin actions.
- [ ] Robustness: root not-found.tsx + error.tsx (localized); convert admin CRUD actions from throw to typed SubmitState; zod on forms.
- [ ] Data/content (prod DB): remove "Rick Roll" test news; some member descriptions show English on /de (backfill German). FR hero "suisse.Dans" spacing — verify in v2 Hero word-split (may already be fine).
- [ ] Optional: rename "Swistzerland Map.png" (typo) + update SwissMap.tsx; refresh README (still says public site is a later phase).
- [ ] Optional: edit-token hashing + expiry; Content-Security-Policy.
