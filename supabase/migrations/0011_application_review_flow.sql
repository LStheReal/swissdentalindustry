-- Mitglieds-Anträge: vom "roh gespeicherten Payload" zum echten Review-Flow.
--
-- Vorher: jede öffentliche Formular-Einsendung (Mitgliedsantrag, Kontakt,
-- Mitwirken) landete unsortiert in derselben Tabelle, und "In Mitglied
-- umwandeln" schaltete die Firma ohne Kontrolle sofort live.
--
-- Nachher: Anträge sind von Kontaktanfragen unterscheidbar (`kind`), tragen
-- ihre strukturierten Felder mit (inkl. Logo), und der Admin nimmt sie an oder
-- lehnt sie ab — mit Begründung und Verweis auf das erzeugte Mitglied.

-- 1. Art der Einsendung. Bestehende Zeilen anhand des payload.source-Feldes
--    einsortieren, das die Formulare bisher mitgeschickt haben.
alter table public.membership_applications
  add column if not exists kind text not null default 'membership';

update public.membership_applications
set kind = 'inquiry'
where payload->>'source' in ('public_contact', 'public_mitwirken');

alter table public.membership_applications
  drop constraint if exists membership_applications_kind_check;
alter table public.membership_applications
  add constraint membership_applications_kind_check
  check (kind in ('membership', 'inquiry'));

-- 2. Review-Metadaten.
alter table public.membership_applications
  add column if not exists logo_url text,
  add column if not exists rejection_reason text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists member_id uuid references public.members(id) on delete set null;

-- 3. Status um 'approved'/'rejected' erweitern. 'converted' bleibt gültig,
--    damit vor dieser Migration umgewandelte Anträge nicht ungültig werden.
alter table public.membership_applications
  drop constraint if exists membership_applications_status_check;
alter table public.membership_applications
  add constraint membership_applications_status_check
  check (status in ('new', 'converted', 'approved', 'rejected', 'archived'));

-- 4. Der Feed sortiert nach Eingang und filtert nach Art/Status.
create index if not exists membership_applications_kind_status_idx
  on public.membership_applications (kind, status, created_at desc);
