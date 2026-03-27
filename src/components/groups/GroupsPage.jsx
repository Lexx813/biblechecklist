import { useState } from "react";
import { useMyGroups, usePublicGroups, useCreateGroup, useJoinGroup, useJoinByCode } from "../../hooks/useGroups";
import PageNav from "../PageNav";
import "../../styles/groups.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

function initial(name) {
  return (name || "?")[0].toUpperCase();
}

// ── Create group modal ────────────────────────────────────────────────────────

function CreateGroupModal({ onClose, onCreated }) {
  const createGroup = useCreateGroup();
  const [form, setForm] = useState({
    name: "",
    description: "",
    isPrivate: false,
    goalLabel: "",
    goalDeadline: "",
  });

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    createGroup.mutate(
      {
        name: form.name.trim(),
        description: form.description.trim() || null,
        isPrivate: form.isPrivate,
        goalLabel: form.goalLabel.trim() || null,
        goalDeadline: form.goalDeadline || null,
      },
      {
        onSuccess: (group) => {
          onCreated(group);
          onClose();
        },
      }
    );
  }

  return (
    <div className="grp-modal-overlay" onClick={onClose}>
      <div className="grp-modal" onClick={e => e.stopPropagation()}>
        <div className="grp-modal-header">
          <h2 className="grp-modal-title">Create Study Group</h2>
          <button className="grp-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="grp-modal-body" onSubmit={handleSubmit}>
          <label className="grp-field">
            <span>Group name *</span>
            <input
              className="grp-input"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="e.g. Morning Bible Readers"
              maxLength={60}
              required
            />
          </label>
          <label className="grp-field">
            <span>Description</span>
            <textarea
              className="grp-input grp-textarea"
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="What is this group about?"
              maxLength={300}
              rows={3}
            />
          </label>
          <label className="grp-field">
            <span>Reading goal</span>
            <input
              className="grp-input"
              value={form.goalLabel}
              onChange={e => set("goalLabel", e.target.value)}
              placeholder="e.g. Read the whole NWT by December"
              maxLength={100}
            />
          </label>
          <label className="grp-field">
            <span>Goal deadline</span>
            <input
              className="grp-input"
              type="date"
              value={form.goalDeadline}
              onChange={e => set("goalDeadline", e.target.value)}
            />
          </label>
          <label className="grp-field grp-field--row">
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={e => set("isPrivate", e.target.checked)}
            />
            <span>Private group (invite-only)</span>
          </label>
          <div className="grp-modal-actions">
            <button type="button" className="grp-btn grp-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="grp-btn grp-btn--primary" disabled={createGroup.isPending || !form.name.trim()}>
              {createGroup.isPending ? "Creating…" : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Join by code modal ────────────────────────────────────────────────────────

function JoinCodeModal({ onClose, onJoined }) {
  const joinByCode = useJoinByCode();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    joinByCode.mutate(code, {
      onSuccess: (groupId) => { onJoined(groupId); onClose(); },
      onError: (err) => setError(err.message),
    });
  }

  return (
    <div className="grp-modal-overlay" onClick={onClose}>
      <div className="grp-modal grp-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="grp-modal-header">
          <h2 className="grp-modal-title">Join with Code</h2>
          <button className="grp-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="grp-modal-body" onSubmit={handleSubmit}>
          <label className="grp-field">
            <span>Invite code</span>
            <input
              className="grp-input"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Enter 8-character code"
              maxLength={8}
              autoFocus
            />
          </label>
          {error && <p className="grp-error">{error}</p>}
          <div className="grp-modal-actions">
            <button type="button" className="grp-btn grp-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="grp-btn grp-btn--primary" disabled={joinByCode.isPending || !code.trim()}>
              {joinByCode.isPending ? "Joining…" : "Join"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Group card ────────────────────────────────────────────────────────────────

function GroupCard({ group, onClick, onJoin, joined, joining }) {
  return (
    <div className="grp-card" onClick={onClick}>
      <div className="grp-card-avatar">
        {group.cover_url
          ? <img src={group.cover_url} alt="" />
          : <span>{initial(group.name)}</span>
        }
      </div>
      <div className="grp-card-info">
        <div className="grp-card-top">
          <h3 className="grp-card-name">{group.name}</h3>
          {group.is_private && <span className="grp-badge grp-badge--private">🔒 Private</span>}
          {group.myRole === "admin" && <span className="grp-badge grp-badge--admin">Admin</span>}
        </div>
        {group.description && <p className="grp-card-desc">{group.description}</p>}
        {group.goal_label && (
          <p className="grp-card-goal">🎯 {group.goal_label}{group.goal_deadline ? ` · ${new Date(group.goal_deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : ""}</p>
        )}
        <div className="grp-card-meta">
          <span>Created {timeAgo(group.created_at)}</span>
        </div>
      </div>
      {!joined && onJoin && (
        <button
          className="grp-btn grp-btn--sm grp-btn--primary"
          onClick={e => { e.stopPropagation(); onJoin(group.id); }}
          disabled={joining}
        >
          Join
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GroupsPage({ user, navigate, darkMode, setDarkMode, i18n, onLogout }) {
  const [tab, setTab] = useState("mine");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const { data: myGroups = [], isLoading: loadingMine } = useMyGroups();
  const { data: publicGroups = [], isLoading: loadingPublic } = usePublicGroups();
  const joinGroup = useJoinGroup();

  const myGroupIds = new Set(myGroups.map(g => g.id));

  function handleCreated(group) {
    navigate("groupDetail", { groupId: group.id });
  }

  function handleJoined(groupId) {
    navigate("groupDetail", { groupId });
  }

  return (
    <div className="grp-page">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} currentPage="groups" />
      <div className="grp-page-header">
        <div className="grp-page-header-left">
          <button className="grp-back-btn" onClick={() => navigate("home")}>← Home</button>
          <div>
            <h1 className="grp-page-title">Study Groups</h1>
            <p className="grp-page-subtitle">Read together, grow together</p>
          </div>
        </div>
        <div className="grp-page-header-actions">
          <button className="grp-btn grp-btn--ghost" onClick={() => setShowJoinCode(true)}>🔑 Join with Code</button>
          <button className="grp-btn grp-btn--primary" onClick={() => setShowCreate(true)}>+ Create Group</button>
        </div>
      </div>

      <div className="grp-tabs">
        <button className={`grp-tab${tab === "mine" ? " grp-tab--active" : ""}`} onClick={() => setTab("mine")}>
          My Groups {myGroups.length > 0 && <span className="grp-tab-count">{myGroups.length}</span>}
        </button>
        <button className={`grp-tab${tab === "explore" ? " grp-tab--active" : ""}`} onClick={() => setTab("explore")}>
          Explore
        </button>
      </div>

      <div className="grp-list">
        {tab === "mine" && (
          loadingMine ? (
            <p className="grp-empty">Loading…</p>
          ) : myGroups.length === 0 ? (
            <div className="grp-empty-state">
              <span className="grp-empty-icon">👥</span>
              <h3>No Groups Yet</h3>
              <p>You haven't joined any groups yet.</p>
              <button className="grp-btn grp-btn--primary" onClick={() => setTab("explore")}>Explore Groups</button>
            </div>
          ) : (
            myGroups.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                joined
                onClick={() => navigate("groupDetail", { groupId: g.id })}
              />
            ))
          )
        )}

        {tab === "explore" && (
          loadingPublic ? (
            <p className="grp-empty">Loading…</p>
          ) : publicGroups.length === 0 ? (
            <div className="grp-empty-state">
              <span className="grp-empty-icon">🌐</span>
              <h3>No Public Groups</h3>
              <p>No public groups yet. Be the first to create one!</p>
              <button className="grp-btn grp-btn--primary" onClick={() => setShowCreate(true)}>Create Group</button>
            </div>
          ) : (
            publicGroups
              .filter(g => !myGroupIds.has(g.id))
              .map(g => (
                <GroupCard
                  key={g.id}
                  group={g}
                  joined={false}
                  onClick={() => navigate("groupDetail", { groupId: g.id })}
                  onJoin={(id) => joinGroup.mutate(id, { onSuccess: () => handleJoined(id) })}
                  joining={joinGroup.isPending}
                />
              ))
          )
        )}
      </div>

      {showCreate && (
        <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
      {showJoinCode && (
        <JoinCodeModal onClose={() => setShowJoinCode(false)} onJoined={handleJoined} />
      )}
    </div>
  );
}
