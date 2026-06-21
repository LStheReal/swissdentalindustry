-- Interne Mitgliedsdaten aus der ASDI-Mitgliederliste.
-- Diese Daten sind bewusst von public.members getrennt, damit die Website nur
-- die öffentlichen Profildaten liest und rendert.

create table if not exists public.member_internal_profiles (
  member_id           uuid primary key references public.members (id) on delete cascade,
  member_number       text,
  contact_title       text,
  contact_first_name  text,
  contact_last_name   text,
  contact_job_title   text,
  street_name         text,
  street_number       text,
  postal_code         text,
  city                text,
  country             text,
  direct_phone        text,
  direct_email        text,
  membership_fee      text,
  internal_notes      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists t_member_internal_profiles_updated on public.member_internal_profiles;
create trigger t_member_internal_profiles_updated before update on public.member_internal_profiles
  for each row execute function public.touch_updated_at();

alter table public.member_internal_profiles enable row level security;

create policy internal_profiles_admin_all on public.member_internal_profiles
  for all using (public.is_admin()) with check (public.is_admin());
