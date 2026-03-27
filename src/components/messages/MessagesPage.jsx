import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import PageNav from "../PageNav";
import ConfirmModal from "../ConfirmModal";
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
} from "../../hooks/useMessages";
import "../../styles/messages.css";
import { useE2EKeys, useSharedKey } from "../../hooks/useE2E";
import { encryptMessage, decryptMessage, sanitizeContent, MAX_MSG_LENGTH } from "../../lib/e2e";
import { supabase } from "../../lib/supabase";

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

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDay(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function groupByDay(messages) {
  const items = [];
  let lastDay = null;
  for (const msg of messages) {
    const day = new Date(msg.created_at).toDateString();
    if (day !== lastDay) {
      items.push({ type: "day", label: formatDay(new Date(msg.created_at)), key: "day-" + day });
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
  if (!message) return null;
  const preview = message.content?.startsWith("enc:") ? "🔒 Encrypted message" : (message.content || "");
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
  const orig = messages.find(m => m.id === replyToId);
  if (!orig) return null;
  const preview = orig.content?.startsWith("enc:") ? "🔒 Encrypted" : (orig.content || "");
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

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, isMine, onDelete, onReply, onEdit, showSeen, reactions, userId, onToggleReaction, allMessages }) {
  const [showActions, setShowActions] = useState(false);
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
          ) : (
            <p className="msg-bubble-text">{msg.content}</p>
          )}
          <div className="msg-bubble-footer">
            <span className="msg-bubble-time">{timeAgo(msg.created_at)}</span>
            {msg.edited_at && <span className="msg-edited-label">edited</span>}
            {isMine && (
              <span className="msg-status-ticks">
                {showSeen ? "✓✓" : "✓"}
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
        {showSeen && <span className="msg-seen">Seen</span>}
      </div>

      {/* Action buttons */}
      {showActions && !editing && (
        <div className={`msg-bubble-actions${isMine ? " msg-bubble-actions--mine" : ""}`}>
          <div style={{ position: "relative" }}>
            <button className="msg-action-btn" title="React" onClick={() => setShowReactionPicker(s => !s)}>😊</button>
            {showReactionPicker && (
              <ReactionPicker
                onPick={(emoji) => onToggleReaction(msg.id, emoji)}
                onClose={() => setShowReactionPicker(false)}
              />
            )}
          </div>
          <button className="msg-action-btn" title="Reply" onClick={() => onReply(msg)}>↩</button>
          {isMine && (
            <>
              <button className="msg-action-btn" title="Edit" onClick={() => { setEditing(true); setEditText(msg.content); }}>✎</button>
              <button className="msg-action-btn msg-action-btn--danger" title="Delete" onClick={() => onDelete(msg.id)}>✕</button>
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
  const [hovered, setHovered] = useState(false);
  const isUnread = conv.unread_count > 0;
  const isMine = conv.last_message_sender_id === currentUserId;
  const isOnline = onlineUsers.has(conv.other_user_id);

  return (
    <div
      className={`msg-conv-item${active ? " msg-conv-item--active" : ""}${isUnread ? " msg-conv-item--unread" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <Avatar profile={{ display_name: conv.other_display_name, avatar_url: conv.other_avatar_url }} online={isOnline} />
      <div className="msg-conv-info">
        <div className="msg-conv-header">
          <span className="msg-conv-name">{conv.other_display_name || "User"}</span>
          {conv.last_message_at && (
            <span className="msg-conv-time">{timeAgo(conv.last_message_at)}</span>
          )}
        </div>
        <div className="msg-conv-preview">
          {conv.last_message_content
            ? `${isMine ? "You: " : ""}${conv.last_message_content.startsWith("enc:") ? "🔒 Encrypted message" : conv.last_message_content}`
            : "No messages yet"}
        </div>
      </div>
      {isUnread && !hovered && <span className="msg-unread-dot">{conv.unread_count}</span>}
      {hovered && (
        <button
          className="msg-conv-delete-btn"
          onClick={e => { e.stopPropagation(); onDelete(conv.conversation_id); }}
          title="Delete conversation"
        >
          🗑
        </button>
      )}
    </div>
  );
}

// ── Thread view ───────────────────────────────────────────────────────────────

function ThreadView({ conv, user, keyPair, onBack, soundEnabled, setSoundEnabled }) {
  const { data: messages = [], isLoading } = useMessages(conv.conversation_id);
  const sendMessage = useSendMessage(conv.conversation_id);
  const deleteMessage = useDeleteMessage(conv.conversation_id);
  const editMessage = useEditMessage(conv.conversation_id);
  const markRead = useMarkRead(conv.conversation_id, user.id);
  const { data: reactions = [] } = useReactions(conv.conversation_id);
  const toggleReaction = useToggleReaction(conv.conversation_id);
  const { sharedKey, otherHasKey } = useSharedKey(keyPair, conv.other_user_id);

  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [replyTo, setReplyTo] = useState(null);
  const [decryptedMessages, setDecryptedMessages] = useState([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [otherLastSeen, setOtherLastSeen] = useState(null);

  const bottomRef = useRef(null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const emojiRef = useRef(null);
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
    sendMessage.mutate({ senderId: user.id, content: toSend, replyToId: replyTo?.id ?? null });
    setInput("");
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

  const otherLastRead = conv.other_last_read_at ? new Date(conv.other_last_read_at) : null;
  const myMsgs = decryptedMessages.filter(m => m.sender_id === user.id && !String(m.id).startsWith("optimistic"));
  const lastSeenId = otherLastRead
    ? myMsgs.filter(m => new Date(m.created_at) <= otherLastRead).at(-1)?.id ?? null
    : null;

  const grouped = groupByDay(decryptedMessages);
  const nearLimit = input.length > 1800;
  const isEncrypted = !!sharedKey;

  // Presence status line
  let presenceLine = null;
  if (isOtherTyping) presenceLine = null; // shown separately as typing dots
  else if (isOtherOnline) presenceLine = <span className="msg-presence-status msg-presence-status--online">Online</span>;
  else if (otherLastSeen) presenceLine = <span className="msg-presence-status">Last seen {timeAgo(otherLastSeen)}</span>;

  return (
    <div className="msg-thread">
      <div className="msg-thread-header">
        <button className="msg-back-btn" onClick={onBack}>←</button>
        <Avatar
          profile={{ display_name: conv.other_display_name, avatar_url: conv.other_avatar_url }}
          size={36}
          online={isOtherOnline}
        />
        <div className="msg-thread-header-info">
          <span className="msg-thread-name">{conv.other_display_name || "User"}</span>
          {isOtherTyping ? (
            <span className="msg-presence-status msg-presence-status--typing">typing…</span>
          ) : presenceLine}
          {isEncrypted
            ? <span className="msg-e2e-badge">🔒 End-to-end encrypted</span>
            : otherHasKey === false
              ? <span className="msg-e2e-badge msg-e2e-badge--warn">⚠️ Not yet encrypted</span>
              : null
          }
        </div>
        <button
          className={`msg-sound-btn${soundEnabled ? " msg-sound-btn--on" : ""}`}
          onClick={() => setSoundEnabled(s => !s)}
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? "🔔" : "🔕"}
        </button>
      </div>

      <div className="msg-thread-body" ref={bodyRef} onScroll={handleScroll}>
        {isLoading ? (
          <p className="msg-empty">Loading…</p>
        ) : decryptedMessages.length === 0 ? (
          <div className="msg-empty-thread">
            <span>👋</span>
            <strong>Start the conversation!</strong>
            <p>Say hello to {conv.other_display_name || "User"}!</p>
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
            className="msg-input"
            placeholder={isEncrypted ? "🔒 Message (encrypted)…" : "Message…"}
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
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MessagesPage({ user, navigate, darkMode, setDarkMode, i18n, onLogout, initialConv = null }) {
  const { data: conversations = [], isLoading } = useConversations();
  const [activeConv, setActiveConv] = useState(initialConv);
  const [convToDelete, setConvToDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const deleteConversation = useDeleteConversation();
  const { keyPair } = useE2EKeys(user.id);

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
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} currentPage="messages" />
<div className="msg-layout">
        <aside className={`msg-sidebar${!showList ? " msg-sidebar--hidden-mobile" : ""}`}>
          <div className="msg-sidebar-header">
            <button className="msg-back-page-btn" onClick={() => navigate("home")}>←</button>
            <h2 className="msg-sidebar-title">Messages</h2>
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
          <div className="msg-conv-list">
            {isLoading ? (
              <p className="msg-empty">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="msg-empty">
                {search ? "No results." : "No conversations yet.\nStart one from a user's profile."}
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
              <h3>No Conversation Selected</h3>
              <p>Select a conversation on the left to start messaging.</p>
            </div>
          )}
        </main>
      </div>

      {convToDelete && (
        <ConfirmModal
          message="Delete this conversation? All messages will be permanently removed."
          onConfirm={confirmDelete}
          onCancel={() => setConvToDelete(null)}
        />
      )}
    </div>
  );
}
