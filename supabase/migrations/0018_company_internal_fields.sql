-- Firmen-interne Angaben gehören an die Firma, nicht an eine Person.
--
-- `membership_fee` und `internal_notes` lagen in member_internal_profiles.
-- Solange dort genau eine Zeile je Firma stand (position = 1), ging das
-- durch. Seit es mehrere Kontakte mit Rollen gibt (Migration 0017), ist diese
-- Zeile aber der HAUPTKONTAKT — der Mitgliederbeitrag hing damit an einer
-- Person. Wer den Hauptkontakt wechselt, hätte den Beitrag mitverschoben.
--
-- Beide wandern deshalb nach `members`, zusammen mit der in Migration 0015
-- ergänzten Mitarbeiterzahl. Übrig bleiben in member_internal_profiles
-- ausschliesslich Angaben zur Person.
--
-- Nicht öffentlich: keine dieser Spalten wird je auf der Website gelesen.

alter table public.members
  add column if not exists membership_fee text,
  add column if not exists internal_notes text;

-- Bestand vom Hauptkontakt auf die Firma heben.
update public.members m
set membership_fee = p.membership_fee,
    internal_notes = p.internal_notes
from public.member_internal_profiles p
where p.member_id = m.id
  and 'main' = any (p.roles)
  and (p.membership_fee is not null or p.internal_notes is not null);

-- Falls eine Firma keinen markierten Hauptkontakt hat: aus der ersten Position.
update public.members m
set membership_fee = coalesce(m.membership_fee, p.membership_fee),
    internal_notes = coalesce(m.internal_notes, p.internal_notes)
from public.member_internal_profiles p
where p.member_id = m.id
  and p.position = 1
  and m.membership_fee is null
  and m.internal_notes is null;

alter table public.member_internal_profiles
  drop column if exists membership_fee,
  drop column if exists internal_notes;

comment on column public.members.membership_fee is
  'Mitgliederbeitrag — intern, erscheint nicht auf der öffentlichen Website.';
comment on column public.members.internal_notes is
  'Interne Notizen zur Firma — erscheinen nicht auf der öffentlichen Website.';
