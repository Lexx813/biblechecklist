"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MESSIANIC_PROPHECIES,
  PROPHECY_CATEGORIES,
  wolUrlFor,
  type MessianicProphecyPair,
  type ScriptureRef,
  type ProphecyCategory,
} from "../../src/data/messianicProphecies";

/**
 * Editorial-typographic treatment for the messianic prophecy dataset.
 * Two sections:
 *   1. <ConvergenceMap> — quiet ink-on-paper SVG: 12 prophets, one anchor.
 *   2. <PairsByStage>   — tab-driven prophecy/fulfillment entries.
 *
 * No animation library, no gradients as decoration, no glassmorphism.
 * Sub-components hoisted to module scope (avoids remount-per-render).
 */
export default function MessianicScrolly() {
  return (
    <>
      <ConvergenceMap />
      <PairsByStage />
    </>
  );
}

// ── Convergence map ──────────────────────────────────────────────────────────

interface ProphetNode {
  id: string;
  name: string;
  year: string;
  /** approximate writing date in years BCE, used only for vertical placement */
  bce: number;
}

const PROPHETS: ProphetNode[] = [
  { id: "moses",     name: "Moses",     year: "≈ 1500 BCE", bce: 1500 },
  { id: "david",     name: "David",     year: "≈ 1000 BCE", bce: 1000 },
  { id: "hosea",     name: "Hosea",     year: "≈ 745 BCE",  bce: 745 },
  { id: "isaiah",    name: "Isaiah",    year: "≈ 730 BCE",  bce: 730 },
  { id: "micah",     name: "Micah",     year: "≈ 717 BCE",  bce: 717 },
  { id: "jeremiah",  name: "Jeremiah",  year: "≈ 580 BCE",  bce: 580 },
  { id: "daniel",    name: "Daniel",    year: "≈ 536 BCE",  bce: 536 },
  { id: "zechariah", name: "Zechariah", year: "≈ 518 BCE",  bce: 518 },
  { id: "malachi",   name: "Malachi",   year: "≈ 443 BCE",  bce: 443 },
];

