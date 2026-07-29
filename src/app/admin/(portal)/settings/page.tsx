import { createClient } from "@/lib/supabase/server";
import { getAdminLocale } from "@/lib/i18n-admin";
import { LocaleSwitcher } from "../LocaleSwitcher";
import { saveSettings } from "./actions";
import { SubmitButton } from "@/components/admin/SubmitButton";

export default async function SettingsPage() {
  const supabase = await createClient();
  const [{ data }, locale] = await Promise.all([
    supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
    getAdminLocale(),
  ]);

  return (
    <div className="space-y-6">
      <section className="max-w-xl space-y-3 rounded-lg border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">
            Portal-Sprache
          </h2>
          <p className="text-xs text-slate-500">
            Sprache der Admin-Oberfläche. Wird pro Benutzer im Browser gespeichert.
          </p>
        </div>
        <LocaleSwitcher current={locale} />
      </section>

      <form action={saveSettings} className="max-w-xl space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">
            Empfänger-E-Mail-Adressen
          </h2>
          <p className="text-xs text-slate-500">
            An diese Adressen werden die ausgefüllten Formulare gesendet.
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            „Mitwirken“-Formular
          </span>
          <input
            name="mitwirken_email"
            type="email"
            defaultValue={data?.mitwirken_email ?? ""}
            placeholder="info@swissdentalindustry.ch"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            „Mitglied werden“-Anträge
          </span>
          <input
            name="membership_email"
            type="email"
            defaultValue={data?.membership_email ?? ""}
            placeholder="info@swissdentalindustry.ch"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Admin-Benachrichtigungen (interne Alerts)
          </span>
          <span className="block text-xs text-slate-500">
            Erhält Mails bei eingereichten Änderungsvorschlägen aus dem
            Self-Service.
          </span>
          <input
            name="admin_notification_email"
            type="email"
            defaultValue={data?.admin_notification_email ?? ""}
            placeholder="admin@swissdentalindustry.ch"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div>
            <h2 className="text-sm font-semibold text-amber-900">
              Test-Modus E-Mail-Versand
            </h2>
            <p className="text-xs text-amber-800">
              Solange aktiv, werden ausgehende Mails nur an die unten
              aufgeführten Adressen zugestellt. Alle anderen Empfänger werden
              stillschweigend verworfen. So lange einlassen, bis die Webseite
              produktiv ist.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <input
              type="checkbox"
              name="email_test_mode"
              defaultChecked={data?.email_test_mode ?? true}
              className="h-4 w-4 rounded border-amber-400"
            />
            Test-Modus aktiv (keine Mails an echte Empfänger)
          </label>

          <label className="block">
            <span className="text-sm font-medium text-amber-900">
              Erlaubte Empfänger
            </span>
            <span className="block text-xs text-amber-800">
              Eine oder mehrere Adressen, getrennt mit Komma, Semikolon oder
              Zeilenumbruch.
            </span>
            <textarea
              name="email_test_recipients"
              rows={3}
              defaultValue={data?.email_test_recipients ?? ""}
              placeholder="mael.ilai@gmail.com"
              className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-sm"
            />
          </label>
        </div>

        <SubmitButton
          pendingLabel="Wird gespeichert …"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Speichern
        </SubmitButton>
      </form>
    </div>
  );
}
