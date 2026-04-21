interface Props {
  value: number; // 0..1
  label?: string;
  size?: "sm" | "md";
  tone?: "purple" | "gold";
}

export default function ProgressBar({ value, label, size = "md", tone = "gold" }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const height = size === "sm" ? "h-1.5" : "h-2";
  const fillBg =
    tone === "gold"
      ? "bg-gradient-to-r from-[var(--color-jw-gold)] to-[#e0c078]"
      : "bg-gradient-to-r from-[var(--color-jw-purple-light)] to-[var(--color-jw-purple)]";

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-600 [html[data-theme=dark]_&]:text-white/60">
          <span>{label}</span>
          <span className="tabular-nums font-medium text-slate-800 [html[data-theme=dark]_&]:text-white/80">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-300/50 [html[data-theme=dark]_&]:bg-white/10 [html[data-theme=dark]_&]:ring-white/5 ${height}`}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${fillBg} h-full rounded-full shadow-[0_0_12px_rgba(201,169,97,0.4)] transition-[width] duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
