import type { ReactNode } from "react";

interface Props {
  navigate: (page: string, params?: Record<string, any>) => void;
}

export default function SupportPage({ navigate }: Props) {
  return (
    <div className="mx-auto w-full max-w-[820px] px-4 py-10 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("home")}
        className="mb-6 inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <header className="mb-10">
        <h1 className="m-0 text-[clamp(28px,4vw,40px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-[var(--text-primary)]">
          Support JW Study
        </h1>
        <p className="m-0 mt-3 max-w-[60ch] text-[16px] leading-relaxed text-[var(--text-secondary)]">
          JW Study is free and always will be. If the app has helped your study, your daily reading, or your family — a one-time gift helps keep it running and growing.
        </p>
      </header>

      <section className="mb-10 rounded-md border border-[var(--border)] bg-[var(--card-bg)] p-6 sm:p-8">
        <h2 className="m-0 text-lg font-bold tracking-tight text-[var(--text-primary)]">Where your gift goes</h2>
        <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0 text-[15px] leading-relaxed text-[var(--text-secondary)]">
          <Item>Hosting, database, and email infrastructure</Item>
          <Item>Translation work for new languages</Item>
          <Item>Time to build the next features the community asks for</Item>
          <Item>Keeping the app ad-free, tracker-free, and free for everyone</Item>
        </ul>
      </section>

      <section className="mb-10 grid gap-4 sm:grid-cols-2">
        <Tier amount="$5" label="Coffee" note="A small thanks." />
        <Tier amount="$15" label="Monthly hosting" note="Covers a slice of infra." />
        <Tier amount="$30" label="Translation help" note="Funds review of one chapter in a new language." />
        <Tier amount="Custom" label="Any amount" note="Whatever feels right." />
      </section>

      <section className="rounded-md border border-[var(--border)] bg-[var(--teal-soft,#F5F3FF)] p-6 sm:p-8">
        <h2 className="m-0 text-lg font-bold tracking-tight text-[var(--text-primary)]">A note before you give</h2>
        <p className="m-0 mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
          For deeper Bible study, the Watch Tower Online Library and JW Library are the canonical sources — please support those first through your local congregation. JW Study is a personal companion tool, not a publisher. Donations here go to one solo developer; they are not tax-deductible and are not affiliated with any branch of Jehovah's Witnesses.
        </p>
      </section>

      <p className="mt-12 text-center text-sm text-[var(--text-muted)]">
        Thank you for using the app, whether or not you give. — Alexi
      </p>
    </div>
  );
}

function Item({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-[var(--teal)]"></span>
      <span>{children}</span>
    </li>
  );
}

function Tier({ amount, label, note }: { amount: string; label: string; note: string }) {
  const donateUrl = process.env.NEXT_PUBLIC_DONATE_URL || "#";
  const isCustom = amount === "Custom";
  const href = isCustom || donateUrl === "#" ? donateUrl : `${donateUrl}${donateUrl.includes("?") ? "&" : "?"}amount=${amount.replace("$", "")}`;
  return (
    <a
      href={href}
      target={donateUrl === "#" ? undefined : "_blank"}
      rel={donateUrl === "#" ? undefined : "noopener noreferrer"}
      className="group flex flex-col gap-1.5 rounded-md border border-[var(--border)] bg-[var(--card-bg)] p-5 no-underline transition-all hover:border-[var(--teal)] hover:shadow-md"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">{amount}</span>
        <span className="text-sm font-semibold text-[var(--teal)]">{label}</span>
      </div>
      <span className="text-[13px] leading-snug text-[var(--text-muted)]">{note}</span>
      <span className="mt-auto pt-2 text-[13px] font-semibold text-[var(--teal)] opacity-0 transition-opacity group-hover:opacity-100">
        {donateUrl === "#" ? "Coming soon" : "Give →"}
      </span>
    </a>
  );
}
