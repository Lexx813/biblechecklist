import { useState, useEffect, useRef, useCallback } from "react";
import { EMOJI_CATEGORIES } from "../../lib/emojiData";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useDeleteMessage,
  useMarkRead,
  useUnreadMessageCount,
  useReactions,
  useToggleReaction,
  useEditMessage,
} from "../../hooks/useMessages";
import { useE2EKeys, useSharedKey } from "../../hooks/useE2E";
import { encryptMessage, decryptMessage, sanitizeContent, MAX_MSG_LENGTH } from "../../lib/e2e";
import { supabase } from "../../lib/supabase";
import "../../styles/floating-chat.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function initial(name) {
  return (name || "?")[0].toUpperCase();
}

// ── Mini avatar ───────────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl, size = 32, online = false }) {
  return (
    <div className="fc-avatar-wrap" style={{ width: size, height: size }}>
      {avatarUrl ? (
        <img className="fc-avatar" src={avatarUrl} alt={name} width={size} height={size} style={{ width: size, height: size }} />
      ) : (
        <div className="fc-avatar fc-avatar--fallback" style={{ width: size, height: size, fontSize: size * 0.38 }}>
          {initial(name)}
        </div>
      )}
      {online && <span className="fc-online-dot" />}
    </div>
  );
}

// ── Emoji picker (full-width, anchored to bottom of panel) ───────────────────

