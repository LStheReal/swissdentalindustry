import Link from "next/link";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "inverse" | "danger";
type Size = "sm" | "md" | "lg";

type Common = {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children: ReactNode;
  className?: string;
};

const base =
  "sdi-btn inline-flex items-center justify-center gap-2 font-semibold tracking-tight " +
  "transition-colors duration-150 ease-out border focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-[color:var(--focus-ring)] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap " +
  "no-underline cursor-pointer";

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-[4px]",
  md: "h-10 px-4 text-[14px] rounded-[4px]",
  lg: "h-12 px-6 text-[15px] rounded-[4px]",
};

const variants: Record<Variant, { cls: string; style: CSSProperties }> = {
  primary: {
    cls: "border-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] hover:border-[color:var(--accent-hover)]",
    style: { background: "var(--accent)", color: "#ffffff" },
  },
  secondary: {
    cls: "border-[color:var(--border-strong)] hover:bg-[color:var(--ink-50)]",
    style: { background: "#ffffff", color: "var(--text-primary)" },
  },
  ghost: {
    cls: "border-transparent hover:bg-[color:var(--ink-50)]",
    style: { background: "transparent", color: "var(--text-primary)" },
  },
  inverse: {
    cls: "border-white hover:bg-[color:var(--ink-100)]",
    style: { background: "#ffffff", color: "var(--ink-950)" },
  },
  danger: {
    cls: "border-[color:var(--red-600)] hover:bg-[color:var(--red-700)]",
    style: { background: "var(--red-600)", color: "#ffffff" },
  },
};

function pick({ variant = "primary", size = "md", className = "" }: Common) {
  const v = variants[variant];
  return {
    className: [base, sizes[size], v.cls, className].join(" "),
    style: v.style,
  };
}

export function Button({
  variant,
  size,
  iconLeft,
  iconRight,
  children,
  className,
  style,
  ...rest
}: Common & ComponentProps<"button">) {
  const p = pick({ variant, size, className, children });
  return (
    <button className={p.className} style={{ ...p.style, ...style }} {...rest}>
      {iconLeft}
      <span>{children}</span>
      {iconRight}
    </button>
  );
}

export function ButtonLink({
  href,
  variant,
  size,
  iconLeft,
  iconRight,
  children,
  className,
  style,
  ...rest
}: Common & { href: string; style?: CSSProperties } & Omit<
  ComponentProps<typeof Link>,
  "href" | "children" | "style"
>) {
  const p = pick({ variant, size, className, children });
  return (
    <Link href={href} className={p.className} style={{ ...p.style, ...style }} {...rest}>
      {iconLeft}
      <span>{children}</span>
      {iconRight}
    </Link>
  );
}
