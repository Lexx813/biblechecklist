import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { EMOJI_CATEGORIES } from "../../lib/emojiData";
import ConfirmModal from "../ConfirmModal";
import { BOOKS } from "../../data/books";
import { wolChapterUrl } from "../../utils/wol";
import { getTemplate } from "../../data/readingPlanTemplates";
import { useMyPlans } from "../../hooks/useReadingPlans";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useDeleteMessage,
  useMarkRead,
  useUnreadMessageCount,
  useDeleteConversation,
  useReactions,
  useToggleReaction,
  useEditMessage,
  useToggleStar,
  useStarredMessages,
  useSearchMessages,
  useConvSettings,
  useSaveConvSettings,
  useLinkPreviews,
  useUploadImage,
} from "../../hooks/useMessages";
import { useE2EKeys, useSharedKey } from "../../hooks/useE2E";
import { encryptMessage, decryptMessage, sanitizeContent, MAX_MSG_LENGTH } from "../../lib/e2e";
import { supabase } from "../../lib/supabase";
import "../../styles/floating-chat.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso, t) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return t ? t("messages.justNow") : "just now";
  if (m < 60) return `${m}${t ? t("messages.minutesAgo") : "m"}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${t ? t("messages.hoursAgo") : "h"}`;
  return `${Math.floor(h / 24)}${t ? t("messages.daysAgo") : "d"}`;
}

function initial(name) { return (name || "?")[0].toUpperCase(); }

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatDay(date, t) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return t ? t("messages.today") : "Today";
  if (date.toDateString() === yesterday.toDateString()) return t ? t("messages.yesterday") : "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
  reactions.filter(r => r.message_id === messageId).forEach(r => {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, users: [] };
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push(r.user_id);
  });
  return grouped;
}

// ── Message content renderer (formatting: *bold*, _italic_, WOL links) ────────

const URL_RE = /https?:\/\/[^\s<>"]+/g;
const BOLD_RE = /\*([^*]+)\*/g;
const ITALIC_RE = /_([^_]+)_/g;
const WOL_BOOK_RE = /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1\s?Samuel|2\s?Samuel|1\s?Kings|2\s?Kings|1\s?Chronicles|2\s?Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1\s?Corinthians|2\s?Corinthians|Galatians|Ephesians|Philippians|Colossians|1\s?Thessalonians|2\s?Thessalonians|1\s?Timothy|2\s?Timothy|Titus|Philemon|Hebrews|James|1\s?Peter|2\s?Peter|1\s?John|2\s?John|3\s?John|Jude|Revelation)\s+(\d+):(\d+)/gi;

function renderFormattedContent(text) {
  if (!text) return null;
  // Split by URLs first to avoid double-processing
  const parts = [];
  let lastIndex = 0;
  const urls = [...text.matchAll(URL_RE)];
  const usedIndices = new Set();

  for (const m of urls) {
    if (m.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, m.index) });
    }
    parts.push({ type: "url", value: m[0] });
    lastIndex = m.index + m[0].length;
    for (let i = m.index; i < lastIndex; i++) usedIndices.add(i);
  }
  if (lastIndex < text.length) parts.push({ type: "text", value: text.slice(lastIndex) });

  return parts.map((part, i) => {
    if (part.type === "url") {
      return <a key={i} href={part.value} target="_blank" rel="noopener noreferrer" className="fc-msg-link">{part.value}</a>;
    }
    // Apply bold, italic, and Bible ref formatting to text segments
    const segments = [];
    let src = part.value;
    let key = 0;

    // Replace WOL Bible refs
    src = src.replace(WOL_BOOK_RE, (match, book, ch, vs) => {
      const bookIdx = BOOKS.findIndex(b => b.name.toLowerCase() === book.trim().toLowerCase());
      if (bookIdx < 0) return match;
      const url = wolChapterUrl(bookIdx, parseInt(ch));
      return `\x00WOL\x01${url}\x02${match}\x03`;
    });

    const wolParts = src.split(/\x00WOL\x01(.*?)\x02(.*?)\x03/g);
    for (let j = 0; j < wolParts.length; j++) {
      if (j % 3 === 0) {
        // Plain text — apply bold/italic
        const txt = wolParts[j];
        const boldParts = txt.split(BOLD_RE);
        boldParts.forEach((bp, bi) => {
          if (bi % 2 === 1) {
            segments.push(<strong key={`${i}-${j}-${bi}`}>{bp}</strong>);
          } else {
            const italicParts = bp.split(ITALIC_RE);
            italicParts.forEach((ip, ii) => {
              if (ii % 2 === 1) segments.push(<em key={`${i}-${j}-${bi}-${ii}`}>{ip}</em>);
              else if (ip) segments.push(<span key={`${i}-${j}-${bi}-${ii}`}>{ip}</span>);
            });
          }
        });
      } else if (j % 3 === 1) {
        // URL (skip, handled by next part)
      } else if (j % 3 === 2) {
        // Link text
        const wolUrl = wolParts[j - 1];
        segments.push(
          <a key={`${i}-wol-${j}`} href={wolUrl} target="_blank" rel="noopener noreferrer" className="fc-msg-link fc-wol-link">
            {wolParts[j]}
          </a>
        );
      }
    }
    return <span key={i}>{segments}</span>;
  });
}

