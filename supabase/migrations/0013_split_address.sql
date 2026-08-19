-- Adresse in Einzelfelder zerlegen: Strasse, Hausnummer, PLZ, Ort.
--
-- `members.address` war ein einziges Freitextfeld. Für Export, Serienbriefe
-- und eine saubere Anzeige brauchen wir die Bestandteile getrennt.
--
-- `members.address` bleibt als Archiv des Originaltexts erhalten und wird von
-- der Anwendung weiterhin mitgeschrieben (aus den Einzelfeldern gebaut), aber
-- nicht mehr gelesen. So geht bei der Umstellung nichts verloren und externe
-- Leser brechen nicht weg.
--
-- Die Zerlegung des Bestands passiert NICHT hier, sondern in
-- `scripts/backfill-addresses.ts` — dort läuft derselbe, unit-getestete Parser
-- wie in der Anwendung (src/lib/address.ts). Eine zweite Regex-Implementierung
-- in SQL würde unweigerlich von ihr abweichen.
--
-- Deshalb gilt hier: alles mit einer Freitext-Adresse wird zunächst als
-- ungeprüft markiert. Der Backfill setzt das Flag nur dort zurück, wo PLZ und
-- Ort sicher bestimmt werden konnten. Wird der Backfill nie ausgeführt, steht
-- jede Adresse zur Handprüfung — nicht verstümmelt.

alter table public.members
  add column if not exists street_name          text,
  add column if not exists street_number        text,
  add column if not exists postal_code          text,
  add column if not exists city                 text,
  add column if not exists address_needs_review boolean not null default false;

update public.members
set address_needs_review = true
where address is not null and btrim(address) <> '';

comment on column public.members.address is
  'Archiv der ursprünglichen Freitext-Adresse. Wird aus den Einzelfeldern mitgeschrieben, aber nicht mehr gelesen.';
comment on column public.members.address_needs_review is
  'true = die Adresse konnte nicht zuverlässig zerlegt werden und braucht eine Handprüfung im Admin-Portal.';

-- Land entfällt ersatzlos. Der Verband ist schweizerisch; das Feld stand in
-- 32 von 33 gefüllten Zeilen auf "CH" und in einer auf "FL".
alter table public.member_internal_profiles
  drop column if exists country;
