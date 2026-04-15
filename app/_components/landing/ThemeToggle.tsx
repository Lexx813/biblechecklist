"use client";

import { useState, useEffect } from "react";

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const btnClass = "flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[var(--lp-border)] bg-[var(--lp-card-bg)] text-[var(--lp-muted)] transition-all duration-150 hover:border-[var(--lp-primary)] hover:bg-[var(--lp-pill-bg)] hover:text-[var(--lp-text)]";

export default function ThemeToggle() {
  // Start with null to avoid hydration mismatch — the inline script in layout.tsx
  // sets data-theme before paint, but the server doesn't know the user's preference.
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("nwt-theme", next ? "dark" : "light"); } catch {}
  }

  // Before hydration: render a placeholder button with no icon to match server output
  if (dark === null) {
    return <button className={btnClass} aria-label="Toggle theme"><span className="size-[18px]" /></button>;
  }

  return (
    <button
      className={btnClass}
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
