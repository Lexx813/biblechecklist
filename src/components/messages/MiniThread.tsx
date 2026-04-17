import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  useMessages, useSendMessage, useDeleteMessage, useMarkRead,
  useReactions, useToggleReaction, useEditMessage, useToggleStar,
  useLinkPreviews, useUploadImage,
} from "../../hooks/useMessages";
import { useMarkConversationNotificationsRead as useMarkMessageNotificationsRead } from "../../hooks/useNotifications";
import { useSharedKey } from "../../hooks/useE2E";
import { encryptMessage, decryptMessage, sanitizeContent, MAX_MSG_LENGTH } from "../../lib/e2e";
import { supabase } from "../../lib/supabase";
import { Avatar, EmojiPicker, VersePicker, PlanPicker, ConvSettingsPanel, StarredPanel, SearchPanel, PushPrompt, FCImageWarningModal } from "./ChatWidgets";
import { FCBubble } from "./FCBubble";
import { groupByDay, timeAgo, PUSH_DISMISS_KEY, computePosition } from "./chatHelpers";

interface Conversation {
  conversation_id: string;
  other_display_name?: string | null;
  other_avatar_url?: string | null;
  other_user_id?: string | null;
  last_message_at?: string | null;
  last_message_content?: string | null;
  last_message_type?: string | null;
  last_message_sender_id?: string | null;
  unread_count?: number;
}

