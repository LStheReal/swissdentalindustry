import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AcceptInviteForm } from "./AcceptInviteForm";

export default async function AcceptInvitePage({
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
        <InviteShell>
          <p className="text-sm text-red-700">
            Einladungs-Link konnte nicht eingelöst werden: {error.message}
          </p>
        </InviteShell>
      );
    }
    redirect("/admin/accept-invite");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <InviteShell>
        <p className="text-sm text-red-700">
          {errorDesc ??
            "Dieser Einladungs-Link ist ungültig oder abgelaufen. Bitte den Superadmin um einen neuen Link bitten."}
        </p>
      </InviteShell>
    );
  }

  return (
    <InviteShell>
      <p className="text-[13px] text-[#4a4a51]">
        Willkommen{user.email ? `, ${user.email}` : ""}. Bitte vergib ein
        Passwort, um deinen Superadmin-Zugang zu aktivieren.
      </p>
      <AcceptInviteForm />
    </InviteShell>
  );
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#e7e5df] p-4 text-[#0a0a0b]">
      <div className="w-full max-w-sm overflow-hidden rounded-[2px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="h-[3px] bg-[#e1000f]" />
        <div className="space-y-5 p-8">
          <div>
            <h1 className="text-[15px] font-extrabold leading-tight tracking-[-0.01em]">
              Swiss Dental Industry
            </h1>
            <p className="font-sdi-mono mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6b6b73]">
              Einladung annehmen
            </p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
