import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../../components/ConfirmModal";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useDeleteMessage,
  useMarkRead,
  useDeleteConversation,
  useReactions,
  useToggleReaction,
  useEditMessage,
  useUploadImage,
  useToggleStar,
  useStarredMessages,
  useSearchMessages,
  useConvSettings,
  useSaveConvSettings,
} from "../../hooks/useMessages";
import "../../styles/messages.css";
import { useE2EKeys, useSharedKey } from "../../hooks/useE2E";
import { encryptMessage, decryptMessage, sanitizeContent, MAX_MSG_LENGTH } from "../../lib/e2e";
import { supabase } from "../../lib/supabase";
import { BOOKS } from "../../data/books";
import { wolChapterUrl } from "../../utils/wol";
import { getTemplate } from "../../data/readingPlanTemplates";
import { useMyPlans } from "../../hooks/useReadingPlans";

// ── Audio ─────────────────────────────────────────────────────────────────────

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* ignore if audio not available */ }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function displayName(profile) {
  return profile?.display_name || "Unknown";
}

function initial(profile) {
  const n = profile?.display_name || "?";
  return n[0].toUpperCase();
}

function timeAgo(iso, t) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return t ? t("messages.justNow") : "just now";
  if (m < 60) return `${m}${t ? t("messages.minutesAgo") : "m ago"}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${t ? t("messages.hoursAgo") : "h ago"}`;
  return `${Math.floor(h / 24)}${t ? t("messages.daysAgo") : "d ago"}`;
}

function formatDay(date, t) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return t ? t("messages.today") : "Today";
  if (date.toDateString() === yesterday.toDateString()) return t ? t("messages.yesterday") : "Yesterday";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
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

// Group reactions by emoji: { "👍": [{ userId, ... }], ... }
function groupReactions(reactions, messageId) {
  const mine = {};
  reactions.filter(r => r.message_id === messageId).forEach(r => {
    if (!mine[r.emoji]) mine[r.emoji] = { count: 0, users: [], mine: false };
    mine[r.emoji].count++;
    mine[r.emoji].users.push(r.user_id);
  });
  return mine;
}

const REACTION_EMOJIS = ["👍","❤️","😂","😮","😢","🔥","🙏","👏"];
const EMOJIS = ["😀","😂","😍","🥰","😊","😎","😢","😭","😅","🤣","❤️","🙏","👍","👋","🎉","🔥","✨","💯","🙌","💪","🤔","🫶","🥳","😇","🤩","✅","⚡","🌟","💡","😤","🫠","🫡","❤️‍🔥","🤝","👏","😆","🥹","😌","😴","🤯"];

// ── Mini avatar ───────────────────────────────────────────────────────────────

function Avatar({ profile, size = 36, online = false }) {
  return (
    <div className="msg-avatar-wrap" style={{ width: size, height: size, flexShrink: 0 }}>
      {profile?.avatar_url ? (
        <img
          className="msg-avatar"
          src={profile.avatar_url}
          alt={displayName(profile)}
          width={size} height={size}
          style={{ width: size, height: size }}
        />
      ) : (
        <div className="msg-avatar msg-avatar--fallback" style={{ width: size, height: size, fontSize: size * 0.38 }}>
          {initial(profile)}
        </div>
      )}
      {online && <span className="msg-online-dot" />}
    </div>
  );
}

// ── Reply preview (inside composer) ──────────────────────────────────────────

function ReplyPreview({ message, onCancel }) {
  const { t } = useTranslation();
  if (!message) return null;
  const preview = message.content?.startsWith("enc:") ? t("messages.encrypted") : (message.content || "");
  return (
    <div className="msg-reply-preview">
      <div className="msg-reply-preview-bar" />
      <div className="msg-reply-preview-content">
        <span className="msg-reply-preview-name">{displayName(message.sender)}</span>
        <span className="msg-reply-preview-text">{preview.slice(0, 80)}</span>
      </div>
      <button className="msg-reply-preview-cancel" onClick={onCancel}>✕</button>
    </div>
  );
}

// ── Quoted reply (inside bubble) ──────────────────────────────────────────────

function QuotedReply({ replyToId, messages }) {
  const { t } = useTranslation();
  const orig = messages.find(m => m.id === replyToId);
  if (!orig) return null;
  const preview = orig.content?.startsWith("enc:") ? t("messages.encryptedShort") : (orig.content || "");
  return (
    <div className="msg-quoted">
      <div className="msg-quoted-bar" />
      <div className="msg-quoted-body">
        <span className="msg-quoted-name">{displayName(orig.sender)}</span>
        <span className="msg-quoted-text">{preview.slice(0, 60)}</span>
      </div>
    </div>
  );
}

// ── Reaction pill row ─────────────────────────────────────────────────────────

function ReactionRow({ messageId, reactions, userId, onToggle }) {
  const grouped = groupReactions(reactions, messageId);
  if (!Object.keys(grouped).length) return null;
  return (
    <div className="msg-reactions">
      {Object.entries(grouped).map(([emoji, { count, users }]) => (
        <button
          key={emoji}
          className={`msg-reaction-pill${users.includes(userId) ? " msg-reaction-pill--mine" : ""}`}
          onClick={() => onToggle(emoji)}
          title={`${count} reaction${count > 1 ? "s" : ""}`}
        >
          {emoji} <span>{count}</span>
        </button>
      ))}
    </div>
  );
}

