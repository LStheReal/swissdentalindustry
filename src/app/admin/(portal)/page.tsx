import Link from "next/link";
import { getAdminT } from "@/lib/i18n-admin";
import { createClient } from "@/lib/supabase/server";
import type { Locale, Member, MembershipApplication } from "@/lib/types";

interface PendingChangeRequest {
  id: string;
  member_id: string;
  submitted_at: string;
  contact_email: string | null;
  members: Pick<Member, "name"> | null;
}

function intlLocale(locale: Locale) {
  switch (locale) {
    case "fr":
      return "fr-CH";
    case "it":
      return "it-CH";
    case "en":
      return "en-CH";
    default:
      return "de-CH";
  }
}

function formatDateTime(value: Date, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Zurich",
  }).format(value);
}

function getZurichHour(value: Date) {
  const hour = new Intl.DateTimeFormat("de-CH", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Zurich",
  }).format(value);

  return Number(hour);
}

function greetingKey(value: Date) {
  const hour = getZurichHour(value);

  if (hour >= 5 && hour < 11) return "dashboard.greetingMorning";
  if (hour >= 18 || hour < 5) return "dashboard.greetingEvening";
  return "dashboard.greetingDay";
}

function formatActivityTime(iso: string, locale: Locale) {
  const date = new Date(iso);
  const today = new Date();
  const sameDay =
    date.toLocaleDateString(intlLocale(locale), { timeZone: "Europe/Zurich" }) ===
    today.toLocaleDateString(intlLocale(locale), { timeZone: "Europe/Zurich" });

  if (sameDay) {
    return new Intl.DateTimeFormat(intlLocale(locale), {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Zurich",
    }).format(date);
  }

  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Zurich",
  }).format(date);
}

