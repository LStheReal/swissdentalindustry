# Security notes

Status of the hardening pass (2026-07-06) and the manual steps still required.

## Applied in code

- **Edit-link mass assignment** — `confirmChange` (`src/app/edit/[token]/actions.ts`)
  and `approveChange` (`src/app/admin/(portal)/feed/actions.ts`) now whitelist the
  fields that a self-service change request may set. The client-supplied
  `proposed` blob can no longer write arbitrary member columns (`status`,
  `source_lang`, foreign `logo_url`, …).
- **Internal fields** — `membership_fee` and `internal_notes` are never sent to
  the unauthenticated edit link and can't be changed through it
  (`MEMBER_SELF_SERVICE_PROFILE_KEYS`, `stripAdminOnlyFields`).
- **URL scheme validation** — `sanitizeExternalUrl` (`src/lib/url.ts`) is applied
  on write (admin + edit flows) and on render (member profile, news links). Only
  `http:`/`https:` survive, so a stored `javascript:` URL can't execute.
- **Form abuse** — per-IP rate limiting (`src/lib/rate-limit.ts`), a honeypot
  field, field-count/length caps, and `__proto__` key stripping on the three
  `/api/forms/*` endpoints.
- **Security headers** — `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy` in `next.config.ts`.
- **XLSX import** — file extension + 5 MB size guard before parsing
  (`parseMemberImportSpreadsheet`).

## Manual steps still required

### 1. Replace the vulnerable `xlsx` package (HIGH)
`xlsx@0.18.5` has prototype-pollution (CVE-2023-30533) and ReDoS
(CVE-2024-22363) with **no fix on npm** — SheetJS stopped publishing there.
The import path is admin-only, and there's now a type/size guard, but the
package should still be replaced. Pick one, then update the import in
`src/lib/member-import.ts`:

```bash
# Option A — official SheetJS build (not on npm; external CDN):
npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
# Option B — maintained npm mirror:
npm install @e965/xlsx        # import * as XLSX from "@e965/xlsx"
# Option C — switch to exceljs (larger refactor of readSpreadsheet)
```

### 2. Apply the RLS grants migration
Run `supabase/migrations/0010_restrict_anon_grants.sql` in the Supabase SQL
editor. It revokes `anon` write access and the fail-open default privileges
introduced by `0002_grants.sql`. Public reads keep working through the existing
RLS SELECT policies.

### 3. Consider hashing edit tokens (LOW)
Tokens are 256-bit CSPRNG (good) but stored in plaintext and never expire. A DB
read/backup compromise yields working edit links for every member. Store
`sha256(token)` and compare hashes; optionally add an expiry.

### 4. Consider a Content-Security-Policy (LOW)
No CSP yet. The news page embeds a YouTube iframe, so any CSP must allow
`frame-src https://www.youtube.com` and the Supabase/Google image + font hosts.
