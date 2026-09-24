"use client";

import Link from "next/link";
import { useActionState } from "react";
import { importMembers, type ImportMembersState } from "./actions";
import { useAdminT } from "@/components/admin/AdminI18n";

const initialState: ImportMembersState = {
  status: "idle",
  message: "",
  importedCount: 0,
  updatedCount: 0,
  duplicateCount: 0,
  skippedCount: 0,
  details: [],
};

export function ImportMembersForm() {
  const { t } = useAdminT();
  const [state, formAction, pending] = useActionState(importMembers, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <section className="border border-[#e2e2e7] bg-white">
        <div className="border-b border-[#e2e2e7] px-5 py-5 sm:px-7">
          <div className="font-sdi-mono mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#e1000f]">
            {t("import.eyebrow")}
          </div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.025em]">
            {t("import.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[#6b6b73]">
            {t("import.intro")}
          </p>
        </div>

        <div className="space-y-6 px-5 py-5 sm:px-7">
          <label className="block">
            <span className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]">
              {t("import.file")}
            </span>
            <input
              name="spreadsheet"
              type="file"
              accept=".xlsx,.xls,.csv"
              required
              className="mt-2 block w-full rounded-[3px] border border-dashed border-[#c4c4cc] bg-[#fafaf8] px-3 py-3 text-sm file:mr-3 file:rounded-[3px] file:border-0 file:bg-[#0a0a0b] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
            />
          </label>

          <div className="rounded-[3px] border border-[#e2e2e7] bg-[#fafaf8] p-4">
            <div className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#0a0a0b]">
              {t("import.expectedColumns")}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6b6b73]">
              {t("import.columnsHelp")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-[3px] bg-[#e1000f] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[#c9000d] disabled:opacity-60"
            >
              {pending ? t("import.running") : t("import.submit")}
            </button>
            <Link
              href="/admin/members"
              className="rounded-[3px] border border-[#c4c4cc] bg-white px-4 py-2 text-[12.5px] font-semibold hover:bg-[#fafaf8]"
            >
              {t("import.backToList")}
            </Link>
          </div>
        </div>
      </section>

      {state.status !== "idle" && (
        <section
          className={`border px-5 py-4 text-sm sm:px-7 ${
            state.status === "success"
              ? "border-[#cfe7da] bg-[#f4fbf7] text-[#14532d]"
              : "border-[#f0c7cb] bg-[#fff5f6] text-[#991b1b]"
          }`}
        >
          <p className="font-semibold">{state.message}</p>
          {state.status === "success" && (
            <p className="mt-2 text-[13px]">
              {t("import.counts", {
                imported: state.importedCount,
                updated: state.updatedCount,
                duplicates: state.duplicateCount,
                skipped: state.skippedCount,
              })}
            </p>
          )}
          {state.details.length > 0 && (
            <div className="mt-3 space-y-1.5 text-[12.5px]">
              {state.details.slice(0, 8).map((detail) => (
                <p key={detail}>{detail}</p>
              ))}
              {state.details.length > 8 && (
                <p>{t("import.moreHints", { count: state.details.length - 8 })}</p>
              )}
            </div>
          )}
        </section>
      )}
    </form>
  );
}
