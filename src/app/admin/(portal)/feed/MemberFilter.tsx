"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function MemberFilter({
  members,
}: {
  members: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("member") ?? "";

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString());
    if (e.target.value) {
      next.set("member", e.target.value);
    } else {
      next.delete("member");
    }
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={onChange}
      className="rounded-[3px] border border-[#c4c4cc] bg-white px-3.5 py-2 text-[12.5px] font-semibold outline-none focus:border-[#0a0a0b] focus:ring-2 focus:ring-[#e1000f]/20"
    >
      <option value="">Alle Firmen</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}
