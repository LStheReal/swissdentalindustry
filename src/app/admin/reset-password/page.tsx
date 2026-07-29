import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "../AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { RecoveryGate } from "./RecoveryGate";

export const metadata: Metadata = {
  title: "Neues Passwort",
  robots: { index: false, follow: false },
};

/**
 * Ziel des Links aus der Reset-Mail. Der Link liefert die Session als
 * Hash-Fragment (#access_token=…&type=recovery) — funktioniert geräte- und
 * browserübergreifend, weil kein zuvor gespeicherter PKCE-Verifier nötig ist
 * (siehe forgot/actions.ts). Das Fragment ist serverseitig nie sichtbar,
 * daher übernimmt <RecoveryGate> (Client-Komponente) die Prüfung.
 *
 * `?code=…` bleibt als Fallback bestehen, falls doch einmal ein Code-Link
 * ankommt (z.B. noch nicht abgelaufene alte Mails aus der Zeit vor dieser
 * Umstellung) — der einmalige Code wird nach dem Tausch aus der URL entfernt,
 * sonst würde ein Reload ihn erneut einzulösen versuchen.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : null;

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

  if (user) {
    return (
      <AuthShell subtitle="Neues Passwort">
        <p className="text-[13px] text-[#4a4a51]">
          Neues Passwort für {user.email} setzen. Mindestens 8 Zeichen.
        </p>
        <ResetPasswordForm />
      </AuthShell>
    );
  }

  return (
    <AuthShell subtitle="Neues Passwort">
      <RecoveryGate />
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
