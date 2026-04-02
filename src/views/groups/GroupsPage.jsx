import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useMyGroups, usePublicGroups, useCreateGroup, useJoinGroup, useJoinByCode, useRequestJoin } from "../../hooks/useGroups";
import "../../styles/groups.css";

// ── Constants ─────────────────────────────────────────────────────────────────

const GROUP_TYPES = [
  { value: "bible_study", labelKey: "groups.typeBibleStudy", icon: "book" },
  { value: "prayer", labelKey: "groups.typePrayer", icon: "heart" },
  { value: "family", labelKey: "groups.typeFamily", icon: "home" },
  { value: "congregation", labelKey: "groups.typeCongregation", icon: "users" },
  { value: "general", labelKey: "groups.typeGeneral", icon: "chat" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso, t) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d === 0) return t ? t("messages.today") : "today";
  if (d === 1) return t ? t("messages.yesterday") : "yesterday";
  return `${d}${t ? t("messages.daysAgo") : "d ago"}`;
}

function initial(name) {
  return (name || "?")[0].toUpperCase();
}

// ── Create group modal ────────────────────────────────────────────────────────

function CreateGroupModal({ onClose, onCreated }) {
  const { t } = useTranslation();
  const createGroup = useCreateGroup();
  const [form, setForm] = useState({
    name: "",
    description: "",
    isPrivate: false,
    groupType: "bible_study",
    goalLabel: "",
    goalDeadline: "",
  });
  const [error, setError] = useState("");

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError("");
    createGroup.mutate(
      {
        name: form.name.trim(),
        description: form.description.trim() || null,
        isPrivate: form.isPrivate,
        groupType: form.groupType,
        goalLabel: form.groupType === "bible_study" ? (form.goalLabel.trim() || null) : null,
        goalDeadline: form.groupType === "bible_study" ? (form.goalDeadline || null) : null,
      },
      {
        onSuccess: (group) => { onCreated(group); onClose(); },
        onError: (err) => setError(err.message || "Failed to create group."),
      }
    );
  }

  return createPortal(
    <div className="grp-modal-overlay" onClick={onClose}>
      <div className="grp-modal" onClick={e => e.stopPropagation()}>
        <div className="grp-modal-header">
          <h2 className="grp-modal-title">{t("groups.createGroupBtn")}</h2>
          <button className="grp-modal-close" onClick={onClose} aria-label={t("common.close")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form className="grp-modal-body" onSubmit={handleSubmit}>
          <div className="grp-field">
            <span className="grp-field-label">{t("groups.groupType")}</span>
            <div className="grp-type-picker">
              {GROUP_TYPES.map(({ value, labelKey }) => (
                <button
                  key={value}
                  type="button"
                  className={`grp-type-btn${form.groupType === value ? " grp-type-btn--active" : ""}`}
                  onClick={() => set("groupType", value)}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>
          <label className="grp-field">
            <span>{t("groups.groupName")}</span>
            <input
              className="grp-input"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder={t("groups.groupNamePlaceholder")}
              maxLength={60}
              required
            />
          </label>
          <label className="grp-field">
            <span>{t("groups.description")}</span>
            <textarea
              className="grp-input grp-textarea"
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder={t("groups.descriptionPlaceholder")}
              maxLength={300}
              rows={3}
            />
          </label>
          {form.groupType === "bible_study" && (
            <>
              <label className="grp-field">
                <span>{t("groups.readingGoal")}</span>
                <input
                  className="grp-input"
                  value={form.goalLabel}
                  onChange={e => set("goalLabel", e.target.value)}
                  placeholder={t("groups.readingGoalPlaceholder")}
                  maxLength={100}
                />
              </label>
              <label className="grp-field">
                <span>{t("groups.goalDeadline")}</span>
                <input
                  className="grp-input"
                  type="date"
                  value={form.goalDeadline}
                  onChange={e => set("goalDeadline", e.target.value)}
                />
              </label>
            </>
          )}
          <label className="grp-field grp-field--row">
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={e => set("isPrivate", e.target.checked)}
            />
            <span>{t("groups.isPrivate")}</span>
          </label>
          {error && <p className="grp-error">{error}</p>}
          <div className="grp-modal-actions">
            <button type="button" className="grp-btn grp-btn--ghost" onClick={onClose}>{t("common.cancel")}</button>
            <button type="submit" className="grp-btn grp-btn--primary" disabled={createGroup.isPending || !form.name.trim()}>
              {createGroup.isPending ? t("groups.creating") : t("groups.createGroupBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Join by code modal ────────────────────────────────────────────────────────

function JoinCodeModal({ onClose, onJoined, userId }) {
  const { t } = useTranslation();
  const joinByCode = useJoinByCode(userId);
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

  return createPortal(
    <div className="grp-modal-overlay" onClick={onClose}>
      <div className="grp-modal grp-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="grp-modal-header">
          <h2 className="grp-modal-title">{t("groups.joinWithCode")}</h2>
          <button className="grp-modal-close" onClick={onClose} aria-label={t("common.close")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form className="grp-modal-body" onSubmit={handleSubmit}>
          <label className="grp-field">
            <span>{t("groups.inviteCode")}</span>
            <input
              className="grp-input"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={t("groups.inviteCodePlaceholder")}
              maxLength={8}
              autoFocus
            />
          </label>
          {error && <p className="grp-error">{error}</p>}
          <div className="grp-modal-actions">
            <button type="button" className="grp-btn grp-btn--ghost" onClick={onClose}>{t("common.cancel")}</button>
            <button type="submit" className="grp-btn grp-btn--primary" disabled={joinByCode.isPending || !code.trim()}>
              {joinByCode.isPending ? t("groups.joining") : t("groups.join")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Group card ────────────────────────────────────────────────────────────────

function GroupCard({ group, onClick, onJoin, onRequestJoin, joined, joining, requesting, requested }) {
  const { t } = useTranslation();

  function renderJoinBtn(e) {
    e.stopPropagation();
    if (group.is_private) {
      onRequestJoin(group.id);
    } else {
      onJoin(group.id);
    }
  }

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
          {group.group_type && group.group_type !== "bible_study" && (
            <span className={`grp-badge grp-badge--type grp-badge--type-${group.group_type}`}>
              {t(`groups.type${group.group_type.replace(/_([a-z])/g, (_, c) => c.toUpperCase()).replace(/^./, c => c.toUpperCase())}`)}
            </span>
          )}
          {group.is_private && <span className="grp-badge grp-badge--private">{t("groups.private")}</span>}
          {group.myRole === "admin" && <span className="grp-badge grp-badge--admin">{t("groups.admin")}</span>}
        </div>
        {group.description && <p className="grp-card-desc">{group.description}</p>}
        {group.goal_label && (
          <p className="grp-card-goal">{group.goal_label}{group.goal_deadline ? ` · ${new Date(group.goal_deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : ""}</p>
        )}
        <div className="grp-card-meta">
          <span>{t("groups.created")} {timeAgo(group.created_at, t)}</span>
        </div>
      </div>
      {!joined && (onJoin || onRequestJoin) && (
        requested ? (
          <span className="grp-badge grp-badge--pending">{t("groups.requested")}</span>
        ) : (
          <button
            className="grp-btn grp-btn--sm grp-btn--primary"
            onClick={renderJoinBtn}
            disabled={joining || requesting}
          >
            {group.is_private ? t("groups.requestJoin") : t("groups.join")}
          </button>
        )
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function GroupsSkeleton() {
  return (
    <div className="groups-page">
      <div className="skeleton" style={{ height: 38, width: '40%', marginBottom: 20 }} />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 17, width: '45%', marginBottom: 7 }} />
            <div className="skeleton" style={{ height: 13, width: '25%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GroupsPage({ user, navigate, darkMode, setDarkMode, i18n, onLogout }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("mine");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [search, setSearch] = useState("");
  const [requestedIds, setRequestedIds] = useState(new Set());
  const { data: myGroups = [], isLoading: loadingMine } = useMyGroups();
  const { data: publicGroups = [], isLoading: loadingPublic } = usePublicGroups();
  const joinGroup = useJoinGroup(user?.id);
  const requestJoin = useRequestJoin();

  const myGroupIds = new Set(myGroups.map(g => g.id));

  const filteredPublic = useMemo(() => {
    const q = search.trim().toLowerCase();
    const notMine = publicGroups.filter(g => !myGroupIds.has(g.id));
    if (!q) return notMine;
    return notMine.filter(g =>
      g.name.toLowerCase().includes(q) ||
      (g.description ?? "").toLowerCase().includes(q) ||
      (g.goal_label ?? "").toLowerCase().includes(q) ||
      (g.group_type ?? "").toLowerCase().includes(q)
    );
  }, [publicGroups, myGroupIds, search]);

  function handleCreated(group) {
    navigate("groupDetail", { groupId: group.id });
  }

  function handleJoined(groupId) {
    navigate("groupDetail", { groupId });
  }

  function handleRequestJoin(groupId) {
    requestJoin.mutate(groupId, {
      onSuccess: () => setRequestedIds(s => new Set([...s, groupId])),
    });
  }

  return (
    <div className="grp-page">
      <div className="grp-page-header">
        <div className="grp-page-header-left">
          <button className="back-btn" onClick={() => navigate("home")}>
            {t("common.back")}
          </button>
          <div>
            <h1 className="grp-page-title">{t("groups.title")}</h1>
            <p className="grp-page-subtitle">{t("groups.subtitle")}</p>
          </div>
        </div>
        <div className="grp-page-header-actions">
          <button className="grp-btn grp-btn--ghost" onClick={() => setShowJoinCode(true)}>{t("groups.joinWithCode")}</button>
          <button className="grp-btn grp-btn--primary" onClick={() => setShowCreate(true)}>{t("groups.createGroup")}</button>
        </div>
      </div>

      <div className="grp-tabs">
        <button className={`grp-tab${tab === "mine" ? " grp-tab--active" : ""}`} onClick={() => setTab("mine")}>
          {t("groups.myGroups")} {myGroups.length > 0 && <span className="grp-tab-count">{myGroups.length}</span>}
        </button>
        <button className={`grp-tab${tab === "explore" ? " grp-tab--active" : ""}`} onClick={() => setTab("explore")}>
          {t("groups.explore")}
        </button>
      </div>

      {tab === "explore" && (
        <div className="grp-search-bar">
          <input
            className="grp-search-input"
            type="search"
            placeholder={t("groups.searchPlaceholder")}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      <div className="grp-list">
        {tab === "mine" && (
          loadingMine ? (
            <GroupsSkeleton />
          ) : myGroups.length === 0 ? (
            <div className="grp-empty-state">
              <span className="grp-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </span>
              <h3>{t("groups.noGroups")}</h3>
              <p>{t("groups.noGroupsDesc")}</p>
              <button className="grp-btn grp-btn--primary" onClick={() => setTab("explore")}>{t("groups.exploreBtn")}</button>
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
            <p className="grp-empty">{t("common.loading")}</p>
          ) : filteredPublic.length === 0 ? (
            <div className="grp-empty-state">
              <span className="grp-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </span>
              <h3>{search ? t("groups.noSearchResults") : t("groups.noPublicGroups")}</h3>
              <p>{search ? t("groups.noSearchResultsDesc") : t("groups.noPublicGroupsDesc")}</p>
              {!search && <button className="grp-btn grp-btn--primary" onClick={() => setShowCreate(true)}>{t("groups.createGroupBtn")}</button>}
            </div>
          ) : (
            filteredPublic.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                joined={false}
                onClick={() => navigate("groupDetail", { groupId: g.id })}
                onJoin={(id) => joinGroup.mutate(id, { onSuccess: () => handleJoined(id) })}
                onRequestJoin={handleRequestJoin}
                joining={joinGroup.isPending}
                requesting={requestJoin.isPending}
                requested={requestedIds.has(g.id)}
              />
            ))
          )
        )}
      </div>

      {showCreate && (
        <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
      {showJoinCode && (
        <JoinCodeModal onClose={() => setShowJoinCode(false)} onJoined={handleJoined} userId={user?.id} />
      )}
    </div>
  );
}
