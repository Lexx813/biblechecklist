import { useState } from "react";
import { Button, Card, Input, Field, Textarea } from "../components/ui";

export default function UIPreview() {
  const [loading, setLoading] = useState(false);
  const [inputVal, setInputVal] = useState("");

  return (
    <div className="mx-auto max-w-[860px] px-6 py-12" style={{ fontFamily: "var(--font-sans, inherit)" }}>
      <h1 className="mb-1 text-2xl font-bold text-[var(--text-primary)]">UI Component Preview</h1>
      <p className="mb-10 text-sm text-[var(--text-muted)]">Tailwind-based reusable components — matching existing design tokens.</p>

      {/* ── Buttons ─────────────────────────────────────────── */}
      <section className="mb-12">
        <h2 className="mb-5 text-lg font-bold text-[var(--text-primary)]">Buttons</h2>

        <div className="mb-4">
          <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Variants</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="danger-outline">Danger Outline</Button>
            <Button variant="text">Text Link</Button>
            <Button variant="icon" aria-label="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Sizes</h3>
          <div className="flex flex-wrap items-end gap-3">
            <Button variant="primary" size="xs">Extra Small</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">States</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="primary" loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 2000); }}>
              {loading ? "Saving..." : "Click to Load"}
            </Button>
            <Button variant="secondary" disabled>Disabled Secondary</Button>
          </div>
        </div>

        <div>
          <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">With Icons</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" iconLeft={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>
              New Post
            </Button>
            <Button variant="secondary" iconRight={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}>
              View All
            </Button>
            <Button variant="danger" size="sm" iconLeft={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14H7L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>}>
              Delete
            </Button>
          </div>
        </div>
      </section>

      {/* ── Cards ──────────────────────────────────────────── */}
      <section className="mb-12">
        <h2 className="mb-5 text-lg font-bold text-[var(--text-primary)]">Cards</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="default" className="p-5">
            <h3 className="mb-1 text-sm font-bold text-[var(--text-primary)]">Default Card</h3>
            <p className="text-sm text-[var(--text-muted)]">Standard card with border, no shadow. Good for static content sections.</p>
          </Card>

          <Card variant="elevated" className="p-5">
            <h3 className="mb-1 text-sm font-bold text-[var(--text-primary)]">Elevated Card</h3>
            <p className="text-sm text-[var(--text-muted)]">Hover to see the lift effect with shadow and purple border accent.</p>
          </Card>

          <Card variant="interactive" className="p-5">
            <h3 className="mb-1 text-sm font-bold text-[var(--text-primary)]">Interactive Card</h3>
            <p className="text-sm text-[var(--text-muted)]">Clickable feed item — subtle hover bg, active scale-down. Click me!</p>
          </Card>

          <Card variant="section" className="p-5">
            <h3 className="mb-1 text-sm font-bold text-[var(--text-primary)]">Section Card</h3>
            <p className="text-sm text-[var(--text-muted)]">Used for settings panels and form sections. Comes with padding.</p>
          </Card>
        </div>

        <div className="mt-4">
          <Card
            variant="default"
            header={<span className="text-sm font-bold text-[var(--text-primary)]">Card with Header</span>}
          >
            <div className="px-4 py-3">
              <p className="text-sm text-[var(--text-muted)]">The header prop adds a bordered header row automatically.</p>
            </div>
            <div className="border-t border-[var(--border)] px-4 py-3">
              <p className="text-sm text-[var(--text-muted)]">Content rows can stack below.</p>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Forms ──────────────────────────────────────────── */}
      <section className="mb-12">
        <h2 className="mb-5 text-lg font-bold text-[var(--text-primary)]">Form Elements</h2>

        <Card variant="section">
          <div className="flex flex-col gap-5">
            <Field label="Display Name" htmlFor="preview-name">
              <Input
                id="preview-name"
                placeholder="Enter your name"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
              />
            </Field>

            <Field label="Email Address" htmlFor="preview-email" hint="We'll never share your email.">
              <Input
                id="preview-email"
                type="email"
                placeholder="you@example.com"
                iconLeft={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
              />
            </Field>

            <Field label="Password" htmlFor="preview-pw" error hint="Password must be at least 8 characters.">
              <Input id="preview-pw" type="password" placeholder="********" error />
            </Field>

            <Field label="Disabled Input" htmlFor="preview-dis">
              <Input id="preview-dis" value="Can't edit this" disabled />
            </Field>

            <Field label="Study Notes" htmlFor="preview-notes">
              <Textarea id="preview-notes" placeholder="Write your thoughts on today's reading..." />
            </Field>

            <div className="flex gap-3 pt-2">
              <Button variant="primary">Save Changes</Button>
              <Button variant="secondary">Cancel</Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Combo example ──────────────────────────────────── */}
      <section className="mb-12">
        <h2 className="mb-5 text-lg font-bold text-[var(--text-primary)]">Combo: Feed Card</h2>

        <Card variant="default" flush>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-base font-bold text-[var(--text-primary)]">Community Notes</span>
            <Button variant="text" size="sm">View all</Button>
          </div>
          {["Genesis 1 — In the Beginning", "Psalm 23 — The Lord Is My Shepherd", "Romans 8 — No Condemnation"].map((title, i) => (
            <div key={i} className="flex cursor-pointer items-center gap-3 border-t border-[var(--border)] px-4 py-3 transition-colors duration-100 hover:bg-[var(--hover-bg)] [html[data-theme=dark]_&]:border-white/[0.06]">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2e1a5c] to-brand-800 text-[13px] font-bold text-white">
                {["M", "D", "A"][i]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div>
                <div className="text-xs text-[var(--text-muted)]">Publisher {i + 1} · 2h ago</div>
              </div>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
