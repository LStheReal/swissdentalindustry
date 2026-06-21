"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login, type LoginState } from "./actions";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/admin";
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#e7e5df] p-4 text-[#0a0a0b]">
      <form
        action={formAction}
        className="w-full max-w-sm overflow-hidden rounded-[2px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
      >
        <div className="h-[3px] bg-[#e1000f]" />
        <div className="space-y-5 p-8">
        <div className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 100 100" aria-hidden="true">
            <rect width="100" height="100" rx="3" fill="#e1000f" />
            <rect x="42" y="20" width="16" height="60" fill="#fff" />
            <rect x="20" y="42" width="60" height="16" fill="#fff" />
          </svg>
          <div>
            <h1 className="text-[15px] font-extrabold leading-tight tracking-[-0.01em]">
              Swiss Dental Industry
            </h1>
            <p className="font-sdi-mono mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6b6b73]">
              Superadmin-Anmeldung
            </p>
          </div>
        </div>

        <input type="hidden" name="redirect" value={redirectTo} />

        <label className="block">
          <span className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em]">
            E-Mail
          </span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-2 w-full rounded-[2px] border border-[#c4c4cc] px-3 py-2.5 text-sm outline-none focus:border-[#0a0a0b] focus:ring-2 focus:ring-[#e1000f]/20"
          />
        </label>

        <label className="block">
          <span className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em]">
            Passwort
          </span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-2 w-full rounded-[2px] border border-[#c4c4cc] px-3 py-2.5 text-sm outline-none focus:border-[#0a0a0b] focus:ring-2 focus:ring-[#e1000f]/20"
          />
        </label>

        {(state.error || params.get("error") === "not_admin") && (
          <p className="text-sm text-[#e1000f]">
            {state.error ?? "Dieses Konto hat keine Superadmin-Berechtigung."}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-[3px] bg-[#e1000f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#c9000d] disabled:opacity-60"
        >
          {pending ? "Anmelden …" : "Anmelden"}
        </button>
        </div>
      </form>
    </main>
  );
}
