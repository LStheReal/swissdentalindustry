-- Datum, seit wann die Firma Mitglied im Verband ist. Wird im Admin-Portal
-- gepflegt und auf der öffentlichen Profilseite angezeigt.
alter table public.members
  add column if not exists member_since date;
