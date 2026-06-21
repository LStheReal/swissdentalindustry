import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteAdmin, removeAdmin } from "./actions";

export default async function AdminUsersPage() {
  const current = await requireAdmin();
  const supabase = createAdminClient();

  const { data: admins } = await supabase
    .from("admins")
    .select("user_id, email, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-2xl space-y-6">
      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">
            Neuen Admin einladen
          </h2>
          <p className="text-xs text-slate-500">
            Es wird ein Einladungs-E-Mail an die Adresse gesendet. Existiert
            bereits ein Konto, wird es direkt als Superadmin freigeschaltet.
          </p>
        </div>
        <form action={inviteAdmin} className="flex gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="name@firma.ch"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Einladen
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Bestehende Admins ({admins?.length ?? 0})
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
                    {a.email ?? "(ohne E-Mail)"}
                    {isSelf && (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        Du
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    seit {new Date(a.created_at).toLocaleDateString("de-CH")}
                  </p>
                </div>
                {!isSelf && (
                  <form action={removeAdmin}>
                    <input type="hidden" name="user_id" value={a.user_id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                    >
                      Entfernen
                    </button>
                  </form>
                )}
              </li>
            );
          })}
          {(!admins || admins.length === 0) && (
            <li className="p-4 text-sm text-slate-500">
              Noch keine Admins eingetragen.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
