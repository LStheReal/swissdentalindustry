-- Rollen für Kontakte: Hauptkontakt, Rechnungskontakt, Marketingkontakt.
--
-- Bisher gab es keine Rollen. „Der Hauptkontakt" war implizit die Zeile mit
-- position = 1 — eine Reihenfolge, die zufällig durch die Reihenfolge der
-- Erfassung entstand. Wer eine Firma mit getrenntem Rechnungskontakt abbilden
-- wollte, konnte das nicht ausdrücken, und der Serienbrief hätte nicht
-- gewusst, wen er anschreibt.
--
-- Ein Kontakt kann mehrere Rollen halten (dieselbe Person ist oft Haupt- UND
-- Rechnungskontakt), deshalb ein Array und keine Spalte je Rolle.

alter table public.member_internal_profiles
  add column if not exists roles text[] not null default '{}';

-- Bestand: position 1 war faktisch der Hauptkontakt.
update public.member_internal_profiles
set roles = array['main']
where position = 1 and (roles is null or roles = '{}');

-- Nur bekannte Rollen. `<@` ist "ist Teilmenge von".
alter table public.member_internal_profiles
  drop constraint if exists member_internal_profiles_roles_valid;
alter table public.member_internal_profiles
  add constraint member_internal_profiles_roles_valid
  check (roles <@ array['main', 'billing', 'marketing']::text[]);

-- Höchstens ein Hauptkontakt je Firma. Der Serienbrief (Abschnitt 11) schreibt
-- „den Hauptkontakt" an — das muss eindeutig sein. Rechnungs- und
-- Marketingkontakte dürfen dagegen mehrfach vorkommen.
create unique index if not exists member_internal_profiles_one_main_idx
  on public.member_internal_profiles (member_id)
  where 'main' = any (roles);

create index if not exists member_internal_profiles_roles_idx
  on public.member_internal_profiles using gin (roles);

comment on column public.member_internal_profiles.roles is
  'Rollen dieses Kontakts: main | billing | marketing. Mehrfachnennung erlaubt; höchstens ein main je Firma.';
