-- Zustellprotokoll für ausgehende Mails + sichtbare Logo-Upload-Fehler.
--
-- ── Warum ein Mail-Log ──
-- Der Versand war bisher blind. Jede Sendestelle fängt Mailfehler ab und
-- loggt sie auf die Konsole — das ist auf Vercel nach kurzer Zeit weg und im
-- Admin-Portal nie sichtbar. Genau deshalb liess sich "die Mail kommt nicht
-- an" nie beantworten: es gab keinen Ort, an dem stand, ob überhaupt
-- gesendet wurde, an wen, und was der Server geantwortet hat.
--
-- Jeder Versuch wird jetzt festgehalten — auch der erfolgreiche, auch der im
-- Test-Modus verworfene.
--
-- ── Warum logo_error ──
-- Der Upload eines Antrags-Logos wird bewusst nicht als Fehler behandelt: die
-- Angaben sind wichtiger als das Bild. Bisher verschwand ein gescheiterter
-- Upload aber spurlos — der Antrag kam mit logo_url = NULL an und im Admin
-- stand "KEIN LOGO", ununterscheidbar davon, dass niemand eines hochgeladen
-- hatte. Der Grund wird jetzt mitgespeichert und angezeigt.

create table if not exists public.mail_log (
  id           uuid primary key default gen_random_uuid(),
  recipient    text not null,
  subject      text not null,
  -- 'sent' = vom SMTP-Server angenommen, 'failed' = Fehler beim Senden,
  -- 'dropped_test_mode' = im Test-Modus nicht zugestellt.
  status       text not null check (status in ('sent', 'failed', 'dropped_test_mode')),
  error        text,
  -- Antwort des SMTP-Servers (z.B. "250 2.0.0 Ok: queued as ABC123").
  provider_response text,
  context      text,
  created_at   timestamptz not null default now()
);

create index if not exists mail_log_created_idx on public.mail_log (created_at desc);
create index if not exists mail_log_status_idx  on public.mail_log (status, created_at desc);

alter table public.mail_log enable row level security;

create policy mail_log_admin_all on public.mail_log
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.membership_applications
  add column if not exists logo_error text;

comment on column public.membership_applications.logo_error is
  'Grund, warum der Logo-Upload fehlgeschlagen ist. NULL = kein Fehler (es wurde entweder eines hochgeladen oder keines mitgeschickt).';