function applicationName(app: MembershipApplication) {
  const keys = ["company", "company_name", "firma", "name", "unternehmen"];
  for (const key of keys) {
    const value = app.payload[key];
    if (value?.trim()) return value;
  }
  return "Neuer Mitgliedsantrag";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { locale, t } = await getAdminT();

  const [
    members,
    pending,
    news,
    applications,
    pendingRequestsResult,
    newApplicationsResult,
  ] = await Promise.all([
    supabase.from("members").select("*", { count: "exact", head: true }),
    supabase
      .from("member_change_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("news").select("*", { count: "exact", head: true }),
    supabase
      .from("membership_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("member_change_requests")
      .select("id, member_id, submitted_at, contact_email, members(name)")
      .eq("status", "pending")
      .order("submitted_at", { ascending: false })
      .limit(5),
    supabase
      .from("membership_applications")
      .select("*")
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const pendingCount = pending.count ?? 0;
  const applicationCount = applications.count ?? 0;

  const cards = [
    {
      code: "MIT",
      label: t("dashboard.members"),
      value: members.count ?? 0,
      sub: t("dashboard.memberProfiles"),
      trend: "+ LIVE",
      trendColor: "text-[#1f8a5b]",
      href: "/admin/members",
    },
    {
      code: "CHG",
      label: t("nav.feed"),
      value: pendingCount,
      sub: t("dashboard.pendingApprovals"),
      trend: pendingCount ? t("dashboard.review") : "OK",
      trendColor: pendingCount ? "text-[#e1000f]" : "text-[#1f8a5b]",
      href: "/admin/feed",
    },
    {
      code: "NEW",
      label: t("nav.news"),
      value: news.count ?? 0,
      sub: t("dashboard.newsEntries"),
      trend: "CMS",
      trendColor: "text-[#6b6b73]",
      href: "/admin/news",
    },
    {
      code: "APP",
      label: t("nav.applications"),
      value: applicationCount,
      sub: t("dashboard.applicationRequests"),
      trend: applicationCount ? t("dashboard.new") : "OK",
      trendColor: applicationCount ? "text-[#e1000f]" : "text-[#1f8a5b]",
      href: "/admin/applications",
    },
  ];

  const pendingRequests =
    (pendingRequestsResult.data ?? []) as unknown as PendingChangeRequest[];
  const newApplications =
    (newApplicationsResult.data ?? []) as MembershipApplication[];
  const activity = [
    ...pendingRequests.map((request) => ({
      id: `change-${request.id}`,
      href: "/admin/feed",
      time: formatActivityTime(request.submitted_at, locale),
      tag: "CR",
      text: `${request.members?.name ?? t("dashboard.members")} ${t("dashboard.changeSubmitted")}`,
      status: t("common.proposed"),
      statusColor: "text-[#e1000f]",
      date: request.submitted_at,
    })),
    ...newApplications.map((application) => ({
      id: `application-${application.id}`,
      href: "/admin/applications",
      time: formatActivityTime(application.created_at, locale),
      tag: "AN",
      text: `${applicationName(application)} ${t("dashboard.wantsMembership")}`,
      status: t("dashboard.new"),
      statusColor: "text-[#e1000f]",
      date: application.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  const now = new Date();

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="font-sdi-mono mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#e1000f]">
            | {t("dashboard.overview")}
          </div>
          <h1 className="text-[34px] font-extrabold leading-none tracking-[-0.025em]">
            {t(greetingKey(now))}
          </h1>
          <p className="mt-2.5 text-sm text-[#6b6b73]">
            {t("dashboard.status")}: {formatDateTime(now, locale)} · {t("dashboard.youHave")}{" "}
            <strong className={pendingCount > 0 ? "text-[#e1000f]" : "text-[#1f8a5b]"}>
              {pendingCount} {t("dashboard.pendingChanges")}
            </strong>{" "}
            {t("dashboard.and")}{" "}
            <strong className={applicationCount > 0 ? "text-[#e1000f]" : "text-[#1f8a5b]"}>
              {applicationCount} {t("dashboard.memberApplications")}
            </strong>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/members/new"
            className="rounded-[3px] bg-[#0a0a0b] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#26262b]"
          >
            {t("dashboard.newMemberCompany")}
          </Link>
        </div>
      </div>

      <div className="grid border border-[#e2e2e7] bg-[#e2e2e7] sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="min-h-[118px] bg-white p-4 transition hover:bg-[#fafaf8]"
          >
            <div className="flex items-center justify-between">
              <span className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#6b6b73]">
                {c.code}
              </span>
              <span className={`font-sdi-mono text-[11px] font-bold ${c.trendColor}`}>
                {c.trend}
              </span>
            </div>
            <p className="font-sdi-mono mt-3 text-[38px] font-bold leading-none tracking-[-0.03em]">
              {c.value}
            </p>
            <p className="mt-2 text-[13.5px] font-semibold">{c.label}</p>
            <p className="mt-0.5 text-xs text-[#6b6b73]">{c.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-7 xl:grid-cols-[1.4fr_1fr]">
        <section>
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.04em]">
              {t("dashboard.latestActivity")}
            </h2>
            <Link
              href="/admin/feed"
              className="font-sdi-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[#e1000f]"
            >
              {t("dashboard.viewAll")} →
            </Link>
          </div>
          <div className="border-t border-[#c4c4cc]">
            {activity.length === 0 ? (
              <div className="border-b border-[#e2e2e7] py-6 text-[13.5px] text-[#6b6b73]">
                {t("dashboard.noActivity")}
              </div>
            ) : (
              activity.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="grid grid-cols-[70px_28px_1fr_auto] items-center gap-3.5 border-b border-[#e2e2e7] py-3.5 transition hover:bg-[#fafaf8]"
              >
                <span className="font-sdi-mono text-[11px] font-bold tracking-[0.04em] text-[#6b6b73]">
                  {item.time}
                </span>
                <span className="font-sdi-mono flex h-6 w-6 items-center justify-center rounded-[2px] bg-[#0a0a0b] text-[10px] font-bold text-white">
                  {item.tag}
                </span>
                <span className="text-[13.5px] text-[#4a4a51]">{item.text}</span>
                <span className={`font-sdi-mono text-[11px] font-bold uppercase tracking-[0.06em] ${item.statusColor}`}>
                  {item.status}
                </span>
              </Link>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3.5 text-sm font-bold uppercase tracking-[0.04em]">
            {t("dashboard.systemStatus")}
          </h2>
          <div className="border border-[#e2e2e7]">
            {[
              t("dashboard.db"),
              t("dashboard.translations"),
              t("dashboard.mail"),
              t("dashboard.geocoding"),
            ].map(
              (name) => (
                <div
                  key={name}
                  className="flex items-center justify-between border-b border-[#ececf0] px-4 py-3.5 last:border-b-0"
                >
                  <div>
                    <p className="text-[13.5px] font-semibold">{name}</p>
                    <p className="mt-0.5 text-[11.5px] text-[#6b6b73]">
                      {t("dashboard.lastCheckOk")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#1f8a5b]" />
                    <span className="font-sdi-mono text-[11px] font-bold text-[#1f8a5b]">
                      OK
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
