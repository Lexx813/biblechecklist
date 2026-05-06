interface Props {
  value: number; // 0..1
  label?: string;
  size?: "sm" | "md";
  tone?: "violet" | "gold";
}

export default function ProgressBar({ value, label, size = "md", tone = "violet" }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const height = size === "sm" ? "h-1.5" : "h-2";
  const inProgress = pct > 0 && pct < 100;
  // Gold reserved for achievement contexts only (per DESIGN.md). Default tone
  // is violet; the gold tone is kept available for streak/badge surfaces only.
  const fillBg =
    tone === "gold"
      ? "bg-linear-to-r from-[#fcd34d] via-[var(--color-gold)] to-[#b45309]"
      : "bg-linear-to-r from-[var(--violet-400)] via-[var(--violet-600)] to-[var(--violet-800)]";
  const glow =
    tone === "gold"
      ? "shadow-[0_0_12px_rgba(245,158,11,0.45)]"
      : "shadow-[0_0_12px_rgba(124,58,237,0.45)]";

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-600 dark:text-white/60">
          <span>{label}</span>
          <span className="tabular-nums font-medium text-slate-800 dark:text-white/80">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className={`relative w-full overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-300/50 dark:bg-white/10 dark:ring-white/5 ${height} shadow-inner`}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`relative h-full rounded-full ${fillBg} ${glow} transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        >
          <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-linear-to-b from-white/35 to-transparent pointer-events-none" />
          {inProgress && (
            <span
              aria-hidden
              className="absolute inset-0 rounded-full opacity-70 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2.4s linear infinite",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