const REACTION_EMOJIS = ["👍","❤️","😂","😮","😢","🔥","🙏","👏"];

const THEME_COLORS = [
  { label: "Teal", value: null },
  { label: "Purple", value: "#7c3aed" },
  { label: "Blue", value: "#2563eb" },
  { label: "Rose", value: "#e11d48" },
  { label: "Amber", value: "#d97706" },
  { label: "Emerald", value: "#059669" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Pink", value: "#db2777" },
];

const DISAPPEAR_OPTIONS = [
  { label: "Off", value: null },
  { label: "24 hours", value: 1 },
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
];

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl, size = 32, online = false }) {
  return (
    <div className="fc-avatar-wrap" style={{ width: size, height: size }}>
      {avatarUrl ? (
        <img className="fc-avatar" src={avatarUrl} alt={name} width={size} height={size} style={{ width: size, height: size }} loading="lazy" />
      ) : (
        <div className="fc-avatar fc-avatar--fallback" style={{ width: size, height: size, fontSize: size * 0.38 }}>
          {initial(name)}
        </div>
      )}
      {online && <span className="fc-online-dot" />}
    </div>
  );
}

// ── Emoji picker ───────────────────────────────────────────────────────────────

function EmojiPicker({ onSelect, onClose }) {
  const [tab, setTab] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return (
    <div className="fc-emoji-picker" ref={ref}>
      <div className="fc-emoji-tabs">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button key={i} className={`fc-emoji-tab${tab === i ? " fc-emoji-tab--active" : ""}`} onClick={() => setTab(i)}>{cat.label}</button>
        ))}
      </div>
      <div className="fc-emoji-grid">
        {EMOJI_CATEGORIES[tab].emojis.map(em => (
          <button key={em} className="fc-emoji-btn" onClick={() => onSelect(em)}>{em}</button>
        ))}
      </div>
    </div>
  );
}

// ── Reaction picker ────────────────────────────────────────────────────────────

function FCReactionPicker({ onPick, onClose, anchorEl }) {
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Position fixed above the anchor button, centered on it
  const style = {};
  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const pickerW = 280; // approx width of 8 emojis
    let left = rect.left + rect.width / 2 - pickerW / 2 - 10;
    // clamp to viewport
    left = Math.max(8, Math.min(left, window.innerWidth - pickerW - 8));
    style.left = left;
    style.top = rect.top - 48;
  }

  return (
    <div className="fc-reaction-picker" ref={ref} style={style}>
      {REACTION_EMOJIS.map(em => (
        <button key={em} className="fc-reaction-picker-btn" onClick={() => { onPick(em); onClose(); }}>{em}</button>
      ))}
    </div>
  );
}

// ── Image upload warning modal ─────────────────────────────────────────────────

function FCImageWarningModal({ file, onConfirm, onCancel }) {
  const previewUrl = file ? URL.createObjectURL(file) : null;
  return (
    <div className="fc-modal-overlay fc-img-warn-overlay" onClick={onCancel}>
      <div className="fc-modal fc-img-warn-modal" onClick={e => e.stopPropagation()}>
        <div className="fc-img-warn-icon">⚠️</div>
        <h3 className="fc-img-warn-title">Before you share</h3>
        <p className="fc-img-warn-body">
          Please ensure this image is appropriate for a Bible study community.
          <strong> Sharing explicit, offensive, or inappropriate content is strictly prohibited</strong> and
          may result in account suspension.
        </p>
        {previewUrl && (
          <img src={previewUrl} alt="Preview" className="fc-img-warn-preview" onLoad={() => URL.revokeObjectURL(previewUrl)} />
        )}
        <p className="fc-img-warn-agree">
          By continuing, you confirm this image is wholesome and appropriate.
        </p>
        <div className="fc-img-warn-actions">
          <button type="button" className="fc-modal-btn fc-img-warn-cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="fc-modal-btn fc-modal-btn--primary" onClick={onConfirm}>Send Image</button>
        </div>
      </div>
    </div>
  );
}

// ── Verse picker ───────────────────────────────────────────────────────────────

