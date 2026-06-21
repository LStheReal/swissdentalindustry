import type { ReactNode } from "react";

export function NewsEditorPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="font-sdi-mono mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#e1000f]">
          | {eyebrow}
        </div>
        <h1 className="text-[28px] font-extrabold tracking-[-0.025em]">{title}</h1>
        {description ? <p className="mt-2 text-sm text-[#6b6b73]">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
