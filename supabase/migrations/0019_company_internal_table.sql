-- Firmen-interne Angaben gehören NICHT in `members`.
--
-- Migration 0018 hat membership_fee und internal_notes (und 0015 zuvor
-- employee_count) als Spalten an `members` gehängt. Das war falsch: `members`
-- wird über den öffentlichen anon-Key gelesen, und die RLS-Policy erlaubt für
-- veröffentlichte Firmen ALLE Spalten. Der Mitgliederbeitrag und die internen
-- Notizen waren damit öffentlich abrufbar.
--
-- Aufgefallen ist das durch tests/db/anon-grants.test.ts, der genau diese
-- Felder gegen den anon-Key prüft.
--
-- Spaltenweise Rechte wären brüchig — eine neue Spalte wäre sofort wieder
-- öffentlich. Stattdessen dieselbe Bauweise wie bei member_internal_profiles:
-- eigene Tabelle, RLS nur für Admins. `members` bleibt damit rein öffentlich,
-- und was intern ist, ist es durch seine Lage.

create table if not exists public.member_company_internal (
  member_id      uuid primary key references public.members (id) on delete cascade,
  employee_count integer,
  membership_fee text,
  internal_notes text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists t_member_company_internal_updated on public.member_company_internal;
create trigger t_member_company_internal_updated
  before update on public.member_company_internal
  for each row execute function public.touch_updated_at();

alter table public.member_company_internal enable row level security;

drop policy if exists company_internal_admin_all on public.member_company_internal;
create policy company_internal_admin_all on public.member_company_internal
  for all using (public.is_admin()) with check (public.is_admin());

-- Bestand hinüberziehen, bevor die Spalten fallen.
insert into public.member_company_internal (member_id, employee_count, membership_fee, internal_notes)
select id, employee_count, membership_fee, internal_notes
from public.members
where employee_count is not null
   or membership_fee is not null
   or internal_notes is not null
on conflict (member_id) do update
set employee_count = excluded.employee_count,
    membership_fee = excluded.membership_fee,
    internal_notes = excluded.internal_notes;

alter table public.members
  drop column if exists employee_count,
  drop column if exists membership_fee,
  drop column if exists internal_notes;
