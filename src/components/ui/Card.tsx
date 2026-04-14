import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

/* ── Variant class map ────────────────────────────────────────── */

const base =
  "rounded-[var(--radius)] border border-[var(--border)] overflow-hidden transition-all duration-150";

const variants = {
  /** Default card — subtle bg, border, no shadow */
  default:
    "bg-[var(--card-bg)] [html[data-theme=dark]_&]:bg-white/[0.06] [html[data-theme=dark]_&]:border-white/10",
  /** Elevated — adds shadow and hover lift */
  elevated:
    "bg-[var(--card-bg)] shadow-[var(--shadow-xs)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] hover:border-[rgba(124,58,237,0.35)] active:-translate-y-px active:shadow-[var(--shadow)] [html[data-theme=dark]_&]:bg-white/[0.06] [html[data-theme=dark]_&]:border-white/10",
  /** Interactive — clickable feed card with subtle hover */
  interactive:
    "bg-[var(--card-bg)] cursor-pointer hover:border-brand-600/[0.28] hover:bg-[var(--hover-bg)] hover:shadow-[var(--shadow-xs)] active:scale-[0.98] [html[data-theme=dark]_&]:bg-white/[0.06] [html[data-theme=dark]_&]:border-white/[0.06] [html[data-theme=dark]_&]:hover:bg-white/[0.09] [html[data-theme=dark]_&]:hover:border-brand-600/35",
  /** Section — settings/panel section card */
  section:
    "bg-[var(--card-bg)] p-5 [html[data-theme=dark]_&]:bg-[var(--card-bg)]",
  /** Ghost — transparent, no border or shadow */
  ghost:
    "bg-transparent border-transparent p-0 shadow-none",
} as const;

/* ── Props ─────────────────────────────────────────────────────── */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variants;
  /** Optional header rendered above children */
  header?: ReactNode;
  /** If true, removes default padding (children fill to edge) */
  flush?: boolean;
}

/* ── Component ─────────────────────────────────────────────────── */

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", header, flush, className, children, ...props }, ref) => {
    const cls = [base, variants[variant], !flush && variant !== "ghost" ? "" : "", className ?? ""]
      .filter(Boolean)
      .join(" ");

    return (
      <div ref={ref} className={cls} {...props}>
        {header && (
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 [html[data-theme=dark]_&]:border-white/[0.06]">
            {header}
          </div>
        )}
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
export default Card;
