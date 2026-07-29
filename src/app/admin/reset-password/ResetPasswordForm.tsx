"use client";

import { useActionState } from "react";
import { setNewPassword, type ResetState } from "./actions";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    setNewPassword,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em]">
          Neues Passwort
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          autoFocus
          className="mt-1 w-full rounded-[3px] border border-[#c4c4cc] bg-white px-3 py-2 text-sm"
        />
      </label>
      <label className="block">
        <span className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em]">
          Passwort bestätigen
        </span>
        <input
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-[3px] border border-[#c4c4cc] bg-white px-3 py-2 text-sm"
        />
      </label>

      {state.error && <p className="text-xs text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[3px] bg-[#0a0a0b] px-3 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
      >
        {pending ? "Speichern…" : "Passwort speichern & einloggen"}
      </button>
    </form>
  );
}
