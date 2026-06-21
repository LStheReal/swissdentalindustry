import type { ReactNode } from "react";

export function Card({
  children,
  accent = false,
  hover = false,
  padded = true,
  className = "",
  "data-gsap-fade": gsapFade,
}: {
  children: ReactNode;
  accent?: boolean;
  hover?: boolean;
  padded?: boolean;
  className?: string;
  "data-gsap-fade"?: boolean;
}) {
  return (
    <div
      {...(gsapFade ? { "data-gsap-fade": true } : {})}
      className={[
        "bg-white border border-[color:var(--border-default)] rounded-[6px] relative",
        padded ? "p-6" : "",
        hover ? "transition-shadow hover:shadow-[var(--shadow-sm)]" : "",
        className,
      ].join(" ")}
    >
      {accent && (
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[3px] bg-[color:var(--accent)] rounded-l-[6px]"
        />
      )}
      {children}
    </div>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`sdi-eyebrow ${className}`}>{children}</div>;
}

export function Badge({
  children,
  variant = "solid",
}: {
  children: ReactNode;
  variant?: "solid" | "outline" | "soft";
}) {
  const styles: Record<string, string> = {
    solid: "bg-[color:var(--accent)] text-white border-[color:var(--accent)]",
    outline: "bg-transparent text-[color:var(--text-secondary)] border-[color:var(--border-strong)]",
    soft: "bg-[color:var(--accent-soft)] text-[color:var(--accent)] border-transparent",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 border rounded-[4px] px-2 py-[3px] text-[11px] font-semibold tracking-wide uppercase ${styles[variant]}`}
      style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}
    >
      {children}
    </span>
  );
}
