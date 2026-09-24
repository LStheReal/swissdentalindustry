import { createClient } from "@/lib/supabase/server";
import type { MembershipApplication } from "@/lib/types";
import { getAdminT, type AdminI18nKey } from "@/lib/i18n-admin";
import { ApplicationCard } from "./ApplicationCard";
import { InquiryCard } from "./InquiryCard";
import {
  approveApplication,
  archiveApplication,
  deleteApplication,
  rejectApplication,
} from "./actions";

type Tab = "open" | "decided" | "inquiries";

const TABS: { key: Tab; href: string; label: AdminI18nKey }[] = [
  { key: "open", href: "/admin/applications", label: "apps.tabOpen" },
  { key: "decided", href: "/admin/applications?tab=decided", label: "apps.tabDecided" },
  { key: "inquiries", href: "/admin/applications?tab=inquiries", label: "apps.tabInquiries" },
];

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const { t, locale } = await getAdminT();
  const tab: Tab =
    params.tab === "decided" ? "decided" : params.tab === "inquiries" ? "inquiries" : "open";

  const supabase = await createClient();
  let query = supabase
    .from("membership_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (tab === "inquiries") {
    // Kontakt-/Mitwirken-Formulare — hier gibt es nichts anzunehmen, nur zu
    // antworten. Offene zuerst, erledigte darunter.
    query = query.eq("kind", "inquiry");
  } else if (tab === "decided") {
    query = query.eq("kind", "membership").in("status", ["approved", "converted", "rejected", "archived"]);
  } else {
    query = query.eq("kind", "membership").eq("status", "new");
  }

  const { data } = await query;
  let apps = (data ?? []) as MembershipApplication[];

  if (tab === "inquiries") {
    // Unbeantwortete nach oben, erledigte darunter — innerhalb der Gruppen
    // bleibt die Reihenfolge der Abfrage (neueste zuerst).
    apps = [
      ...apps.filter((a) => a.status === "new"),
      ...apps.filter((a) => a.status !== "new"),
    ];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {tab === "inquiries" ? t("apps.titleInquiries") : t("apps.titleApplications")}
        </h1>
        <p className="mt-1 text-[13px] text-[#6b6b73]">
          {tab === "inquiries" ? t("apps.introInquiries") : t("apps.introApplications")}
        </p>
      </div>

      <div className="inline-flex overflow-hidden rounded-[3px] border border-[#c4c4cc] bg-white">
        {TABS.map((tabItem, i) => (
          <a
            key={tabItem.key}
            href={tabItem.href}
            className={`px-4 py-2 text-[12.5px] font-semibold ${i > 0 ? "border-l border-[#c4c4cc]" : ""} ${
              tab === tabItem.key ? "bg-[#0a0a0b] text-white" : "text-[#0a0a0b] hover:bg-[#fafaf8]"
            }`}
          >
            {t(tabItem.label)}
          </a>
        ))}
      </div>

      {apps.length === 0 ? (
        <p className="text-sm text-[#6b6b73]">
          {tab === "open"
            ? t("apps.emptyOpen")
            : tab === "decided"
              ? t("apps.emptyDecided")
              : t("apps.emptyInquiries")}
        </p>
      ) : (
        <ul className="space-y-4">
          {apps.map((app) =>
            app.kind === "inquiry" ? (
              <InquiryCard
                key={app.id}
                app={app}
                t={t}
                locale={locale}
                archiveAction={archiveApplication.bind(null, app.id)}
                deleteAction={deleteApplication.bind(null, app.id)}
              />
            ) : (
              <ApplicationCard
                key={app.id}
                app={app}
                approveAction={approveApplication.bind(null, app.id)}
                rejectAction={rejectApplication.bind(null, app.id)}
                archiveAction={archiveApplication.bind(null, app.id)}
                deleteAction={deleteApplication.bind(null, app.id)}
              />
            ),
          )}
        </ul>
      )}
    </div>
  );
}
