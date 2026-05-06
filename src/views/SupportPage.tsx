import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  navigate: (page: string, params?: Record<string, any>) => void;
}

export default function SupportPage({ navigate }: Props) {
  const { t } = useTranslation();
  return (
    <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("home")}
        className="mb-6 inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        {t("support.back")}
      </button>

      <header className="mb-10">
        <h1 className="m-0 text-[clamp(28px,4vw,40px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-[var(--text-primary)]">
          {t("support.title")}
        </h1>
        <p className="m-0 mt-3 max-w-[60ch] text-[16px] leading-relaxed text-[var(--text-secondary)]">
          {t("support.subtitle")}
        </p>
      </header>

      <section className="mb-10 rounded-md border border-[var(--border)] bg-[var(--card-bg)] p-6 sm:p-8">
        <h2 className="m-0 text-lg font-bold tracking-tight text-[var(--text-primary)]">{t("support.whereGoesHeading")}</h2>
        <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0 text-[15px] leading-relaxed text-[var(--text-secondary)]">
          <Item>{t("support.whereGoesItem1")}</Item>
          <Item>{t("support.whereGoesItem2")}</Item>
          <Item>{t("support.whereGoesItem3")}</Item>
          <Item>{t("support.whereGoesItem4")}</Item>
        </ul>
      </section>

      <section className="mb-10 grid gap-4 sm:grid-cols-2">
        <Tier amount="$5" label={t("support.tierCoffee.label")} note={t("support.tierCoffee.desc")} />
        <Tier amount="$15" label={t("support.tierHosting.label")} note={t("support.tierHosting.desc")} />
        <Tier amount="$30" label={t("support.tierTranslation.label")} note={t("support.tierTranslation.desc")} />
        <Tier amount="Custom" label={t("support.tierCustom.label")} note={t("support.tierCustom.desc")} />
      </section>

      <section className="rounded-md border border-[var(--border)] bg-[var(--teal-soft,#F5F3FF)] p-6 sm:p-8">
        <h2 className="m-0 text-lg font-bold tracking-tight text-[var(--text-primary)]">{t("support.noteHeading")}</h2>
        <p className="m-0 mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {t("support.noteBody")}
        </p>
      </section>

      <p className="mt-12 text-center text-sm text-[var(--text-muted)]">
        {t("support.thankYou")}
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
  const { t } = useTranslation();
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
      <span className="mt-auto pt-2 text-[13px] font-semibold text-[var(--teal)]">
        {donateUrl === "#" ? t("support.comingSoon") : t("support.giveCta")}
      </span>
    </a>
  );
}
