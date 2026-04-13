import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeContent } from "../../lib/e2e";
import { Avatar, FCReactionPicker, FCVerseCard, FCImageCard, FCPlanCard, FCPrayerCard, FCLinkPreviewCard } from "./ChatWidgets";
import { groupReactions, formatTime, renderFormattedContent } from "./chatHelpers";

interface Message {
  id: string;
  content: string | null;
  message_type: string;
  created_at: string;
  edited_at?: string | null;
  reply_to_id?: string | null;
  sender_id: string;
  starred_by?: string[];
  metadata?: unknown;
  sender?: Array<{ display_name: string | null; avatar_url: string | null }> | null;
}

interface Reaction {
  message_id: string;
  emoji: string;
  user_id: string;
}

interface LinkPreview {
  message_id: string;
  url: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
}

interface FCBubbleProps {
  msg: Message;
  isMine: boolean;
  allMessages: Message[];
  reactions: Reaction[];
  userId: string;
  linkPreviews: LinkPreview[];
  onDelete: (id: string) => void;
  onReply: (msg: Message) => void;
  onEdit: (id: string, content: string) => void;
  onToggleReaction: (id: string, emoji: string) => void;
  onStar: (id: string) => void;
  isLast: boolean;
  accentColor: string | null;
}

export function FCBubble({ msg, isMine, allMessages, reactions, userId, linkPreviews, onDelete, onReply, onEdit, onToggleReaction, onStar, isLast, accentColor }: FCBubbleProps) {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [showReactPicker, setShowReactPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content ?? "");
  const editRef = useRef<HTMLTextAreaElement>(null);
  const reactBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isStarred = Array.isArray(msg.starred_by) && msg.starred_by.includes(userId);
  const preview = linkPreviews?.find(p => p.message_id === msg.id);

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [editing]);

  useEffect(() => {
    if (!showMenu) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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
  const accentStyle = (accentColor ? { "--conv-accent": accentColor } : {}) as React.CSSProperties;

  const isPrayer = msg.message_type === "prayer_request";
  const isVerse = msg.message_type === "verse";
  const isImage = msg.message_type === "image";
  const isPlan = msg.message_type === "reading_plan";

  return (
    <div className={`fc-bubble-wrap${isMine ? " fc-bubble-wrap--mine" : ""}`} style={accentStyle}>
      {!isMine && <Avatar name={msg.sender?.[0]?.display_name} avatarUrl={msg.sender?.[0]?.avatar_url} size={22} />}

      <div style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", gap: 2, minWidth: 0, maxWidth: "100%" }}>
        {replyOrig && (
          <div className="fc-quoted">
            <div className="fc-quoted-bar" />
            <div className="fc-quoted-body">
              <span className="fc-quoted-name">{replyOrig.sender?.[0]?.display_name || t("messages.user")}</span>
              <span className="fc-quoted-text">{(replyOrig.content?.startsWith("enc:") ? t("messages.encryptedShort") : replyOrig.content || "").slice(0, 50)}</span>
            </div>
          </div>
        )}

        <div className="fc-bubble-content" ref={menuRef}>
          <button
            className="fc-dots-btn"
            onClick={() => setShowMenu(s => !s)}
            title="Options"
            aria-label="Options"
            aria-expanded={showMenu}
          >⋮</button>

          {showMenu && !editing && (
            <div className="fc-action-menu">
              <button ref={reactBtnRef} className="fc-action-menu-item" onClick={() => setShowReactPicker(s => !s)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                React
              </button>
              <button className="fc-action-menu-item" onClick={() => { onReply(msg); closeMenu(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                Reply
              </button>
              <button className="fc-action-menu-item" onClick={() => { onStar(msg.id); closeMenu(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isStarred ? "goldenrod" : "none"} stroke={isStarred ? "goldenrod" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {isStarred ? "Unstar" : "Star"}
              </button>
              {isMine && !isPrayer && !isVerse && !isImage && !isPlan && (
                <button className="fc-action-menu-item" onClick={() => { setEditing(true); setEditText(msg.content ?? ""); closeMenu(); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit
                </button>
              )}
              {isMine && (
                <button className="fc-action-menu-item fc-action-menu-item--danger" onClick={() => { onDelete(msg.id); closeMenu(); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  Delete
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
            <FCVerseCard metadata={msg.metadata as Record<string, unknown> | null} isMine={isMine} />
          ) : isImage ? (
            <FCImageCard content={msg.content} metadata={msg.metadata as Record<string, unknown> | null} />
          ) : isPlan ? (
            <FCPlanCard metadata={msg.metadata as Record<string, unknown> | null} isMine={isMine} />
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
                    if (e.key === "Escape") { setEditing(false); setEditText(msg.content ?? ""); }
                  }}
                  rows={1}
                />
              ) : (
                <span>{renderFormattedContent(msg.content)}</span>
              )}
              <div className="fc-bubble-footer">
                {isStarred && <span className="fc-star-indicator"><svg width="10" height="10" viewBox="0 0 24 24" fill="goldenrod" stroke="goldenrod" strokeWidth="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>}
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
