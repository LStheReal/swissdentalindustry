-- Entwurf und veröffentlichter Stand trennen.
--
-- Bisher trug `members` genau eine Fassung des Inhalts. Jedes Speichern im
-- Admin-Portal und jede freigegebene Änderung aus dem Self-Service stand damit
-- unmittelbar auf der öffentlichen Website — es gab keinen Zustand „geprüft,
-- aber noch nicht online".
--
-- Die vorhandenen Spalten bleiben, was sie sind: der VERÖFFENTLICHTE Stand.
-- Genau sie liest die Website, deshalb ändert sich am Lesepfad nichts und es
-- kann durch diese Migration nichts verschwinden. Neu ist `draft`: die noch
-- nicht veröffentlichten Änderungen als Teilmenge derselben Felder.
--
--   draft IS NULL        → der veröffentlichte Stand ist aktuell
--   draft = {...}        → es liegen Änderungen vor, die niemand sieht,
--                          bis ein Admin „Veröffentlichen" klickt
--
-- `status` behält seine Bedeutung ('draft' = war nie online, 'published' =
-- steht im Verzeichnis) und ist bewusst unabhängig davon, ob ein Entwurf
-- anliegt: eine veröffentlichte Firma darf unveröffentlichte Änderungen haben.

alter table public.members
  add column if not exists draft jsonb;

comment on column public.members.draft is
  'Noch nicht veröffentlichte Änderungen an den öffentlichen Feldern. NULL = veröffentlichter Stand ist aktuell. Wird ausschliesslich durch "Veröffentlichen" in die Spalten übernommen.';

-- Bestand: alle 36 Firmen sind live und haben keine offenen Änderungen.
update public.members set draft = null where draft is not null;

-- Der Admin filtert nach „hat unveröffentlichte Änderungen".
create index if not exists members_draft_pending_idx
  on public.members ((draft is not null)) where draft is not null;
