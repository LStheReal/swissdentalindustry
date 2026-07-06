-- Härtet die zu breiten GRANTs aus 0002_grants.sql.
--
-- 0002 vergab `grant all ... to anon` plus `alter default privileges ...
-- grant all ... to anon`. Solange jede Tabelle RLS mit korrekten Policies hat,
-- ist das sicher — aber die Default-Privileges bedeuten: JEDE künftig ohne
-- explizites `enable row level security` angelegte Tabelle wäre für die
-- (öffentliche) anon-Rolle voll les- UND schreibbar. Fail-open.
--
-- Diese Migration entzieht anon die Schreibrechte und die gefährlichen
-- Default-Privileges. Der öffentliche Lesezugriff bleibt über die bestehenden
-- RLS-SELECT-Policies (members/news) erhalten; Schreibzugriff läuft ohnehin nur
-- über den Service-Role-Key im Admin-Portal.

-- Bestehende Tabellen: anon darf nur noch lesen.
revoke insert, update, delete, truncate on all tables in schema public from anon;

-- Künftige Tabellen: keine automatischen Rechte mehr für anon.
alter default privileges in schema public
  revoke all on tables from anon;
alter default privileges in schema public
  grant select on tables to anon;

-- Sequenzen/Routinen muss anon nicht schreiben.
alter default privileges in schema public
  revoke all on sequences from anon;
alter default privileges in schema public
  revoke all on routines from anon;
