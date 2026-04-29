import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useFollowers, useFollowing } from "../../hooks/useFollows";

type Mode = "followers" | "following";

interface Person {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  userId: string;
  initialMode: Mode;
  onClose: () => void;
  navigate: (page: string, params?: Record<string, unknown>) => void;
}

function PersonRow({ person, onClick }: { person: Person; onClick: () => void }) {
  const { t } = useTranslation();
  const initial = (person.display_name || "?")[0].toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-0 bg-transparent px-4 py-2.5 text-left transition-colors hover:bg-[var(--hover-bg)]"
    >
      {person.avatar_url ? (
        <img src={person.avatar_url} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full object-cover" loading="lazy" />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-sm font-bold text-white">{initial}</span>
      )}
      <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{person.display_name || t("follow.anonymous")}</span>
    </button>
  );
}

export default function FollowersModal({ userId, initialMode, onClose, navigate }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [query, setQuery] = useState("");
  const followers = useFollowers(mode === "followers" ? userId : undefined);
  const following = useFollowing(mode === "following" ? userId : undefined);
  const active = mode === "followers" ? followers : following;
  const list = (active.data as Person[] | undefined) ?? [];
  const filtered = query.trim()
    ? list.filter(p => (p.display_name ?? "").toLowerCase().includes(query.trim().toLowerCase()))
    : list;

  function go(person: Person) {
    onClose();
    navigate("publicProfile", { userId: person.id });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div className="flex gap-1 rounded-lg bg-[var(--hover-bg)] p-1">
            <button
              type="button"
              onClick={() => setMode("followers")}
              className={`rounded-md px-3 py-1 text-sm font-semibold transition-colors ${mode === "followers" ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
            >
              {t("follow.followers")}
            </button>
            <button
              type="button"
              onClick={() => setMode("following")}
              className={`rounded-md px-3 py-1 text-sm font-semibold transition-colors ${mode === "following" ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
            >
              {t("follow.following")}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full border-0 bg-[var(--hover-bg)] text-[var(--text-muted)] transition-colors hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-4 pt-3 pb-2">
          <input
            type="search"
            placeholder={t("common.search")}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
            aria-label={t("follow.searchMode", { mode: mode === "followers" ? t("follow.followers") : t("follow.following") })}
          />
        </div>

        {/* List */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-2">
          {active.isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">{t("follow.loading")}</p>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              {query ? t("follow.noMatches") : mode === "followers" ? t("follow.noFollowersYet") : t("follow.notFollowingAnyoneYet")}
            </p>
          ) : (
            filtered.map(person => (
              <PersonRow key={person.id} person={person} onClick={() => go(person)} />
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
