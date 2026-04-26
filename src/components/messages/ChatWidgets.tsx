import React, { useState, useEffect, useRef } from "react";
import { EMOJI_CATEGORIES } from "../../lib/emojiData";
import { BOOKS } from "../../data/books";
import { wolChapterUrl } from "../../utils/wol";
import { getTemplate } from "../../data/readingPlanTemplates";
import { useMyPlans } from "../../hooks/useReadingPlans";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import {
  useStarredMessages, useToggleStar,
  useConvSettings, useSaveConvSettings,
  useSearchMessages,
} from "../../hooks/useMessages";
import { THEME_COLORS, DISAPPEAR_OPTIONS, PUSH_DISMISS_KEY, formatTime, initial, REACTION_EMOJIS } from "./chatHelpers";
import { sanitizeContent } from "../../lib/e2e";

/** Only allow http/https URLs, blocks javascript:, data:, and other dangerous schemes */
function safeUrl(url: string | null | undefined): string {
  if (!url) return "#";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "#";
    return parsed.href;
  } catch {
    return "#";
  }
}

// ── Avatar ────────────────────────────────────────────────────────────────────

export function Avatar({ name, avatarUrl, size = 32, online = false }: {
  name?: string | null;
  avatarUrl?: string | null;
  size?: number;
  online?: boolean;
}) {
  return (
    <div className="fc-avatar-wrap" style={{ width: size, height: size }}>
      {avatarUrl ? (
        <img className="fc-avatar" src={avatarUrl} alt={name ?? ""} width={size} height={size} style={{ width: size, height: size }} loading="lazy" />
      ) : (
        <div className="fc-avatar fc-avatar--fallback" style={{ width: size, height: size, fontSize: size * 0.38 }}>
          {initial(name)}
        </div>
      )}
      {online && <span className="fc-online-dot" />}
    </div>
  );
}

// ── Emoji picker ──────────────────────────────────────────────────────────────

