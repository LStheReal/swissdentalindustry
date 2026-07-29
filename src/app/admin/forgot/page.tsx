import type { Metadata } from "next";
import { ForgotForm } from "./ForgotForm";
import { AuthShell } from "../AuthShell";

export const metadata: Metadata = {
  title: "Passwort zurücksetzen",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell subtitle="Passwort zurücksetzen">
      <p className="text-[13px] text-[#4a4a51]">
        E-Mail-Adresse des Superadmin-Kontos eingeben. Wir schicken einen Link,
        mit dem ein neues Passwort gesetzt werden kann.
      </p>
      <ForgotForm />
    </AuthShell>
  );
}
