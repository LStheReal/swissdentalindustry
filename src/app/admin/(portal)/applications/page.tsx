import { createClient } from "@/lib/supabase/server";
import type { MembershipApplication } from "@/lib/types";
import { ApplicationCard } from "./ApplicationCard";
import {
  approveApplication,
  archiveApplication,
  deleteApplication,
  rejectApplication,
} from "./actions";

type Tab = "open" | "decided" | "inquiries";

const TABS: { key: Tab; href: string; label: string }[] = [
  { key: "open", href: "/admin/applications", label: "Offen" },
  { key: "decided", href: "/admin/applications?tab=decided", label: "Entschieden" },
  { key: "inquiries", href: "/admin/applications?tab=inquiries", label: "Kontaktanfragen" },
];

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const tab: Tab =
    params.tab === "decided" ? "decided" : params.tab === "inquiries" ? "inquiries" : "open";

  const supabase = await createClient();
  let query = supabase
    .from("membership_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (tab === "inquiries") {
    // Kontakt-/Mitwirken-Formulare — hier gibt es nichts anzunehmen.
    query = query.eq("kind", "inquiry");
  } else if (tab === "decided") {
    query = query.eq("kind", "membership").in("status", ["approved", "converted", "rejected", "archived"]);
  } else {
    query = query.eq("kind", "membership").eq("status", "new");
  }

  const { data } = await query;
  const apps = (data ?? []) as MembershipApplication[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mitglieds-Anträge</h1>
        <p className="mt-1 text-[13px] text-[#6b6b73]">
          Angenommene Anträge legen die Firma an, schalten sie live und schicken der
          Kontaktperson den Self-Service-Link. Abgelehnte erhalten eine Absage.
          Die Übersetzung der Beschreibung und der Mailversand laufen im Hintergrund
          weiter — bis die Übersetzung da ist, steht überall der Originaltext.
        </p>
      </div>

      <div className="inline-flex overflow-hidden rounded-[3px] border border-[#c4c4cc] bg-white">
        {TABS.map((t, i) => (
          <a
            key={t.key}
            href={t.href}
            className={`px-4 py-2 text-[12.5px] font-semibold ${i > 0 ? "border-l border-[#c4c4cc]" : ""} ${
              tab === t.key ? "bg-[#0a0a0b] text-white" : "text-[#0a0a0b] hover:bg-[#fafaf8]"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {apps.length === 0 ? (
        <p className="text-sm text-[#6b6b73]">
          {tab === "open"
            ? "Keine offenen Anträge."
            : tab === "decided"
              ? "Noch keine entschiedenen Anträge."
              : "Keine Kontaktanfragen."}
        </p>
      ) : (
        <ul className="space-y-4">
          {apps.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              approveAction={approveApplication.bind(null, app.id)}
              rejectAction={rejectApplication.bind(null, app.id)}
              archiveAction={archiveApplication.bind(null, app.id)}
              deleteAction={deleteApplication.bind(null, app.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
