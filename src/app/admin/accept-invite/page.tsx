import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AcceptInviteForm } from "./AcceptInviteForm";
import { getAdminT } from "@/lib/i18n-admin";

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
  const { t } = await getAdminT();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return (
        <InviteShell title={t("invite.title")}>
          <p className="text-sm text-red-700">
            {t("invite.linkFailed", { message: error.message })}
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
      <InviteShell title={t("invite.title")}>
        <p className="text-sm text-red-700">
          {errorDesc ?? t("invite.invalid")}
        </p>
      </InviteShell>
    );
  }

  return (
    <InviteShell title={t("invite.title")}>
      <p className="text-[13px] text-[#4a4a51]">
        {t("invite.welcome", { who: user.email ? `, ${user.email}` : "" })}
      </p>
      <AcceptInviteForm />
    </InviteShell>
  );
}

function InviteShell({ title, children }: { title: string; children: React.ReactNode }) {
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
              {title}
            </p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
