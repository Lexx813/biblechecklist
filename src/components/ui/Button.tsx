import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

/* ── Variant × Size class map ─────────────────────────────────── */

const base =
  "inline-flex items-center justify-center gap-2 font-semibold cursor-pointer select-none transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none font-[inherit] shrink-0";

const variants = {
  primary:
    "bg-gradient-to-br from-[var(--teal-dark)] to-[var(--teal)] text-white border-none rounded-lg hover:opacity-90 hover:-translate-y-px hover:shadow-[var(--shadow)] active:translate-y-0 active:shadow-[var(--shadow-xs)]",
  secondary:
    "bg-transparent text-[var(--text-primary)] border border-[var(--border)] rounded-md hover:border-[var(--teal)] hover:text-[var(--teal)] hover:bg-[var(--active-bg)] active:bg-[var(--active-hover-bg)]",
  ghost:
    "bg-transparent text-[var(--text-muted)] border border-transparent rounded-md hover:border-[var(--border)] hover:text-[var(--teal)] hover:bg-[var(--active-bg)] active:bg-[var(--active-hover-bg)]",
  danger:
    "bg-[#dc2626] text-white border-none rounded-lg hover:bg-[#b91c1c] hover:-translate-y-px hover:shadow-[var(--shadow)] active:translate-y-0 active:shadow-[var(--shadow-xs)]",
  "danger-outline":
    "bg-transparent text-[#dc2626] border border-[#dc2626]/30 rounded-md hover:bg-[#dc2626]/10 hover:border-[#dc2626]/60 active:bg-[#dc2626]/15",
  text:
    "bg-transparent text-[var(--accent)] border-none rounded-md hover:bg-[var(--active-bg)] active:bg-[var(--active-hover-bg)] px-2.5! py-1!",
  icon:
    "bg-transparent text-[var(--text-muted)] border border-[var(--border)] rounded-md hover:border-[var(--teal)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] active:bg-[var(--active-bg)]",
} as const;

const sizes = {
  xs: "h-7 px-2.5 text-xs rounded-[var(--radius-sm)]",
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-[15px]",
} as const;

const iconSizes = {
  xs: "size-7",
  sm: "size-8",
  md: "size-9",
  lg: "size-11",
} as const;

/* ── Props ─────────────────────────────────────────────────────── */

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  /** Render a loading spinner and disable interaction */
  loading?: boolean;
  /** Icon placed before children */
  iconLeft?: ReactNode;
  /** Icon placed after children */
  iconRight?: ReactNode;
}

/* ── Component ─────────────────────────────────────────────────── */

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, iconLeft, iconRight, className, children, disabled, ...props }, ref) => {
    const isIcon = variant === "icon";
    const cls = [
      base,
      variants[variant],
      isIcon ? iconSizes[size] : sizes[size],
      loading ? "opacity-75 pointer-events-none" : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} className={cls} disabled={disabled || loading} {...props}>
        {loading ? (
          <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          iconLeft
        )}
        {children}
        {!loading && iconRight}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
