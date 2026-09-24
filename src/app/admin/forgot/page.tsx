import type { Metadata } from "next";
import { ForgotForm } from "./ForgotForm";
import { AuthShell } from "../AuthShell";
import { getAdminT } from "@/lib/i18n-admin";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminT();
  return { title: t("forgot.title"), robots: { index: false, follow: false } };
}

export default async function ForgotPasswordPage() {
  const { t } = await getAdminT();
  return (
    <AuthShell subtitle={t("forgot.title")}>
      <p className="text-[13px] text-[#4a4a51]">
        {t("forgot.intro")}
      </p>
      <ForgotForm />
    </AuthShell>
  );
}
