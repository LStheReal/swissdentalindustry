-- Mehrere Kontaktpersonen pro Partner.
--
-- Bisher war `member_id` Primary Key — pro Firma war damit genau ein interner
-- Datensatz möglich. Ein Partner hat aber mehrere Ansprechpersonen. Die Tabelle
-- bekommt deshalb eine eigene `id` und eine `position` (1, 2, 3 … je Firma).
--
-- Rein additiv: bestehende Zeilen behalten ihre Daten und werden Position 1.
-- Firmendaten (Adresse, Logo, Website) bleiben unverändert an `members`.

alter table public.member_internal_profiles
  add column if not exists id uuid not null default gen_random_uuid();

alter table public.member_internal_profiles
  add column if not exists position integer not null default 1;

-- Primary Key von member_id auf id umhängen. Der Fremdschlüssel auf members
-- bleibt davon unberührt (eigenes Constraint, inline in 0008 definiert).
alter table public.member_internal_profiles
  drop constraint if exists member_internal_profiles_pkey;

alter table public.member_internal_profiles
  add constraint member_internal_profiles_pkey primary key (id);

-- Eine Position darf es pro Firma nur einmal geben.
create unique index if not exists member_internal_profiles_member_position_idx
  on public.member_internal_profiles (member_id, position);

create index if not exists member_internal_profiles_member_idx
  on public.member_internal_profiles (member_id);

-- Bestandsdaten: alles, was es schon gibt, ist Position 1.
update public.member_internal_profiles set position = 1 where position is null;
