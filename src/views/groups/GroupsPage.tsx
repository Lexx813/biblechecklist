import { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useMyGroups, usePublicGroups, useCreateGroup, useJoinGroup } from "../../hooks/useGroups";
import { Group, groupsApi } from "../../api/groups";
import "../../styles/groups.css";

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

// ── Create group modal ────────────────────────────────────────────────────────

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (g: Group) => void }) {
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
          onError: (err: Error) => setError(err.message || "Failed to create group."),
          onSettled: () => setUploading(false),
        }
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload cover photo.");
      setUploading(false);
    }
  }

  const busy = uploading || createGroup.isPending;

  return createPortal(
    <div className="grp-modal-overlay" onClick={onClose}>
      <div className="grp-modal" role="dialog" aria-modal="true" aria-label="Create group" onClick={e => e.stopPropagation()}>
        <div className="grp-modal-header">
          <h2 className="grp-modal-title">Create Group</h2>
          <button className="grp-modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form className="grp-modal-body" onSubmit={handleSubmit}>

          {/* Cover photo picker */}
          <div className="grp-field">
            <span>Cover photo <span className="grp-optional">(optional)</span></span>
            <div className="grp-cover-picker" onClick={() => fileInputRef.current?.click()}>
              {coverPreview
                ? <img src={coverPreview} alt="Cover preview" className="grp-cover-preview" />
                : (
                  <div className="grp-cover-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span>Add cover photo</span>
                  </div>
                )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleCoverChange}
              />
            </div>
            {coverPreview && (
              <button type="button" className="grp-cover-remove" onClick={() => { setCoverFile(null); setCoverPreview(null); }}>
                Remove photo
              </button>
            )}
          </div>

          <label className="grp-field">
            <span>Group name</span>
            <input className="grp-input" value={name} onChange={e => setName(e.target.value)} placeholder="My study group" maxLength={80} required autoFocus />
          </label>
          <label className="grp-field">
            <span>Description <span className="grp-optional">(optional)</span></span>
            <textarea className="grp-input grp-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this group about?" maxLength={300} rows={3} />
          </label>
          <div className="grp-field">
            <span>Privacy</span>
            <div className="grp-privacy-picker">
              <button type="button" className={`grp-privacy-btn${privacy === "public" ? " grp-privacy-btn--active" : ""}`} onClick={() => setPrivacy("public")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Public
              </button>
              <button type="button" className={`grp-privacy-btn${privacy === "private" ? " grp-privacy-btn--active" : ""}`} onClick={() => setPrivacy("private")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Private
              </button>
            </div>
            <p className="grp-privacy-hint">
              {privacy === "public"
                ? "Anyone can find and join this group."
                : "Members need admin approval to join."}
            </p>
          </div>
          {error && <p className="grp-error">{error}</p>}
          <div className="grp-modal-actions">
            <button type="button" className="grp-btn grp-btn--ghost" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="grp-btn grp-btn--primary" disabled={busy || !name.trim()}>
              {busy ? "Creating…" : "Create group"}
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
  const isMine = !!group.myRole;
  const isPending = group.myStatus === "pending";

  return (
    <div className="grp-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && onClick()} aria-label={`Open ${group.name}`}>
      <div className="grp-card-cover">
        {group.cover_url
          ? <img src={group.cover_url} alt={group.name} loading="lazy" />
          : <span className="grp-card-cover-initial">{(group.name || "?")[0].toUpperCase()}</span>}
        {group.privacy === "private" && (
          <span className="grp-card-cover-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Private
          </span>
        )}
      </div>
      <div className="grp-card-body">
        <div className="grp-card-top">
          <h3 className="grp-card-name">{group.name}</h3>
          <div className="grp-card-badges">
            {group.myRole === "owner" && <span className="grp-badge grp-badge--admin">Owner</span>}
            {group.myRole === "admin" && <span className="grp-badge grp-badge--admin">Admin</span>}
            {isPending && <span className="grp-badge grp-badge--pending">Pending</span>}
          </div>
        </div>
        {group.description && <p className="grp-card-desc">{group.description}</p>}
        <div className="grp-card-footer">
          <span className="grp-card-meta">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {group.member_count} {group.member_count === 1 ? "member" : "members"}
          </span>
          {!isMine && onJoin && (
            <button
              className="grp-btn grp-btn--sm grp-btn--primary"
              onClick={e => { e.stopPropagation(); onJoin(); }}
              disabled={joining}
            >
              {group.privacy === "private" ? "Request" : "Join"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GroupsPage({ user, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const [tab, setTab] = useState<"mine" | "explore">("mine");
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const { data: myGroups = [], isLoading: loadingMine } = useMyGroups();
  const { data: publicGroups = [], isLoading: loadingPublic } = usePublicGroups();
  const joinGroup = useJoinGroup();

  const myGroupIds = new Set((myGroups as Group[]).map(g => g.id));

  const filteredPublic = useMemo(() => {
    const q = search.trim().toLowerCase();
    const notMine = (publicGroups as Group[]).filter(g => !myGroupIds.has(g.id));
    if (!q) return notMine;
    return notMine.filter(g =>
      g.name.toLowerCase().includes(q) ||
      (g.description ?? "").toLowerCase().includes(q)
    );
  }, [publicGroups, myGroupIds, search]);

  return (
    <div className="grp-page">
        <div className="grp-page-header">
          <div>
            <h1 className="grp-page-title">Groups</h1>
            <p className="grp-page-subtitle">Study, share, and grow together</p>
          </div>
          <button className="grp-btn grp-btn--primary" onClick={() => setShowCreate(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New group
          </button>
        </div>

        <div className="grp-tabs">
          <button className={`grp-tab${tab === "mine" ? " grp-tab--active" : ""}`} onClick={() => setTab("mine")}>
            My Groups {myGroups.length > 0 && <span className="grp-tab-count">{myGroups.length}</span>}
          </button>
          <button className={`grp-tab${tab === "explore" ? " grp-tab--active" : ""}`} onClick={() => setTab("explore")}>
            Explore
          </button>
        </div>

        {tab === "explore" && (
          <div className="grp-search-bar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="grp-search-input" type="search" placeholder="Search groups…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search groups" />
          </div>
        )}

        <div className="grp-grid">
          {tab === "mine" && (
            loadingMine ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grp-card-skeleton">
                  <div className="skeleton" style={{ height: 140, borderRadius: "10px 10px 0 0" }} />
                  <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="skeleton" style={{ height: 14, width: "60%" }} />
                    <div className="skeleton" style={{ height: 11, width: "40%" }} />
                  </div>
                </div>
              ))
            ) : (myGroups as Group[]).length === 0 ? (
              <div className="grp-empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <h3>No groups yet</h3>
                <p>Create a group or explore public ones to get started.</p>
                <button className="grp-btn grp-btn--primary" onClick={() => setTab("explore")}>Explore groups</button>
              </div>
            ) : (
              (myGroups as Group[]).map(g => (
                <GroupCard key={g.id} group={g} onClick={() => navigate("groupDetail", { groupId: g.id })} />
              ))
            )
          )}

          {tab === "explore" && (
            loadingPublic ? (
              <>{Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grp-card-skeleton">
                  <div className="skeleton" style={{ height: 140, borderRadius: "10px 10px 0 0" }} />
                  <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="skeleton" style={{ height: 14, width: "60%" }} />
                    <div className="skeleton" style={{ height: 11, width: "40%" }} />
                  </div>
                </div>
              ))}</>
            ) : filteredPublic.length === 0 ? (
              <div className="grp-empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <h3>{search ? "No results" : "No public groups yet"}</h3>
                <p>{search ? "Try a different search term." : "Be the first to create one!"}</p>
                {!search && <button className="grp-btn grp-btn--primary" onClick={() => setShowCreate(true)}>Create group</button>}
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