function ConvergenceMap() {
  const ref = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (es) => { for (const e of es) if (e.isIntersecting) { setActive(true); obs.disconnect(); break; } },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const W = 1080, H = 580;
  const leftX = 240;
  const targetX = 880;
  const targetY = H / 2;
  const padTop = 60, padBot = 60;
  const usableH = H - padTop - padBot;

  const nodes = PROPHETS.map((p, i) => ({
    ...p,
    x: leftX,
    y: padTop + (i * usableH) / (PROPHETS.length - 1),
  }));

  return (
    <section className="border-b border-[var(--border)] bg-[var(--bg)] px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-y-8 lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--text-muted)]">
              Pt. II
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Convergence</p>
          </div>
          <div className="lg:col-span-9 lg:col-start-3">
            <h2 className="text-[clamp(1.75rem,4.2vw,3.25rem)] font-extrabold leading-[0.98] tracking-[-0.025em] text-[var(--text-primary)]">
              Fifteen centuries of voices.
              <br />
              One target.
            </h2>
            <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-[var(--text-muted)]">
              Each prophet wrote in his own century, in his own city, often without ever reading the others. None of them met Jesus.
              Drawn to scale, the chronology converges on a single point.
            </p>
          </div>
        </div>

        <div className="mt-12 sm:mt-16">
          <svg
            ref={ref}
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full"
            role="img"
            aria-label="Twelve Hebrew Scripture prophets connected by lines to a single point representing Jesus"
          >
            {/* Era labels */}
            <g fontFamily="inherit" fontSize="11" fontWeight="700" letterSpacing="0.32em" fill="currentColor" opacity="0.45">
              <text x={leftX} y={28} textAnchor="middle">HEBREW SCRIPTURES</text>
              <text x={targetX} y={28} textAnchor="middle">≈ 33 C.E.</text>
            </g>

            {/* Subtle horizontal axis */}
            <line x1="0" y1={targetY} x2={W} y2={targetY} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />

            {/* Connection lines: hairlines, no gradient */}
            {nodes.map((n, i) => {
              const cx1 = leftX + 220;
              const cy1 = n.y;
              const cx2 = targetX - 140;
              const cy2 = targetY;
              const path = `M ${n.x + 10} ${n.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${targetX - 16} ${targetY}`;
              const length = 1300;
              return (
                <path
                  key={`line-${n.id}`}
                  d={path}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.32"
                  strokeWidth="1"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: length,
                    strokeDashoffset: active ? 0 : length,
                    transition: `stroke-dashoffset 1500ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 90}ms`,
                  }}
                />
              );
            })}

            {/* Convergence point: solid violet, no glow */}
            <g
              style={{
                opacity: active ? 1 : 0,
                transform: active ? "translate(0,0)" : "translate(-8px,0)",
                transition: "opacity 600ms ease-out 1500ms, transform 600ms ease-out 1500ms",
              }}
            >
              <circle cx={targetX} cy={targetY} r="9" fill="#7C3AED" />
              <text
                x={targetX + 24}
                y={targetY - 4}
                fontFamily="inherit"
                fontSize="32"
                fontWeight="800"
                letterSpacing="-0.02em"
                fill="currentColor"
              >
                Jesus
              </text>
              <text
                x={targetX + 24}
                y={targetY + 18}
                fontFamily="inherit"
                fontSize="11"
                fontWeight="700"
                letterSpacing="0.28em"
                fill="currentColor"
                opacity="0.55"
              >
                MESSIAH FORETOLD
              </text>
            </g>

            {/* Prophet nodes */}
            {nodes.map((n, i) => (
              <g
                key={n.id}
                style={{
                  opacity: active ? 1 : 0,
                  transform: active ? "translateX(0)" : "translateX(-10px)",
                  transition: `opacity 500ms ease-out ${i * 70}ms, transform 500ms ease-out ${i * 70}ms`,
                }}
              >
                <circle cx={n.x} cy={n.y} r="4" fill="currentColor" />
                <text x={n.x - 16} y={n.y + 6} textAnchor="end" fontFamily="inherit" fontSize="20" fontWeight="700" fill="currentColor">
                  {n.name}
                </text>
                <text x={n.x - 16} y={n.y + 26} textAnchor="end" fontFamily="inherit" fontSize="11" fontWeight="600" letterSpacing="0.12em" fill="currentColor" opacity="0.55">
                  {n.year}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}

// ── Pairs by stage (tabs + entries) ──────────────────────────────────────────

const CATEGORY_INDEX: Record<ProphecyCategory, string> = {
  lineage:        "01",
  birth:          "02",
  ministry:       "03",
  rejection:      "04",
  "death-burial": "05",
  resurrection:   "06",
};

function PairsByStage() {
  const [active, setActive] = useState<ProphecyCategory>(PROPHECY_CATEGORIES[0].key);
  const cat = PROPHECY_CATEGORIES.find((c) => c.key === active) ?? PROPHECY_CATEGORIES[0];
  const pairs = MESSIANIC_PROPHECIES.filter((p) => p.category === active);

  return (
    <section className="bg-[var(--bg)] px-4 pb-32 pt-20 sm:px-6 sm:pb-40 sm:pt-24 lg:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Section label */}
        <div className="grid gap-y-8 lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--text-muted)]">
              Pt. III
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">By stage of his life</p>
          </div>
          <div className="lg:col-span-9 lg:col-start-3">
            <h2 className="text-[clamp(1.75rem,4.2vw,3.25rem)] font-extrabold leading-[0.98] tracking-[-0.025em] text-[var(--text-primary)]">
              Walk through every prophecy.
            </h2>
          </div>
        </div>

        {/* Tabs: chapter-heading scale, full bleed.
            Tailwind preflight is off, so each <button> needs explicit
            background/border/padding/font reset to escape user-agent defaults. */}
        <div
          role="tablist"
          aria-label="Stages of the Messiah's life"
          className="mt-12 -mx-4 grid grid-cols-2 gap-x-1 gap-y-px overflow-x-auto border-y border-[var(--border)] sm:-mx-6 sm:grid-cols-3 lg:mx-0 lg:grid-cols-6 lg:gap-x-px"
        >
          {PROPHECY_CATEGORIES.map((c) => {
            const count = MESSIANIC_PROPHECIES.filter((p) => p.category === c.key).length;
            const isActive = c.key === active;
            return (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${c.key}`}
                id={`tab-${c.key}`}
                onClick={() => setActive(c.key)}
                style={{ appearance: "none", background: "none", border: 0, font: "inherit", color: "inherit" }}
                className={`group relative cursor-pointer px-4 py-5 text-left transition-colors sm:px-5 sm:py-6 ${
                  isActive
                    ? "bg-[var(--card-bg)]"
                    : "bg-transparent hover:bg-[var(--card-bg)]"
                }`}
              >
                {/* active rule */}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 top-0 h-[3px] transition-colors ${
                    isActive ? "bg-violet-600" : "bg-transparent"
                  }`}
                />
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-[10px] font-bold tracking-[0.28em] tabular-nums transition-colors ${
                      isActive ? "text-violet-700 dark:text-violet-300" : "text-[var(--text-muted)]"
                    }`}
                  >
                    {CATEGORY_INDEX[c.key]}
                  </span>
                  <span
                    className={`text-[10px] font-bold tabular-nums transition-colors ${
                      isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] opacity-50"
                    }`}
                  >
                    {String(count).padStart(2, "0")}
                  </span>
                </div>
                <div
                  className={`mt-2 text-base font-extrabold leading-[1.05] tracking-[-0.02em] transition-colors sm:text-lg lg:text-xl ${
                    isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                  }`}
                >
                  {c.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active panel */}
        <div
          key={active}
          id={`panel-${active}`}
          role="tabpanel"
          aria-labelledby={`tab-${active}`}
          className="animate-[panelFade_500ms_cubic-bezier(0.22,1,0.36,1)]"
        >
          <p className="mt-10 max-w-[58ch] text-lg leading-relaxed text-[var(--text-muted)]">
            {cat.description}
          </p>

          <ol className="mt-12 divide-y divide-[var(--border)]">
            {pairs.map((pair, i) => (
              <ProphecyEntry key={pair.id} pair={pair} index={i + 1} />
            ))}
          </ol>
        </div>

        <style>{`
          @keyframes panelFade {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </section>
  );
}

// ── Single editorial entry ──────────────────────────────────────────────────

function ProphecyEntry({ pair, index }: { pair: MessianicProphecyPair; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setVisible(true); obs.disconnect(); break; }
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <li
      ref={ref}
      className={`grid grid-cols-1 gap-x-12 gap-y-6 py-12 transition-opacity duration-700 lg:grid-cols-12 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      {/* Index + prophecy ref */}
      <div className="lg:col-span-4">
        <p className="text-[11px] font-bold tracking-[0.28em] tabular-nums text-[var(--text-muted)]">
          № {String(index).padStart(2, "0")}
        </p>
        <div className="mt-2">
          <ScriptureLink
            refData={pair.prophecy}
            className="inline-block text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[var(--text-primary)] underline decoration-[var(--border)] decoration-2 underline-offset-[6px] transition hover:decoration-violet-600 sm:text-4xl"
          />
        </div>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">
          Hebrew Scriptures
        </p>
      </div>

      {/* Summary + fulfillment refs */}
      <div className="lg:col-span-8">
        <p className="max-w-[60ch] text-lg leading-relaxed text-[var(--text-primary)] sm:text-xl">
          {pair.summary}
        </p>
        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">
            Fulfilled in the Christian Greek Scriptures
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-1 gap-y-2 text-[var(--text-primary)]">
            {pair.fulfillments.map((r, idx) => (
              <li key={r.ref} className="flex items-baseline">
                <RefLink refData={r} />
                {idx < pair.fulfillments.length - 1 && (
                  <span className="px-2 text-[var(--text-muted)]" aria-hidden="true">·</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

function RefLink({ refData }: { refData: ScriptureRef }) {
  return (
    <ScriptureLink
      refData={refData}
      className="text-base font-bold underline decoration-[var(--border)] decoration-2 underline-offset-[5px] transition hover:decoration-violet-600 sm:text-lg"
    />
  );
}

/**
 * Scripture reference link with a hover/focus tooltip showing the NWT verse
 * text when available. The tooltip is portal-rendered to document.body so
 * it escapes ancestor stacking contexts (transform / opacity wrappers were
 * eating its z-index and causing the page to leak through). Solid bg
 * guaranteed by literal Tailwind colors.
 */
function ScriptureLink({ refData, className }: { refData: ScriptureRef; className?: string }) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [open, setOpen] = useState(false);
  const hasText = Boolean(refData.text);
  const tipId = `tip-${refData.bookSlug}-${refData.chapter}-${refData.ref.replace(/\W+/g, "-")}`;

  return (
    <>
      <a
        ref={linkRef}
        href={wolUrlFor(refData)}
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby={hasText ? tipId : undefined}
        onMouseEnter={() => hasText && setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => hasText && setOpen(true)}
        onBlur={() => setOpen(false)}
        className={className}
      >
        {refData.ref}
      </a>
      {hasText && open && <ScriptureTooltip id={tipId} refData={refData} anchor={linkRef} />}
    </>
  );
}

function ScriptureTooltip({
  id,
  refData,
  anchor,
}: {
  id: string;
  refData: ScriptureRef;
  anchor: React.RefObject<HTMLElement | null>;
}) {
  const [pos, setPos] = useState<{ left: number; top: number; placement: "above" | "below" } | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    function place() {
      const el = anchor.current;
      const tip = tipRef.current;
      if (!el || !tip) return;
      const r = el.getBoundingClientRect();
      const tipRect = tip.getBoundingClientRect();
      const PAD = 12;
      const arrowGap = 12;
      const desiredW = tipRect.width || 320;
      // Center horizontally on the link
      let left = r.left + r.width / 2 - desiredW / 2;
      // Clamp to viewport
      left = Math.max(PAD, Math.min(left, window.innerWidth - desiredW - PAD));
      // Prefer above; if no room, go below
      const spaceAbove = r.top;
      const tipH = tipRect.height || 140;
      const placement: "above" | "below" = spaceAbove > tipH + arrowGap + PAD ? "above" : "below";
      const top = placement === "above"
        ? r.top - tipH - arrowGap + window.scrollY
        : r.bottom + arrowGap + window.scrollY;
      setPos({ left: left + window.scrollX, top, placement });
    }
    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [anchor]);

  if (typeof document === "undefined") return null;

  const arrowStyle: React.CSSProperties = pos?.placement === "above"
    ? { bottom: "-5px", left: "50%", transform: "translateX(-50%) rotate(45deg)" }
    : { top: "-5px",   left: "50%", transform: "translateX(-50%) rotate(45deg)" };

  return createPortal(
    <div
      ref={tipRef}
      id={id}
      role="tooltip"
      style={{
        position: "absolute",
        left: pos?.left ?? -9999,
        top: pos?.top ?? -9999,
        width: "min(20rem, 88vw)",
        opacity: pos ? 1 : 0,
        transition: "opacity 150ms ease-out",
        pointerEvents: "none",
        zIndex: 1000,
      }}
      className="rounded-md border border-slate-200 bg-white px-4 py-3 text-left text-slate-900 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.45),0_4px_12px_-4px_rgba(0,0,0,0.18)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-700 dark:text-violet-300">
        {refData.ref} · NWT
      </div>
      <div className="mt-2 text-sm leading-[1.55]">
        &ldquo;{refData.text}&rdquo;
      </div>
      <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
        wol.jw.org
      </div>
      <div
        aria-hidden="true"
        style={arrowStyle}
        className="absolute size-2.5 border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
      />
    </div>,
    document.body,
  );
}
