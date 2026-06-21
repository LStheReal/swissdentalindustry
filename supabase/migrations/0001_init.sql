-- ════════════════════════════════════════════════════════════════════════════
-- Swiss Dental Industry — Initiales Schema
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─── Superadmins ──────────────────────────────────────────────────────────────
-- Ein Auth-User ist Superadmin, wenn er hier eingetragen ist.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- Helper: ist der aktuell eingeloggte User ein Superadmin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- ─── Mitglieder-Firmen (Live-Stand) ──────────────────────────────────────────
create table if not exists public.members (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  logo_url     text,
  description  jsonb not null default '{"de":"","fr":"","it":"","en":""}',
  address      text,
  phone        text,
  email        text,
  website_url  text,
  lat          double precision,
  lng          double precision,
  canton       text,
  source_lang  text not null default 'de',
  status       text not null default 'published' check (status in ('draft','published')),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── Self-Service Edit-Tokens (permanente Public-URLs) ───────────────────────
create table if not exists public.member_edit_tokens (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.members (id) on delete cascade,
  token      text not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
-- Pro Firma höchstens ein aktiver Token.
create unique index if not exists one_active_token_per_member
  on public.member_edit_tokens (member_id) where is_active;

-- ─── Änderungsvorschläge aus dem Self-Service ────────────────────────────────
create table if not exists public.member_change_requests (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references public.members (id) on delete cascade,
  proposed      jsonb not null,
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  contact_email text,
  submitted_at  timestamptz not null default now(),
  reviewed_at   timestamptz
);
create index if not exists idx_change_requests_status
  on public.member_change_requests (status, submitted_at desc);

-- ─── News ─────────────────────────────────────────────────────────────────────
create table if not exists public.news (
  id           uuid primary key default gen_random_uuid(),
  title        jsonb not null default '{"de":"","fr":"","it":"","en":""}',
  body         jsonb not null default '{"de":"","fr":"","it":"","en":""}',
  image_url    text,
  source_lang  text not null default 'de',
  is_published boolean not null default true,
  published_at timestamptz default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── "Mitglied werden"-Anträge ───────────────────────────────────────────────
create table if not exists public.membership_applications (
  id         uuid primary key default gen_random_uuid(),
  payload    jsonb not null,
  status     text not null default 'new' check (status in ('new','converted','archived')),
  created_at timestamptz not null default now()
);

-- ─── Globale Einstellungen (Single-Row) ──────────────────────────────────────
create table if not exists public.app_settings (
  id                 int primary key default 1 check (id = 1),
  mitwirken_email    text,
  membership_email   text,
  updated_at         timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict do nothing;

-- ─── updated_at automatisch pflegen ──────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists t_members_updated on public.members;
create trigger t_members_updated before update on public.members
  for each row execute function public.touch_updated_at();

drop trigger if exists t_news_updated on public.news;
create trigger t_news_updated before update on public.news
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- Schreibvorgänge laufen serverseitig über den Service-Role-Key (umgeht RLS).
-- Diese Policies regeln Lesezugriff: öffentlich nur veröffentlichte Daten,
-- Superadmins sehen/ändern alles über die Cookie-Session.
-- ════════════════════════════════════════════════════════════════════════════
alter table public.members                enable row level security;
alter table public.member_edit_tokens     enable row level security;
alter table public.member_change_requests enable row level security;
alter table public.news                   enable row level security;
alter table public.membership_applications enable row level security;
alter table public.app_settings           enable row level security;
alter table public.admins                 enable row level security;

-- members: öffentlich lesbar wenn veröffentlicht+aktiv; Admins alles.
create policy members_public_read on public.members
  for select using (status = 'published' and is_active);
create policy members_admin_all on public.members
  for all using (public.is_admin()) with check (public.is_admin());

-- news: öffentlich lesbar wenn veröffentlicht; Admins alles.
create policy news_public_read on public.news
  for select using (is_published);
create policy news_admin_all on public.news
  for all using (public.is_admin()) with check (public.is_admin());

-- Restliche Tabellen: nur Admins lesen/ändern (Self-Service nutzt Service-Role).
create policy tokens_admin_all on public.member_edit_tokens
  for all using (public.is_admin()) with check (public.is_admin());
create policy changes_admin_all on public.member_change_requests
  for all using (public.is_admin()) with check (public.is_admin());
create policy applications_admin_all on public.membership_applications
  for all using (public.is_admin()) with check (public.is_admin());
create policy settings_admin_all on public.app_settings
  for all using (public.is_admin()) with check (public.is_admin());
create policy admins_self_read on public.admins
  for select using (user_id = auth.uid());

-- ─── Storage-Buckets (öffentlich lesbar; Upload via Service-Role) ────────────
insert into storage.buckets (id, name, public)
  values ('logos', 'logos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('news', 'news', true) on conflict (id) do nothing;
