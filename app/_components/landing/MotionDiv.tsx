"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useSaveData } from "../../../src/hooks/useSaveData";

type Variant = "fadeUp" | "slideLeft" | "slideRight" | "fadeIn";

interface Props {
  variant?: Variant;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

const HIDDEN_TRANSFORM: Record<Variant, string> = {
  fadeUp:     "translateY(36px)",
  slideLeft:  "translateX(-56px)",
  slideRight: "translateX(56px)",
  fadeIn:     "none",
};

/**
 * CSS-only fade-up wrapper. IntersectionObserver flips visibility when the
 * element enters the viewport; CSS transitions handle the animation. Replaces
 * the previous `motion/react` import (~30KB gzipped on the landing critical
 * path) with 0KB of runtime JS beyond the observer.
 *
 * On constrained connections (Data Saver / 2G–3G) the animation is skipped
 * and content shows in its final state from first paint.
 */
export default function MotionDiv({
  variant = "fadeUp",
  delay = 0,
  duration = 0.55,
  className,
  style,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const slow = useSaveData();

  useEffect(() => {
    if (slow) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin: "-50px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [slow]);

  const skip = slow;
  const easing = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  const transform = visible || skip ? "none" : HIDDEN_TRANSFORM[variant];
  const opacity = visible || skip ? 1 : 0;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity,
        transform,
        transition: skip
          ? "none"
          : `opacity ${duration}s ${easing} ${delay}s, transform ${duration}s ${easing} ${delay}s`,
        willChange: visible ? undefined : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
