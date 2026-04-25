import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

const base =
  "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap select-none";

const variants = {
  /** Neutral chip — counts, tags, generic labels */
  default:
    "bg-[var(--teal-soft)] text-[var(--text-secondary)] border border-[var(--border)]",
  /** Brand accent — active filters, "new" markers */
  accent:
    "bg-[var(--accent-light)] text-[var(--teal-darker)] border border-[var(--accent)]/35",
  /** Solid violet — primary chip */
  primary:
    "bg-[var(--teal)] text-white border-none",
  /** Achievement / streak / milestone — gold reserved per brand rule */
  gold:
    "bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/35",
  /** Success / done / completed */
  success:
    "bg-[#22c55e]/12 text-[#16a34a] border border-[#22c55e]/30",
  /** Warning / paused / pending */
  warning:
    "bg-[#fb923c]/10 text-[#c2410c] border border-[#fb923c]/30",
  /** Danger / blocked */
  danger:
    "bg-[#ef4444]/10 text-[#b91c1c] border border-[#ef4444]/30",
  /** Muted — beta, debug, low-key */
  muted:
    "bg-transparent text-[var(--text-muted)] border border-[var(--border)]",
} as const;

const sizes = {
  sm: "h-5 px-2 text-[10px] tracking-[0.04em]",
  md: "h-6 px-2.5 text-[11px] tracking-[0.02em]",
  lg: "h-7 px-3 text-xs",
} as const;

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  /** Optional leading icon (small SVG or character) */
  iconLeft?: ReactNode;
}

const Pill = forwardRef<HTMLSpanElement, PillProps>(
  ({ variant = "default", size = "md", iconLeft, className, children, ...props }, ref) => {
    const cls = [base, variants[variant], sizes[size], className ?? ""].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={cls} {...props}>
        {iconLeft && <span className="flex shrink-0 items-center">{iconLeft}</span>}
        {children}
      </span>
    );
  },
);

Pill.displayName = "Pill";
export default Pill;
