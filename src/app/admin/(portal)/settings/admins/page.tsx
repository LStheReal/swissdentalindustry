import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteAdmin, removeAdmin } from "./actions";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { formatAdminDate, getAdminT } from "@/lib/i18n-admin";

export default async function AdminUsersPage() {
  const current = await requireAdmin();
  const supabase = createAdminClient();
  const { t, locale } = await getAdminT();

  const { data: admins } = await supabase
    .from("admins")
    .select("user_id, email, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-2xl space-y-6">
      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">
            {t("admins.inviteTitle")}
          </h2>
          <p className="text-xs text-slate-500">
            {t("admins.inviteHint")}
          </p>
        </div>
        <form action={inviteAdmin} className="flex gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder={t("admins.emailPlaceholder")}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <SubmitButton
            pendingLabel={t("admins.inviting")}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {t("admins.invite")}
          </SubmitButton>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            {t("admins.existing", { count: admins?.length ?? 0 })}
          </h2>
        </div>
        <ul className="divide-y divide-slate-200">
          {(admins ?? []).map((a) => {
            const isSelf = a.user_id === current.id;
            return (
              <li
                key={a.user_id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {a.email ?? t("admins.noEmail")}
                    {isSelf && (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        {t("admins.you")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t("admins.since", { date: formatAdminDate(a.created_at, locale) })}
                  </p>
                </div>
                {!isSelf && (
                  <form action={removeAdmin}>
                    <input type="hidden" name="user_id" value={a.user_id} />
                    <SubmitButton
                      pendingLabel={t("admins.removing")}
                      confirm={t("admins.removeConfirm", { who: a.email ?? t("admins.thisPerson") })}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                    >
                      {t("admins.remove")}
                    </SubmitButton>
                  </form>
                )}
              </li>
            );
          })}
          {(!admins || admins.length === 0) && (
            <li className="p-4 text-sm text-slate-500">
              {t("admins.empty")}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
