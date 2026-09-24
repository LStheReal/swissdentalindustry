import { SettingsTabs } from "./SettingsTabs";
import { getAdminT } from "@/lib/i18n-admin";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = await getAdminT();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
      <SettingsTabs />
      <div>{children}</div>
    </div>
  );
}
