import { createClient } from "@/lib/supabase/server";
import { getAdminT } from "@/lib/i18n-admin";
import { LocaleSwitcher } from "../LocaleSwitcher";
import { saveSettings } from "./actions";
import { SubmitButton } from "@/components/admin/SubmitButton";

export default async function SettingsPage() {
  const supabase = await createClient();
  const [{ data }, { locale, t }] = await Promise.all([
    supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
    getAdminT(),
  ]);

  return (
    <div className="space-y-6">
      <section className="max-w-xl space-y-3 rounded-lg border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">
            {t("settings.portalLanguage")}
          </h2>
          <p className="text-xs text-slate-500">
            {t("settings.portalLanguageHint")}
          </p>
        </div>
        <LocaleSwitcher current={locale} />
      </section>

      <form action={saveSettings} className="max-w-xl space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">
            {t("settings.recipients")}
          </h2>
          <p className="text-xs text-slate-500">
            {t("settings.recipientsHint")}
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            {t("settings.getInvolvedForm")}
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
            {t("settings.membershipForm")}
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
            {t("settings.adminAlerts")}
          </span>
          <span className="block text-xs text-slate-500">
            {t("settings.adminAlertsHint")}
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
              {t("settings.testMode")}
            </h2>
            <p className="text-xs text-amber-800">
              {t("settings.testModeHint")}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <input
              type="checkbox"
              name="email_test_mode"
              defaultChecked={data?.email_test_mode ?? true}
              className="h-4 w-4 rounded border-amber-400"
            />
            {t("settings.testModeActive")}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-amber-900">
              {t("settings.allowedRecipients")}
            </span>
            <span className="block text-xs text-amber-800">
              {t("settings.allowedRecipientsHint")}
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
          pendingLabel={t("contacts.saving")}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {t("common.save")}
        </SubmitButton>
      </form>
    </div>
  );
}
