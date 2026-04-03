// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "../../components/AppLayout";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { insertEmojiAtCursor } from "../../components/EmojiPickerPopup";
import { EMOJI_CATEGORIES } from "../../lib/emojiData";
import MentionAutocomplete from "../../components/mentions/MentionAutocomplete";
import { renderMentions } from "../../utils/mentions";
import {
  useGroup,
  useGroupMembers,
  useGroupMessages,
  useSendGroupMessage,
  useDeleteGroupMessage,
  useEditGroupMessage,
  useGroupReactions,
  useToggleGroupReaction,
  useGroupLeaderboard,
  useLeaveGroup,
  useRemoveMember,
  useDeleteGroup,
  useGroupAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useJoinRequests,
  useApproveJoinRequest,
  useDenyJoinRequest,
  useGroupProgress,
} from "../../hooks/useGroups";
import ConfirmModal from "../../components/ConfirmModal";
import { sanitizeContent, MAX_MSG_LENGTH } from "../../lib/e2e";
import { PLAN_TEMPLATES, BOOKS } from "../../data/readingPlanTemplates";
import {
  useActiveChallenge,
  useStartChallenge,
  useEndChallenge,
  useChallengeProgress,
} from "../../hooks/useGroupChallenge";
import { useSubscription } from "../../hooks/useSubscription";
import "../../styles/groups.css";
import "../../styles/group-challenge.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso, t) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return t ? t("messages.justNow") : "just now";
  if (m < 60) return `${m}${t ? t("messages.minutesAgo") : "m ago"}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${t ? t("messages.hoursAgo") : "h ago"}`;
  return `${Math.floor(h / 24)}${t ? t("messages.daysAgo") : "d ago"}`;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatDay(date, t) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return t ? t("messages.today") : "Today";
  if (date.toDateString() === yesterday.toDateString()) return t ? t("messages.yesterday") : "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function groupByDay(messages, t) {
  const items = [];
  let lastDay = null;
  for (const msg of messages) {
    const day = new Date(msg.created_at).toDateString();
    if (day !== lastDay) {
      items.push({ type: "day", label: formatDay(new Date(msg.created_at), t), key: "day-" + day });
      lastDay = day;
    }
    items.push({ type: "message", ...msg });
  }
  return items;
}

function groupReactions(reactions, messageId) {
  const grouped = {};
  (reactions || []).filter(r => r.message_id === messageId).forEach(r => {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, users: [] };
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push(r.user_id);
  });
  return grouped;
}

const REACTION_EMOJIS = ["👍","❤️","😂","😮","😢","🔥","🙏","👏"];

function initial(name) { return (name || "?")[0].toUpperCase(); }

function Avatar({ name, avatarUrl, size = 36 }) {
  return avatarUrl ? (
    <img className="grp-avatar" src={avatarUrl} alt={name} width={size} height={size} style={{ width: size, height: size }} loading="lazy" />
  ) : (
    <div className="grp-avatar grp-avatar--fallback" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initial(name)}
    </div>
  );
}

// ── Chat sub-components ───────────────────────────────────────────────────────

function GrpEmojiPicker({ onSelect, onClose }) {
  const [tab, setTab] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return (
    <div className="grp-emoji-picker" ref={ref}>
      <div className="grp-emoji-tabs">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button key={i} className={`grp-emoji-tab${tab === i ? " grp-emoji-tab--active" : ""}`} onClick={() => setTab(i)}>{cat.label}</button>
        ))}
      </div>
      <div className="grp-emoji-grid">
        {EMOJI_CATEGORIES[tab].emojis.map(em => (
          <button key={em} className="grp-emoji-btn" onClick={() => onSelect(em)}>{em}</button>
        ))}
      </div>
    </div>
  );
}