// ── Reaction picker popover ───────────────────────────────────────────────────

function ReactionPicker({ onPick, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className="msg-reaction-picker" ref={ref}>
      {REACTION_EMOJIS.map(e => (
        <button key={e} className="msg-reaction-picker-btn" onClick={() => { onPick(e); onClose(); }}>{e}</button>
      ))}
    </div>
  );
}

// ── Rich message cards ────────────────────────────────────────────────────────

function MSGImageCard({ content, metadata }) {
  const url = metadata?.url || content;
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="msg-image-card">
      <img
        src={url}
        alt={metadata?.filename || "Image"}
        className={`msg-image-thumb${loaded ? " msg-image-thumb--loaded" : ""}`}
        onLoad={() => setLoaded(true)}
        onClick={() => window.open(url, "_blank")}
      />
    </div>
  );
}

function MSGVerseCard({ metadata, isMine }) {
  if (!metadata) return null;
  const url = wolChapterUrl(metadata.book, metadata.chapter);
  return (
    <div className={`msg-verse-card${isMine ? " msg-verse-card--mine" : ""}`}>
      <div className="msg-verse-card-ref">📖 {metadata.ref}</div>
      {metadata.note && <p className="msg-verse-card-note">{metadata.note}</p>}
      {url && <a href={url} target="_blank" rel="noopener noreferrer" className="msg-verse-card-link">View on WOL →</a>}
    </div>
  );
}

function MSGPrayerCard({ content, isMine }) {
  return (
    <div className={`msg-prayer-card${isMine ? " msg-prayer-card--mine" : ""}`}>
      <div className="msg-prayer-card-tag">🙏 Prayer Request</div>
      <p className="msg-prayer-card-text">{content}</p>
    </div>
  );
}

function MSGPlanCard({ metadata, isMine }) {
  if (!metadata) return null;
  const friendlyTitle = getTemplate(metadata.templateKey)?.name || metadata.title || metadata.templateKey;
  return (
    <div className={`msg-plan-card${isMine ? " msg-plan-card--mine" : ""}`}>
      <span className="msg-plan-card-icon">📅</span>
      <div className="msg-plan-card-body">
        <div className="msg-plan-card-title">{friendlyTitle}</div>
        <div className="msg-plan-card-sub">Reading Plan</div>
      </div>
    </div>
  );
}

// ── Theme + disappear constants ───────────────────────────────────────────────

const MSG_THEME_COLORS = [
  { label: "Teal",    value: null },
  { label: "Purple",  value: "#7c3aed" },
  { label: "Blue",    value: "#2563eb" },
  { label: "Rose",    value: "#e11d48" },
  { label: "Amber",   value: "#d97706" },
  { label: "Emerald", value: "#059669" },
  { label: "Indigo",  value: "#4f46e5" },
  { label: "Pink",    value: "#db2777" },
];

const MSG_DISAPPEAR_OPTIONS = [
  { label: "Off",     value: null },
  { label: "24h",     value: 1 },
  { label: "7 days",  value: 7 },
  { label: "30 days", value: 30 },
];

// ── Starred panel ─────────────────────────────────────────────────────────────

