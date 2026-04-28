import { useState } from "react";
import {
  useGroup, useGroupPosts, useGroupEvents,
  useLeaveGroup, useDeleteGroup,
} from "../../hooks/useGroups";
import { GroupPost, GroupEvent } from "../../api/groups";
import ConfirmModal from "../../components/ConfirmModal";
import { toast } from "../../lib/toast";
import "../../styles/groups.css";

import ComposeBox from "./detail/ComposeBox";
import PostCard from "./detail/PostCard";
import CreateEventModal from "./detail/CreateEventModal";
import EventCard from "./detail/EventCard";
import MembersTab from "./detail/MembersTab";
import FilesTab from "./detail/FilesTab";

type Tab = "feed" | "members" | "events" | "files";

interface GroupDetailProps {
  groupId: string;
  user: { id: string; email?: string };
  navigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function GroupDetail({ groupId, user, navigate }: GroupDetailProps) {
  const [tab, setTab] = useState<Tab>("feed");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { data: group, isLoading: groupLoading, isError: groupError } = useGroup(groupId);
  const { data: posts = [], isLoading: postsLoading } = useGroupPosts(tab === "feed" ? groupId : undefined);
  const { data: events = [], isLoading: eventsLoading } = useGroupEvents(tab === "events" ? groupId : undefined);
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();

  const myRole = group?.myRole;
  const myStatus = group?.myStatus;
  const isAdmin = myRole === "owner" || myRole === "admin";
  const isOwner = myRole === "owner";
  const isMember = myStatus === "member";

  function handleLeave() {
    leaveGroup.mutate(groupId, {
      onSuccess: () => navigate("groups"),
      onError: () => toast.error("Failed to leave group."),
    });
  }

  function handleDelete() {
    deleteGroup.mutate(groupId, {
      onSuccess: () => navigate("groups"),
      onError: () => toast.error("Failed to delete group."),
    });
  }

  if (groupLoading) {
    return (
      <div className="grp-detail-page">
        <div className="grp-detail-header-skeleton">
          <div className="skeleton" style={{ height: 26, width: "50%", marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 14, width: "30%" }} />
        </div>
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="grp-detail-page">
        <p className="grp-error">Group not found or you don&apos;t have access.</p>
        <button className="grp-btn grp-btn--ghost" onClick={() => navigate("groups")}>← Back to groups</button>
      </div>
    );
  }

  // Pending users see a waiting screen
  if (myStatus === "pending") {
    return (
      <div className="grp-detail-page grp-pending-page">
        <div className="grp-hero grp-hero--sm">
          {group.cover_url ? <img src={group.cover_url} alt={group.name} className="grp-hero-img" loading="lazy" /> : <div className="grp-hero-placeholder"><span>{(group.name||"?")[0].toUpperCase()}</span></div>}
          <button className="grp-back-btn grp-back-btn--overlay" onClick={() => navigate("groups")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg> Groups</button>
        </div>
        <div className="grp-detail-info"><div className="grp-detail-info-main"><div><h1 className="grp-detail-title">{group.name}</h1></div></div></div>
        <div className="grp-pending-banner">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <h3>Request pending</h3>
          <p>An admin needs to approve your request before you can see the group.</p>
          <button className="grp-btn grp-btn--ghost" onClick={handleLeave}>Cancel request</button>
        </div>
      </div>
    );
  }

  // Non-members of private groups see locked
  if (!isMember && group.privacy === "private") {
    return (
      <div className="grp-detail-page grp-pending-page">
        <div className="grp-hero grp-hero--sm">
          {group.cover_url ? <img src={group.cover_url} alt={group.name} className="grp-hero-img" loading="lazy" /> : <div className="grp-hero-placeholder"><span>{(group.name||"?")[0].toUpperCase()}</span></div>}
          <button className="grp-back-btn grp-back-btn--overlay" onClick={() => navigate("groups")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg> Groups</button>
        </div>
        <div className="grp-detail-info"><div className="grp-detail-info-main"><div><h1 className="grp-detail-title">{group.name}</h1></div></div></div>
        <div className="grp-pending-banner">
          <p>{group.description}</p>
          <p className="grp-pending-banner-sub">{group.member_count} members</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="grp-detail-page">
        {/* Hero banner */}
        <div className="grp-hero">
          {group.cover_url
            ? <img src={group.cover_url} alt={group.name} className="grp-hero-img" loading="lazy" />
            : <div className="grp-hero-placeholder"><span>{(group.name || "?")[0].toUpperCase()}</span></div>}
          <button className="grp-back-btn grp-back-btn--overlay" onClick={() => navigate("groups")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            Groups
          </button>
        </div>

        {/* Group info row */}
        <div className="grp-detail-info">
          <div className="grp-detail-info-main">
            <div>
              <div className="grp-detail-title-row">
                <h1 className="grp-detail-title">{group.name}</h1>
                {group.privacy === "private" && <span className="grp-badge grp-badge--private">Private</span>}
              </div>
              {group.description && <p className="grp-detail-desc">{group.description}</p>}
              <p className="grp-detail-meta">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {group.member_count} {group.member_count === 1 ? "member" : "members"}
              </p>
            </div>
            <div className="grp-detail-header-actions">
              {!isOwner && (
                <button className="grp-btn grp-btn--ghost grp-btn--sm" onClick={() => setShowLeaveConfirm(true)}>Leave</button>
              )}
              {isOwner && (
                <button className="grp-btn grp-btn--danger grp-btn--sm" onClick={() => setShowDeleteConfirm(true)}>Delete group</button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grp-tabs grp-tabs--detail">
          {(["feed", "members", "events", "files"] as Tab[]).map(t => (
            <button key={t} className={`grp-tab${tab === t ? " grp-tab--active" : ""}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Feed */}
        {tab === "feed" && (
          <div className="grp-feed">
            <ComposeBox groupId={groupId} isAdmin={isAdmin} />
            {postsLoading ? (
              <div className="grp-posts-skeleton">
                {[0, 1, 2].map(i => <div key={i} className="skeleton grp-post-skeleton" />)}
              </div>
            ) : (posts as GroupPost[]).length === 0 ? (
              <div className="grp-empty-state grp-empty-state--sm">
                <p>No posts yet. Start the conversation.</p>
              </div>
            ) : (
              (posts as GroupPost[]).map(p => (
                <PostCard key={p.id} post={p} userId={user.id} isAdmin={isAdmin} groupId={groupId} />
              ))
            )}
          </div>
        )}

        {/* Members */}
        {tab === "members" && (
          <MembersTab groupId={groupId} userId={user.id} isAdmin={isAdmin} isOwner={isOwner} />
        )}

        {/* Events */}
        {tab === "events" && (
          <div className="grp-events-tab">
            {isAdmin && (
              <div className="grp-events-header">
                <button className="grp-btn grp-btn--primary grp-btn--sm" onClick={() => setShowCreateEvent(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Create event
                </button>
              </div>
            )}
            {eventsLoading ? (
              <p className="grp-tab-loading">Loading events…</p>
            ) : (events as GroupEvent[]).length === 0 ? (
              <div className="grp-empty-state grp-empty-state--sm">
                <p>{isAdmin ? "No events yet. Create one above." : "No events scheduled yet."}</p>
              </div>
            ) : (
              (events as GroupEvent[]).map(e => (
                <EventCard key={e.id} event={e} isAdmin={isAdmin} groupId={groupId} />
              ))
            )}
          </div>
        )}

        {/* Files */}
        {tab === "files" && <FilesTab groupId={groupId} userId={user.id} isAdmin={isAdmin} />}
      </div>
      {showCreateEvent && <CreateEventModal groupId={groupId} onClose={() => setShowCreateEvent(false)} />}
      {showLeaveConfirm && (
        <ConfirmModal
          title="Leave group"
          message={`Leave ${group.name}? You'll need to rejoin to see it again.`}
          confirmLabel="Leave"
          onConfirm={handleLeave}
          onCancel={() => setShowLeaveConfirm(false)}
          danger
        />
      )}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete group"
          message={`Permanently delete "${group.name}" and all its content? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          danger
        />
      )}
    </>
  );
}
