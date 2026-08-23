-- Mitarbeiterzahl der Firma.
--
-- Wird im "Mitglied werden"-Formular erhoben (Abschnitt 7) und ist eine
-- interne Angabe: sie erscheint im Admin-Portal und im Export, aber nicht auf
-- der öffentlichen Website. Sie hängt an der Firma, nicht an einer Person —
-- deshalb `members` und nicht `member_internal_profiles`.
--
-- Bewusst `integer` und nicht `text`: die Zahl wird sortiert und exportiert.
-- Wer eine Spanne festhalten will, hat dafür die internen Notizen.

alter table public.members
  add column if not exists employee_count integer;

comment on column public.members.employee_count is
  'Mitarbeiterzahl — intern, erscheint nicht auf der öffentlichen Website.';
