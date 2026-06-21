import { createClient } from "@/lib/supabase/server";
import type { MembershipApplication } from "@/lib/types";
import {
  convertApplication,
  archiveApplication,
  deleteApplication,
} from "./actions";

const STATUS_LABEL: Record<string, string> = {
  new: "Neu",
  converted: "Umgewandelt",
  archived: "Archiviert",
};

type ApplicationsPageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const currentTab = resolvedSearchParams.tab === "archived" ? "archived" : "active";
  const supabase = await createClient();
  let query = supabase
    .from("membership_applications")
    .select("*")
    .order("created_at", { ascending: false });

  query =
    currentTab === "archived"
      ? query.eq("status", "archived")
      : query.neq("status", "archived");

  const { data } = await query;
  const apps = (data ?? []) as MembershipApplication[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mitglieds-Anträge</h1>

      <div className="inline-flex overflow-hidden rounded-[3px] border border-[#c4c4cc] bg-white">
        <a
          href="/admin/applications"
          className={`px-4 py-2 text-[12.5px] font-semibold ${
            currentTab === "active"
              ? "bg-[#0a0a0b] text-white"
              : "text-[#0a0a0b] hover:bg-[#fafaf8]"
          }`}
        >
          Aktiv
        </a>
        <a
          href="/admin/applications?tab=archived"
          className={`border-l border-[#c4c4cc] px-4 py-2 text-[12.5px] font-semibold ${
            currentTab === "archived"
              ? "bg-[#0a0a0b] text-white"
              : "text-[#0a0a0b] hover:bg-[#fafaf8]"
          }`}
        >
          Archiviert
        </a>
      </div>

      {apps.length === 0 ? (
        <p className="text-sm text-slate-500">
          {currentTab === "archived"
            ? "Keine archivierten Anträge vorhanden."
            : "Keine aktiven Anträge vorhanden."}
        </p>
      ) : (
        <ul className="space-y-4">
          {apps.map((app) => (
            <li
              key={app.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {new Date(app.created_at).toLocaleString("de-CH")} ·{" "}
                  <span className="font-medium text-slate-700">
                    {STATUS_LABEL[app.status] ?? app.status}
                  </span>
                </p>
                <div className="flex gap-2">
                  {app.status === "new" && (
                    <form action={convertApplication.bind(null, app.id)}>
                      <button
                        type="submit"
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                      >
                        In Mitglied umwandeln
                      </button>
                    </form>
                  )}
                  {app.status !== "archived" && (
                    <form action={archiveApplication.bind(null, app.id)}>
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
                      >
                        Archivieren
                      </button>
                    </form>
                  )}
                  <form action={deleteApplication.bind(null, app.id)}>
                    <button
                      type="submit"
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      Löschen
                    </button>
                  </form>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                {Object.entries(app.payload).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="font-medium text-slate-500">{k}:</dt>
                    <dd className="text-slate-800">{v}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
