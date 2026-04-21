"use client";
import { useEffect, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";

type Variant = "fadeUp" | "slideLeft" | "slideRight" | "fadeIn";

const VARIANTS: Record<Variant, { hidden: object; visible: object }> = {
  fadeUp:     { hidden: { opacity: 0, y: 36 },   visible: { opacity: 1, y: 0 } },
  slideLeft:  { hidden: { opacity: 0, x: -56 },  visible: { opacity: 1, x: 0 } },
  slideRight: { hidden: { opacity: 0, x: 56 },   visible: { opacity: 1, x: 0 } },
  fadeIn:     { hidden: { opacity: 0 },           visible: { opacity: 1 } },
};

interface Props {
  variant?: Variant;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

// Lazy-loads motion/react after first paint so it's off the critical JS path.
// Renders a plain div until motion is ready — content is always visible on SSR/FCP.
export default function MotionDiv({
  variant = "fadeUp",
  delay = 0,
  duration = 0.55,
  className,
  style,
  children,
}: Props) {
  const [Div, setDiv] = useState<ComponentType<any> | null>(null);

  useEffect(() => {
    import("motion/react").then((m) => setDiv(() => m.motion.div));
  }, []);

  if (!Div) {
    return <div className={className} style={style}>{children}</div>;
  }

  return (
    <Div
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={VARIANTS[variant]}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </Div>
  );
}
