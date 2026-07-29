"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/sdi/logo.png"
            alt="Swiss Dental Industry"
            width={180}
            height={60}
            className="object-contain"
            priority
          />
          <p className="font-sdi-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#6b6b73]">
            Superadmin-Anmeldung
          </p>
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

        <Link
          href="/admin/forgot"
          className="block text-center text-[12px] text-[#6b6b73] underline underline-offset-2 hover:text-[#0a0a0b]"
        >
          Passwort vergessen?
        </Link>
        </div>
      </form>
    </main>
  );
}
