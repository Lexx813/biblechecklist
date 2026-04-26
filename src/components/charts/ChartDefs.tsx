interface AreaGradientProps {
  id: string;
  color: string;
  /** Top-of-chart opacity (0..1). Default 0.45. */
  topOpacity?: number;
}

export function AreaGradient({ id, color, topOpacity = 0.45 }: AreaGradientProps) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={topOpacity} />
      <stop offset="55%" stopColor={color} stopOpacity={topOpacity * 0.35} />
      <stop offset="100%" stopColor={color} stopOpacity={0} />
    </linearGradient>
  );
}

interface BarGradientProps {
  id: string;
  color: string;
  /** Optional override for the bright top stop. Defaults to color at 100%. */
  highlight?: string;
}

export function BarGradient({ id, color, highlight }: BarGradientProps) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={highlight ?? color} stopOpacity={1} />
      <stop offset="60%" stopColor={color} stopOpacity={0.95} />
      <stop offset="100%" stopColor={color} stopOpacity={0.7} />
    </linearGradient>
  );
}

interface GlowProps {
  id: string;
  /** Larger = softer/wider glow. Default 2.5. */
  stdDeviation?: number;
}

export function Glow({ id, stdDeviation = 2.5 }: GlowProps) {
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={stdDeviation} result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}
