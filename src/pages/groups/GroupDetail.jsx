import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { insertEmojiAtCursor } from "../../components/EmojiPickerPopup";
import { EMOJI_CATEGORIES } from "../../lib/emojiData";
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
} from "../../hooks/useGroups";
import ConfirmModal from "../../components/ConfirmModal";
import { sanitizeContent, MAX_MSG_LENGTH } from "../../lib/e2e";
import "../../styles/groups.css";

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
            <span>{msg.content}</span>
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
            <button className="grp-action-btn" title={t("groups.react")} onClick={() => setShowReactPicker(s => !s)}>😊</button>
            {showReactPicker && (
              <GrpReactionPicker onPick={(em) => onToggleReaction(msg.id, em)} onClose={() => setShowReactPicker(false)} />
            )}
          </div>
          <button className="grp-action-btn" title={t("groups.reply")} onClick={() => onReply(msg)}>↩</button>
          {isMine && <button className="grp-action-btn" title={t("common.edit")} onClick={() => { setEditing(true); setEditText(msg.content); }}>✎</button>}
          {canDelete && <button className="grp-action-btn grp-action-btn--danger" title={t("common.delete")} onClick={() => onDelete(msg.id)}>✕</button>}
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
            <span>💬</span>
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
            <button className="grp-reply-preview-cancel" onClick={() => setReplyTo(null)}>✕</button>
          </div>
        )}
        <form className="grp-chat-composer" onSubmit={handleSend}>
          <button type="button" className="grp-emoji-toggle" onClick={() => setShowEmoji(v => !v)} title="Emoji">😊</button>
          <textarea
            ref={inputRef}
            className="grp-chat-input"
            placeholder={t("groups.messagePlaceholder")}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_MSG_LENGTH}
            rows={1}
          />
          <button className="grp-chat-send" type="submit" disabled={!input.trim() || sendMessage.isPending}>➤</button>
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
              <span className="grp-lb-streak-label">{t("groups.dayStreak")} 🔥</span>
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

  if (isLoading) return <div className="grp-spinner-wrap"><div className="grp-spinner" /></div>;

  return (
    <div className="grp-members">
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

// ── Main detail page ──────────────────────────────────────────────────────────

export default function GroupDetail({ groupId, user, navigate, darkMode, setDarkMode, i18n, onLogout }) {
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

  return (
    <div className="grp-detail">
      {/* Header */}
      <div className="grp-detail-header">
        <button className="grp-detail-back-btn" onClick={() => navigate("groups")}>←</button>
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
              🎯 {group.goal_label}
              {daysLeft !== null && (
                <span className={`grp-deadline${daysLeft < 7 ? " grp-deadline--urgent" : ""}`}>
                  {daysLeft > 0 ? ` · ${daysLeft}d left` : " · Deadline passed"}
                </span>
              )}
            </p>
          )}
          <div className="grp-detail-meta">
            <span>👥 {members.length} {t("groups.members")}</span>
            {group.is_private && <span>{t("groups.private")}</span>}
            {isAdmin && group.invite_code && (
              <span
                className="grp-invite-code"
                title="Click to copy"
                onClick={() => { navigator.clipboard.writeText(group.invite_code); }}
              >
                {t("groups.code")} <strong>{group.invite_code}</strong> 📋
              </span>
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
        <button className={`grp-tab${tab === "leaderboard" ? " grp-tab--active" : ""}`} onClick={() => setTab("leaderboard")}>{t("groups.leaderboard")}</button>
        <button className={`grp-tab${tab === "members" ? " grp-tab--active" : ""}`} onClick={() => setTab("members")}>{t("groups.membersTab")}</button>
      </div>

      {/* Tab content */}
      <div className="grp-detail-body">
        {tab === "chat" && <ChatTab groupId={groupId} user={user} isAdmin={isAdmin} />}
        {tab === "leaderboard" && <LeaderboardTab groupId={groupId} userId={user.id} />}
        {tab === "members" && (
          <MembersTab
            groupId={groupId}
            userId={user.id}
            isAdmin={isAdmin}
            onRemove={(uid) => setRemoveTarget(uid)}
          />
        )}
      </div>

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
    </div>
  );
}
