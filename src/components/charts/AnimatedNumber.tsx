import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  format?: (n: number) => string;
  durationMs?: number;
  className?: string;
}

export default function AnimatedNumber({ value, format, durationMs = 900, className }: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startedRef = useRef(false);

  useEffect(() => {
    // First mount: snap to value, then animate from 0 → value once
    if (!startedRef.current) {
      startedRef.current = true;
      fromRef.current = 0;
      setDisplay(0);
    } else {
      fromRef.current = display;
    }

    const start = performance.now();
    const from = fromRef.current;
    const to = value;
    if (from === to) { setDisplay(to); return; }

    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  const out = format ? format(display) : Math.round(display).toLocaleString();
  return <span className={className}>{out}</span>;
}
