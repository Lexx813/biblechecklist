import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../ConfirmModal";
import {
  useConversations, useUnreadMessageCount, useDeleteConversation, useConvSettings,
} from "../../hooks/useMessages";
import { useE2EKeys } from "../../hooks/useE2E";
import { supabase } from "../../lib/supabase";
import { MiniThread, ConvList } from "./MiniThread";
import "../../styles/floating-chat.css";
import { MessageErrorBoundary } from "./MessageErrorBoundary";

interface User {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

export default function FloatingChat({ user, navigate, initialConvId = null, initialConvName = null, initialConvAvatar = null }: {
  user: User;
  navigate: (page: string, params?: Record<string, unknown>) => void;
  initialConvId?: string | null;
  initialConvName?: string | null;
  initialConvAvatar?: string | null;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(() => {
    if (initialConvId) return true;
    try { return sessionStorage.getItem("fc:open") === "1"; } catch { return false; }
  });
  const [activeConv, setActiveConv] = useState<Record<string, unknown> | null>(() => {
    if (initialConvId) return { conversation_id: initialConvId, other_display_name: initialConvName, other_avatar_url: initialConvAvatar, other_user_id: null };
    try {
      const saved = sessionStorage.getItem("fc:conv");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [onlineUsers, setOnlineUsers] = useState(new Set<string>());
  const [convToDelete, setConvToDelete] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<string | null>(null);
  const { data: conversations = [], isLoading } = useConversations();
  const { data: unreadCount = 0 } = useUnreadMessageCount();
  const deleteConversation = useDeleteConversation();
  const { keyPair } = useE2EKeys(user.id);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: convSettings } = useConvSettings(activeConv?.conversation_id as string | undefined);
  useEffect(() => {
    if (convSettings?.theme_accent !== undefined) {
      setAccentColor(convSettings.theme_accent);
    }
  }, [convSettings]);

  useEffect(() => {
    if (!user.id) return;
    const channel = supabase.channel("fc-global-presence", { config: { presence: { key: user.id } } });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineUsers(new Set(Object.keys(state).filter(k => k !== user.id)));
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") await channel.track({ user_id: user.id });
      });
    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  useEffect(() => {
    if (!activeConv || !conversations.length) return;
    const full = conversations.find(c => c.conversation_id === (activeConv as Record<string, unknown>).conversation_id);
    if (full) setActiveConv(full as unknown as Record<string, unknown>);
  }, [conversations]);

  useEffect(() => {
    try {
      if (open) sessionStorage.setItem("fc:open", "1");
      else sessionStorage.removeItem("fc:open");
    } catch {}
  }, [open]);

  useEffect(() => {
    try {
      if (activeConv) {
        sessionStorage.setItem("fc:conv", JSON.stringify({
          conversation_id: activeConv.conversation_id,
          other_display_name: activeConv.other_display_name,
          other_avatar_url: activeConv.other_avatar_url,
          other_user_id: activeConv.other_user_id ?? null,
        }));
      } else {
        sessionStorage.removeItem("fc:conv");
      }
    } catch {}
  }, [activeConv]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    const el = document.documentElement;
    if (open) {
      el.style.overflow = "hidden";
      document.body.classList.add("fc-panel-open");
    } else {
      el.style.overflow = "";
      document.body.classList.remove("fc-panel-open");
    }
    return () => {
      el.style.overflow = "";
      document.body.classList.remove("fc-panel-open");
    };
  }, [open]);

  function confirmDelete() {
    deleteConversation.mutate(convToDelete!, {
      onSuccess: () => {
        if ((activeConv as Record<string, unknown>)?.conversation_id === convToDelete) setActiveConv(null);
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

  const panelAccentStyle = (accentColor && activeConv
    ? { "--conv-accent": accentColor }
    : {}) as React.CSSProperties;

  return (
    <>
      {open && <div className="fc-backdrop" onClick={() => setOpen(false)} />}

      <div className="fc-root" ref={panelRef}>
        {open && (
          <div className="fc-panel" style={panelAccentStyle}>
            <div className="fc-panel-header" style={accentColor && activeConv ? { background: `linear-gradient(135deg, ${accentColor}, #1e1035)` } : {}}>
              <span className="fc-panel-title">
                {activeConv ? ((activeConv.other_display_name as string) || t("messages.chat")) : t("messages.title")}
              </span>
              <div className="fc-panel-header-actions">
                <button className="fc-header-btn fc-fullview-btn" onClick={openFullMessages} data-tip={t("messages.openFullView")} aria-label={t("messages.openFullView")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                </button>
                <button className="fc-header-btn" onClick={() => setOpen(false)} data-tip={t("messages.close")} aria-label={t("messages.close")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <MessageErrorBoundary>
              {activeConv ? (
                <MiniThread
                  key={(activeConv as Record<string, unknown>).conversation_id as string}
                  conv={activeConv as unknown as Parameters<typeof MiniThread>[0]["conv"]}
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
                    conversations={conversations as Parameters<typeof ConvList>[0]["conversations"]}
                    currentUserId={user.id}
                    onSelect={(conv) => { setActiveConv(conv as unknown as Record<string, unknown>); window.dispatchEvent(new Event("fc:open")); }}
                    onDelete={setConvToDelete}
                    onlineUsers={onlineUsers}
                    onCompose={openFullMessages}
                  />
                )
              )}
            </MessageErrorBoundary>
          </div>
        )}

        {!open && (
          <button className="fc-fab" onClick={() => setOpen(true)} title="Messages" aria-label="Open messages">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
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
