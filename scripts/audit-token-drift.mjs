#!/usr/bin/env node
/**
 * Token drift detector.
 *
 * Per PRODUCT.md / DESIGN.md, violet-600 (`#7c3aed`) is the single brand
 * purple. Hex literals for purple — and `#000` / `#fff` — should reference
 * tokens (`var(--violet-N)`, `var(--text-primary)`, etc.) so the theme stays
 * one-place-to-change.
 *
 * Allowlist (intentional):
 *   - Token source files (app.css, globals.css, src/lib/colors.ts)
 *   - `var(--token, #hex)` fallback patterns
 *   - Per-user identity gradient palettes (avatarGradient.ts, HomePage.tsx
 *     VIOLET_GRADIENTS, ActivityFeedInline.tsx, blog/DiscoveryPage.tsx,
 *     messages/chatHelpers.tsx color picker)
 *   - Remotion video renders (src/remotion/*) — render to MP4, no CSS context
 *   - Pre-CSS-load fallback pages (app/error.tsx, app/not-found.tsx,
 *     app/global-error.tsx, app/promo/page.tsx)
 *   - Email HTML strings (app/api/unsubscribe/route.ts)
 *
 * Exit 0 if clean, 2 if drift found (so it can gate CI).
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const PURPLE_DRIFT = [
  // canonical-brand spelled as a literal outside token files
  "#7c3aed", "#7C3AED",
  // legacy / non-canonical purples
  "#6a3daa", "#6A3DAA", "#5530a0", "#5530A0",
  "#6d28d9", "#6D28D9", "#5b21b6", "#5B21B6",
  "#4c1d95", "#4C1D95", "#2e1065", "#2E1065",
  "#8b5cf6", "#8B5CF6", "#a78bfa", "#A78BFA",
  "#c4b5fd", "#C4B5FD", "#ddd6fe", "#DDD6FE",
  "#ede9fe", "#EDE9FE", "#f5f3ff", "#F5F3FF",
  // Tailwind purple-* (different hue family, NOT violet)
  "#a855f7", "#A855F7", "#c084fc", "#C084FC",
  // non-scale drift seen historically
  "#9d7cf2", "#9D7CF2", "#9F7AEA", "#9f7aea",
];

const NEUTRAL_DRIFT = ["#000", "#000000", "#fff", "#ffffff", "#FFF", "#FFFFFF"];

// Files where hex literals are intentional and should not be flagged.
const ALLOWLIST = [
  /^src\/styles\/app\.css$/,
  /^app\/globals\.css$/,
  /^src\/lib\/colors\.ts$/,
  /^src\/lib\/avatarGradient\.ts$/,
  /^src\/views\/social\/ActivityFeedInline\.tsx$/, // per-user identity gradients
  /^src\/views\/blog\/MyPostsPage\.tsx$/, // tag/category color palette array
  /^src\/components\/messages\/chatHelpers\.tsx$/,
  /^src\/remotion\//,
  /opengraph-image\.tsx$/, // @vercel/og renders to PNG, no var() support
  /^app\/error\.tsx$/,
  /^app\/not-found\.tsx$/,
  /^app\/global-error\.tsx$/,
  /^app\/promo\/page\.tsx$/,
  /^app\/api\/unsubscribe\/route\.ts$/,
  /^src\/components\/BookCelebration\.tsx$/, // celebration confetti palette
  /^src\/components\/CommandPalette\.tsx$/, // per-nav-item identity icon gradients
  /^src\/components\/home\/HomeLeftSidebar\.tsx$/, // same nav icon gradients
  /^src\/components\/LoadingSpinner\.tsx$/, // var() fallback hex
  /^src\/components\/InstallPrompt\.tsx$/, // landing CTA gradient pre-CSS-token
  /^scripts\//,
  /\/__tests__\//,
];

// Listing files via git keeps the check fast and ignores node_modules / build dirs.
const tracked = execSync(
  "git ls-files 'src/**/*.css' 'src/**/*.tsx' 'src/**/*.ts' 'app/**/*.css' 'app/**/*.tsx' 'app/**/*.ts'",
  { encoding: "utf8" },
).trim().split("\n").filter(Boolean);

const findings = [];

for (const file of tracked) {
  if (ALLOWLIST.some(re => re.test(file))) continue;
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");

  lines.forEach((line, idx) => {
    // Skip CSS comments and JS line/block comments that contain a hex.
    const stripped = line.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/, "");
    // Skip fallback pattern: var(--token, #hex) is intentional belt-and-suspenders.
    const noFallback = stripped.replace(/var\([^)]*?,\s*#[0-9a-fA-F]+\s*\)/g, "");

    for (const hex of PURPLE_DRIFT) {
      if (noFallback.includes(hex)) {
        findings.push({ file, line: idx + 1, value: hex, kind: "purple-drift", snippet: line.trim() });
      }
    }
    for (const hex of NEUTRAL_DRIFT) {
      const re = new RegExp(`(?<![0-9a-fA-F])${hex}(?![0-9a-fA-F])`);
      if (re.test(noFallback)) {
        findings.push({ file, line: idx + 1, value: hex, kind: "neutral-drift", snippet: line.trim() });
      }
    }
  });
}

const purple = findings.filter(f => f.kind === "purple-drift");
const neutral = findings.filter(f => f.kind === "neutral-drift");

if (purple.length === 0 && neutral.length === 0) {
  console.log("✓ No token drift detected.");
  process.exit(0);
}

// Purple drift = brand-critical (single-purple rule). Always report by file.
if (purple.length > 0) {
  console.log(`PURPLE DRIFT — ${purple.length} hex literal(s) violate the single-brand-violet rule:\n`);
  const byFile = new Map();
  for (const f of purple) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }
  for (const [file, fs] of byFile) {
    console.log(`  ${file}`);
    for (const f of fs) console.log(`    L${f.line}  ${f.value}  ${f.snippet.slice(0, 100)}`);
    console.log();
  }
}

// Neutral drift = `#fff`/`#000` outside tokens. Noisy (lots in decorative SVG, palette arrays).
// Report as warning only — count per file, don't list every line.
if (neutral.length > 0) {
  console.log(`Neutral drift (informational) — ${neutral.length} #000/#fff literal(s):\n`);
  const byFile = new Map();
  for (const f of neutral) byFile.set(f.file, (byFile.get(f.file) ?? 0) + 1);
  for (const [file, count] of byFile) console.log(`  ${count.toString().padStart(4)}  ${file}`);
  console.log();
  console.log("Run with --strict to fail on neutral drift too. Most are decorative SVG fills / palette arrays.");
}

console.log("Fix by replacing literals with var(--violet-N) / var(--text-primary) / var(--card-bg) etc.");
console.log("If a hex is intentional (Remotion render, pre-CSS fallback page, identity palette), add the file to ALLOWLIST in scripts/audit-token-drift.mjs.");

// Only fail on purple drift unless --strict.
const strict = process.argv.includes("--strict");
process.exit(purple.length > 0 || (strict && neutral.length > 0) ? 2 : 0);
