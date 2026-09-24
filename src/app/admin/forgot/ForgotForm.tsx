"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type ForgotState } from "./actions";
import { useAdminT } from "@/components/admin/AdminI18n";

export function ForgotForm() {
  const { t } = useAdminT();
  const [state, formAction, pending] = useActionState<ForgotState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.sent) {
    return (
      <div className="space-y-4">
        <p className="text-[13px] text-[#4a4a51]">
          {t("forgot.sent")}
        </p>
        <p className="text-[12px] text-[#6b6b73]">
          {t("forgot.checkSpam")}
        </p>
        <Link
          href="/admin/login"
          className="inline-block text-[12px] font-semibold underline underline-offset-2"
        >
          {t("forgot.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em]">
          {t("login.email")}
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          className="mt-1 w-full rounded-[3px] border border-[#c4c4cc] bg-white px-3 py-2 text-sm"
        />
      </label>

      {state.error && <p className="text-xs text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[3px] bg-[#0a0a0b] px-3 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
      >
        {pending ? t("forgot.sending") : t("forgot.submit")}
      </button>

      <Link
        href="/admin/login"
        className="block text-center text-[12px] text-[#6b6b73] underline underline-offset-2"
      >
        {t("forgot.backToLogin")}
      </Link>
    </form>
  );
}