function EmojiPicker({ onSelect, onClose }) {
  const [tab, setTab] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className="fc-emoji-picker" ref={ref}>
      <div className="fc-emoji-tabs">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={i}
            className={`fc-emoji-tab${tab === i ? " fc-emoji-tab--active" : ""}`}
            onClick={() => setTab(i)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="fc-emoji-grid">
        {EMOJI_CATEGORIES[tab].emojis.map(em => (
          <button key={em} className="fc-emoji-btn" onClick={() => onSelect(em)}>
            {em}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatDay(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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

function groupReactions(reactions, messageId) {
  const grouped = {};
  reactions.filter(r => r.message_id === messageId).forEach(r => {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, users: [] };
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push(r.user_id);
  });
  return grouped;
}

const REACTION_EMOJIS = ["👍","❤️","😂","😮","😢","🔥","🙏","👏"];

// ── FC Reaction picker ────────────────────────────────────────────────────────

function FCReactionPicker({ onPick, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return (
    <div className="fc-reaction-picker" ref={ref}>
      {REACTION_EMOJIS.map(em => (
        <button key={em} className="fc-reaction-picker-btn" onClick={() => { onPick(em); onClose(); }}>{em}</button>
      ))}
    </div>
  );
}

// ── FC Message bubble ─────────────────────────────────────────────────────────

function FCBubble({ msg, isMine, allMessages, reactions, userId, onDelete, onReply, onEdit, onToggleReaction, isLast }) {
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
      className={`fc-bubble-wrap${isMine ? " fc-bubble-wrap--mine" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactPicker(false); }}
    >
      {!isMine && <Avatar name={msg.sender?.display_name} avatarUrl={msg.sender?.avatar_url} size={22} />}

      <div style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", gap: 2, minWidth: 0 }}>
        {replyOrig && (
          <div className="fc-quoted">
            <div className="fc-quoted-bar" />
            <div className="fc-quoted-body">
              <span className="fc-quoted-name">{replyOrig.sender?.display_name || "User"}</span>
              <span className="fc-quoted-text">{(replyOrig.content?.startsWith("enc:") ? "🔒 Encrypted" : replyOrig.content || "").slice(0, 50)}</span>
            </div>
          </div>
        )}

        <div className={`fc-bubble${isMine ? " fc-bubble--mine" : ""}`} title={formatTime(msg.created_at)}>
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
            <span>{msg.content}</span>
          )}
          <div className="fc-bubble-footer">
            <span className="fc-bubble-time">{formatTime(msg.created_at)}</span>
            {msg.edited_at && <span className="fc-edited-label">edited</span>}
            {isMine && <span className="fc-status-ticks">{isLast ? "✓✓" : "✓"}</span>}
          </div>
        </div>

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

      {showActions && !editing && (
        <div className={`fc-bubble-actions${isMine ? " fc-bubble-actions--mine" : ""}`}>
          <div style={{ position: "relative" }}>
            <button className="fc-action-btn" title="React" onClick={() => setShowReactPicker(s => !s)}>😊</button>
            {showReactPicker && (
              <FCReactionPicker
                onPick={(em) => onToggleReaction(msg.id, em)}
                onClose={() => setShowReactPicker(false)}
              />
            )}
          </div>
          <button className="fc-action-btn" title="Reply" onClick={() => onReply(msg)}>↩</button>
          {isMine && (
            <>
              <button className="fc-action-btn" title="Edit" onClick={() => { setEditing(true); setEditText(msg.content); }}>✎</button>
              <button className="fc-action-btn fc-action-btn--danger" title="Delete" onClick={() => onDelete(msg.id)}>✕</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Mini thread ───────────────────────────────────────────────────────────────

function MiniThread({ conv, user, keyPair, onBack }) {
  const { data: messages = [], isLoading } = useMessages(conv.conversation_id);
  const sendMessage = useSendMessage(conv.conversation_id);
  const deleteMessage = useDeleteMessage(conv.conversation_id);
  const editMessage = useEditMessage(conv.conversation_id);
  const markRead = useMarkRead(conv.conversation_id, user.id);
  const { data: reactions = [] } = useReactions(conv.conversation_id);
  const toggleReaction = useToggleReaction(conv.conversation_id);
  const { sharedKey } = useSharedKey(keyPair, conv.other_user_id);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [decryptedMessages, setDecryptedMessages] = useState([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
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
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + em.length, start + em.length);
    });
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
          content: sharedKey ? await decryptMessage(msg.content, sharedKey) : msg.content,
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
        const others = Object.entries(state)
          .filter(([key]) => key !== user.id)
          .flatMap(([, p]) => p);
        const other = others.find(p => p.user_id === conv.other_user_id);
        setIsOtherOnline(!!other);
        setIsOtherTyping(!!other?.typing);
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (key === conv.other_user_id) setIsOtherOnline(true);
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key === conv.other_user_id) { setIsOtherOnline(false); setIsOtherTyping(false); }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id, typing: false });
        }
      });
    presenceChannelRef.current = channel;
    return () => { supabase.removeChannel(channel); presenceChannelRef.current = null; };
  }, [conv.conversation_id, user.id, conv.other_user_id]);

  function broadcastTyping(typing) {
    presenceChannelRef.current?.track({ user_id: user.id, typing });
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
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
    if (e.key === "Escape" && replyTo) setReplyTo(null);
  }

  const items = groupByDay(decryptedMessages);
  const myLastMsgIdx = decryptedMessages.reduce((acc, m, i) => m.sender_id === user.id ? i : acc, -1);

  return (
    <div className="fc-thread">
      <div className="fc-thread-header">
        <button className="fc-back-btn" onClick={onBack}>←</button>
        <Avatar
          name={conv.other_display_name}
          avatarUrl={conv.other_avatar_url}
          size={28}
          online={isOtherOnline}
        />
        <div className="fc-thread-header-info">
          <span className="fc-thread-name">{conv.other_display_name || "User"}</span>
          {isOtherTyping
            ? <span className="fc-typing-label">typing…</span>
            : isOtherOnline && <span className="fc-typing-label" style={{ fontStyle: "normal" }}>● online</span>
          }
        </div>
      </div>

      <div className="fc-messages">
        {isLoading ? (
          <p className="fc-empty">Loading…</p>
        ) : decryptedMessages.length === 0 ? (
          <p className="fc-empty">Say hello! 👋</p>
        ) : (
          items.map((item, idx) => {
            if (item.type === "day") {
              return <div key={item.key} className="fc-day-divider"><span>{item.label}</span></div>;
            }
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
                onDelete={(id) => deleteMessage.mutate(id)}
                onReply={(msg) => { setReplyTo(msg); inputRef.current?.focus(); }}
                onEdit={(id, content) => editMessage.mutate({ messageId: id, content })}
                onToggleReaction={(id, emoji) => toggleReaction.mutate({ messageId: id, emoji, userId: user.id })}
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
        {showEmoji && (
          <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />
        )}
        {replyTo && (
          <div className="fc-reply-preview">
            <div className="fc-reply-preview-bar" />
            <div className="fc-reply-preview-content">
              <span className="fc-reply-preview-name">{replyTo.sender?.display_name || "User"}</span>
              <span className="fc-reply-preview-text">
                {(replyTo.content?.startsWith("enc:") ? "🔒 Encrypted" : replyTo.content || "").slice(0, 60)}
              </span>
            </div>
            <button className="fc-reply-preview-cancel" onClick={() => setReplyTo(null)}>✕</button>
          </div>
        )}
        <form className="fc-composer" onSubmit={handleSend}>
          <button
            type="button"
            className="fc-emoji-toggle"
            onClick={() => setShowEmoji(v => !v)}
            title="Emoji"
          >
            😊
          </button>
          <input
            ref={inputRef}
            className="fc-input"
            placeholder="Message…"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_MSG_LENGTH}
            autoFocus
          />
          <button className="fc-send-btn" type="submit" disabled={!input.trim() || sendMessage.isPending}>➤</button>
        </form>
      </div>
    </div>
  );
}

// ── Conversation list ─────────────────────────────────────────────────────────

function ConvList({ conversations, currentUserId, onSelect, onlineUsers }) {
  return (
    <div className="fc-conv-list">
      {conversations.length === 0 ? (
        <p className="fc-empty">No conversations yet.</p>
      ) : (
        conversations.map(conv => {
          const isUnread = conv.unread_count > 0;
          const isOnline = onlineUsers.has(conv.other_user_id);
          const isMine = conv.last_message_sender_id === currentUserId;
          const preview = conv.last_message_content?.startsWith("enc:")
            ? "🔒 Encrypted message"
            : conv.last_message_content;
          return (
            <button key={conv.conversation_id} className="fc-conv-item" onClick={() => onSelect(conv)}>
              <Avatar
                name={conv.other_display_name}
                avatarUrl={conv.other_avatar_url}
                size={36}
                online={isOnline}
              />
              <div className="fc-conv-info">
                <div className="fc-conv-header">
                  <span className={`fc-conv-name${isUnread ? " fc-conv-name--unread" : ""}`}>
                    {conv.other_display_name || "User"}
                  </span>
                  {conv.last_message_at && (
                    <span className="fc-conv-time">{timeAgo(conv.last_message_at)}</span>
                  )}
                </div>
                <span className="fc-conv-preview">
                  {preview ? `${isMine ? "You: " : ""}${preview}` : "No messages yet"}
                </span>
              </div>
              {isUnread && <span className="fc-unread-dot">{conv.unread_count}</span>}
            </button>
          );
        })
      )}
    </div>
  );
}

// ── Main floating chat ────────────────────────────────────────────────────────

export default function FloatingChat({ user, navigate, initialConvId = null, initialConvName = null, initialConvAvatar = null }) {
  const [open, setOpen] = useState(!!initialConvId);
  const [activeConv, setActiveConv] = useState(
    initialConvId
      ? { conversation_id: initialConvId, other_display_name: initialConvName, other_avatar_url: initialConvAvatar, other_user_id: null }
      : null
  );
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { data: conversations = [], isLoading } = useConversations();
  const { data: unreadCount = 0 } = useUnreadMessageCount();
  const { keyPair } = useE2EKeys(user.id);
  const panelRef = useRef(null);

  // Global presence for online dots in conversation list
  useEffect(() => {
    if (!user.id) return;
    const channel = supabase.channel("fc-global-presence", {
      config: { presence: { key: user.id } },
    });
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

  function openFullMessages() {
    setOpen(false);
    navigate("messages", activeConv ? {
      conversationId: activeConv.conversation_id,
      otherDisplayName: activeConv.other_display_name,
      otherAvatarUrl: activeConv.other_avatar_url,
    } : {});
  }

  return (
    <div className="fc-root" ref={panelRef}>
      {open && (
        <div className="fc-panel">
          <div className="fc-panel-header">
            <span className="fc-panel-title">
              {activeConv ? (activeConv.other_display_name || "Chat") : "Messages"}
            </span>
            <div className="fc-panel-header-actions">
              <button className="fc-header-btn" onClick={openFullMessages} title="Open full view">⤢</button>
              <button className="fc-header-btn" onClick={() => setOpen(false)} title="Close">✕</button>
            </div>
          </div>

          {activeConv ? (
            <MiniThread
              conv={activeConv}
              user={user}
              keyPair={keyPair}
              onBack={() => setActiveConv(null)}
            />
          ) : (
            isLoading ? (
              <p className="fc-empty" style={{ padding: "24px" }}>Loading…</p>
            ) : (
              <ConvList
                conversations={conversations}
                currentUserId={user.id}
                onSelect={setActiveConv}
                onlineUsers={onlineUsers}
              />
            )
          )}
        </div>
      )}

      <button
        className="fc-fab"
        onClick={() => setOpen(o => !o)}
        title="Messages"
      >
        💬
        {unreadCount > 0 && (
          <span className="fc-fab-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>
    </div>
  );
}
