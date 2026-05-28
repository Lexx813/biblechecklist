import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ONLINE_THRESHOLD_MS } from "../../hooks/useOnlineMembers";
import { useCommunityMembers, useOnlineCount, type CommunityFilter, type CommunityMember } from "../../hooks/useCommunityMembers";
import { avatarGradient } from "../../lib/avatarGradient";
import { fmtDiff } from "../../lib/timeFormat";

const PAGE_SIZE = 24;

interface Props {
  user: { id: string };
  navigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function CommunityPage({ navigate }: Props) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<CommunityFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [filter, search]);

  const { data: onlineCount = 0 } = useOnlineCount();
  const { data, isLoading, isFetching, isError } = useCommunityMembers({
    page,
    pageSize: PAGE_SIZE,
    filter,
    search,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const usedFallback = data?.usedFallback ?? false;
  const totalPages = total === 0 ? 0 : Math.ceil(total / PAGE_SIZE);
  const hasMore = page < totalPages - 1;
  const hasPrev = page > 0;

  const rangeLabel = useMemo(() => {
    if (total === 0) return null;
    const start = page * PAGE_SIZE + 1;
    const end = Math.min(total, (page + 1) * PAGE_SIZE);
    return `${start}–${end} ${t("community.of")} ${total}`;
  }, [page, total, t]);

  return (
    <div className="px-4 pb-12 pt-2 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-[28px]">
            {t("community.title", "Community")}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {onlineCount > 0
              ? t("community.subtitleOnline", { count: onlineCount })
              : t("community.subtitleEmpty", "Everyone reading along.")}
          </p>
        </div>
        {rangeLabel && (
          <span className="text-xs font-medium text-[var(--text-muted)]" aria-live="polite">
            {rangeLabel}
          </span>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div role="tablist" aria-label={t("community.filterLabel", "Filter members")} className="inline-flex shrink-0 rounded-full border border-[var(--border)] bg-white/[0.03] p-1 [html[data-theme=light]_&]:bg-white">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")} label={t("community.tabAll", "Everyone")} />
          <FilterTab active={filter === "online"} onClick={() => setFilter("online")} label={t("community.tabOnline", "Online")} badge={onlineCount > 0 ? onlineCount : undefined} />
        </div>

        <label className="relative flex-1">
          <span className="sr-only">{t("community.searchLabel", "Search members")}</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={t("community.searchPlaceholder", "Search by name")}
            className="w-full rounded-full border border-[var(--border)] bg-white/[0.03] py-2 pl-9 pr-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 [html[data-theme=light]_&]:bg-white"
            autoComplete="off"
          />
          {searchInput && (
            <button
              type="button"
              aria-label={t("community.clearSearch", "Clear search")}
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-[var(--text-muted)] hover:bg-brand-600/10 hover:text-[var(--text-primary)]"
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </label>
      </div>

      {usedFallback && filter === "all" && !search && !isLoading && rows.length > 0 && (
        <div className="mb-4 rounded-lg border border-violet-500/20 bg-violet-500/[0.06] px-3 py-2 text-xs text-[var(--text-muted)]">
          {t("community.fallbackNotice", "No activity in the last two weeks. Showing the most recent members instead.")}
        </div>
      )}

      {isError ? (
        <EmptyBlock title={t("community.errorTitle", "Could not load members")} sub={t("community.errorSub", "Refresh to try again.")} />
      ) : isLoading && rows.length === 0 ? (
        <MemberGrid>
          {Array.from({ length: 8 }).map((_, i) => <MemberSkeleton key={i} />)}
        </MemberGrid>
      ) : rows.length === 0 ? (
        <EmptyBlock
          title={search ? t("community.emptySearchTitle", "No matches") : t("community.emptyTitle", "Nobody here yet")}
          sub={search ? t("community.emptySearchSub", "Try a different name.") : t("community.emptySub", "Be the first to read along.")}
        />
      ) : (
        <MemberGrid>
          {rows.map(m => (
            <MemberCard key={m.id} member={m} now={now} onOpen={() => navigate("publicProfile", { userId: m.id })} t={t} />
          ))}
        </MemberGrid>
      )}

      {(hasPrev || hasMore) && (
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={!hasPrev || isFetching}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-brand-600/10 disabled:cursor-not-allowed disabled:opacity-40 [html[data-theme=light]_&]:bg-white"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t("community.prev", "Previous")}
          </button>
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {t("community.pageOf", "Page {{page}} of {{total}}", { page: page + 1, total: Math.max(1, totalPages) })}
          </span>
          <button
            type="button"
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore || isFetching}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("community.next", "Next")}
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function MemberGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

interface MemberCardProps {
  member: CommunityMember;
  now: number;
  onOpen: () => void;
  t: (key: string, opts?: any) => string;
}

function MemberCard({ member, now, onOpen, t }: MemberCardProps) {
  const lastActive = member.last_active_at ? new Date(member.last_active_at).getTime() : null;
  const isOnline = lastActive != null && now - lastActive < ONLINE_THRESHOLD_MS;
  const diff = lastActive != null ? now - lastActive : null;
  const status = isOnline
    ? t("community.statusOnline", "Online now")
    : lastActive != null
      ? fmtDiff(diff)
      : member.created_at
        ? t("community.statusJoined", "Joined recently")
        : t("community.statusUnknown", "Member");
  const [g1, g2] = avatarGradient(member.id);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:border-violet-500/30 hover:bg-brand-600/[0.07] focus:border-violet-500/60 focus:bg-brand-600/[0.07] focus:outline-none focus:ring-2 focus:ring-violet-500/30 [html[data-theme=light]_&]:bg-white"
    >
      <span className="relative shrink-0">
        <span
          className="flex size-11 items-center justify-center overflow-hidden rounded-full text-[15px] font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
        >
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.display_name ?? ""}
              loading="lazy"
              width={44}
              height={44}
              className="h-full w-full object-cover"
            />
          ) : (
            (member.display_name || "?")[0].toUpperCase()
          )}
        </span>
        {isOnline && (
          <span className="absolute -bottom-px -right-px size-3.5 rounded-full border-2 border-[var(--card-bg,var(--bg))] bg-green-400" aria-label={t("community.statusOnline", "Online now")} />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {member.display_name || t("community.anonymous", "Anonymous")}
        </span>
        <span className={`truncate text-xs ${isOnline ? "font-semibold text-green-500 dark:text-green-400" : "text-[var(--text-muted)]"}`}>
          {status}
        </span>
      </span>
      <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

function MemberSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white/[0.02] px-3 py-2.5 [html[data-theme=light]_&]:bg-white">
      <div className="skeleton size-11 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-2.5 w-1/3 rounded" />
      </div>
    </div>
  );
}

function FilterTab({ active, onClick, label, badge }: { active: boolean; onClick: () => void; label: string; badge?: number }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-violet-600 text-white"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
      {badge !== undefined && (
        <span className={`ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full px-1.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-green-500/15 text-green-500 dark:text-green-400"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function EmptyBlock({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-12 text-center">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{sub}</p>
    </div>
  );
}
