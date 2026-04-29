import { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useMyGroups, usePublicGroups, useCreateGroup, useJoinGroup } from "../../hooks/useGroups";
import { Group, groupsApi } from "../../api/groups";
import "../../styles/groups.css";

// ── Create group modal ────────────────────────────────────────────────────────

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (g: Group) => void }) {
  const { t } = useTranslation();
  const createGroup = useCreateGroup();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setUploading(true);
    try {
      let cover_url: string | undefined;
      if (coverFile) {
        cover_url = await groupsApi.uploadCoverPhoto(coverFile);
      }
      createGroup.mutate(
        { name: name.trim(), description: description.trim() || undefined, privacy, cover_url },
        {
          onSuccess: (g) => { onCreated(g); onClose(); },
          onError: (err: Error) => setError(err.message || t("groups.failedToCreate")),
          onSettled: () => setUploading(false),
        }
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("groups.failedToUploadCover"));
      setUploading(false);
    }
  }

  const busy = uploading || createGroup.isPending;

  return createPortal(
    <div className="grp-modal-overlay" onClick={onClose}>
      <div className="grp-modal" role="dialog" aria-modal="true" aria-label={t("groups.createGroup")} onClick={e => e.stopPropagation()}>
        <div className="grp-modal-header">
          <h2 className="grp-modal-title">{t("groups.createGroup")}</h2>
          <button className="grp-modal-close" onClick={onClose} aria-label={t("groups.closeAria")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form className="grp-modal-body" onSubmit={handleSubmit}>

          {/* Cover photo picker */}
          <div className="grp-field">
            <span>{t("groups.coverPhoto")} <span className="grp-optional">{t("groups.optional")}</span></span>
            <div className="grp-cover-picker" onClick={() => fileInputRef.current?.click()}>
              {coverPreview
                ? <img src={coverPreview} alt={t("groups.coverPreview")} className="grp-cover-preview" />
                : (
                  <div className="grp-cover-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span>{t("groups.addCoverPhoto")}</span>
                  </div>
                )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverChange}
              />
            </div>
            {coverPreview && (
              <button type="button" className="grp-cover-remove" onClick={() => { setCoverFile(null); setCoverPreview(null); }}>
                {t("groups.removePhoto")}
              </button>
            )}
          </div>

          <label className="grp-field">
            <span>{t("groups.groupName")}</span>
            <input className="grp-input" value={name} onChange={e => setName(e.target.value)} placeholder={t("groups.groupNamePlaceholder")} maxLength={80} required autoFocus />
          </label>
          <label className="grp-field">
            <span>{t("groups.descriptionLabel")} <span className="grp-optional">{t("groups.optional")}</span></span>
            <textarea className="grp-input grp-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder={t("groups.descriptionPlaceholder")} maxLength={300} rows={3} />
          </label>
          <div className="grp-field">
            <span>{t("groups.privacyLabel")}</span>
            <div className="grp-privacy-picker">
              <button type="button" className={`grp-privacy-btn${privacy === "public" ? " grp-privacy-btn--active" : ""}`} onClick={() => setPrivacy("public")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                {t("groups.public")}
              </button>
              <button type="button" className={`grp-privacy-btn${privacy === "private" ? " grp-privacy-btn--active" : ""}`} onClick={() => setPrivacy("private")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                {t("groups.private")}
              </button>
            </div>
            <p className="grp-privacy-hint">
              {privacy === "public" ? t("groups.publicHint") : t("groups.privateHint")}
            </p>
          </div>
          {error && <p className="grp-error">{error}</p>}
          <div className="grp-modal-actions">
            <button type="button" className="grp-btn grp-btn--ghost" onClick={onClose} disabled={busy}>{t("common.cancel")}</button>
            <button type="submit" className="grp-btn grp-btn--primary" disabled={busy || !name.trim()}>
              {busy ? t("common.creating") : t("groups.createGroupBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Group card ────────────────────────────────────────────────────────────────

function GroupCard({ group, onClick, onJoin, joining }: {
  group: Group & { myRole?: string; myStatus?: string };
  onClick: () => void;
  onJoin?: () => void;
  joining?: boolean;
}) {
  const { t } = useTranslation();
  const isMine = !!group.myRole;
  const isPending = group.myStatus === "pending";

  return (
    <article className="grp-card">
      <button type="button" className="grp-card-link" onClick={onClick} aria-label={t("groups.openX", { name: group.name })} />
      <div className="grp-card-cover">
        {group.cover_url
          ? <img src={group.cover_url} alt={group.name} loading="lazy" />
          : <span className="grp-card-cover-initial">{(group.name || "?")[0].toUpperCase()}</span>}
        {group.privacy === "private" && (
          <span className="grp-card-cover-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            {t("groups.private")}
          </span>
        )}
      </div>
      <div className="grp-card-body">
        <div className="grp-card-top">
          <h3 className="grp-card-name">{group.name}</h3>
          <div className="grp-card-badges">
            {group.myRole === "owner" && <span className="grp-badge grp-badge--admin">{t("groups.owner")}</span>}
            {group.myRole === "admin" && <span className="grp-badge grp-badge--admin">{t("groups.admin")}</span>}
            {isPending && <span className="grp-badge grp-badge--pending">{t("groups.pending")}</span>}
          </div>
        </div>
        {group.description && <p className="grp-card-desc">{group.description}</p>}
        <div className="grp-card-footer">
          <span className="grp-card-meta">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {t("groups.memberCount", { count: group.member_count })}
          </span>
          {!isMine && onJoin && (
            <button
              className="grp-btn grp-btn--sm grp-btn--primary"
              onClick={onJoin}
              disabled={joining}
            >
              {group.privacy === "private" ? t("groups.request") : t("groups.join")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function GroupCardSkeleton() {
  return (
    <div className="grp-card-skeleton">
      <div className="skeleton grp-card-skeleton-cover" />
      <div className="grp-card-skeleton-body">
        <div className="skeleton" style={{ height: 14, width: "60%" }} />
        <div className="skeleton" style={{ height: 11, width: "40%" }} />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface GroupsPageProps {
  navigate: (page: string, params?: Record<string, unknown>) => void;
}

type Sort = "members" | "newest";

export default function GroupsPage({ navigate }: GroupsPageProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"mine" | "explore">("mine");
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("members");
  const { data: myGroups = [], isLoading: loadingMine } = useMyGroups();
  const { data: publicGroups = [], isLoading: loadingPublic } = usePublicGroups();
  const joinGroup = useJoinGroup();

  const myGroupIds = new Set((myGroups as Group[]).map(g => g.id));

  const filteredPublic = useMemo(() => {
    const q = search.trim().toLowerCase();
    const notMine = (publicGroups as Group[]).filter(g => !myGroupIds.has(g.id));
    const matched = q
      ? notMine.filter(g =>
          g.name.toLowerCase().includes(q) ||
          (g.description ?? "").toLowerCase().includes(q)
        )
      : notMine;
    return [...matched].sort((a, b) =>
      sort === "members"
        ? b.member_count - a.member_count
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [publicGroups, myGroupIds, search, sort]);

  return (
    <div className="grp-page">
        <div className="grp-page-header">
          <h1 className="grp-page-title">{t("groups.pageTitle")}</h1>
          <button className="grp-btn grp-btn--primary" onClick={() => setShowCreate(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {t("groups.newGroup")}
          </button>
        </div>

        <div className="grp-tabs">
          <button className={`grp-tab${tab === "mine" ? " grp-tab--active" : ""}`} onClick={() => setTab("mine")}>
            {t("groups.tabMine")} {myGroups.length > 0 && <span className="grp-tab-count">{myGroups.length}</span>}
          </button>
          <button className={`grp-tab${tab === "explore" ? " grp-tab--active" : ""}`} onClick={() => setTab("explore")}>
            {t("groups.tabExplore")}
          </button>
        </div>

        {tab === "explore" && (
          <div className="grp-toolbar">
            <div className="grp-search-bar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="grp-search-input" type="search" placeholder={t("groups.searchGroupsPlaceholder")} value={search} onChange={e => setSearch(e.target.value)} aria-label={t("groups.searchGroupsAria")} />
            </div>
            <select className="grp-sort" value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label={t("groups.sortAria")}>
              <option value="members">{t("groups.sortMostMembers")}</option>
              <option value="newest">{t("groups.sortNewest")}</option>
            </select>
          </div>
        )}

        <div className="grp-grid">
          {tab === "mine" && (
            loadingMine ? (
              Array.from({ length: 4 }).map((_, i) => <GroupCardSkeleton key={i} />)
            ) : (myGroups as Group[]).length === 0 ? (
              <div className="grp-empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <h3>{t("groups.notJoinedAnyGroups")}</h3>
                <p>{t("groups.browseOrCreate")}</p>
                <button className="grp-btn grp-btn--primary" onClick={() => setTab("explore")}>{t("groups.exploreGroups")}</button>
              </div>
            ) : (
              (myGroups as Group[]).map(g => (
                <GroupCard key={g.id} group={g} onClick={() => navigate("groupDetail", { groupId: g.id })} />
              ))
            )
          )}

          {tab === "explore" && (
            loadingPublic ? (
              Array.from({ length: 4 }).map((_, i) => <GroupCardSkeleton key={i} />)
            ) : filteredPublic.length === 0 ? (
              <div className="grp-empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <h3>{search ? t("groups.noMatches") : t("groups.noPublicGroupsYet")}</h3>
                <p>{search ? t("groups.tryDifferentSearch") : t("groups.startFirstOne")}</p>
                {!search && <button className="grp-btn grp-btn--primary" onClick={() => setShowCreate(true)}>{t("groups.createGroupBtn")}</button>}
              </div>
            ) : (
              filteredPublic.map(g => (
                <GroupCard
                  key={g.id}
                  group={g}
                  onClick={() => navigate("groupDetail", { groupId: g.id })}
                  onJoin={() => joinGroup.mutate(g.id, { onSuccess: () => navigate("groupDetail", { groupId: g.id }) })}
                  joining={joinGroup.isPending}
                />
              ))
            )
          )}
        </div>

        {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={g => navigate("groupDetail", { groupId: g.id })} />}
    </div>
  );
}
