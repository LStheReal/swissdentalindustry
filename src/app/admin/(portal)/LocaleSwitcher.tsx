"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/types";
import { setAdminLocale } from "./locale-actions";

export function LocaleSwitcher({ current }: { current: Locale }) {
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="grid grid-cols-4 gap-1" aria-label="Portal-Sprache">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          title={LOCALE_LABELS[l]}
          onClick={() =>
            startTransition(async () => {
              await setAdminLocale(l, pathname);
              router.refresh();
            })
          }
          className={`font-sdi-mono rounded-[2px] border px-0 py-1.5 text-[11px] font-bold uppercase ${
            current === l
              ? "border-[#0a0a0b] bg-[#0a0a0b] text-white"
              : "border-[#e2e2e7] bg-white text-[#6b6b73] hover:border-[#c4c4cc]"
          } disabled:opacity-60`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
