<!-- Managed with AIOS · brain/projects/swissdentalindustry.md -->
# TODO — swissdentalindustry

## Done
- [x] Members visible: .env.local now points at the production Supabase (read-only anon key, see docs/backend-anbindung.md) — 36 published members load in v1 & v2; seeding no longer needed
- [x] 2026-07-06 Full project review (security, architecture, UI/UX, features, hygiene) — see next actions below
- [x] 2026-07-06 Fixed broken production build: next.config.ts `import.meta.dirname`, declared `sharp` in package.json, fixed `.sharpen({sigma,m1,m2})` API in storage.ts. `next build` now green (39 routes). NOTE: all edits still uncommitted.

## Next actions (chosen: build fix now, rest planned)
- [ ] Commit the build fix + untracked v2/docs/TODO (currently at risk of loss); add `.claude/settings.local.json` to .gitignore; add CI `next build`
- [ ] Promote v2 → main: extract shared data layer, swap v1 page bodies in place (keep URLs), delete src/app/v2 + styles/sdi + gsap
- [ ] SEO: noindex /v2 & /forms-test NOW; add canonical + hreflang metadata per page; localized titles/descriptions
- [ ] Security: replace vulnerable xlsx; whitelist keys in edit-token `proposed`/`approveChange`; validate website_url scheme (block javascript:); rate-limit /api/forms/*; add security headers; hide internal profile fields from /edit
- [ ] Architecture: data-access layer (dedupe v1/v2/sitemap queries), error/loading/not-found boundaries, real caching (revalidateTag), zod on forms
- [ ] Repo cleanup: delete public/original-upload, next-scaffold svgs, forms-test, dead components (Reveal, MarkerAccent), HeroVariants 2-5, .env.local.bak
- [ ] Data/content: remove "Rick Roll" test news in prod; fix FR hero missing-space ("suisse.Dans"); backfill German member descriptions (some show English on /de)