function VersePicker({ onSend, onClose }) {
  const [bookIdx, setBookIdx] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState(1);
  const [note, setNote] = useState("");
  const book = BOOKS[bookIdx];
  return (
    <div className="fc-modal-overlay" onClick={onClose}>
      <div className="fc-modal" onClick={e => e.stopPropagation()}>
        <div className="fc-modal-header">
          <span>📖 Share a Bible Verse</span>
          <button className="fc-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="fc-modal-body">
          <label className="fc-modal-label">Book</label>
          <select className="fc-modal-select" value={bookIdx} onChange={e => { setBookIdx(+e.target.value); setChapter(1); setVerse(1); }}>
            {BOOKS.map((b, i) => <option key={i} value={i}>{b.name}</option>)}
          </select>
          <div className="fc-modal-row">
            <div className="fc-modal-field">
              <label className="fc-modal-label">Chapter</label>
              <select className="fc-modal-select" value={chapter} onChange={e => { setChapter(+e.target.value); setVerse(1); }}>
                {Array.from({ length: book.chapters }, (_, i) => i + 1).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="fc-modal-field">
              <label className="fc-modal-label">Verse</label>
              <input className="fc-modal-input" type="number" min={1} max={200} value={verse} onChange={e => setVerse(+e.target.value)} />
            </div>
          </div>
          <label className="fc-modal-label">Note (optional)</label>
          <input className="fc-modal-input" placeholder="Add a note…" value={note} onChange={e => setNote(e.target.value)} maxLength={200} />
        </div>
        <div className="fc-modal-footer">
          <button className="fc-modal-btn fc-modal-btn--primary" onClick={() => {
            onSend({
              bookIdx,
              bookName: book.name,
              chapter,
              verse,
              note,
              ref: `${book.name} ${chapter}:${verse}`,
              url: wolChapterUrl(bookIdx, chapter),
            });
            onClose();
          }}>
            Share Verse
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reading plan picker ────────────────────────────────────────────────────────

function PlanPicker({ onSend, onClose }) {
  const { data: plans = [] } = useMyPlans();
  return (
    <div className="fc-modal-overlay" onClick={onClose}>
      <div className="fc-modal" onClick={e => e.stopPropagation()}>
        <div className="fc-modal-header">
          <span>📅 Share a Reading Plan</span>
          <button className="fc-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="fc-modal-body">
          {plans.length === 0 ? (
            <p className="fc-modal-empty">You have no active reading plans.</p>
          ) : (
            plans.map(plan => (
              <button key={plan.id} className="fc-plan-pick-item" onClick={() => {
                const friendlyName = getTemplate(plan.template_key)?.name || plan.title || plan.template_key;
                onSend({ planId: plan.id, templateKey: plan.template_key, title: friendlyName });
                onClose();
              }}>
                <span className="fc-plan-pick-title">{plan.title || plan.template_key}</span>
                <span className="fc-plan-pick-arrow">→</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Conversation settings panel ────────────────────────────────────────────────

function ConvSettingsPanel({ convId, onClose, accentColor, onAccentChange }) {
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
    <div className="fc-settings-panel">
      <div className="fc-settings-header">
        <span>⚙ Chat Settings</span>
        <button className="fc-modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="fc-settings-body">
        <div className="fc-settings-section">
          <span className="fc-settings-label">🎨 Theme Color</span>
          <div className="fc-theme-swatches">
            {THEME_COLORS.map(tc => (
              <button
                key={tc.label}
                className={`fc-swatch${theme === tc.value ? " fc-swatch--active" : ""}`}
                style={{ background: tc.value ?? "linear-gradient(135deg, var(--teal), #5b21b6)" }}
                title={tc.label}
                onClick={() => setTheme(tc.value)}
              />
            ))}
          </div>
        </div>
        <div className="fc-settings-section">
          <span className="fc-settings-label">⏱ Disappearing Messages</span>
          <div className="fc-disappear-opts">
            {DISAPPEAR_OPTIONS.map(opt => (
              <button
                key={opt.label}
                className={`fc-disappear-btn${disappear === opt.value ? " fc-disappear-btn--active" : ""}`}
                onClick={() => setDisappear(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <button className="fc-settings-save" onClick={save} disabled={saveSettings.isPending}>
          {saveSettings.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Starred messages panel ─────────────────────────────────────────────────────

function StarredPanel({ convId, userId, onClose }) {
  const { data: starred = [], isLoading } = useStarredMessages(convId);
  const toggleStar = useToggleStar(convId);
  return (
    <div className="fc-overlay-panel">
      <div className="fc-overlay-header">
        <button className="fc-back-btn" onClick={onClose}>←</button>
        <span>⭐ Starred Messages</span>
      </div>
      <div className="fc-overlay-body">
        {isLoading ? <p className="fc-empty">Loading…</p> : starred.length === 0 ? (
          <p className="fc-empty">No starred messages yet.</p>
        ) : (
          starred.map(msg => (
            <div key={msg.id} className="fc-starred-item">
              <div className="fc-starred-content">
                {msg.message_type === "verse" && msg.metadata ? (
                  <span>📖 {msg.metadata.ref}</span>
                ) : msg.message_type === "image" ? (
                  <span>🖼 Image</span>
                ) : (
                  <span>{msg.content?.slice(0, 80)}</span>
                )}
              </div>
              <div className="fc-starred-meta">
                <span>{formatTime(msg.created_at)}</span>
                <button className="fc-action-btn" onClick={() => toggleStar.mutate(msg.id)}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Search panel ───────────────────────────────────────────────────────────────

function SearchPanel({ convId, onClose }) {
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
    <div className="fc-overlay-panel">
      <div className="fc-overlay-header">
        <button className="fc-back-btn" onClick={onClose}>←</button>
        <input className="fc-search-input" placeholder="Search messages…" value={query} onChange={handleChange} autoFocus />
      </div>
      <div className="fc-overlay-body">
        {isFetching ? <p className="fc-empty">Searching…</p> : debouncedQuery.length < 2 ? (
          <p className="fc-empty">Type to search.</p>
        ) : results.length === 0 ? (
          <p className="fc-empty">No results for "{debouncedQuery}".</p>
        ) : (
          results.map(msg => (
            <div key={msg.id} className="fc-search-result">
              <span className="fc-search-result-text">{msg.content?.slice(0, 120)}</span>
              <span className="fc-search-result-time">{formatTime(msg.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Push notification prompt ───────────────────────────────────────────────────

function PushPrompt({ onDismiss }) {
  const { supported, permission, subscribe } = usePushNotifications();
  if (!supported || permission !== "default") return null;
  return (
    <div className="fc-push-prompt">
      <span>🔔 Get notified of new messages</span>
      <button className="fc-push-btn" onClick={async () => { await subscribe(); onDismiss(); }}>Enable</button>
      <button className="fc-push-dismiss" onClick={onDismiss}>✕</button>
    </div>
  );
}

// ── Rich message cards ─────────────────────────────────────────────────────────

function FCVerseCard({ metadata, isMine }) {
  if (!metadata) return null;
  return (
    <div className={`fc-verse-card${isMine ? " fc-verse-card--mine" : ""}`}>
      <div className="fc-verse-card-ref">📖 {metadata.ref}</div>
      {metadata.note && <div className="fc-verse-card-note">{metadata.note}</div>}
      <a href={metadata.url} target="_blank" rel="noopener noreferrer" className="fc-verse-card-link">
        Read on WOL ↗
      </a>
    </div>
  );
}

function FCImageCard({ content, metadata }) {
  const url = metadata?.url || content;
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="fc-image-card">
      <img
        src={url}
        alt={metadata?.filename || "Image"}
        className={`fc-image-thumb${loaded ? " fc-image-thumb--loaded" : ""}`}
        onLoad={() => setLoaded(true)}
        onClick={() => window.open(url, "_blank")}
      />
    </div>
  );
}

function FCPlanCard({ metadata, isMine }) {
  if (!metadata) return null;
  const friendlyTitle = getTemplate(metadata.templateKey)?.name || metadata.title || metadata.templateKey;
  return (
    <div className={`fc-plan-card${isMine ? " fc-plan-card--mine" : ""}`}>
      <div className="fc-plan-card-icon">📅</div>
      <div className="fc-plan-card-body">
        <div className="fc-plan-card-title">{friendlyTitle}</div>
        <div className="fc-plan-card-sub">Reading Plan Invitation</div>
      </div>
    </div>
  );
}

function FCPrayerCard({ content, isMine }) {
  return (
    <div className={`fc-prayer-card${isMine ? " fc-prayer-card--mine" : ""}`}>
      <div className="fc-prayer-card-tag">🙏 Prayer Request</div>
      <div className="fc-prayer-card-text">{content}</div>
    </div>
  );
}

function FCLinkPreviewCard({ preview }) {
  if (!preview || (!preview.og_title && !preview.og_description)) return null;
  return (
    <a href={preview.url} target="_blank" rel="noopener noreferrer" className="fc-link-preview">
      {preview.og_image && (
        <img src={preview.og_image} alt="" className="fc-link-preview-img" onError={e => e.currentTarget.style.display = "none"} />
      )}
      <div className="fc-link-preview-body">
        {preview.og_title && <div className="fc-link-preview-title">{preview.og_title}</div>}
        {preview.og_description && <div className="fc-link-preview-desc">{preview.og_description.slice(0, 120)}</div>}
        <div className="fc-link-preview-domain">{new URL(preview.url).hostname}</div>
      </div>
    </a>
  );
}

// ── FC Message bubble ──────────────────────────────────────────────────────────

function FCBubble({ msg, isMine, allMessages, reactions, userId, linkPreviews, onDelete, onReply, onEdit, onToggleReaction, onStar, isLast, accentColor }) {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [showReactPicker, setShowReactPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content);
  const editRef = useRef(null);
  const reactBtnRef = useRef(null);
  const menuRef = useRef(null);
  const isStarred = Array.isArray(msg.starred_by) && msg.starred_by.includes(userId);
  const preview = linkPreviews?.find(p => p.message_id === msg.id);

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [editing]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowReactPicker(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  function submitEdit() {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === msg.content) { setEditing(false); return; }
    onEdit(msg.id, sanitizeContent(trimmed));
    setEditing(false);
  }

  function closeMenu() { setShowMenu(false); setShowReactPicker(false); }

  const replyOrig = msg.reply_to_id ? allMessages.find(m => m.id === msg.reply_to_id) : null;
  const grouped = groupReactions(reactions, msg.id);
  const accentStyle = accentColor ? { "--conv-accent": accentColor } : {};

  const isPrayer = msg.message_type === "prayer_request";
  const isVerse = msg.message_type === "verse";
  const isImage = msg.message_type === "image";
  const isPlan = msg.message_type === "reading_plan";

  return (
    <div
      className={`fc-bubble-wrap${isMine ? " fc-bubble-wrap--mine" : ""}`}
      style={accentStyle}
    >
      {!isMine && <Avatar name={msg.sender?.display_name} avatarUrl={msg.sender?.avatar_url} size={22} />}

      <div style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", gap: 2, minWidth: 0, maxWidth: "100%" }}>
        {replyOrig && (
          <div className="fc-quoted">
            <div className="fc-quoted-bar" />
            <div className="fc-quoted-body">
              <span className="fc-quoted-name">{replyOrig.sender?.display_name || t("messages.user")}</span>
              <span className="fc-quoted-text">{(replyOrig.content?.startsWith("enc:") ? t("messages.encryptedShort") : replyOrig.content || "").slice(0, 50)}</span>
            </div>
          </div>
        )}

        {/* Dots menu — rendered once, positioned inside whichever card is shown */}
        <div className="fc-bubble-content" ref={menuRef}>
          <button
            className="fc-dots-btn"
            onClick={() => setShowMenu(s => !s)}
            title="Options"
          >⋮</button>

          {showMenu && !editing && (
            <div className="fc-action-menu">
              <button ref={reactBtnRef} className="fc-action-menu-item" onClick={() => setShowReactPicker(s => !s)}>
                <span>😊</span> React
              </button>
              <button className="fc-action-menu-item" onClick={() => { onReply(msg); closeMenu(); }}>
                <span>↩</span> Reply
              </button>
              <button className="fc-action-menu-item" onClick={() => { onStar(msg.id); closeMenu(); }}>
                <span>{isStarred ? "✩" : "⭐"}</span> {isStarred ? "Unstar" : "Star"}
              </button>
              {isMine && !isPrayer && !isVerse && !isImage && !isPlan && (
                <button className="fc-action-menu-item" onClick={() => { setEditing(true); setEditText(msg.content); closeMenu(); }}>
                  <span>✎</span> Edit
                </button>
              )}
              {isMine && (
                <button className="fc-action-menu-item fc-action-menu-item--danger" onClick={() => { onDelete(msg.id); closeMenu(); }}>
                  <span>✕</span> Delete
                </button>
              )}
              {showReactPicker && (
                <FCReactionPicker onPick={(em) => { onToggleReaction(msg.id, em); closeMenu(); }} onClose={closeMenu} anchorEl={reactBtnRef.current} />
              )}
            </div>
          )}

          {isPrayer ? (
            <FCPrayerCard content={msg.content} isMine={isMine} />
          ) : isVerse ? (
            <FCVerseCard metadata={msg.metadata} isMine={isMine} />
          ) : isImage ? (
            <FCImageCard content={msg.content} metadata={msg.metadata} />
          ) : isPlan ? (
            <FCPlanCard metadata={msg.metadata} isMine={isMine} />
          ) : (
            <div className={`fc-bubble${isMine ? " fc-bubble--mine" : ""}${isStarred ? " fc-bubble--starred" : ""}`} title={formatTime(msg.created_at)}>
              {editing ? (
                <textarea
                  ref={editRef}
                  className="fc-edit-textarea"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(); }
                    if (e.key === "Escape") { setEditing(false); setEditText(msg.content); }
                  }}
                  rows={1}
                />
              ) : (
                <span>{renderFormattedContent(msg.content)}</span>
              )}
              <div className="fc-bubble-footer">
                {isStarred && <span className="fc-star-indicator">⭐</span>}
                <span className="fc-bubble-time">{formatTime(msg.created_at)}</span>
                {msg.edited_at && <span className="fc-edited-label">{t("messages.edited")}</span>}
                {isMine && <span className="fc-status-ticks">{isLast ? t("messages.read") : t("messages.sent")}</span>}
              </div>
            </div>
          )}
        </div>

        {preview && !isImage && !isVerse && !isPlan && !isPrayer && (
          <FCLinkPreviewCard preview={preview} />
        )}

        {Object.keys(grouped).length > 0 && (
          <div className="fc-reaction-row">
            {Object.entries(grouped).map(([em, { count, users }]) => (
              <button
                key={em}
                className={`fc-reaction-pill${users.includes(userId) ? " fc-reaction-pill--mine" : ""}`}
                onClick={() => onToggleReaction(msg.id, em)}
              >
                {em} <span>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mini thread ────────────────────────────────────────────────────────────────

function MiniThread({ conv, user, keyPair, onBack, accentColor, onAccentChange }) {
  const { t } = useTranslation();
  const { data: messages = [], isLoading } = useMessages(conv.conversation_id);
  const sendMessage = useSendMessage(conv.conversation_id);
  const deleteMessage = useDeleteMessage(conv.conversation_id);
  const editMessage = useEditMessage(conv.conversation_id);
  const markRead = useMarkRead(conv.conversation_id, user.id);
  const { data: reactions = [] } = useReactions(conv.conversation_id);
  const toggleReaction = useToggleReaction(conv.conversation_id);
  const toggleStar = useToggleStar(conv.conversation_id);
  const { data: linkPreviews = [] } = useLinkPreviews(conv.conversation_id);
  const { uploading, uploadAndSend } = useUploadImage(conv.conversation_id);
  const { sharedKey } = useSharedKey(keyPair, conv.other_user_id);

  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [decryptedMessages, setDecryptedMessages] = useState([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [showVersePicker, setShowVersePicker] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStarred, setShowStarred] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(true);
  const [isPrayerMode, setIsPrayerMode] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const presenceChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const insertEmoji = useCallback((em) => {
    const el = inputRef.current;
    if (!el) { setInput(v => v + em); setShowEmoji(false); return; }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const next = input.slice(0, start) + em + input.slice(end);
    setInput(next);
    setShowEmoji(false);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + em.length, start + em.length); });
  }, [input]);

  useEffect(() => { markRead.mutate(); }, [conv.conversation_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [decryptedMessages.length]);

  useEffect(() => {
    if (!messages.length) { setDecryptedMessages([]); return; }
    let cancelled = false;
    async function decrypt() {
      const results = await Promise.all(
        messages.map(async (msg) => ({
          ...msg,
          content: (msg.message_type === "text" || msg.message_type === "prayer_request") && sharedKey
            ? await decryptMessage(msg.content, sharedKey)
            : msg.content?.startsWith("enc:") ? "[🔒 Encrypted message]" : msg.content,
        }))
      );
      if (!cancelled) setDecryptedMessages(results);
    }
    decrypt();
    return () => { cancelled = true; };
  }, [messages, sharedKey]);

  // Presence
  useEffect(() => {
    if (!conv.conversation_id || !user.id) return;
    const channel = supabase.channel(`fc-presence:${conv.conversation_id}`, {
      config: { presence: { key: user.id } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const others = Object.entries(state).filter(([key]) => key !== user.id).flatMap(([, p]) => p);
        const other = others.find(p => p.user_id === conv.other_user_id);
        setIsOtherOnline(!!other);
        setIsOtherTyping(!!other?.typing);
      })
      .on("presence", { event: "join" }, ({ key }) => { if (key === conv.other_user_id) setIsOtherOnline(true); })
      .on("presence", { event: "leave" }, ({ key }) => { if (key === conv.other_user_id) { setIsOtherOnline(false); setIsOtherTyping(false); } })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ user_id: user.id, typing: false });
      });
    presenceChannelRef.current = channel;
    return () => { supabase.removeChannel(channel); presenceChannelRef.current = null; };
  }, [conv.conversation_id, user.id, conv.other_user_id]);

  function broadcastTyping(typing) { presenceChannelRef.current?.track({ user_id: user.id, typing }); }

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
      recipientId: conv.other_user_id,
      content: toSend,
      replyToId: replyTo?.id ?? null,
      messageType: isPrayerMode ? "prayer_request" : "text",
    });
    setInput("");
    setReplyTo(null);
    setIsPrayerMode(false);
    broadcastTyping(false);
    clearTimeout(typingTimeoutRef.current);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
    if (e.key === "Escape" && replyTo) setReplyTo(null);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImageFile(file);
    e.target.value = "";
  }

  // Paste image
  function handlePaste(e) {
    const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith("image/"));
    if (!item) return;
    const file = item.getAsFile();
    if (file) setPendingImageFile(file);
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
      recipientId: conv.other_user_id,
      content: verseData.ref,
      replyToId: replyTo?.id ?? null,
      messageType: "verse",
      metadata: verseData,
    });
    setReplyTo(null);
  }

  function sendPlan(planData) {
    sendMessage.mutate({
      senderId: user.id,
      recipientId: conv.other_user_id,
      content: planData.title,
      replyToId: null,
      messageType: "reading_plan",
      metadata: planData,
    });
  }

  const items = groupByDay(decryptedMessages, t);
  const myLastMsgIdx = decryptedMessages.reduce((acc, m, i) => m.sender_id === user.id ? i : acc, -1);
  const accentStyle = accentColor ? { "--conv-accent": accentColor } : {};

  if (showStarred) return <StarredPanel convId={conv.conversation_id} userId={user.id} onClose={() => setShowStarred(false)} />;
  if (showSearch) return <SearchPanel convId={conv.conversation_id} onClose={() => setShowSearch(false)} />;

  return (
    <div className="fc-thread" style={accentStyle}>
      <div className="fc-thread-header">
        <button className="fc-back-btn" onClick={onBack}>←</button>
        <Avatar name={conv.other_display_name} avatarUrl={conv.other_avatar_url} size={28} online={isOtherOnline} />
        <div className="fc-thread-header-info">
          <span className="fc-thread-name">{conv.other_display_name || t("messages.user")}</span>
          {isOtherTyping
            ? <span className="fc-typing-label">{t("messages.typing")}</span>
            : isOtherOnline && <span className="fc-typing-label" style={{ fontStyle: "normal" }}>{t("messages.onlineDot")}</span>
          }
        </div>
        <div className="fc-thread-header-actions">
          <button className="fc-header-icon-btn" title="Search" onClick={() => setShowSearch(true)}>🔍</button>
          <button className={`fc-header-icon-btn${showStarred ? " fc-header-icon-btn--active" : ""}`} title="Starred" onClick={() => setShowStarred(true)}>⭐</button>
          <button className={`fc-header-icon-btn${showSettings ? " fc-header-icon-btn--active" : ""}`} title="Settings" onClick={() => setShowSettings(s => !s)}>⚙</button>
        </div>
      </div>

      {showSettings && (
        <ConvSettingsPanel
          convId={conv.conversation_id}
          onClose={() => setShowSettings(false)}
          accentColor={accentColor}
          onAccentChange={onAccentChange}
        />
      )}

      <div className="fc-messages" onPaste={handlePaste}>
        {isLoading ? (
          <p className="fc-empty">{t("common.loading")}</p>
        ) : decryptedMessages.length === 0 ? (
          <p className="fc-empty">{t("messages.sayHello")} 👋</p>
        ) : (
          items.map((item, idx) => {
            if (item.type === "day") return <div key={item.key} className="fc-day-divider"><span>{item.label}</span></div>;
            const isMine = item.sender_id === user.id;
            const origIdx = decryptedMessages.findIndex(m => m.id === item.id);
            return (
              <FCBubble
                key={item.id}
                msg={item}
                isMine={isMine}
                allMessages={decryptedMessages}
                reactions={reactions}
                userId={user.id}
                linkPreviews={linkPreviews}
                accentColor={accentColor}
                onDelete={(id) => deleteMessage.mutate(id)}
                onReply={(msg) => { setReplyTo(msg); inputRef.current?.focus(); }}
                onEdit={(id, content) => editMessage.mutate({ messageId: id, content })}
                onToggleReaction={(id, emoji) => toggleReaction.mutate({ messageId: id, emoji, userId: user.id })}
                onStar={(id) => toggleStar.mutate(id)}
                isLast={origIdx === myLastMsgIdx}
              />
            );
          })
        )}
        {isOtherTyping && (
          <div className="fc-bubble-wrap">
            <div className="fc-typing-bubble">
              <span className="fc-dot" /><span className="fc-dot" /><span className="fc-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="fc-composer-wrap">
        {showPushPrompt && <PushPrompt onDismiss={() => setShowPushPrompt(false)} />}
        {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
        {replyTo && (
          <div className="fc-reply-preview">
            <div className="fc-reply-preview-bar" />
            <div className="fc-reply-preview-content">
              <span className="fc-reply-preview-name">{replyTo.sender?.display_name || t("messages.user")}</span>
              <span className="fc-reply-preview-text">
                {(replyTo.content?.startsWith("enc:") ? t("messages.encryptedShort") : replyTo.content || "").slice(0, 60)}
              </span>
            </div>
            <button className="fc-reply-preview-cancel" onClick={() => setReplyTo(null)}>✕</button>
          </div>
        )}

        {/* Rich message toolbar */}
        <div className="fc-rich-toolbar">
          {uploading ? (
            <div className="fc-upload-status">
              <span className="fc-upload-status-spinner" />
              <span className="fc-upload-status-text">Uploading image…</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                className={`fc-toolbar-btn${isPrayerMode ? " fc-toolbar-btn--active" : ""}`}
                title="Prayer Request"
                onClick={() => setIsPrayerMode(v => !v)}
              >🙏</button>
              <button type="button" className="fc-toolbar-btn" title="Share Bible Verse" onClick={() => setShowVersePicker(true)}>📖</button>
              <button type="button" className="fc-toolbar-btn fc-toolbar-btn--img" title="Share Image" onClick={() => fileRef.current?.click()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </button>
              <button type="button" className="fc-toolbar-btn" title="Share Reading Plan" onClick={() => setShowPlanPicker(true)}>📅</button>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
        </div>

        <form className="fc-composer" onSubmit={handleSend}>
          <button type="button" className="fc-emoji-toggle" onClick={() => setShowEmoji(v => !v)} title="Emoji">😊</button>
          <input
            ref={inputRef}
            className={`fc-input${isPrayerMode ? " fc-input--prayer" : ""}`}
            placeholder={isPrayerMode ? "Share your prayer request…" : "Message…"}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_MSG_LENGTH}
            autoFocus
          />
          {uploading ? (
            <span className="fc-upload-spinner">⏳</span>
          ) : (
            <button className="fc-send-btn" type="submit" disabled={!input.trim() || sendMessage.isPending}>➤</button>
          )}
        </form>

        {isPrayerMode && (
          <div className="fc-prayer-hint">🙏 Prayer request mode — your message will be highlighted for the recipient</div>
        )}
      </div>

      {showVersePicker && <VersePicker onSend={sendVerse} onClose={() => setShowVersePicker(false)} />}
      {showPlanPicker && <PlanPicker onSend={sendPlan} onClose={() => setShowPlanPicker(false)} />}
      {pendingImageFile && (
        <FCImageWarningModal
          file={pendingImageFile}
          onConfirm={confirmImageUpload}
          onCancel={() => setPendingImageFile(null)}
        />
      )}
    </div>
  );
}

// ── Conversation list ──────────────────────────────────────────────────────────

function ConvList({ conversations, currentUserId, onSelect, onDelete, onlineUsers }) {
  const { t } = useTranslation();
  return (
    <div className="fc-conv-list">
      {conversations.length === 0 ? (
        <p className="fc-empty">{t("messages.noConversationsShort")}</p>
      ) : (
        conversations.map(conv => {
          const isUnread = conv.unread_count > 0;
          const isOnline = onlineUsers.has(conv.other_user_id);
          const isMine = conv.last_message_sender_id === currentUserId;
          const isSpecial = conv.last_message_type && conv.last_message_type !== "text";
          const preview = isSpecial
            ? conv.last_message_type === "verse" ? "📖 Bible verse"
            : conv.last_message_type === "image" ? "🖼 Image"
            : conv.last_message_type === "prayer_request" ? "🙏 Prayer request"
            : conv.last_message_type === "reading_plan" ? "📅 Reading plan"
            : conv.last_message_content
            : conv.last_message_content?.startsWith("enc:")
              ? t("messages.encrypted")
              : conv.last_message_content;
          return (
            <div key={conv.conversation_id} className="fc-conv-item" onClick={() => onSelect(conv)}>
              <Avatar name={conv.other_display_name} avatarUrl={conv.other_avatar_url} size={36} online={isOnline} />
              <div className="fc-conv-info">
                <div className="fc-conv-header">
                  <span className={`fc-conv-name${isUnread ? " fc-conv-name--unread" : ""}`}>
                    {conv.other_display_name || t("messages.user")}
                  </span>
                  {conv.last_message_at && <span className="fc-conv-time">{timeAgo(conv.last_message_at, t)}</span>}
                </div>
                <span className="fc-conv-preview">
                  {preview ? `${isMine && !isSpecial ? `${t("messages.you")}: ` : ""}${preview}` : t("messages.noMessagesYet")}
                </span>
              </div>
              <div className="fc-conv-actions">
                {isUnread && <span className="fc-unread-dot">{conv.unread_count}</span>}
                <button className="fc-conv-delete-btn" onClick={e => { e.stopPropagation(); onDelete(conv.conversation_id); }} title="Delete conversation">🗑</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Main floating chat ─────────────────────────────────────────────────────────

export default function FloatingChat({ user, navigate, initialConvId = null, initialConvName = null, initialConvAvatar = null }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(!!initialConvId);
  const [activeConv, setActiveConv] = useState(
    initialConvId
      ? { conversation_id: initialConvId, other_display_name: initialConvName, other_avatar_url: initialConvAvatar, other_user_id: null }
      : null
  );
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [convToDelete, setConvToDelete] = useState(null);
  const [accentColor, setAccentColor] = useState(null);
  const { data: conversations = [], isLoading } = useConversations();
  const { data: unreadCount = 0 } = useUnreadMessageCount();
  const deleteConversation = useDeleteConversation();
  const { keyPair } = useE2EKeys(user.id);
  const panelRef = useRef(null);

  // Load accent color from settings when active conversation changes
  const { data: convSettings } = useConvSettings(activeConv?.conversation_id);
  useEffect(() => {
    if (convSettings?.theme_accent !== undefined) {
      setAccentColor(convSettings.theme_accent);
    }
  }, [convSettings]);

  // Global presence
  useEffect(() => {
    if (!user.id) return;
    const channel = supabase.channel("fc-global-presence", { config: { presence: { key: user.id } } });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineUsers(new Set(Object.keys(state).filter(k => k !== user.id)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ user_id: user.id });
      });
    return () => supabase.removeChannel(channel);
  }, [user.id]);

  // Upgrade activeConv stub with full data when conversations load
  useEffect(() => {
    if (!activeConv || !conversations.length) return;
    const full = conversations.find(c => c.conversation_id === activeConv.conversation_id);
    if (full) setActiveConv(full);
  }, [conversations]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function confirmDelete() {
    deleteConversation.mutate(convToDelete, {
      onSuccess: () => {
        if (activeConv?.conversation_id === convToDelete) setActiveConv(null);
        setConvToDelete(null);
      },
    });
  }

  function openFullMessages() {
    setOpen(false);
    navigate("messages", activeConv ? {
      conversationId: activeConv.conversation_id,
      otherDisplayName: activeConv.other_display_name,
      otherAvatarUrl: activeConv.other_avatar_url,
    } : {});
  }

  // Lock scroll when panel is open
  useEffect(() => {
    const el = document.documentElement;
    if (open) el.style.overflow = "hidden";
    else el.style.overflow = "";
    return () => { el.style.overflow = ""; };
  }, [open]);

  const panelAccentStyle = accentColor && activeConv
    ? { "--conv-accent": accentColor }
    : {};

  return (
    <>
      {open && <div className="fc-backdrop" onClick={() => setOpen(false)} />}

      <div className="fc-root" ref={panelRef}>
        {open && (
          <div className="fc-panel" style={panelAccentStyle}>
            <div className="fc-panel-header" style={accentColor && activeConv ? { background: `linear-gradient(135deg, ${accentColor}, #1e1035)` } : {}}>
              <span className="fc-panel-title">
                {activeConv ? (activeConv.other_display_name || t("messages.chat")) : t("messages.title")}
              </span>
              <div className="fc-panel-header-actions">
                <button className="fc-header-btn fc-fullview-btn" onClick={openFullMessages} title={t("messages.openFullView")}>⤢</button>
                <button className="fc-header-btn" onClick={() => setOpen(false)} title={t("messages.close")}>✕</button>
              </div>
            </div>

            {activeConv ? (
              <MiniThread
                conv={activeConv}
                user={user}
                keyPair={keyPair}
                onBack={() => setActiveConv(null)}
                accentColor={accentColor}
                onAccentChange={setAccentColor}
              />
            ) : (
              isLoading ? (
                <p className="fc-empty" style={{ padding: "24px" }}>{t("common.loading")}</p>
              ) : (
                <ConvList
                  conversations={conversations}
                  currentUserId={user.id}
                  onSelect={setActiveConv}
                  onDelete={setConvToDelete}
                  onlineUsers={onlineUsers}
                />
              )
            )}
          </div>
        )}

        {!open && (
          <button className="fc-fab" onClick={() => setOpen(true)} title="Messages">
            💬
            {unreadCount > 0 && <span className="fc-fab-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>
        )}
      </div>

      {convToDelete && (
        <ConfirmModal
          message="Delete this conversation? This cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setConvToDelete(null)}
          confirmLabel="Delete"
          danger
        />
      )}
    </>
  );
}
