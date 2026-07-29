import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "../AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Neues Passwort",
  robots: { index: false, follow: false },
};

/**
 * Ziel des Links aus der Reset-Mail. Supabase hängt `?code=…` an; der Code wird
 * einmalig gegen eine Session getauscht (danach ist er verbraucht). Deshalb
 * wird nach dem Tausch auf dieselbe Seite ohne Query umgeleitet — sonst würde
 * ein Reload den bereits verbrauchten Code erneut einzulösen versuchen.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : null;
  const errorDesc =
    typeof params.error_description === "string"
      ? params.error_description
      : typeof params.error === "string"
        ? params.error
        : null;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return (
        <AuthShell subtitle="Neues Passwort">
          <p className="text-sm text-red-700">
            Der Link konnte nicht eingelöst werden: {error.message}
          </p>
          <RequestAgain />
        </AuthShell>
      );
    }
    redirect("/admin/reset-password");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthShell subtitle="Neues Passwort">
        <p className="text-sm text-red-700">
          {errorDesc ??
            "Dieser Link ist ungültig, abgelaufen oder wurde bereits benutzt."}
        </p>
        <RequestAgain />
      </AuthShell>
    );
  }

  return (
    <AuthShell subtitle="Neues Passwort">
      <p className="text-[13px] text-[#4a4a51]">
        Neues Passwort für {user.email} setzen. Mindestens 8 Zeichen.
      </p>
      <ResetPasswordForm />
    </AuthShell>
  );
}

function RequestAgain() {
  return (
    <Link
      href="/admin/forgot"
      className="inline-block text-[12px] font-semibold underline underline-offset-2"
    >
      Neuen Link anfordern
    </Link>
  );
}
