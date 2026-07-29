# Admin Portal — User Guide (Swiss Dental Industry)

*How the superadmin portal at `/admin` works: every section, feature, and workflow.*
*Written 2026-07-12, matches the current code.*

---

## Getting in

- **URL**: `<your-domain>/admin` (locally `localhost:3000/admin`)
- **Login**: Supabase email + password. Only accounts listed in the `admins` table get past the login — anyone else sees "no superadmin permission".
- The whole `/admin` area is protected twice: a proxy guard on every request, and each page re-checks your admin status server-side.
- **Portal language**: the interface itself is available in DE / FR / IT / EN — switch it with the locale switcher in the navigation (stored per browser).

## Dashboard (`/admin`)

Your landing page after login. Shows a time-of-day greeting (Zurich time), quick stats, and the most recent activity: pending change requests and new membership applications, each linking straight to the item. Use it as your daily "what needs my attention" view.

---

## Mitglieder / Members (`/admin/members`)

The heart of the portal — the member-company directory that feeds the public website.

**Create** (`/members/new`): enter name, address, contact details, description, and upload a logo. On save, two things happen automatically:
- **Auto-translation**: the description is translated into all four languages (DE/FR/IT/EN) via DeepSeek. If translation fails, the original text is kept as fallback for all languages.
- **Geocoding**: the address is turned into map coordinates + canton (via OpenStreetMap), so the company appears on the Swiss map.

**Edit** (`/members/[id]`): change any field; if you edit the description, it re-translates. You can also trigger a manual re-translation. Internal-only fields (membership fee, internal notes) live here too — they are never exposed publicly or to the company itself.

**Publish / status**: members are created as drafts. Only after you publish them (`status = published` + active) do they appear on the public site. Deleting a member removes it permanently — prefer unpublishing if unsure.

**Edit links (self-service)**: per member you can
- **generate** a permanent edit link (`/edit/<token>`),
- **email** it to the company directly from the portal,
- **revoke** it anytime (old link stops working; generate a new one if needed).

**Spreadsheet import** (`/members/import`): upload an Excel/CSV file to create many members at once. They arrive as **drafts** — review, complete, and publish them individually. (Uses the security-patched SheetJS; the file type/size is validated.)

## News (`/admin/news`)

Three kinds of posts, all with auto-translation of title/body into the four languages:

- **Article** (`/news/new`): title, text, and an image upload.
- **Link post** (`/news/new-link`): a headline pointing to an external URL.
- **YouTube post** (`/news/new-youtube`): embeds a video.

News go **live immediately** on publish (no approval step). You can edit, temporarily deactivate (hide without deleting), or delete each post.

## Änderungs-Feed / Change feed (`/admin/feed`)

Where company-submitted edits land (from their self-service edit links). Nothing a company submits goes live by itself — it always waits here.

- Each request shows a **diff**: current value ↔ proposed value, field by field.
- **Approve**: the changes are written to the member record (only whitelisted fields — companies can never touch fee, notes, status, etc.), the description is re-translated if it changed, and the company receives a **confirmation email**.
- **Reject**: nothing is applied; the request is closed.

## Anträge / Applications (`/admin/applications`)

Submissions from the public "Mitglied werden" (become a member) form.

- **Convert**: one click turns an application into a draft member record (you then complete and publish it in Members).
- **Archive**: keep it but move it out of the way.
- **Delete**: remove it permanently.

## Einstellungen / Settings (`/admin/settings`)

- **Form recipients**: which email addresses receive the contact / mitwirken / membership form submissions, plus a separate admin-notification address.
- **Email test mode**: when enabled, all outgoing emails go to your test recipients instead of real ones — useful for trying things without emailing companies.
- **Admins** (`/settings/admins`): invite additional superadmins by email (they get an invite link and set their password at `/admin/accept-invite`) or remove existing ones. Current admins: hello@freshnow.ch, mael.ilai@gmail.com, louise.schuele@gmail.com.

---

## Outside the portal (related pieces)

**Self-service editing** (`/edit/<token>`) — no login needed. A company opens its permanent link and can propose changes to its logo, description, and contact data. They see a preview/confirm step; on confirm, the proposal goes into your change feed (replacing any still-open proposal from them). Sensitive fields are hidden and blocked server-side.

**Form endpoints** (`/api/forms/contact`, `/mitwirken`, `/mitglied-werden`) — the public website posts here. Each sends an email to the configured recipients (with the sender as reply-to); contact and membership submissions are also stored. Protected by rate-limiting, a honeypot field, and length caps.

## Behind the scenes (good to know)

- **Writes** all go through the server with the service-role key; the public anon key can only read published content (hardened by migration 0010, applied 2026-07-12).
- ⚠️ **Emails** need `SMTP_*` env vars and **translation** needs `ANTHROPIC_API_KEY` — as of 2026-07-29 neither is configured (locally or on Vercel), so email sending and auto-translation will fail until those keys are added. Members still save fine; descriptions just stay untranslated.
- **Geocoding** needs no key (OpenStreetMap).
