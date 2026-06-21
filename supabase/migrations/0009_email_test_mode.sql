-- Test-Modus für ausgehenden E-Mail-Versand.
-- Solange aktiv, werden Mails nur an die unter email_test_recipients
-- aufgeführten Adressen zugestellt; alle anderen Empfänger werden gedroppt.
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS email_test_mode boolean NOT NULL DEFAULT true;

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS email_test_recipients text;