export function EmojiPicker({ onSelect, onClose }: { onSelect: (em: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
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

// ── Reaction picker ───────────────────────────────────────────────────────────

export function FCReactionPicker({ onPick, onClose, anchorEl }: {
  onPick: (em: string) => void;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const style: React.CSSProperties = {};
  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const pickerW = 280;
    let left = rect.left + rect.width / 2 - pickerW / 2 - 10;
    left = Math.max(8, Math.min(left, window.innerWidth - pickerW - 8));
    (style as Record<string, unknown>).left = left;
    (style as Record<string, unknown>).top = rect.top - 48;
  }

  return (
    <div className="fc-reaction-picker" ref={ref} style={style}>
      {REACTION_EMOJIS.map(em => (
        <button key={em} className="fc-reaction-picker-btn" onClick={() => { onPick(em); onClose(); }}>{em}</button>
      ))}
    </div>
  );
}

// ── Image upload warning modal ────────────────────────────────────────────────

export function FCImageWarningModal({ file, onConfirm, onCancel }: {
  file: File | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const previewUrl = file ? URL.createObjectURL(file) : null;
  return (
    <div className="fc-modal-overlay fc-img-warn-overlay" onClick={onCancel}>
      <div className="fc-modal fc-img-warn-modal" role="dialog" aria-modal="true" aria-label="Image upload warning" onClick={e => e.stopPropagation()}>
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

// ── Verse picker ──────────────────────────────────────────────────────────────

export function VersePicker({ onSend, onClose }: { onSend: (data: Record<string, unknown>) => void; onClose: () => void }) {
  const [bookIdx, setBookIdx] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState(1);
  const [note, setNote] = useState("");
  const book = BOOKS[bookIdx];
  return (
    <div className="fc-modal-overlay" onClick={onClose}>
      <div className="fc-modal" role="dialog" aria-modal="true" aria-label="Share a Bible verse" onClick={e => e.stopPropagation()}>
        <div className="fc-modal-header">
          <span>📖 Share a Bible Verse</span>
          <button className="fc-modal-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
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
              <input className="fc-modal-input" type="number" inputMode="numeric" min={1} max={200} value={verse} onChange={e => setVerse(+e.target.value)} aria-label="Verse number" />
            </div>
          </div>
          <label className="fc-modal-label">Note (optional)</label>
          <input className="fc-modal-input" placeholder="Add a note…" value={note} onChange={e => setNote(e.target.value)} maxLength={200} aria-label="Add a note" />
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

// ── Reading plan picker ───────────────────────────────────────────────────────

export function PlanPicker({ onSend, onClose }: { onSend: (data: Record<string, unknown>) => void; onClose: () => void }) {
  const { data: plans = [] } = useMyPlans();
  return (
    <div className="fc-modal-overlay" onClick={onClose}>
      <div className="fc-modal" role="dialog" aria-modal="true" aria-label="Share a reading plan" onClick={e => e.stopPropagation()}>
        <div className="fc-modal-header">
          <span>📅 Share a Reading Plan</span>
          <button className="fc-modal-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
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

// ── Conversation settings panel ───────────────────────────────────────────────

export function ConvSettingsPanel({ convId, onClose, accentColor, onAccentChange }: {
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
    <div className="fc-settings-panel">
      <div className="fc-settings-header">
        <span>⚙ Chat Settings</span>
        <button className="fc-modal-close" onClick={onClose} aria-label="Close">✕</button>
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

// ── Starred messages panel ────────────────────────────────────────────────────

export function StarredPanel({ convId, userId, onClose }: {
  convId: string;
  userId: string;
  onClose: () => void;
}) {
  const { data: starred = [], isLoading } = useStarredMessages(convId);
  const toggleStar = useToggleStar(convId, userId);
  return (
    <div className="fc-overlay-panel">
      <div className="fc-overlay-header">
        <button className="fc-back-btn" onClick={onClose} aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="goldenrod" stroke="goldenrod" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Starred Messages
        </span>
      </div>
      <div className="fc-overlay-body">
        {isLoading ? <p className="fc-empty">Loading…</p> : starred.length === 0 ? (
          <p className="fc-empty">No starred messages yet.</p>
        ) : (
          starred.map(msg => (
            <div key={msg.id} className="fc-starred-item">
              <div className="fc-starred-content">
                {msg.message_type === "verse" && msg.metadata ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    {(msg.metadata as Record<string, unknown>)?.ref as string}
                  </span>
                ) : msg.message_type === "image" ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    Image
                  </span>
                ) : (
                  <span>{msg.content?.slice(0, 80)}</span>
                )}
              </div>
              <div className="fc-starred-meta">
                <span>{formatTime(msg.created_at)}</span>
                <button className="fc-action-btn" onClick={() => toggleStar.mutate(msg.id)} aria-label="Remove star">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Search panel ──────────────────────────────────────────────────────────────

export function SearchPanel({ convId, onClose }: { convId: string; onClose: () => void }) {
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
    <div className="fc-overlay-panel">
      <div className="fc-overlay-header">
        <button className="fc-back-btn" onClick={onClose} aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <input className="fc-search-input" placeholder="Search messages…" value={query} onChange={handleChange} autoFocus aria-label="Search messages" />
      </div>
      <div className="fc-overlay-body">
        {isFetching ? <p className="fc-empty">Searching…</p> : debouncedQuery.length < 2 ? (
          <p className="fc-empty">Type to search.</p>
        ) : results.length === 0 ? (
          <p className="fc-empty">No results for "{debouncedQuery}".</p>
        ) : (
          results.map(msg => (
            <div key={msg.id} className="fc-search-result">
              <span className="fc-search-result-text">{sanitizeContent(msg.content ?? "").slice(0, 120)}</span>
              <span className="fc-search-result-time">{formatTime(msg.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Push notification prompt ──────────────────────────────────────────────────

export function PushPrompt({ onDismiss }: { onDismiss: () => void }) {
  const { supported, permission, subscribed, subscribe } = usePushNotifications();
  if (!supported || subscribed) return null;
  if (permission !== "default" && permission !== "denied") return null;
  return (
    <div className="fc-push-prompt">
      <span className="fc-push-prompt-icon">🔔</span>
      <span className="fc-push-prompt-text">
        {permission === "denied"
          ? "Notifications blocked. Enable in browser settings."
          : "Get notified of new messages"}
      </span>
      {permission !== "denied" && (
        <button className="fc-push-btn" onClick={async () => { await subscribe(); onDismiss(); }}>Enable</button>
      )}
      <button className="fc-push-dismiss" onClick={onDismiss} aria-label="Dismiss">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

// ── Rich message cards ────────────────────────────────────────────────────────

export function FCVerseCard({ metadata, isMine }: { metadata: Record<string, unknown> | null; isMine: boolean }) {
  if (!metadata) return null;
  return (
    <div className={`fc-verse-card${isMine ? " fc-verse-card--mine" : ""}`}>
      <div className="fc-verse-card-ref">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        {metadata.ref as string}
      </div>
      {metadata.note && <div className="fc-verse-card-note">{metadata.note as string}</div>}
      <a href={metadata.url as string} target="_blank" rel="noopener noreferrer" className="fc-verse-card-link">
        Read on WOL ↗
      </a>
    </div>
  );
}

export function FCImageCard({ content, metadata }: { content: string | null; metadata: Record<string, unknown> | null }) {
  const url = (metadata?.url as string) || content;
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="fc-image-card">
      <img
        src={safeUrl(url)}
        alt={(metadata?.filename as string) || "Image"}
        className={`fc-image-thumb${loaded ? " fc-image-thumb--loaded" : ""}`}
        onLoad={() => setLoaded(true)}
        onClick={() => url && window.open(safeUrl(url), "_blank")}
      />
    </div>
  );
}

export function FCPlanCard({ metadata, isMine }: { metadata: Record<string, unknown> | null; isMine: boolean }) {
  if (!metadata) return null;
  const friendlyTitle = getTemplate(metadata.templateKey as string)?.name || (metadata.title as string) || (metadata.templateKey as string);
  return (
    <div className={`fc-plan-card${isMine ? " fc-plan-card--mine" : ""}`}>
      <div className="fc-plan-card-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
      <div className="fc-plan-card-body">
        <div className="fc-plan-card-title">{friendlyTitle}</div>
        <div className="fc-plan-card-sub">Reading Plan Invitation</div>
      </div>
    </div>
  );
}

export function FCLinkPreviewCard({ preview }: { preview: { url: string; og_title?: string; og_description?: string; og_image?: string } | null }) {
  if (!preview || (!preview.og_title && !preview.og_description)) return null;
  const href = safeUrl(preview.url);
  let hostname = "";
  try { hostname = href !== "#" ? new URL(href).hostname : ""; } catch { /* noop */ }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="fc-link-preview">
      {preview.og_image && (
        <img src={preview.og_image} alt="" className="fc-link-preview-img" onError={e => (e.currentTarget.style.display = "none")} />
      )}
      <div className="fc-link-preview-body">
        {preview.og_title && <div className="fc-link-preview-title">{preview.og_title}</div>}
        {preview.og_description && <div className="fc-link-preview-desc">{preview.og_description.slice(0, 120)}</div>}
        {hostname && <div className="fc-link-preview-domain">{hostname}</div>}
      </div>
    </a>
  );
}