interface User {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

// ── Mini thread ───────────────────────────────────────────────────────────────

export function MiniThread({ conv, user, keyPair, onBack, accentColor, onAccentChange }: {
  conv: Conversation;
  user: User;
  keyPair: null;
  onBack: () => void;
  accentColor: string | null;
  onAccentChange: (color: string | null) => void;
}) {
  const { t } = useTranslation();
  const { data: messages = [], isLoading } = useMessages(conv.conversation_id);
  const sendMessage = useSendMessage(conv.conversation_id);
  const deleteMessage = useDeleteMessage(conv.conversation_id);
  const editMessage = useEditMessage(conv.conversation_id);
  const markRead = useMarkRead(conv.conversation_id, user.id);
  const markNotifRead = useMarkMessageNotificationsRead(user.id);
  const { data: reactions = [] } = useReactions(conv.conversation_id);
  const toggleReaction = useToggleReaction(conv.conversation_id);
  const toggleStar = useToggleStar(conv.conversation_id, user.id);
  const { data: linkPreviews = [] } = useLinkPreviews(conv.conversation_id);
  const { uploading, uploadAndSend } = useUploadImage(conv.conversation_id);
  const { sharedKey } = useSharedKey(keyPair, conv.other_user_id ?? null, user.id);

  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<typeof messages[0] | null>(null);
  const [decryptedMessages, setDecryptedMessages] = useState<typeof messages>([]);
  const decryptCacheRef = useRef(new Map<string, string>());
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [showVersePicker, setShowVersePicker] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStarred, setShowStarred] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(() => {
    try {
      const until = localStorage.getItem(PUSH_DISMISS_KEY);
      return until ? Date.now() >= Number(until) : true;
    } catch { return true; }
  });
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [failedPayload, setFailedPayload] = useState<Record<string, unknown> | null>(null);
  const [showNewMsgChip, setShowNewMsgChip] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingBroadcastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const insertEmoji = useCallback((em: string) => {
    const el = inputRef.current;
    if (!el) { setInput(v => v + em); setShowEmoji(false); return; }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const next = input.slice(0, start) + em + input.slice(end);
    setInput(next);
    setShowEmoji(false);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + em.length, start + em.length); });
  }, [input]);

  useEffect(() => {
    if (sendTimeoutRef.current) { clearTimeout(sendTimeoutRef.current); sendTimeoutRef.current = null; }
    setSendError(null);
    setFailedPayload(null);
    markRead.mutate(conv.conversation_id);
    markNotifRead.mutate(conv.conversation_id);
    decryptCacheRef.current.clear();
  }, [conv.conversation_id]);

  useEffect(() => {
    return () => {
      if (sendTimeoutRef.current) { clearTimeout(sendTimeoutRef.current); sendTimeoutRef.current = null; }
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      const el = messagesRef.current;
      if (!el) { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); return; }
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distFromBottom <= 100) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowNewMsgChip(false);
      } else {
        setShowNewMsgChip(true);
      }
    });
  }, [decryptedMessages.length]);

  useEffect(() => {
    if (!messages.length) { setDecryptedMessages((prev) => prev.length ? [] : prev); return; }
    let cancelled = false;
    const cache = decryptCacheRef.current;
    async function decrypt() {
      const results = await Promise.all(
        messages.map(async (msg) => {
          const cacheKey = `${msg.id}:${msg.edited_at ?? ""}:${msg.content}`;
          if (cache.has(cacheKey)) return { ...msg, content: cache.get(cacheKey) as string };
          const decrypted = msg.message_type === "text" && sharedKey
            ? await decryptMessage(msg.content ?? "", sharedKey)
            : msg.content?.startsWith("enc:") ? "[🔒 Encrypted message]" : msg.content;
          cache.set(cacheKey, decrypted ?? "");
          if (cache.size > 500) {
            const firstKey = cache.keys().next().value;
            if (firstKey !== undefined) cache.delete(firstKey);
          }
          return { ...msg, content: decrypted ?? "" };
        })
      );
      if (!cancelled) setDecryptedMessages(results);
    }
    decrypt();
    return () => { cancelled = true; };
  }, [messages, sharedKey]);

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
          .flatMap(([, p]) => p) as unknown as Array<{ user_id: string; typing?: boolean }>;
        const other = others.find(p => p.user_id === conv.other_user_id);
        setIsOtherOnline(!!other);
        setIsOtherTyping(!!(other?.typing));
      })
      .on("presence", { event: "join" }, ({ key }: { key: string }) => { if (key === conv.other_user_id) setIsOtherOnline(true); })
      .on("presence", { event: "leave" }, ({ key }: { key: string }) => { if (key === conv.other_user_id) { setIsOtherOnline(false); setIsOtherTyping(false); } })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") await channel.track({ user_id: user.id, typing: false });
      });
    presenceChannelRef.current = channel;
    return () => { supabase.removeChannel(channel); presenceChannelRef.current = null; };
  }, [conv.conversation_id, user.id, conv.other_user_id]);

  function broadcastTyping(typing: boolean) { presenceChannelRef.current?.track({ user_id: user.id, typing }); }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    if (typingBroadcastRef.current) clearTimeout(typingBroadcastRef.current);
    typingBroadcastRef.current = setTimeout(() => {
      broadcastTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => broadcastTyping(false), 2000);
    }, 300);
  }

  async function doSend(payload: Record<string, unknown>) {
    setSendError(null);
    setFailedPayload(null);
    if (sendTimeoutRef.current) clearTimeout(sendTimeoutRef.current);
    sendTimeoutRef.current = setTimeout(() => {
      if (sendMessage.isPending) setSendError("Message failed to send. Check your connection.");
    }, 15_000);
    sendMessage.mutate(payload as unknown as Parameters<typeof sendMessage.mutate>[0], {
      onSuccess: () => {
        if (sendTimeoutRef.current) { clearTimeout(sendTimeoutRef.current); sendTimeoutRef.current = null; }
      },
      onError: () => {
        if (sendTimeoutRef.current) { clearTimeout(sendTimeoutRef.current); sendTimeoutRef.current = null; }
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
      recipientId: conv.other_user_id,
      content: toSend,
      replyToId: replyTo?.id ?? null,
      messageType: "text",
    };
    doSend(payload);
    setInput("");
    setReplyTo(null);
    broadcastTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); }
    if (e.key === "Escape" && replyTo) setReplyTo(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImageFile(file);
    e.target.value = "";
  }

  function handlePaste(e: React.ClipboardEvent) {
    const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith("image/"));
    if (!item) return;
    const file = item.getAsFile();
    if (file) setPendingImageFile(file);
  }

  function handleMessagesScroll() {
    const el = messagesRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom <= 100) setShowNewMsgChip(false);
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
      recipientId: conv.other_user_id,
      content: verseData.ref as string,
      replyToId: replyTo?.id ?? null,
      messageType: "verse",
      metadata: verseData,
    } as unknown as Parameters<typeof sendMessage.mutate>[0]);
    setReplyTo(null);
  }

  function sendPlan(planData: Record<string, unknown>) {
    sendMessage.mutate({
      senderId: user.id,
      recipientId: conv.other_user_id,
      content: planData.title as string,
      replyToId: null,
      messageType: "reading_plan",
      metadata: planData,
    } as unknown as Parameters<typeof sendMessage.mutate>[0]);
  }

  const items = useMemo(() => groupByDay(decryptedMessages as unknown as Array<{ created_at: string } & Record<string, unknown>>, t), [decryptedMessages, t]);
  const myLastMsgIdx = useMemo(() => decryptedMessages.reduce((acc, m, i) => m.sender_id === user.id ? i : acc, -1), [decryptedMessages, user.id]);
  const accentStyle = (accentColor ? { "--conv-accent": accentColor } : {}) as React.CSSProperties;

  if (showStarred) return <StarredPanel convId={conv.conversation_id} userId={user.id} onClose={() => setShowStarred(false)} />;
  if (showSearch) return <SearchPanel convId={conv.conversation_id} onClose={() => setShowSearch(false)} />;

  return (
    <div className="fc-thread" style={accentStyle}>
      <div className="fc-thread-header">
        <button className="fc-back-btn" onClick={onBack} aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <Avatar name={conv.other_display_name} avatarUrl={conv.other_avatar_url} size={28} online={isOtherOnline} />
        <div className="fc-thread-header-info">
          <span className="fc-thread-name">{conv.other_display_name || t("messages.user")}</span>
          {isOtherTyping
            ? <span className="fc-typing-label">{t("messages.typing")}</span>
            : isOtherOnline && <span className="fc-typing-label" style={{ fontStyle: "normal" }}>{t("messages.onlineDot")}</span>
          }
        </div>
        <div className="fc-thread-header-actions">
          <button className="fc-header-icon-btn" data-tip="Search" aria-label="Search messages" onClick={() => setShowSearch(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </button>
          <button className={`fc-header-icon-btn${showStarred ? " fc-header-icon-btn--active" : ""}`} data-tip="Starred" aria-label="Starred messages" onClick={() => setShowStarred(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={showStarred ? "goldenrod" : "none"} stroke={showStarred ? "goldenrod" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
          <button className={`fc-header-icon-btn${showSettings ? " fc-header-icon-btn--active" : ""}`} data-tip="Settings" aria-label="Chat settings" onClick={() => setShowSettings(s => !s)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
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

      <div className="fc-messages" ref={messagesRef} onPaste={handlePaste} onScroll={handleMessagesScroll}>
        {isLoading ? (
          <p className="fc-empty">{t("common.loading")}</p>
        ) : decryptedMessages.length === 0 ? (
          <p className="fc-empty">{t("messages.sayHello")} 👋</p>
        ) : (
          items.map((item, idx) => {
            if (item.type === "day") return <div key={item.key as string} className="fc-day-divider"><span>{item.label as string}</span></div>;
            const isMine = item.sender_id === user.id;
            const origIdx = decryptedMessages.findIndex(m => m.id === item.id);
            return (
              <FCBubble
                key={item.id as string}
                msg={item as unknown as Parameters<typeof FCBubble>[0]["msg"]}
                isMine={isMine as boolean}
                allMessages={decryptedMessages}
                reactions={reactions}
                userId={user.id}
                linkPreviews={linkPreviews}
                accentColor={accentColor}
                position={computePosition(decryptedMessages, origIdx)}
                onDelete={(id) => deleteMessage.mutate(id)}
                onReply={(msg) => { setReplyTo(msg as unknown as typeof replyTo); inputRef.current?.focus(); }}
                onEdit={(id, content, onDone, onFail) =>
                  editMessage.mutate({ messageId: id, content }, { onSuccess: onDone, onError: onFail })
                }
                onToggleReaction={(id, emoji) => toggleReaction.mutate({ messageId: id, emoji, userId: user.id })}
                onStar={(id) => toggleStar.mutate(id)}
                isLast={origIdx === myLastMsgIdx}
              />
            );
          })
        )}
        <div className={`fc-bubble-wrap fc-typing-wrap${isOtherTyping ? "" : " fc-typing-wrap--hidden"}`}>
          <div className="fc-typing-bubble">
            <span className="fc-dot" /><span className="fc-dot" /><span className="fc-dot" />
          </div>
        </div>
        <div ref={bottomRef} />
      </div>

      {showNewMsgChip && (
        <button
          className="fc-new-msg-chip"
          onClick={() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); setShowNewMsgChip(false); }}
          type="button"
        >
          ↓ New message
        </button>
      )}

      <div className="fc-composer-wrap">
        {showPushPrompt && <PushPrompt onDismiss={() => {
          try { localStorage.setItem(PUSH_DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000)); } catch {}
          setShowPushPrompt(false);
        }} />}
        {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
        {replyTo && (
          <div className="fc-reply-preview">
            <div className="fc-reply-preview-bar" />
            <div className="fc-reply-preview-content">
              <span className="fc-reply-preview-name">{(replyTo.sender as Array<{ display_name: string | null }> | null)?.[0]?.display_name || t("messages.user")}</span>
              <span className="fc-reply-preview-text">
                {(replyTo.content?.startsWith("enc:") ? t("messages.encryptedShort") : replyTo.content || "").slice(0, 60)}
              </span>
            </div>
            <button className="fc-reply-preview-cancel" onClick={() => setReplyTo(null)} aria-label="Cancel reply">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}

        {sendError && (
          <div className="fc-send-error">
            <span>{sendError}</span>
            <button
              type="button"
              className="fc-send-retry-btn"
              onClick={() => failedPayload && doSend(failedPayload)}
              disabled={sendMessage.isPending}
            >
              Retry
            </button>
            <button type="button" className="fc-send-error-dismiss" onClick={() => { setSendError(null); setFailedPayload(null); }} aria-label="Dismiss">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}

        <form className="fc-composer" onSubmit={handleSend}>
          <div className="fc-composer-icons">
            <button
              type="button"
              className="fc-composer-icon-btn"
              onClick={() => fileRef.current?.click()}
              aria-label="Share image"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            <button
              type="button"
              className="fc-composer-icon-btn"
              onClick={() => setShowVersePicker(true)}
              aria-label="Share Bible verse"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </button>
            <button
              type="button"
              className="fc-composer-icon-btn"
              onClick={() => setShowPlanPicker(true)}
              aria-label="Share reading plan"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
          <div className="fc-input-pill">
            <input
              ref={inputRef}
              className="fc-input"
              placeholder="Aa"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              maxLength={MAX_MSG_LENGTH}
              aria-label="Type a message"
              autoFocus
            />
            <button
              type="button"
              className="fc-emoji-pill-btn"
              onClick={() => setShowEmoji(v => !v)}
              aria-label="Emoji"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </button>
          </div>
          <button
            className="fc-send-btn"
            type="submit"
            disabled={sendMessage.isPending || uploading}
            aria-label={input.trim() ? "Send" : "Like"}
          >
            {uploading ? (
              <span className="fc-upload-spinner" aria-label="Uploading" />
            ) : input.trim() ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" stroke="none"/>
              </svg>
            ) : (
              <span style={{ fontSize: "18px", lineHeight: 1 }}>👍</span>
            )}
          </button>
        </form>

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

// ── Conversation list ─────────────────────────────────────────────────────────

export function ConvList({ conversations, currentUserId, onSelect, onDelete, onlineUsers, onCompose }: {
  conversations: Conversation[];
  currentUserId: string;
  onSelect: (conv: Conversation) => void;
  onDelete: (id: string) => void;
  onlineUsers: Set<string>;
  onCompose?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="fc-conv-list" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
      {conversations.length === 0 ? (
        <p className="fc-empty">{t("messages.noConversationsShort")}</p>
      ) : (
        conversations.map(conv => {
          const isUnread = (conv.unread_count ?? 0) > 0;
          const isOnline = onlineUsers.has(conv.other_user_id ?? "");
          const isMine = conv.last_message_sender_id === currentUserId;
          const isSpecial = conv.last_message_type && conv.last_message_type !== "text";
          const preview = isSpecial
            ? conv.last_message_type === "verse" ? "📖 Bible verse"
            : conv.last_message_type === "image" ? "🖼 Image"
            : conv.last_message_type === "reading_plan" ? "📅 Reading plan"
            : conv.last_message_content
            : conv.last_message_content?.startsWith("enc:")
              ? t("messages.encrypted")
              : conv.last_message_content;
          return (
            <div key={conv.conversation_id} className={`fc-conv-item${isUnread ? " fc-conv-item--unread" : ""}`} onClick={() => onSelect(conv)}>
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
      {onCompose && (
        <div className="fc-compose-footer">
          <button className="fc-compose-btn" onClick={onCompose}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            New conversation
          </button>
        </div>
      )}
    </div>
  );
}