function MSGStarredPanel({ convId, userId, onClose }) {
  const { data: starred = [], isLoading } = useStarredMessages(convId);
  const toggleStar = useToggleStar(convId);
  return (
    <div className="msg-overlay-panel">
      <div className="msg-overlay-header">
        <button className="msg-overlay-back" onClick={onClose}>←</button>
        <span>⭐ Starred Messages</span>
      </div>
      <div className="msg-overlay-body">
        {isLoading ? (
          <p className="msg-empty">Loading…</p>
        ) : starred.length === 0 ? (
          <p className="msg-empty">No starred messages yet.</p>
        ) : starred.map(msg => (
          <div key={msg.id} className="msg-starred-item">
            <div className="msg-starred-content">
              {msg.message_type === "verse" && msg.metadata ? (
                <span>📖 {msg.metadata.ref}</span>
              ) : msg.message_type === "image" ? (
                <span>🖼 Image</span>
              ) : msg.message_type === "prayer_request" ? (
                <span>🙏 {msg.content?.slice(0, 80)}</span>
              ) : (
                <span>{msg.content?.slice(0, 80)}</span>
              )}
            </div>
            <div className="msg-starred-meta">
              <span>{formatTime(msg.created_at)}</span>
              <button className="msg-starred-remove" onClick={() => toggleStar.mutate(msg.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Search panel ──────────────────────────────────────────────────────────────

function MSGSearchPanel({ convId, onClose }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef(null);
  const { data: results = [], isFetching } = useSearchMessages(convId, debouncedQuery);

  function handleChange(e) {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(v), 350);
  }

  return (
    <div className="msg-overlay-panel">
      <div className="msg-overlay-header">
        <button className="msg-overlay-back" onClick={onClose}>←</button>
        <input className="msg-overlay-search-input" placeholder="Search messages…" value={query} onChange={handleChange} autoFocus />
      </div>
      <div className="msg-overlay-body">
        {isFetching ? (
          <p className="msg-empty">Searching…</p>
        ) : debouncedQuery.length < 2 ? (
          <p className="msg-empty">Type to search.</p>
        ) : results.length === 0 ? (
          <p className="msg-empty">No results for "{debouncedQuery}".</p>
        ) : results.map(msg => (
          <div key={msg.id} className="msg-search-result">
            <span className="msg-search-result-text">{msg.content?.slice(0, 120)}</span>
            <span className="msg-search-result-time">{formatTime(msg.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Conversation settings panel ───────────────────────────────────────────────

function MSGConvSettingsPanel({ convId, onClose, accentColor, onAccentChange }) {
  const { data: settings } = useConvSettings(convId);
  const saveSettings = useSaveConvSettings(convId);
  const [theme, setTheme] = useState(settings?.theme_accent ?? null);
  const [disappear, setDisappear] = useState(settings?.disappear_after ?? null);

  useEffect(() => {
    if (settings) {
      setTheme(settings.theme_accent ?? null);
      setDisappear(settings.disappear_after ?? null);
    }
  }, [settings]);

  function save() {
    saveSettings.mutate({ themeAccent: theme, disappearAfter: disappear });
    onAccentChange(theme);
    onClose();
  }

  return (
    <div className="msg-overlay-panel">
      <div className="msg-overlay-header">
        <button className="msg-overlay-back" onClick={onClose}>←</button>
        <span>⚙ Chat Settings</span>
      </div>
      <div className="msg-overlay-body">
        <div className="msg-settings-section">
          <span className="msg-settings-label">🎨 Theme Color</span>
          <div className="msg-theme-swatches">
            {MSG_THEME_COLORS.map(tc => (
              <button
                key={tc.label}
                className={`msg-swatch${theme === tc.value ? " msg-swatch--active" : ""}`}
                style={{ background: tc.value ?? "linear-gradient(135deg, var(--teal), #5b21b6)" }}
                title={tc.label}
                onClick={() => setTheme(tc.value)}
              />
            ))}
          </div>
        </div>
        <div className="msg-settings-section">
          <span className="msg-settings-label">⏱ Disappearing Messages</span>
          <div className="msg-disappear-opts">
            {MSG_DISAPPEAR_OPTIONS.map(opt => (
              <button
                key={opt.label}
                className={`msg-disappear-btn${disappear === opt.value ? " msg-disappear-btn--active" : ""}`}
                onClick={() => setDisappear(opt.value)}
              >{opt.label}</button>
            ))}
          </div>
        </div>
        <button className="msg-settings-save" onClick={save} disabled={saveSettings.isPending}>
          {saveSettings.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Image upload warning modal ─────────────────────────────────────────────────

function MSGImageWarningModal({ file, onConfirm, onCancel }) {
  const previewUrl = file ? URL.createObjectURL(file) : null;
  return (
    <div className="msg-modal-overlay" onClick={onCancel}>
      <div className="msg-warn-modal" onClick={e => e.stopPropagation()}>
        <div className="msg-warn-icon">⚠️</div>
        <h3 className="msg-warn-title">Before you share</h3>
        <p className="msg-warn-body">
          Please ensure this image is appropriate for a Bible study community.
          <strong> Sharing explicit, offensive, or inappropriate content is strictly prohibited</strong> and
          may result in account suspension.
        </p>
        {previewUrl && (
          <img src={previewUrl} alt="Preview" className="msg-warn-preview" onLoad={() => URL.revokeObjectURL(previewUrl)} />
        )}
        <p className="msg-warn-agree">By continuing, you confirm this image is wholesome and appropriate.</p>
        <div className="msg-warn-actions">
          <button type="button" className="msg-warn-cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="msg-warn-confirm" onClick={onConfirm}>Send Image</button>
        </div>
      </div>
    </div>
  );
}

// ── Verse picker ──────────────────────────────────────────────────────────────

function MSGVersePicker({ onSend, onClose }) {
  const [bookIdx, setBookIdx] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [note, setNote] = useState("");
  const book = BOOKS[bookIdx];
  const chapterCount = book?.chapters || 1;
  function handleSend() {
    const ref = `${book.name} ${chapter}`;
    onSend({ ref, book: book.name, chapter, note: note.trim() });
    onClose();
  }
  return (
    <div className="msg-modal-overlay" onClick={onClose}>
      <div className="msg-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="msg-picker-header">
          <span>📖 Share Bible Verse</span>
          <button className="msg-picker-close" onClick={onClose}>✕</button>
        </div>
        <div className="msg-picker-body">
          <select className="msg-picker-select" value={bookIdx} onChange={e => { setBookIdx(+e.target.value); setChapter(1); }}>
            {BOOKS.map((b, i) => <option key={i} value={i}>{b.name}</option>)}
          </select>
          <select className="msg-picker-select" value={chapter} onChange={e => setChapter(+e.target.value)}>
            {Array.from({ length: chapterCount }, (_, i) => i + 1).map(c => <option key={c} value={c}>Chapter {c}</option>)}
          </select>
          <input className="msg-picker-input" placeholder="Add a note (optional)…" value={note} onChange={e => setNote(e.target.value)} maxLength={200} />
          <button className="msg-picker-send" onClick={handleSend}>Share</button>
        </div>
      </div>
    </div>
  );
}

// ── Plan picker ───────────────────────────────────────────────────────────────

function MSGPlanPicker({ onSend, onClose }) {
  const { data: plans = [] } = useMyPlans();
  return (
    <div className="msg-modal-overlay" onClick={onClose}>
      <div className="msg-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="msg-picker-header">
          <span>📅 Share Reading Plan</span>
          <button className="msg-picker-close" onClick={onClose}>✕</button>
        </div>
        <div className="msg-picker-body">
          {plans.length === 0 ? (
            <p className="msg-picker-empty">No active reading plans found.</p>
          ) : plans.map(plan => {
            const name = getTemplate(plan.template_key)?.name || plan.title || plan.template_key;
            return (
              <button key={plan.id} className="msg-plan-pick-item" onClick={() => { onSend({ templateKey: plan.template_key, title: name }); onClose(); }}>
                <span>📅</span><span>{name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, isMine, onDelete, onReply, onEdit, onStar, showSeen, reactions, userId, onToggleReaction, allMessages }) {
  const { t } = useTranslation();
  const [showActions, setShowActions] = useState(false);
  const isStarred = Array.isArray(msg.starred_by) && msg.starred_by.includes(userId);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content);
  const editRef = useRef(null);
  const fullTime = formatTime(msg.created_at);

  function submitEdit() {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === msg.content) { setEditing(false); return; }
    onEdit(msg.id, sanitizeContent(trimmed));
    setEditing(false);
  }

  function handleEditKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(); }
    if (e.key === "Escape") { setEditing(false); setEditText(msg.content); }
  }

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [editing]);

  return (
    <div
      className={`msg-bubble-wrap${isMine ? " msg-bubble-wrap--mine" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactionPicker(false); }}
    >
      {!isMine && <Avatar profile={msg.sender} size={28} />}
      <div style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", gap: 2 }}>
        {msg.reply_to_id && (
          <QuotedReply replyToId={msg.reply_to_id} messages={allMessages} />
        )}
        <div className={`msg-bubble${isMine ? " msg-bubble--mine" : ""}${msg._new ? " msg-bubble--new" : ""}`} title={fullTime}>
          {editing ? (
            <textarea
              ref={editRef}
              className="msg-edit-textarea"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={1}
            />
          ) : msg.message_type === "image" ? (
            <MSGImageCard content={msg.content} metadata={msg.metadata} />
          ) : msg.message_type === "verse" ? (
            <MSGVerseCard metadata={msg.metadata} isMine={isMine} />
          ) : msg.message_type === "prayer_request" ? (
            <MSGPrayerCard content={msg.content} isMine={isMine} />
          ) : msg.message_type === "reading_plan" ? (
            <MSGPlanCard metadata={msg.metadata} isMine={isMine} />
          ) : (
            <p className="msg-bubble-text">{msg.content}</p>
          )}
          <div className="msg-bubble-footer">
            <span className="msg-bubble-time">{timeAgo(msg.created_at, t)}</span>
            {msg.edited_at && <span className="msg-edited-label">{t("messages.edited")}</span>}
            {isMine && (
              <span className="msg-status-ticks">
                {showSeen ? t("messages.read") : t("messages.sent")}
              </span>
            )}
          </div>
        </div>
        <ReactionRow
          messageId={msg.id}
          reactions={reactions}
          userId={userId}
          onToggle={(emoji) => onToggleReaction(msg.id, emoji)}
        />
        {showSeen && <span className="msg-seen">{t("messages.seen")}</span>}
      </div>

      {/* Action buttons */}
      {showActions && !editing && (
        <div className={`msg-bubble-actions${isMine ? " msg-bubble-actions--mine" : ""}`}>
          <div style={{ position: "relative" }}>
            <button className="msg-action-btn" title={t("messages.react")} onClick={() => setShowReactionPicker(s => !s)}>😊</button>
            {showReactionPicker && (
              <ReactionPicker
                onPick={(emoji) => onToggleReaction(msg.id, emoji)}
                onClose={() => setShowReactionPicker(false)}
              />
            )}
          </div>
          <button className="msg-action-btn" title={t("messages.reply")} onClick={() => onReply(msg)}>↩</button>
          <button className={`msg-action-btn${isStarred ? " msg-action-btn--active" : ""}`} title={isStarred ? "Unstar" : "Star"} onClick={() => onStar?.(msg.id)}>⭐</button>
          {isMine && (
            <>
              <button className="msg-action-btn" title={t("common.edit")} onClick={() => { setEditing(true); setEditText(msg.content); }}>✎</button>
              <button className="msg-action-btn msg-action-btn--danger" title={t("common.delete")} onClick={() => onDelete(msg.id)}>✕</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="msg-typing-wrap">
      <div className="msg-typing-bubble">
        <span className="msg-typing-dot" />
        <span className="msg-typing-dot" />
        <span className="msg-typing-dot" />
      </div>
    </div>
  );
}

// ── Conversation list item ────────────────────────────────────────────────────

function ConvItem({ conv, active, onClick, currentUserId, onDelete, onlineUsers }) {
  const { t } = useTranslation();
  const isUnread = conv.unread_count > 0;
  const isMine = conv.last_message_sender_id === currentUserId;
  const isOnline = onlineUsers.has(conv.other_user_id);

  return (
    <div
      className={`msg-conv-item${active ? " msg-conv-item--active" : ""}${isUnread ? " msg-conv-item--unread" : ""}`}
      onClick={onClick}
    >
      <Avatar profile={{ display_name: conv.other_display_name, avatar_url: conv.other_avatar_url }} online={isOnline} />
      <div className="msg-conv-info">
        <div className="msg-conv-header">
          <span className="msg-conv-name">{conv.other_display_name || t("messages.user")}</span>
          {conv.last_message_at && (
            <span className="msg-conv-time">{timeAgo(conv.last_message_at, t)}</span>
          )}
        </div>
        <div className="msg-conv-preview">
          {conv.last_message_content
            ? `${isMine ? `${t("messages.you")}: ` : ""}${conv.last_message_content.startsWith("enc:") ? t("messages.encrypted") : conv.last_message_content}`
            : t("messages.noMessagesYet")}
        </div>
      </div>
      <div className="msg-conv-actions">
        {isUnread && <span className="msg-unread-dot">{conv.unread_count}</span>}
        <button
          className="msg-conv-delete-btn"
          onClick={e => { e.stopPropagation(); onDelete(conv.conversation_id); }}
          title="Delete conversation"
        >
          🗑
        </button>
      </div>
    </div>
  );
}

// ── Thread view ───────────────────────────────────────────────────────────────

function ThreadView({ conv, user, keyPair, onBack, soundEnabled, setSoundEnabled }) {
  const { t } = useTranslation();
  const { data: messages = [], isLoading } = useMessages(conv.conversation_id);
  const sendMessage = useSendMessage(conv.conversation_id);
  const deleteMessage = useDeleteMessage(conv.conversation_id);
  const editMessage = useEditMessage(conv.conversation_id);
  const markRead = useMarkRead(conv.conversation_id, user.id);
  const { data: reactions = [] } = useReactions(conv.conversation_id);
  const toggleReaction = useToggleReaction(conv.conversation_id);
  const { sharedKey, otherHasKey } = useSharedKey(keyPair, conv.other_user_id);
  const { uploading, uploadAndSend } = useUploadImage(conv.conversation_id);
  const toggleStar = useToggleStar(conv.conversation_id);
  const { data: convSettings } = useConvSettings(conv.conversation_id);

  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [replyTo, setReplyTo] = useState(null);
  const [decryptedMessages, setDecryptedMessages] = useState([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [otherLastSeen, setOtherLastSeen] = useState(null);
  const [isPrayerMode, setIsPrayerMode] = useState(false);
  const [showVersePicker, setShowVersePicker] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [showStarred, setShowStarred] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [accentColor, setAccentColor] = useState(null);

  // Sync accent color from saved settings
  useEffect(() => {
    if (convSettings?.theme_accent !== undefined) {
      setAccentColor(convSettings.theme_accent ?? null);
    }
  }, [convSettings?.theme_accent]);

  const bottomRef = useRef(null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const emojiRef = useRef(null);
  const fileRef = useRef(null);
  const presenceChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const prevCountRef = useRef(0);
  const isAtBottomRef = useRef(true);

  // Mark read on open
  useEffect(() => { markRead.mutate(); }, [conv.conversation_id]);

  // Decrypt all messages
  useEffect(() => {
    if (!messages.length) { setDecryptedMessages([]); return; }
    let cancelled = false;
    async function decryptAll() {
      const results = await Promise.all(
        messages.map(async (msg) => ({
          ...msg,
          content: sharedKey
            ? await decryptMessage(msg.content, sharedKey)
            : msg.content?.startsWith("enc:") ? "[🔒 Encrypted message]" : msg.content,
        }))
      );
      if (!cancelled) setDecryptedMessages(results);
    }
    decryptAll();
    return () => { cancelled = true; };
  }, [messages, sharedKey]);

  // Scroll to bottom on new messages (if already near bottom)
  useEffect(() => {
    const count = decryptedMessages.length;
    if (count > prevCountRef.current) {
      const added = count - prevCountRef.current;
      // Play chime for incoming messages
      if (prevCountRef.current > 0 && soundEnabled) {
        const lastNew = decryptedMessages[decryptedMessages.length - 1];
        if (lastNew?.sender_id !== user.id) playChime();
      }
      if (isAtBottomRef.current) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setNewMsgCount(0);
      } else {
        setNewMsgCount(c => c + added);
      }
    }
    prevCountRef.current = count;
  }, [decryptedMessages.length]);

  // Supabase Realtime Presence for typing + online
  useEffect(() => {
    if (!conv.conversation_id || !user.id) return;
    const channel = supabase.channel(`presence:${conv.conversation_id}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const others = Object.entries(state)
          .filter(([key]) => key !== user.id)
          .flatMap(([, presences]) => presences);
        const otherPresence = others.find(p => p.user_id === conv.other_user_id);
        setIsOtherOnline(!!otherPresence);
        setIsOtherTyping(!!otherPresence?.typing);
        if (!otherPresence) setOtherLastSeen(conv.other_last_read_at ?? null);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        if (key === conv.other_user_id) setIsOtherOnline(true);
        const p = newPresences.find(p => p.user_id === conv.other_user_id);
        if (p) setIsOtherTyping(!!p.typing);
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key === conv.other_user_id) {
          setIsOtherOnline(false);
          setIsOtherTyping(false);
          setOtherLastSeen(new Date().toISOString());
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id, typing: false });
        }
      });

    presenceChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      presenceChannelRef.current = null;
    };
  }, [conv.conversation_id, user.id, conv.other_user_id]);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  // Close emoji on outside click
  useEffect(() => {
    if (!showEmoji) return;
    function handler(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmoji]);

  function handleScroll() {
    const el = bodyRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = dist < 80;
    isAtBottomRef.current = atBottom;
    setShowScrollBtn(dist > 200);
    if (atBottom) setNewMsgCount(0);
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewMsgCount(0);
  }

  function broadcastTyping(isTyping) {
    const ch = presenceChannelRef.current;
    if (!ch) return;
    ch.track({ user_id: user.id, typing: isTyping });
  }

  function handleInputChange(e) {
    setInput(e.target.value);
    broadcastTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => broadcastTyping(false), 2000);
  }

  async function handleSend(e) {
    e.preventDefault();
    const raw = input.trim();
    if (!raw) return;
    const sanitized = sanitizeContent(raw);
    if (!sanitized) return;
    const toSend = sharedKey ? await encryptMessage(sanitized, sharedKey) : sanitized;
    sendMessage.mutate({
      senderId: user.id,
      content: toSend,
      replyToId: replyTo?.id ?? null,
      messageType: isPrayerMode ? "prayer_request" : "text",
    });
    setInput("");
    setIsPrayerMode(false);
    setReplyTo(null);
    broadcastTyping(false);
    clearTimeout(typingTimeoutRef.current);
    if (inputRef.current) inputRef.current.style.height = "auto";
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  function insertEmoji(emoji) {
    setInput(prev => prev + emoji);
    inputRef.current?.focus();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImageFile(file);
    e.target.value = "";
  }

  function confirmImageUpload() {
    if (!pendingImageFile) return;
    uploadAndSend(pendingImageFile, user.id, replyTo?.id ?? null);
    setReplyTo(null);
    setPendingImageFile(null);
  }

  function sendVerse(verseData) {
    sendMessage.mutate({
      senderId: user.id,
      content: `📖 ${verseData.ref}`,
      replyToId: null,
      messageType: "verse",
      metadata: verseData,
    });
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function sendPlan(planData) {
    sendMessage.mutate({
      senderId: user.id,
      content: `📅 ${planData.title}`,
      replyToId: null,
      messageType: "reading_plan",
      metadata: planData,
    });
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  const otherLastRead = conv.other_last_read_at ? new Date(conv.other_last_read_at) : null;
  const myMsgs = decryptedMessages.filter(m => m.sender_id === user.id && !String(m.id).startsWith("optimistic"));
  const lastSeenId = otherLastRead
    ? myMsgs.filter(m => new Date(m.created_at) <= otherLastRead).at(-1)?.id ?? null
    : null;

  const grouped = groupByDay(decryptedMessages, t);
  const nearLimit = input.length > 1800;
  const isEncrypted = !!sharedKey;

  // Presence status line
  let presenceLine = null;
  if (isOtherTyping) presenceLine = null; // shown separately as typing dots
  else if (isOtherOnline) presenceLine = <span className="msg-presence-status msg-presence-status--online">{t("messages.online")}</span>;
  else if (otherLastSeen) presenceLine = <span className="msg-presence-status">Last seen {timeAgo(otherLastSeen, t)}</span>;

  return (
    <div className="msg-thread" style={accentColor ? { "--conv-accent": accentColor } : {}}>
      <div className="msg-thread-header">
        <button className="msg-back-btn" onClick={onBack}>←</button>
        <Avatar
          profile={{ display_name: conv.other_display_name, avatar_url: conv.other_avatar_url }}
          size={36}
          online={isOtherOnline}
        />
        <div className="msg-thread-header-info">
          <span className="msg-thread-name">{conv.other_display_name || t("messages.user")}</span>
          {isOtherTyping ? (
            <span className="msg-presence-status msg-presence-status--typing">{t("messages.typing")}</span>
          ) : presenceLine}
          {isEncrypted
            ? <span className="msg-e2e-badge">{t("messages.endToEndEncrypted")}</span>
            : otherHasKey === false
              ? <span className="msg-e2e-badge msg-e2e-badge--warn">{t("messages.notYetEncrypted")}</span>
              : null
          }
        </div>
        <div className="msg-header-actions">
          <button className="msg-header-icon-btn" title="Search" onClick={() => { setShowSearch(true); setShowStarred(false); setShowSettings(false); }}>🔍</button>
          <button className={`msg-header-icon-btn${showStarred ? " msg-header-icon-btn--active" : ""}`} title="Starred" onClick={() => { setShowStarred(s => !s); setShowSearch(false); setShowSettings(false); }}>⭐</button>
          <button className={`msg-header-icon-btn${showSettings ? " msg-header-icon-btn--active" : ""}`} title="Settings" onClick={() => { setShowSettings(s => !s); setShowSearch(false); setShowStarred(false); }}>⚙</button>
          <button
            className={`msg-sound-btn${soundEnabled ? " msg-sound-btn--on" : ""}`}
            onClick={() => setSoundEnabled(s => !s)}
            title={soundEnabled ? t("messages.muteSounds") : t("messages.enableSounds")}
          >
            {soundEnabled ? "🔔" : "🔕"}
          </button>
        </div>
      </div>

      {showStarred && (
        <MSGStarredPanel convId={conv.conversation_id} userId={user.id} onClose={() => setShowStarred(false)} />
      )}
      {showSearch && (
        <MSGSearchPanel convId={conv.conversation_id} onClose={() => setShowSearch(false)} />
      )}
      {showSettings && (
        <MSGConvSettingsPanel
          convId={conv.conversation_id}
          onClose={() => setShowSettings(false)}
          accentColor={accentColor}
          onAccentChange={setAccentColor}
        />
      )}

      <div className="msg-thread-body" ref={bodyRef} onScroll={handleScroll}>
        {isLoading ? (
          <p className="msg-empty">{t("common.loading")}</p>
        ) : decryptedMessages.length === 0 ? (
          <div className="msg-empty-thread">
            <span>👋</span>
            <strong>{t("messages.startConversation")}</strong>
            <p>{t("messages.sayHelloTo")} {conv.other_display_name || t("messages.user")}!</p>
          </div>
        ) : (
          grouped.map((item) =>
            item.type === "day" ? (
              <div key={item.key} className="msg-day-divider"><span>{item.label}</span></div>
            ) : (
              <MessageBubble
                key={item.id}
                msg={item}
                isMine={item.sender_id === user.id}
                onDelete={(id) => deleteMessage.mutate(id)}
                onReply={(msg) => setReplyTo(msg)}
                onEdit={(id, content) => editMessage.mutate({ messageId: id, content })}
                showSeen={item.id === lastSeenId}
                reactions={reactions}
                userId={user.id}
                onToggleReaction={(messageId, emoji) => toggleReaction.mutate({ messageId, userId: user.id, emoji })}
                onStar={(id) => toggleStar.mutate(id)}
                allMessages={decryptedMessages}
              />
            )
          )
        )}
        {isOtherTyping && <TypingDots />}
        <div ref={bottomRef} />
        {showScrollBtn && (
          <button className="msg-scroll-btn" onClick={scrollToBottom}>
            {newMsgCount > 0 ? <span className="msg-scroll-badge">{newMsgCount}</span> : "↓"}
          </button>
        )}
      </div>

      <form className="msg-composer" onSubmit={handleSend}>
        <ReplyPreview message={replyTo} onCancel={() => setReplyTo(null)} />
        {nearLimit && (
          <div className="msg-char-count">{input.length} / 2000</div>
        )}

        {/* Rich toolbar */}
        <div className="msg-rich-toolbar">
          {uploading ? (
            <div className="msg-upload-status">
              <span className="msg-upload-spinner" />
              <span className="msg-upload-status-text">Uploading image…</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                className={`msg-toolbar-btn${isPrayerMode ? " msg-toolbar-btn--active" : ""}`}
                title="Prayer Request"
                onClick={() => setIsPrayerMode(v => !v)}
              >🙏</button>
              <button type="button" className="msg-toolbar-btn" title="Share Bible Verse" onClick={() => setShowVersePicker(true)}>📖</button>
              <button type="button" className="msg-toolbar-btn msg-toolbar-btn--img" title="Share Image" onClick={() => fileRef.current?.click()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </button>
              <button type="button" className="msg-toolbar-btn" title="Share Reading Plan" onClick={() => setShowPlanPicker(true)}>📅</button>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: "none" }} onChange={handleFileChange} />
        </div>

        {isPrayerMode && (
          <div className="msg-prayer-hint">🙏 Prayer request mode — your message will be highlighted</div>
        )}

        <div className="msg-composer-row">
          <div className="msg-emoji-wrap" ref={emojiRef}>
            <button type="button" className="msg-emoji-btn" onClick={() => setShowEmoji(s => !s)} title="Emoji">
              😊
            </button>
            {showEmoji && (
              <div className="msg-emoji-picker">
                {EMOJIS.map(e => (
                  <button key={e} type="button" className="msg-emoji-option" onClick={() => insertEmoji(e)}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <textarea
            ref={inputRef}
            className={`msg-input${isPrayerMode ? " msg-input--prayer" : ""}`}
            placeholder={isPrayerMode ? "Share your prayer request…" : isEncrypted ? "🔒 Message (encrypted)…" : "Message…"}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_MSG_LENGTH}
            rows={1}
            autoFocus
          />
          <button
            className="msg-send-btn"
            type="submit"
            disabled={!input.trim() || sendMessage.isPending}
            title="Send"
          >
            ➤
          </button>
        </div>
      </form>

      {showVersePicker && <MSGVersePicker onSend={sendVerse} onClose={() => setShowVersePicker(false)} />}
      {showPlanPicker && <MSGPlanPicker onSend={sendPlan} onClose={() => setShowPlanPicker(false)} />}
      {pendingImageFile && (
        <MSGImageWarningModal
          file={pendingImageFile}
          onConfirm={confirmImageUpload}
          onCancel={() => setPendingImageFile(null)}
        />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MessagesPage({ user, navigate, darkMode, setDarkMode, i18n, onLogout, initialConv = null }) {
  const { t } = useTranslation();
  const { data: conversations = [], isLoading } = useConversations();
  const [activeConv, setActiveConv] = useState(initialConv);
  const [convToDelete, setConvToDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [pushDismissed, setPushDismissed] = useState(false);
  const deleteConversation = useDeleteConversation();
  const { keyPair } = useE2EKeys(user.id);
  const { supported: pushSupported, permission, subscribed, loading: pushLoading, subscribe } = usePushNotifications();
  const showPushBanner = pushSupported && permission === "default" && !subscribed && !pushDismissed;

  // Global presence channel for sidebar online dots
  useEffect(() => {
    if (!user.id) return;
    const channel = supabase.channel("global-presence", {
      config: { presence: { key: user.id } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineUsers(new Set(Object.keys(state).filter(k => k !== user.id)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id });
        }
      });
    return () => supabase.removeChannel(channel);
  }, [user.id]);

  function confirmDelete() {
    deleteConversation.mutate(convToDelete, {
      onSuccess: () => {
        if (activeConv?.conversation_id === convToDelete) setActiveConv(null);
        setConvToDelete(null);
      },
    });
  }

  // Upgrade stub conv with full data once list loads
  useEffect(() => {
    if (!activeConv || !conversations.length) return;
    const full = conversations.find(c => c.conversation_id === activeConv.conversation_id);
    if (full) setActiveConv(full);
  }, [conversations]);

  const filtered = search.trim()
    ? conversations.filter(c =>
        (c.other_display_name || "").toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  const showList = !activeConv;

  return (
    <div className="msg-page">
      <div className="msg-layout">
        <aside className={`msg-sidebar${!showList ? " msg-sidebar--hidden-mobile" : ""}`}>
          <div className="msg-sidebar-header">
            <button className="msg-back-page-btn" onClick={() => navigate("home")}>←</button>
            <h2 className="msg-sidebar-title">{t("messages.title")}</h2>
          </div>
          <div className="msg-search-wrap">
            <input
              className="msg-search"
              type="search"
              placeholder="Search conversations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {showPushBanner && (
            <div className="msg-push-banner">
              <span className="msg-push-banner-icon">🔔</span>
              <div className="msg-push-banner-text">
                <strong>{t("messages.stayNotified")}</strong>
                <span>{t("messages.stayNotifiedDesc")}</span>
              </div>
              <button
                className="msg-push-banner-btn msg-push-banner-btn--primary"
                onClick={() => subscribe().then(ok => ok && setPushDismissed(true))}
                disabled={pushLoading}
              >
                {t("messages.enableNotifications")}
              </button>
              <button
                className="msg-push-banner-btn"
                onClick={() => setPushDismissed(true)}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          <div className="msg-conv-list">
            {isLoading ? (
              <p className="msg-empty">{t("common.loading")}</p>
            ) : filtered.length === 0 ? (
              <p className="msg-empty">
                {search ? t("messages.noResults") : t("messages.noConversations")}
              </p>
            ) : (
              filtered.map((conv) => (
                <ConvItem
                  key={conv.conversation_id}
                  conv={conv}
                  active={activeConv?.conversation_id === conv.conversation_id}
                  currentUserId={user.id}
                  onClick={() => setActiveConv(conv)}
                  onDelete={(id) => setConvToDelete(id)}
                  onlineUsers={onlineUsers}
                />
              ))
            )}
          </div>
        </aside>

        <main className={`msg-main${showList ? " msg-main--hidden-mobile" : ""}`}>
          {activeConv ? (
            <ThreadView
              conv={activeConv}
              user={user}
              keyPair={keyPair}
              onBack={() => setActiveConv(null)}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
            />
          ) : (
            <div className="msg-empty-state">
              <span className="msg-empty-icon">💬</span>
              <h3>{t("messages.noConversationSelected")}</h3>
              <p>{t("messages.noConversationSelectedDesc")}</p>
            </div>
          )}
        </main>
      </div>

      {convToDelete && (
        <ConfirmModal
          message={t("messages.deleteConversationConfirm")}
          onConfirm={confirmDelete}
          onCancel={() => setConvToDelete(null)}
        />
      )}
    </div>
  );
}
