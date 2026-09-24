import { createClient } from "@/lib/supabase/server";
import {
  EXPORT_COLUMNS,
  EXPORT_FILTERS,
  buildExportRowsForFilters,
  summarise,
} from "@/lib/member-export";
import { getAdminT } from "@/lib/i18n-admin";

export async function generateMetadata() {
  const { t } = await getAdminT();
  return { title: t("export.metaTitle") };
}

export default async function ExportPage() {
  const supabase = await createClient();
  const { t } = await getAdminT();

  // Zeilenzahl je Filter vorab zeigen — sonst lädt man eine Datei herunter und
  // stellt erst in Excel fest, dass sie leer ist.
  const rowsByFilter = await buildExportRowsForFilters(supabase, EXPORT_FILTERS);
  const counts = EXPORT_FILTERS.map((filter) => ({
    filter,
    ...summarise(rowsByFilter[filter]),
  }));

  return (
    <div className="overflow-hidden border border-[#e2e2e7] bg-white">
      <div className="border-b border-[#e2e2e7] px-5 py-5 sm:px-8">
        <div className="font-sdi-mono mb-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#6b6b73]">
          {t("export.eyebrow")}
        </div>
        <h1 className="text-[26px] font-extrabold tracking-[-0.025em]">
          {t("export.title")}
        </h1>
        <p className="mt-2 max-w-prose text-[13.5px] leading-relaxed text-[#6b6b73]">
          {t("export.intro")}
        </p>
      </div>

      <div className="space-y-4 px-5 py-6 sm:px-8">
        <ul className="space-y-3">
          {counts.map(({ filter, rows, companies }) => (
            <li
              key={filter}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-[#e2e2e7] bg-[#fafaf8] px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-bold">{t(`export.filter.${filter}`)}</p>
                <p className="mt-0.5 text-[12.5px] text-[#6b6b73]">
                  {t("export.counts", { rows, companies })}
                </p>
              </div>
              <a
                href={`/admin/export/download?filter=${filter}`}
                className="shrink-0 rounded-[3px] bg-[#0a0a0b] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-black"
              >
                {t("export.download")}
              </a>
            </li>
          ))}
        </ul>

        <details className="rounded-[3px] border border-[#e2e2e7] px-4 py-3">
          <summary className="cursor-pointer text-[13px] font-semibold">
            {t("export.columns", { count: EXPORT_COLUMNS.length })}
          </summary>
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-[#6b6b73]">
            {EXPORT_COLUMNS.join(" · ")}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-[#9595a0]">{t("export.columnsNote")}</p>
        </details>
      </div>
    </div>
  );
}
