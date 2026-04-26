import { useState, useEffect, useMemo } from "react";

export interface ChartTheme {
  isDark: boolean;
  grid: string;
  tick: string;
  tooltip: {
    contentStyle: React.CSSProperties;
    itemStyle: React.CSSProperties;
    cursor: { fill: string };
  };
  purple: string;
  purpleLight: string;
  purpleDark: string;
  teal: string;
  tealLight: string;
  amber: string;
  amberLight: string;
  green: string;
  red: string;
  text: string;
}

const PURPLE = "#7c3aed";
const PURPLE_LIGHT = "#a78bfa";
const PURPLE_DARK = "#4c1d95";
const TEAL = "#0d9488";
const TEAL_LIGHT = "#5eead4";
const AMBER = "#d97706";
const AMBER_LIGHT = "#fbbf24";
const GREEN = "#16a34a";
const RED = "#ef4444";

export function useChartTheme(): ChartTheme {
  const [isDark, setIsDark] = useState(() =>
    typeof document === "undefined" ? true : document.documentElement.dataset.theme !== "light"
  );

  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.dataset.theme !== "light");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  return useMemo<ChartTheme>(() => ({
    isDark,
    grid: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.06)",
    tick: isDark ? "#94a3b8" : "#94a3b8",
    tooltip: isDark
      ? {
          contentStyle: {
            background: "rgba(20, 10, 45, 0.92)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(167, 139, 250, 0.25)",
            borderRadius: 10,
            fontSize: 12,
            padding: "8px 12px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1)",
          },
          itemStyle: { color: "#e9d5ff" },
          cursor: { fill: "rgba(167, 139, 250, 0.08)" },
        }
      : {
          contentStyle: {
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(124,58,237,0.18)",
            borderRadius: 10,
            fontSize: 12,
            padding: "8px 12px",
            boxShadow: "0 12px 32px rgba(15,23,42,0.12)",
          },
          itemStyle: { color: "#4c1d95" },
          cursor: { fill: "rgba(124, 58, 237, 0.06)" },
        },
    purple: PURPLE,
    purpleLight: PURPLE_LIGHT,
    purpleDark: PURPLE_DARK,
    teal: TEAL,
    tealLight: TEAL_LIGHT,
    amber: AMBER,
    amberLight: AMBER_LIGHT,
    green: GREEN,
    red: RED,
    text: isDark ? "#e9d5ff" : "#4c1d95",
  }), [isDark]);
}