function GrpReactionPicker({ onPick, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return (
    <div className="grp-reaction-picker" ref={ref}>
      {REACTION_EMOJIS.map(em => (
        <button key={em} className="grp-reaction-picker-btn" onClick={() => { onPick(em); onClose(); }}>{em}</button>
      ))}
    </div>
  );
}

function GrpBubble({ msg, isMine, canDelete, allMessages, reactions, userId, onDelete, onReply, onEdit, onToggleReaction }) {
  const { t } = useTranslation();
  const [showActions, setShowActions] = useState(false);
  const [showReactPicker, setShowReactPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content);
  const editRef = useRef(null);

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [editing]);

  function submitEdit() {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === msg.content) { setEditing(false); return; }
    onEdit(msg.id, sanitizeContent(trimmed));
    setEditing(false);
  }

  const replyOrig = msg.reply_to_id ? allMessages.find(m => m.id === msg.reply_to_id) : null;
  const grouped = groupReactions(reactions, msg.id);

  return (
    <div
      className={`grp-msg-wrap${isMine ? " grp-msg-wrap--mine" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactPicker(false); }}
    >
      {!isMine && <Avatar name={msg.sender?.display_name} avatarUrl={msg.sender?.avatar_url} size={28} />}
      <div className="grp-msg-col">
        {!isMine && <span className="grp-msg-sender">{msg.sender?.display_name || t("groups.member")}</span>}

        {replyOrig && (
          <div className="grp-quoted">
            <div className="grp-quoted-bar" />
            <div className="grp-quoted-body">
              <span className="grp-quoted-name">{replyOrig.sender?.display_name || t("messages.user")}</span>
              <span className="grp-quoted-text">{(replyOrig.content || "").slice(0, 60)}</span>
            </div>
          </div>
        )}

        <div className={`grp-msg-bubble${isMine ? " grp-msg-bubble--mine" : ""}`}>
          {editing ? (
            <textarea
              ref={editRef}
              className="grp-edit-textarea"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(); }
                if (e.key === "Escape") { setEditing(false); setEditText(msg.content); }
              }}
              rows={1}
            />
          ) : (
            <span dangerouslySetInnerHTML={{ __html: renderMentions(msg.content) }} />
          )}
          <div className="grp-bubble-footer">
            <span className="grp-bubble-time">{formatTime(msg.created_at)}</span>
            {msg.edited_at && <span className="grp-edited-label">{t("groups.edited")}</span>}
          </div>
        </div>

        {Object.keys(grouped).length > 0 && (
          <div className="grp-reaction-row">
            {Object.entries(grouped).map(([em, { count, users }]) => (
              <button
                key={em}
                className={`grp-reaction-pill${users.includes(userId) ? " grp-reaction-pill--mine" : ""}`}
                onClick={() => onToggleReaction(msg.id, em)}
              >
                {em} <span>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showActions && !editing && (
        <div className={`grp-bubble-actions${isMine ? " grp-bubble-actions--mine" : ""}`}>
          <div style={{ position: "relative" }}>
            <button className="grp-action-btn" title={t("groups.react")} onClick={() => setShowReactPicker(s => !s)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </button>
            {showReactPicker && (
              <GrpReactionPicker onPick={(em) => onToggleReaction(msg.id, em)} onClose={() => setShowReactPicker(false)} />
            )}
          </div>
          <button className="grp-action-btn" title={t("groups.reply")} onClick={() => onReply(msg)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
          </button>
          {isMine && <button className="grp-action-btn" title={t("common.edit")} onClick={() => { setEditing(true); setEditText(msg.content); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>}
          {canDelete && <button className="grp-action-btn grp-action-btn--danger" title={t("common.delete")} onClick={() => onDelete(msg.id)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>}
        </div>
      )}
    </div>
  );
}

// ── Chat tab ──────────────────────────────────────────────────────────────────

function ChatTab({ groupId, user, isAdmin }) {
  const { t } = useTranslation();
  const { data: messages = [], isLoading } = useGroupMessages(groupId);
  const { data: reactions = [] } = useGroupReactions(groupId);
  const sendMessage = useSendGroupMessage(groupId);
  const deleteMessage = useDeleteGroupMessage(groupId);
  const editMessage = useEditGroupMessage(groupId);
  const toggleReaction = useToggleGroupReaction(groupId);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const insertEmoji = useCallback((em) => {
    const next = insertEmojiAtCursor(inputRef.current, input, em);
    setInput(next.slice(0, 2000));
    setShowEmoji(false);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      const pos = (el.selectionStart ?? input.length) + em.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }, [input]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  }, [input]);

  function handleSend(e) {
    e.preventDefault();
    const raw = input.trim();
    if (!raw) return;
    const sanitized = sanitizeContent(raw);
    if (!sanitized) return;
    sendMessage.mutate({ senderId: user.id, content: sanitized, replyToId: replyTo?.id ?? null });
    setInput("");
    setReplyTo(null);
    if (inputRef.current) inputRef.current.style.height = "auto";
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
    if (e.key === "Escape" && replyTo) setReplyTo(null);
  }

  const items = groupByDay(messages, t);

  return (
    <div className="grp-chat">
      <div className="grp-chat-messages">
        {isLoading ? (
          <p className="grp-empty">{t("common.loading")}</p>
        ) : messages.length === 0 ? (
          <div className="grp-chat-empty">
            <span>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </span>
            <strong>{t("groups.noMessages")}</strong>
            <p>{t("groups.beFirst")}</p>
          </div>
        ) : (
          items.map(item => {
            if (item.type === "day") {
              return <div key={item.key} className="grp-chat-divider"><span>{item.label}</span></div>;
            }
            const isMine = item.sender_id === user.id;
            return (
              <GrpBubble
                key={item.id}
                msg={item}
                isMine={isMine}
                canDelete={isMine || isAdmin}
                allMessages={messages}
                reactions={reactions}
                userId={user.id}
                onDelete={(id) => deleteMessage.mutate(id)}
                onReply={(msg) => { setReplyTo(msg); inputRef.current?.focus(); }}
                onEdit={(id, content) => editMessage.mutate({ messageId: id, content })}
                onToggleReaction={(id, emoji) => toggleReaction.mutate({ messageId: id, emoji, userId: user.id })}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="grp-chat-composer-wrap">
        {showEmoji && <GrpEmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
        {replyTo && (
          <div className="grp-reply-preview">
            <div className="grp-reply-preview-bar" />
            <div className="grp-reply-preview-content">
              <span className="grp-reply-preview-name">{replyTo.sender?.display_name || t("messages.user")}</span>
              <span className="grp-reply-preview-text">{(replyTo.content || "").slice(0, 60)}</span>
            </div>
            <button className="grp-reply-preview-cancel" onClick={() => setReplyTo(null)} aria-label={t("common.cancel")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}
        <form className="grp-chat-composer" onSubmit={handleSend}>
          <button type="button" className="grp-emoji-toggle" onClick={() => setShowEmoji(v => !v)} title="Emoji" aria-label="Emoji">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </button>
          <MentionAutocomplete
            value={input}
            onChange={e => setInput(e.target.value.slice(0, MAX_MSG_LENGTH))}
            onKeyDown={handleKeyDown}
            placeholder={t("groups.messagePlaceholder")}
            rows={1}
            className="grp-chat-input"
          />
          <button className="grp-chat-send" type="submit" disabled={!input.trim() || sendMessage.isPending} aria-label={t("messages.send")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Leaderboard tab ───────────────────────────────────────────────────────────

function LeaderboardTab({ groupId, userId }) {
  const { t } = useTranslation();
  const { data: board = [], isLoading } = useGroupLeaderboard(groupId);

  if (isLoading) return <div className="grp-spinner-wrap"><div className="grp-spinner" /></div>;
  if (!board.length) return <p className="grp-empty grp-empty--pad">{t("groups.noData")}</p>;

  return (
    <div className="grp-leaderboard">
      {board.map((entry, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
        const isMe = entry.userId === userId;
        return (
          <div key={entry.userId} className={`grp-lb-row${isMe ? " grp-lb-row--me" : ""}`}>
            <span className="grp-lb-rank">{medal || `#${i + 1}`}</span>
            <Avatar name={entry.displayName} avatarUrl={entry.avatarUrl} size={34} />
            <div className="grp-lb-info">
              <span className="grp-lb-name">{entry.displayName}{isMe ? " (you)" : ""}</span>
              <span className="grp-lb-sub">{t("groups.longestStreak")} {entry.longestStreak}d</span>
            </div>
            <div className="grp-lb-streak">
              <span className="grp-lb-streak-num">{entry.currentStreak}</span>
              <span className="grp-lb-streak-label">{t("groups.dayStreak")}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Members tab ───────────────────────────────────────────────────────────────

function MembersTab({ groupId, userId, isAdmin, onRemove }) {
  const { t } = useTranslation();
  const { data: members = [], isLoading } = useGroupMembers(groupId);
  const { data: requests = [] } = useJoinRequests(groupId);
  const approveRequest = useApproveJoinRequest(groupId);
  const denyRequest = useDenyJoinRequest(groupId);

  if (isLoading) return <div className="grp-spinner-wrap"><div className="grp-spinner" /></div>;

  return (
    <div className="grp-members">
      {isAdmin && requests.length > 0 && (
        <div className="grp-join-requests">
          <h4 className="grp-join-requests-title">
            {t("groups.joinRequests")} <span className="grp-tab-count">{requests.length}</span>
          </h4>
          {requests.map(r => (
            <div key={r.id} className="grp-request-row">
              <Avatar name={r.profile?.display_name} avatarUrl={r.profile?.avatar_url} size={32} />
              <span className="grp-request-name">{r.profile?.display_name || t("groups.member")}</span>
              <span className="grp-request-time">{timeAgo(r.created_at, t)}</span>
              <button
                className="grp-btn grp-btn--sm grp-btn--primary"
                onClick={() => approveRequest.mutate({ requestId: r.id, userId: r.user_id })}
                disabled={approveRequest.isPending}
              >{t("groups.approve")}</button>
              <button
                className="grp-btn grp-btn--sm grp-btn--ghost"
                onClick={() => denyRequest.mutate(r.id)}
                disabled={denyRequest.isPending}
              >{t("groups.deny")}</button>
            </div>
          ))}
        </div>
      )}
      {members.map(m => (
        <div key={m.userId} className="grp-member-row">
          <Avatar name={m.display_name} avatarUrl={m.avatar_url} size={36} />
          <div className="grp-member-info">
            <span className="grp-member-name">{m.display_name || t("groups.member")}</span>
            <span className="grp-member-role">{m.role === "admin" ? t("groups.kingAdmin") : t("groups.member")} · {t("groups.joined")} {timeAgo(m.joinedAt, t)}</span>
          </div>
          {isAdmin && m.userId !== userId && (
            <button
              className="grp-btn grp-btn--sm grp-btn--danger"
              onClick={() => onRemove(m.userId)}
            >
              {t("common.delete")}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Announcements tab ─────────────────────────────────────────────────────────

function AnnouncementsTab({ groupId, isAdmin }) {
  const { t } = useTranslation();
  const { data: announcements = [], isLoading } = useGroupAnnouncements(groupId);
  const createAnnouncement = useCreateAnnouncement(groupId);
  const deleteAnnouncement = useDeleteAnnouncement(groupId);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  function handlePost(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setError("");
    createAnnouncement.mutate(trimmed, {
      onSuccess: () => setText(""),
      onError: (err) => setError(err.message),
    });
  }

  if (isLoading) return <div className="grp-spinner-wrap"><div className="grp-spinner" /></div>;

  return (
    <div className="grp-announcements">
      {isAdmin && (
        <form className="grp-announce-form" onSubmit={handlePost}>
          <textarea
            className="grp-input grp-textarea"
            placeholder={t("groups.announcementPlaceholder")}
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={500}
            rows={3}
          />
          {error && <p className="grp-error">{error}</p>}
          <button type="submit" className="grp-btn grp-btn--primary grp-btn--sm" disabled={!text.trim() || createAnnouncement.isPending}>
            {t("groups.postAnnouncement")}
          </button>
        </form>
      )}
      {announcements.length === 0 ? (
        <p className="grp-empty grp-empty--pad">{t("groups.noAnnouncements")}</p>
      ) : (
        announcements.map(a => (
          <div key={a.id} className="grp-announce-card">
            <div className="grp-announce-header">
              <Avatar name={a.author?.display_name} avatarUrl={a.author?.avatar_url} size={28} />
              <span className="grp-announce-author">{a.author?.display_name}</span>
              <span className="grp-announce-time">{timeAgo(a.created_at, t)}</span>
              {isAdmin && (
                <button className="grp-announce-delete" onClick={() => deleteAnnouncement.mutate(a.id)} title={t("common.delete")} aria-label={t("common.delete")}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
            <p className="grp-announce-content">{a.content}</p>
          </div>
        ))
      )}
    </div>
  );
}

// ── Reading progress tab ──────────────────────────────────────────────────────

function ProgressTab({ groupId, userId }) {
  const { t } = useTranslation();
  const { data: progress = [], isLoading } = useGroupProgress(groupId);

  if (isLoading) return <div className="grp-spinner-wrap"><div className="grp-spinner" /></div>;
  if (!progress.length) return <p className="grp-empty grp-empty--pad">{t("groups.noData")}</p>;

  const maxChapters = Math.max(...progress.map(p => Number(p.total_chapters)), 1);

  return (
    <div className="grp-progress">
      {progress.map((entry, i) => {
        const isMe = entry.user_id === userId;
        const pct = Math.round((Number(entry.total_chapters) / maxChapters) * 100);
        return (
          <div key={entry.user_id} className={`grp-progress-row${isMe ? " grp-progress-row--me" : ""}`}>
            <span className="grp-progress-rank">#{i + 1}</span>
            <Avatar name={entry.display_name} avatarUrl={entry.avatar_url} size={32} />
            <div className="grp-progress-info">
              <div className="grp-progress-top">
                <span className="grp-progress-name">{entry.display_name}{isMe ? ` (${t("groups.you")})` : ""}</span>
                <span className="grp-progress-count">{Number(entry.total_chapters).toLocaleString()} {t("groups.chaptersRead")}</span>
              </div>
              <div className="grp-progress-bar-wrap">
                <div className="grp-progress-bar" style={{ width: `${pct}%` }} />
              </div>
              {entry.last_read_date && (
                <span className="grp-progress-last">{t("groups.lastRead")}: {new Date(entry.last_read_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Reading Challenge components ──────────────────────────────────────────────

function ChallengePicker({ onConfirm, onClose }) {
  const [selectedKey, setSelectedKey] = useState(PLAN_TEMPLATES[0]?.key ?? "");

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="gc-picker-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="gc-picker-sheet" role="dialog" aria-modal="true">
        <h2 className="gc-picker-title">Choose a Reading Plan</h2>
        <div className="gc-picker-list">
          {PLAN_TEMPLATES.map((template) => (
            <button
              key={template.key}
              className={`gc-picker-item${selectedKey === template.key ? " gc-picker-item--selected" : ""}`}
              onClick={() => setSelectedKey(template.key)}
            >
              <div className="gc-picker-item-name">{template.name}</div>
              <div className="gc-picker-item-meta">
                {template.totalChapters ?? "?"} chapters
                {template.totalDays ? ` · ~${template.totalDays} days` : ""}
              </div>
            </button>
          ))}
        </div>
        <button
          className="gc-picker-confirm"
          disabled={!selectedKey}
          onClick={() => selectedKey && onConfirm(selectedKey)}
        >
          Start Challenge →
        </button>
      </div>
    </div>,
    document.body
  );
}

function ChallengeSection({ groupId, currentUser, isAdmin, onUpgrade }) {
  const { isPremium } = useSubscription(currentUser?.id);
  const { data: challenge, isLoading: challengeLoading } = useActiveChallenge(groupId);
  const { data: progress = [], isLoading: progressLoading } = useChallengeProgress(
    challenge?.id,
    challenge?.plan_key
  );
  const startChallenge = useStartChallenge(groupId);
  const endChallenge = useEndChallenge(groupId);
  const [showPicker, setShowPicker] = useState(false);

  if (challengeLoading) return null;

  const planName = PLAN_TEMPLATES.find((t) => t.key === challenge?.plan_key)?.name
    ?? challenge?.plan_key;

  function handleStartClick() {
    if (!isAdmin) return;
    if (!isPremium) { onUpgrade?.(); return; }
    setShowPicker(true);
  }

  return (
    <section className="gc-section">
      <h2 className="gc-section-title">Reading Challenge</h2>

      {!challenge ? (
        <div
          className="gc-start-card"
          onClick={handleStartClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleStartClick()}
        >
          <p className="gc-start-label">+ Start a Reading Challenge</p>
          <p className="gc-start-sub">
            {isAdmin
              ? (isPremium ? "Pick a plan and track the whole group's progress" : "✦ Requires Premium")
              : "Ask your group admin to start a challenge"}
          </p>
        </div>
      ) : (
        <>
          <div className="gc-active-header">
            <div>
              <div className="gc-plan-name">{planName}</div>
              <div className="gc-start-date">
                Started {new Date(challenge.start_date).toLocaleDateString(undefined, {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </div>
            </div>
            {isAdmin && (
              <button
                className="gc-end-btn"
                onClick={() => endChallenge.mutate(challenge.id)}
                disabled={endChallenge.isPending}
              >
                End Challenge
              </button>
            )}
          </div>

          {progressLoading ? (
            <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          ) : (
            <ul className="gc-member-list" style={{ listStyle: "none", padding: 0 }}>
              {progress.map((member) => (
                <li key={member.user_id} className="gc-member-row">
                  <span className="gc-avatar">
                    {member.avatar_url
                      ? <img src={member.avatar_url} alt={member.display_name} />
                      : member.display_name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                  <div className="gc-member-info">
                    <div className="gc-member-name">{member.display_name}</div>
                    {member.chapters_done > 0 ? (
                      <div className="gc-progress-bar">
                        <div
                          className="gc-progress-fill"
                          style={{ width: `${member.pct}%` }}
                        />
                      </div>
                    ) : (
                      <span className="gc-not-started">Not started</span>
                    )}
                  </div>
                  <span className="gc-member-pct">
                    {member.chapters_done > 0 ? `${member.pct}%` : "0%"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {showPicker && (
        <ChallengePicker
          onConfirm={(planKey) => {
            startChallenge.mutate(
              { planKey, userId: currentUser?.id },
              {
                onError: (err) => console.error("Failed to start challenge:", err),
              }
            );
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </section>
  );
}

// ── Main detail page ──────────────────────────────────────────────────────────

export default function GroupDetail({ groupId, user, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("chat");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const { data: group, isLoading: loadingGroup } = useGroup(groupId);
  const { data: members = [] } = useGroupMembers(groupId);
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();
  const removeMember = useRemoveMember(groupId);

  const myMembership = members.find(m => m.userId === user.id);
  const isAdmin = myMembership?.role === "admin";
  const isMember = !!myMembership;

  if (loadingGroup) return <p className="grp-empty grp-empty--pad">{t("common.loading")}</p>;
  if (!group) return <p className="grp-empty grp-empty--pad">{t("groups.notFound")}</p>;

  function handleLeave() {
    leaveGroup.mutate(groupId, {
      onSuccess: () => navigate("groups"),
    });
  }

  function handleDelete() {
    deleteGroup.mutate(groupId, {
      onSuccess: () => navigate("groups"),
    });
  }

  function handleRemove(userId) {
    removeMember.mutate(userId, {
      onSuccess: () => setRemoveTarget(null),
    });
  }

  const daysLeft = group.goal_deadline
    ? Math.ceil((new Date(group.goal_deadline) - Date.now()) / 86400000)
    : null;

  const isReadingGroup = !group.group_type || group.group_type === "bible_study";

  return (
    <div className="grp-detail">
      <AppLayout navigate={navigate} user={user} currentPage="groups">
      {/* Header */}
      <div className="grp-detail-header">
        <button className="grp-detail-back-btn" onClick={() => navigate("groups")} aria-label={t("common.back")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="grp-detail-avatar">
          {group.cover_url
            ? <img src={group.cover_url} alt="" />
            : <span>{initial(group.name)}</span>
          }
        </div>
        <div className="grp-detail-header-info">
          <h1 className="grp-detail-name">{group.name}</h1>
          {group.description && <p className="grp-detail-desc">{group.description}</p>}
          {group.goal_label && (
            <p className="grp-detail-goal">
              {group.goal_label}
              {daysLeft !== null && (
                <span className={`grp-deadline${daysLeft < 7 ? " grp-deadline--urgent" : ""}`}>
                  {daysLeft > 0 ? ` · ${daysLeft}d left` : " · Deadline passed"}
                </span>
              )}
            </p>
          )}
          <div className="grp-detail-meta">
            <span className="grp-detail-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {members.length} {t("groups.members")}
            </span>
            {group.is_private && <span>{t("groups.private")}</span>}
            {isAdmin && group.invite_code && (
              <button
                className="grp-invite-code"
                title={t("groups.clickToCopy")}
                onClick={() => { navigator.clipboard.writeText(group.invite_code); }}
              >
                {t("groups.code")} <strong>{group.invite_code}</strong>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            )}
          </div>
        </div>
        <div className="grp-detail-actions">
          {isMember && !isAdmin && (
            <button className="grp-btn grp-btn--ghost grp-btn--sm" onClick={() => setConfirmLeave(true)}>
              {t("groups.leave")}
            </button>
          )}
          {isAdmin && (
            <button className="grp-btn grp-btn--danger grp-btn--sm" onClick={() => setConfirmDelete(true)}>
              {t("common.delete")}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="grp-tabs grp-tabs--detail">
        <button className={`grp-tab${tab === "chat" ? " grp-tab--active" : ""}`} onClick={() => setTab("chat")}>{t("groups.chat")}</button>
        <button className={`grp-tab${tab === "announcements" ? " grp-tab--active" : ""}`} onClick={() => setTab("announcements")}>{t("groups.announcements")}</button>
        {isReadingGroup && <button className={`grp-tab${tab === "progress" ? " grp-tab--active" : ""}`} onClick={() => setTab("progress")}>{t("groups.progress")}</button>}
        {isReadingGroup && <button className={`grp-tab${tab === "leaderboard" ? " grp-tab--active" : ""}`} onClick={() => setTab("leaderboard")}>{t("groups.leaderboard")}</button>}
        <button className={`grp-tab${tab === "members" ? " grp-tab--active" : ""}`} onClick={() => setTab("members")}>{t("groups.membersTab")}</button>
      </div>

      {/* Tab content */}
      <div className="grp-detail-body">
        {tab === "chat" && <ChatTab groupId={groupId} user={user} isAdmin={isAdmin} />}
        {tab === "announcements" && <AnnouncementsTab groupId={groupId} isAdmin={isAdmin} />}
        {tab === "progress" && isReadingGroup && <ProgressTab groupId={groupId} userId={user.id} />}
        {tab === "leaderboard" && isReadingGroup && <LeaderboardTab groupId={groupId} userId={user.id} />}
        {tab === "members" && (
          <MembersTab
            groupId={groupId}
            userId={user.id}
            isAdmin={isAdmin}
            onRemove={(uid) => setRemoveTarget(uid)}
          />
        )}
      </div>

      {isReadingGroup && (
        <ChallengeSection
          groupId={groupId}
          currentUser={user}
          isAdmin={isAdmin}
          onUpgrade={() => navigate("premium")}
        />
      )}

      {confirmLeave && (
        <ConfirmModal
          message={t("groups.leaveConfirm")}
          onConfirm={handleLeave}
          onCancel={() => setConfirmLeave(false)}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          message={t("groups.deleteConfirm")}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {removeTarget && (
        <ConfirmModal
          message={t("groups.removeMemberConfirm")}
          onConfirm={() => handleRemove(removeTarget)}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
      </AppLayout>
    </div>
  );
}
