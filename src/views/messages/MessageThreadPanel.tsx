import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import {
  useMessages, useSendMessage, useDeleteMessage, useMarkRead,
  useReactions, useToggleReaction, useEditMessage, useUploadImage,
  useToggleStar, useStarredMessages, useSearchMessages, useConvSettings, useSaveConvSettings,
} from "../../hooks/useMessages";
import { useMarkMessageNotificationsRead } from "../../hooks/useNotifications";
import { useSharedKey } from "../../hooks/useE2E";
import { encryptMessage, decryptMessage, sanitizeContent, MAX_MSG_LENGTH } from "../../lib/e2e";
import { supabase } from "../../lib/supabase";
import { BOOKS } from "../../data/books";
import { wolChapterUrl } from "../../utils/wol";
import { toast } from "../../lib/toast";
import { getTemplate } from "../../data/readingPlanTemplates";
import { useMyPlans } from "../../hooks/useReadingPlans";
import type { Conversation } from "./ConversationListPanel";

// ── Types ─────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface ThreadViewProps {
  conv: Conversation;
  user: User;
  keyPair: null;
  onBack: () => void;
  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  navigate: (page: string, params?: Record<string, unknown>) => void;
}

// ── Audio ─────────────────────────────────────────────────────────────────────

function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function displayName(profile: any) { return profile?.display_name || "Unknown"; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function initial(profile: any) { return (profile?.display_name || "?")[0].toUpperCase(); }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function timeAgo(iso: string | null | undefined, t?: any) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return t ? t("messages.justNow") : "just now";
  if (m < 60) return `${m}${t ? t("messages.minutesAgo") : "m ago"}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${t ? t("messages.hoursAgo") : "h ago"}`;
  return `${Math.floor(h / 24)}${t ? t("messages.daysAgo") : "d ago"}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatDay(date: Date, t?: any) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return t ? t("messages.today") : "Today";
  if (date.toDateString() === yesterday.toDateString()) return t ? t("messages.yesterday") : "Yesterday";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupByDay(messages: any[], t?: any) {
  const items: unknown[] = [];
  let lastDay: string | null = null;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupReactions(reactions: any[], messageId: string): Record<string, { count: number; users: string[]; mine: boolean }> {
  const grouped: Record<string, { count: number; users: string[]; mine: boolean }> = {};
  reactions.filter(r => r.message_id === messageId).forEach(r => {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, users: [], mine: false };
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push(r.user_id);
  });
  return grouped;
}

const REACTION_EMOJIS = ["👍","❤️","😂","😮","😢","🔥","🙏","👏"];
const EMOJIS = ["😀","😂","😍","🥰","😊","😎","😢","😭","😅","🤣","❤️","🙏","👍","👋","🎉","🔥","✨","💯","🙌","💪","🤔","🫶","🥳","😇","🤩","✅","⚡","🌟","💡","😤","🫠","🫡","❤️‍🔥","🤝","👏","😆","🥹","😌","😴","🤯"];

// ── Avatar ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Avatar({ profile, size = 36, online = false }: { profile: any; size?: number; online?: boolean }) {
  return (
    <div className="msg-avatar-wrap" style={{ width: size, height: size, flexShrink: 0 }}>
      {profile?.avatar_url ? (
        <img className="msg-avatar" src={profile.avatar_url} alt={displayName(profile)} width={size} height={size} style={{ width: size, height: size }} />
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ReplyPreview({ message, onCancel }: { message: any; onCancel: () => void }) {
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
      <button className="msg-reply-preview-cancel" onClick={onCancel} aria-label="Cancel reply">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

// ── Quoted reply (inside bubble) ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function QuotedReply({ replyToId, messages }: { replyToId: string; messages: any[] }) {
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

function ReactionRow({ messageId, reactions, userId, onToggle }: {
  messageId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reactions: any[];
  userId: string;
  onToggle: (emoji: string) => void;
}) {
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
        >{emoji} <span>{count}</span></button>
      ))}
    </div>
  );
}

// ── Reaction picker popover ───────────────────────────────────────────────────

function ReactionPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MSGImageCard({ content, metadata }: { content: any; metadata: any }) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MSGVerseCard({ metadata, isMine }: { metadata: any; isMine: boolean }) {
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


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MSGPlanCard({ metadata, isMine }: { metadata: any; isMine: boolean }) {
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

// ── Trivia invite card ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TriviaInviteCard({ metadata, navigate }: { metadata: any; navigate: (page: string, params?: Record<string, unknown>) => void }) {
  const [expired, setExpired] = useState<boolean>(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!metadata?.room_id) { setChecked(true); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from("trivia_rooms")
          .select("status")
          .eq("id", metadata.room_id)
          .single();
        if (data && data.status !== "lobby") setExpired(true);
      } catch {
        // ignore
      } finally {
        setChecked(true);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata?.room_id]);

  if (!metadata) return null;

  const { host_name, room_code, question_count, time_limit_seconds, has_timer, points_to_win } = metadata;

  const settingsParts: string[] = [
    `${question_count ?? 10} questions`,
    has_timer ? `${time_limit_seconds ?? 30}s timer` : "No timer",
    points_to_win > 0 ? `${points_to_win} pts to win` : "",
  ].filter(Boolean);

  return (
    <div style={{ background: "var(--card-bg)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "14px 16px", minWidth: 240, maxWidth: 280 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l6-6" /><path d="M2 2l20 20" />
        </svg>
        <span style={{ fontFamily: "Russo One, sans-serif", fontSize: 13, color: "var(--text)", letterSpacing: "0.04em" }}>
          BIBLE TRIVIA BATTLE
        </span>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px" }}>
        Invited by <strong style={{ color: "var(--text)" }}>{host_name}</strong>
      </p>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Room Code</div>
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px", fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "var(--teal)", letterSpacing: "0.18em" }}>
          {room_code}
        </div>
      </div>
      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 12px" }}>{settingsParts.join(" · ")}</p>
      {!checked ? (
        <div style={{ height: 36 }} />
      ) : expired ? (
        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "8px 0" }}>Expired</div>
      ) : (
        <button
          onClick={() => navigate("trivia", { prefillCode: room_code })}
          style={{ width: "100%", padding: "9px 0", borderRadius: 10, border: "none", background: "var(--teal)", color: "#fff", fontFamily: "Russo One, sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" }}
        >
          Join Battle
        </button>
      )}
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

function MSGStarredPanel({ convId, userId, onClose }: { convId: string; userId: string; onClose: () => void }) {
  const { data: starred = [], isLoading } = useStarredMessages(convId);
  const toggleStar = useToggleStar(convId);
  return (
    <div className="msg-overlay-panel">
      <div className="msg-overlay-header">
        <button className="msg-overlay-back" onClick={onClose} aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true" style={{ color: "goldenrod" }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Starred Messages
        </span>
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
                <span>📖 {(msg.metadata as Record<string, unknown>)?.ref as string}</span>
              ) : msg.message_type === "image" ? (
                <span>🖼 Image</span>
              ) : (
                <span>{msg.content?.slice(0, 80)}</span>
              )}
            </div>
            <div className="msg-starred-meta">
              <span>{formatTime(msg.created_at)}</span>
              <button className="msg-starred-remove" onClick={() => toggleStar.mutate(msg.id, { onError: () => toast.error("Failed to update star.") })} aria-label="Remove star">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Search panel ──────────────────────────────────────────────────────────────

function MSGSearchPanel({ convId, onClose }: { convId: string; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: results = [], isFetching } = useSearchMessages(convId, debouncedQuery);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(v), 350);
  }

  return (
    <div className="msg-overlay-panel">
      <div className="msg-overlay-header">
        <button className="msg-overlay-back" onClick={onClose} aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <input className="msg-overlay-search-input" placeholder="Search messages…" value={query} onChange={handleChange} autoFocus aria-label="Search messages" />
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

function MSGConvSettingsPanel({ convId, onClose, accentColor, onAccentChange }: {
  convId: string;
  onClose: () => void;
  accentColor: string | null;
  onAccentChange: (color: string | null) => void;
}) {
  const { data: settings } = useConvSettings(convId);
  const saveSettings = useSaveConvSettings(convId);
  const [theme, setTheme] = useState<string | null>(settings?.theme_accent ?? null);
  const [disappear, setDisappear] = useState<number | null>(settings?.disappear_after ?? null);

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
        <button className="msg-overlay-back" onClick={onClose} aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Chat Settings
        </span>
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

// ── Image upload warning modal ────────────────────────────────────────────────

function MSGImageWarningModal({ file, onConfirm, onCancel }: { file: File | null; onConfirm: () => void; onCancel: () => void }) {
  const previewUrl = file ? URL.createObjectURL(file) : null;
  return (
    <div className="msg-modal-overlay" onClick={onCancel}>
      <div className="msg-warn-modal" role="dialog" aria-modal="true" aria-label="Image upload warning" onClick={e => e.stopPropagation()}>
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

function MSGVersePicker({ onSend, onClose }: { onSend: (v: Record<string, unknown>) => void; onClose: () => void }) {
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
      <div className="msg-picker-modal" role="dialog" aria-modal="true" aria-label="Share Bible verse" onClick={e => e.stopPropagation()}>
        <div className="msg-picker-header">
          <span>📖 Share Bible Verse</span>
          <button className="msg-picker-close" onClick={onClose} aria-label="Close">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="msg-picker-body">
          <select className="msg-picker-select" value={bookIdx} onChange={e => { setBookIdx(+e.target.value); setChapter(1); }} aria-label="Select book">
            {BOOKS.map((b, i) => <option key={i} value={i}>{b.name}</option>)}
          </select>
          <select className="msg-picker-select" value={chapter} onChange={e => setChapter(+e.target.value)} aria-label="Select chapter">
            {Array.from({ length: chapterCount }, (_, i) => i + 1).map(c => <option key={c} value={c}>Chapter {c}</option>)}
          </select>
          <input className="msg-picker-input" placeholder="Add a note (optional)…" value={note} onChange={e => setNote(e.target.value)} maxLength={200} aria-label="Add a note" />
          <button className="msg-picker-send" onClick={handleSend}>Share</button>
        </div>
      </div>
    </div>
  );
}

// ── Plan picker ───────────────────────────────────────────────────────────────

function MSGPlanPicker({ onSend, onClose }: { onSend: (p: Record<string, unknown>) => void; onClose: () => void }) {
  const { data: plans = [] } = useMyPlans();
  return (
    <div className="msg-modal-overlay" onClick={onClose}>
      <div className="msg-picker-modal" role="dialog" aria-modal="true" aria-label="Share reading plan" onClick={e => e.stopPropagation()}>
        <div className="msg-picker-header">
          <span>📅 Share Reading Plan</span>
          <button className="msg-picker-close" onClick={onClose} aria-label="Close">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
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

const EMPTY_REACTIONS: never[] = [];

const MessageBubble = memo(function MessageBubble({ msg, isMine, onDelete, onReply, onEdit, onStar, showSeen, reactions, userId, onToggleReaction, allMessages, navigate }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  msg: any;
  isMine: boolean;
  onDelete: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onReply: (msg: any) => void;
  onEdit: (id: string, content: string, onDone: () => void, onFail: () => void) => void;
  onStar: (id: string) => void;
  showSeen?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reactions: any[];
  userId: string;
  onToggleReaction: (messageId: string, emoji: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allMessages: any[];
  navigate: (page: string, params?: Record<string, unknown>) => void;
}) {
  const { t } = useTranslation();
  const [showActions, setShowActions] = useState(false);
  const isStarred = Array.isArray(msg.starred_by) && msg.starred_by.includes(userId);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content);
  const [saving, setSaving] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const fullTime = formatTime(msg.created_at);

  function submitEdit() {
    if (saving) return;
    const trimmed = editText.trim();
    if (!trimmed || trimmed === msg.content) { setEditing(false); return; }
    setSaving(true);
    onEdit(
      msg.id,
      sanitizeContent(trimmed),
      () => { setEditing(false); setSaving(false); },
      () => { setSaving(false); }
    );
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(); }
    if (e.key === "Escape") {
      if (saving) return;
      setEditing(false); setEditText(msg.content);
    }
  }

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
      editRef.current.style.height = "auto";
      editRef.current.style.height = editRef.current.scrollHeight + "px";
    }
  }, [editing]);

  return (
    <div
      className={`msg-bubble-wrap${isMine ? " msg-bubble-wrap--mine" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactionPicker(false); }}
    >
      {!isMine && <Avatar profile={Array.isArray(msg.sender) ? msg.sender[0] : msg.sender} size={28} />}
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
              onChange={e => { setEditText(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
              onKeyDown={handleEditKeyDown}
              rows={2}
              aria-label="Edit message"
              disabled={saving}
            />
          ) : msg.message_type === "image" ? (
            <MSGImageCard content={msg.content} metadata={msg.metadata} />
          ) : msg.message_type === "verse" ? (
            <MSGVerseCard metadata={msg.metadata} isMine={isMine} />
          ) : msg.message_type === "reading_plan" ? (
            <MSGPlanCard metadata={msg.metadata} isMine={isMine} />
          ) : msg.message_type === "trivia_invite" ? (
            <TriviaInviteCard metadata={msg.metadata} navigate={navigate} />
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
          onToggle={emoji => onToggleReaction(msg.id, emoji)}
        />
        {showSeen && <span className="msg-seen">{t("messages.seen")}</span>}
      </div>

      {showActions && !editing && (
        <div className={`msg-bubble-actions${isMine ? " msg-bubble-actions--mine" : ""}`}>
          <div style={{ position: "relative" }}>
            <button className="msg-action-btn" title={t("messages.react")} onClick={() => setShowReactionPicker(s => !s)} aria-expanded={showReactionPicker}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </button>
            {showReactionPicker && (
              <ReactionPicker onPick={emoji => onToggleReaction(msg.id, emoji)} onClose={() => setShowReactionPicker(false)} />
            )}
          </div>
          <button className="msg-action-btn" title={t("messages.reply")} onClick={() => onReply(msg)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
          </button>
          <button className={`msg-action-btn${isStarred ? " msg-action-btn--active" : ""}`} title={isStarred ? "Unstar" : "Star"} onClick={() => onStar(msg.id)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isStarred ? "goldenrod" : "none"} stroke={isStarred ? "goldenrod" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
          {isMine && (
            <>
              <button className="msg-action-btn" title={t("common.edit")} onClick={() => { setEditing(true); setEditText(msg.content); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button className="msg-action-btn msg-action-btn--danger" title={t("common.delete")} onClick={() => onDelete(msg.id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
});

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

// ── Thread view ───────────────────────────────────────────────────────────────

const EMPTY_MESSAGES: never[] = [];

export function ThreadView({ conv, user, keyPair, onBack, soundEnabled, setSoundEnabled, navigate }: ThreadViewProps) {
  const { t } = useTranslation();
  const { data: messages = EMPTY_MESSAGES, isLoading } = useMessages(conv.conversation_id);
  const sendMessage = useSendMessage(conv.conversation_id);
  const deleteMessage = useDeleteMessage(conv.conversation_id);
  const editMessage = useEditMessage(conv.conversation_id);
  const markRead = useMarkRead(conv.conversation_id, user.id);
  const markNotifRead = useMarkMessageNotificationsRead(user.id);
  const { data: reactions = EMPTY_REACTIONS } = useReactions(conv.conversation_id);
  const toggleReaction = useToggleReaction(conv.conversation_id);
  const { sharedKey, otherHasKey } = useSharedKey(keyPair, conv.other_user_id, user.id);
  const { uploading, uploadAndSend } = useUploadImage(conv.conversation_id);
  const toggleStar = useToggleStar(conv.conversation_id);
  const { data: convSettings } = useConvSettings(conv.conversation_id);

  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [replyTo, setReplyTo] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [decryptedMessages, setDecryptedMessages] = useState<any[]>([]);
  const decryptCacheRef = useRef(new Map<string, string | null>());
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [otherLastSeen, setOtherLastSeen] = useState<string | null>(null);
  const [showVersePicker, setShowVersePicker] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [showStarred, setShowStarred] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [accentColor, setAccentColor] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [failedPayload, setFailedPayload] = useState<any>(null);

  useEffect(() => {
    if (convSettings?.theme_accent !== undefined) {
      setAccentColor(convSettings.theme_accent ?? null);
    }
  }, [convSettings?.theme_accent]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const presenceChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCountRef = useRef(0);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    markRead.mutate();
    markNotifRead.mutate(conv.conversation_id);
  }, [conv.conversation_id]);

  useEffect(() => {
    if (!messages.length) { setDecryptedMessages([]); return; }
    let cancelled = false;
    const cache = decryptCacheRef.current;
    async function decryptIncremental() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (messages as any[]).map(async (msg: any) => {
          const cacheKey = `${msg.id}:${msg.content}`;
          if (cache.has(cacheKey)) return { ...msg, content: cache.get(cacheKey) };
          const decrypted = sharedKey
            ? await decryptMessage(msg.content, sharedKey)
            : msg.content?.startsWith("enc:") ? "[🔒 Encrypted message]" : msg.content;
          cache.set(cacheKey, decrypted as string);
          return { ...msg, content: decrypted };
        })
      );
      if (!cancelled) setDecryptedMessages(results);
    }
    decryptIncremental();
    return () => { cancelled = true; };
  }, [messages, sharedKey]);

  useEffect(() => {
    const count = decryptedMessages.length;
    if (count > prevCountRef.current) {
      const added = count - prevCountRef.current;
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

  useEffect(() => {
    if (!conv.conversation_id || !user.id) return;
    const channel = supabase.channel(`presence:${conv.conversation_id}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const others = (Object.entries(state)
          .filter(([key]) => key !== user.id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .flatMap(([, presences]) => presences)) as any[];
        const otherPresence = others.find(p => p.user_id === conv.other_user_id);
        setIsOtherOnline(!!otherPresence);
        setIsOtherTyping(!!(otherPresence?.typing));
        if (!otherPresence) setOtherLastSeen(conv.other_last_read_at ?? null);
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("presence", { event: "join" }, ({ key, newPresences }: any) => {
        if (key === conv.other_user_id) setIsOtherOnline(true);
        const p = (newPresences as Array<{ user_id: string; typing?: boolean }>).find(p => p.user_id === conv.other_user_id);
        if (p) setIsOtherTyping(!!(p.typing));
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("presence", { event: "leave" }, ({ key }: any) => {
        if (key === conv.other_user_id) {
          setIsOtherOnline(false);
          setIsOtherTyping(false);
          setOtherLastSeen(new Date().toISOString());
        }
      })
      .subscribe(async (status: string) => {
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

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  useEffect(() => {
    if (!showEmoji) return;
    function handler(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
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

  function broadcastTyping(isTyping: boolean) {
    const ch = presenceChannelRef.current;
    if (!ch) return;
    ch.track({ user_id: user.id, typing: isTyping });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    broadcastTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => broadcastTyping(false), 2000);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function doSend(payload: any) {
    setSendError(null);
    setFailedPayload(null);
    sendMessage.mutate(payload, {
      onError: () => {
        setSendError("Message failed to send.");
        setFailedPayload(payload);
      },
    });
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const raw = input.trim();
    if (!raw) return;
    const sanitized = sanitizeContent(raw);
    if (!sanitized) return;
    const toSend = sharedKey ? await encryptMessage(sanitized, sharedKey) : sanitized;
    const payload = {
      senderId: user.id,
      content: toSend,
      replyToId: replyTo?.id ?? null,
      messageType: "text",
    };
    doSend(payload);
    setInput("");
    setReplyTo(null);
    broadcastTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (inputRef.current) inputRef.current.style.height = "auto";
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  }

  function insertEmoji(emoji: string) {
    setInput(prev => prev + emoji);
    inputRef.current?.focus();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImageFile(file);
    e.target.value = "";
  }

  function confirmImageUpload() {
    if (!pendingImageFile) return;
    uploadAndSend(pendingImageFile, user.id, replyTo?.id ?? null, (msg) => setSendError(msg));
    setReplyTo(null);
    setPendingImageFile(null);
  }

  function sendVerse(verseData: Record<string, unknown>) {
    sendMessage.mutate({
      senderId: user.id,
      content: `📖 ${verseData.ref}`,
      replyToId: null,
      messageType: "verse",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: verseData as any,
    });
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function sendPlan(planData: Record<string, unknown>) {
    sendMessage.mutate({
      senderId: user.id,
      content: `📅 ${planData.title}`,
      replyToId: null,
      messageType: "reading_plan",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: planData as any,
    });
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  const otherLastRead = conv.other_last_read_at ? new Date(conv.other_last_read_at) : null;
  const lastSeenId = useMemo(() => {
    if (!otherLastRead) return null;
    const myMsgs = decryptedMessages.filter(m => m.sender_id === user.id && !String(m.id).startsWith("optimistic"));
    return myMsgs.filter(m => new Date(m.created_at) <= otherLastRead).at(-1)?.id ?? null;
  }, [decryptedMessages, user.id, otherLastRead]);

  const grouped = useMemo(() => groupByDay(decryptedMessages, t), [decryptedMessages, t]);
  const nearLimit = input.length > 1800;
  const isEncrypted = !!sharedKey;

  let presenceLine: React.ReactNode = null;
  if (isOtherTyping) presenceLine = null;
  else if (isOtherOnline) presenceLine = <span className="msg-presence-status msg-presence-status--online">{t("messages.online")}</span>;
  else if (otherLastSeen) presenceLine = <span className="msg-presence-status">Last seen {timeAgo(otherLastSeen, t)}</span>;

  return (
    <div className="msg-thread" style={(accentColor ? { "--conv-accent": accentColor } : {}) as React.CSSProperties}>
      <div className="msg-thread-header">
        <button className="msg-back-btn" onClick={onBack} aria-label="Back to conversations">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ cursor: "pointer" }} onClick={() => navigate("publicProfile", { userId: conv.other_user_id })}>
          <Avatar profile={{ display_name: conv.other_display_name, avatar_url: conv.other_avatar_url }} size={36} online={isOtherOnline} />
        </span>
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
          <button className="msg-header-icon-btn" data-tip="Search" aria-label="Search messages" onClick={() => { setShowSearch(true); setShowStarred(false); setShowSettings(false); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </button>
          <button className={`msg-header-icon-btn${showStarred ? " msg-header-icon-btn--active" : ""}`} data-tip="Starred" aria-label="Starred messages" onClick={() => { setShowStarred(s => !s); setShowSearch(false); setShowSettings(false); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={showStarred ? "goldenrod" : "none"} stroke={showStarred ? "goldenrod" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
          <button className={`msg-header-icon-btn${showSettings ? " msg-header-icon-btn--active" : ""}`} data-tip="Settings" aria-label="Chat settings" onClick={() => { setShowSettings(s => !s); setShowSearch(false); setShowStarred(false); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
          <button
            className={`msg-sound-btn${soundEnabled ? " msg-sound-btn--on" : ""}`}
            onClick={() => setSoundEnabled(s => !s)}
            data-tip={soundEnabled ? t("messages.muteSounds") : t("messages.enableSounds")}
            aria-label={soundEnabled ? t("messages.muteSounds") : t("messages.enableSounds")}
          >
            {soundEnabled
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 1 6 8"/><path d="M2 20h20"/><path d="M12 2v18"/><path d="M18 20a6 6 0 0 1-12 0"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            }
          </button>
        </div>
      </div>

      {showStarred && <MSGStarredPanel convId={conv.conversation_id} userId={user.id} onClose={() => setShowStarred(false)} />}
      {showSearch && <MSGSearchPanel convId={conv.conversation_id} onClose={() => setShowSearch(false)} />}
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (grouped as any[]).map((item: any) =>
            item.type === "day" ? (
              <div key={item.key} className="msg-day-divider"><span>{item.label}</span></div>
            ) : (
              <MessageBubble
                key={item.id}
                msg={item}
                isMine={item.sender_id === user.id}
                onDelete={id => deleteMessage.mutate(id, { onError: () => toast.error("Failed to delete message.") })}
                onReply={msg => setReplyTo(msg)}
                onEdit={(id, content, onDone, onFail) =>
                  editMessage.mutate({ messageId: id, content }, { onSuccess: onDone, onError: () => { onFail(); toast.error("Failed to edit message."); } })
                }
                showSeen={item.id === lastSeenId}
                reactions={reactions}
                userId={user.id}
                onToggleReaction={(messageId, emoji) => toggleReaction.mutate({ messageId, userId: user.id, emoji }, { onError: () => toast.error("Failed to update reaction.") })}
                onStar={id => toggleStar.mutate(id, { onError: () => toast.error("Failed to update star.") })}
                allMessages={decryptedMessages}
                navigate={navigate}
              />
            )
          )
        )}
        {isOtherTyping && <TypingDots />}
        <div ref={bottomRef} />
        {showScrollBtn && (
          <button className="msg-scroll-btn" onClick={scrollToBottom}>
            {newMsgCount > 0
              ? <span className="msg-scroll-badge">{newMsgCount}</span>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            }
          </button>
        )}
      </div>

      {sendError && (
        <div className="msg-send-error">
          <span>{sendError}</span>
          <button type="button" className="msg-send-retry-btn" onClick={() => failedPayload && doSend(failedPayload)} disabled={sendMessage.isPending}>Retry</button>
          <button type="button" className="msg-send-error-dismiss" onClick={() => { setSendError(null); setFailedPayload(null); }} aria-label="Dismiss">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      <form className="msg-composer" onSubmit={handleSend}>
        <ReplyPreview message={replyTo} onCancel={() => setReplyTo(null)} />
        {nearLimit && <div className="msg-char-count">{input.length} / 2000</div>}

        <div className="msg-rich-toolbar">
          {uploading ? (
            <div className="msg-upload-status">
              <span className="msg-upload-spinner" />
              <span className="msg-upload-status-text">Uploading image…</span>
            </div>
          ) : (
            <>
              <button type="button" className="msg-toolbar-btn" data-tip="Share Bible Verse" aria-label="Share Bible Verse" onClick={() => setShowVersePicker(true)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </button>
              <button type="button" className="msg-toolbar-btn msg-toolbar-btn--img" data-tip="Share Image" onClick={() => fileRef.current?.click()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </button>
              <button type="button" className="msg-toolbar-btn" data-tip="Share Reading Plan" aria-label="Share Reading Plan" onClick={() => setShowPlanPicker(true)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </button>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: "none" }} onChange={handleFileChange} />
        </div>


        <div className="msg-composer-row">
          <div className="msg-emoji-wrap" ref={emojiRef}>
            <button type="button" className="msg-emoji-btn" onClick={() => setShowEmoji(s => !s)} data-tip="Emoji" aria-label="Emoji picker">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </button>
            {showEmoji && (
              <div className="msg-emoji-picker">
                {EMOJIS.map(e => (
                  <button key={e} type="button" className="msg-emoji-option" onClick={() => insertEmoji(e)}>{e}</button>
                ))}
              </div>
            )}
          </div>
          <textarea
            ref={inputRef}
            className="msg-input"
            placeholder={isEncrypted ? "🔒 Message (encrypted)…" : "Message…"}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_MSG_LENGTH}
            rows={1}
            autoFocus
            aria-label="Type a message"
          />
          <button
            className="msg-send-btn"
            type="submit"
            disabled={!input.trim() || sendMessage.isPending}
            data-tip="Send"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
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
