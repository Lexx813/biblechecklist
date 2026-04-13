import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../../components/ConfirmModal";
import { NewConversationModal } from "../../components/NewConversationModal";
import { useConversations, useDeleteConversation } from "../../hooks/useMessages";
import { useE2EKeys } from "../../hooks/useE2E";
import { supabase } from "../../lib/supabase";
import "../../styles/messages.css";
import { ConversationListPanel, type Conversation } from "./ConversationListPanel";
import { ThreadView } from "./MessageThreadPanel";

// ── Types ─────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface MessagesPageProps {
  user: User;
  navigate: (page: string, params?: Record<string, unknown>) => void;
  darkMode?: boolean;
  setDarkMode?: (v: boolean) => void;
  i18n?: unknown;
  onLogout?: () => void;
  onBack?: (() => void) | null;
  initialConv?: Conversation | null;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MessagesPage({
  user, navigate, onBack = null, initialConv = null, isPremium = true, onUpgrade,
}: MessagesPageProps) {
  const { t } = useTranslation();
  const { data: conversations = [], isLoading } = useConversations();
  const [activeConv, setActiveConv] = useState<Conversation | null>(() => {
    if (initialConv) return initialConv;
    try {
      const saved = sessionStorage.getItem("msg:activeConv");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [convToDelete, setConvToDelete] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set<string>());
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
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") await channel.track({ user_id: user.id });
      });
    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  // Persist active conversation across reloads
  useEffect(() => {
    try {
      if (activeConv) sessionStorage.setItem("msg:activeConv", JSON.stringify(activeConv));
      else sessionStorage.removeItem("msg:activeConv");
    } catch {}
  }, [activeConv]);

  // Respond to prop-driven navigation (e.g. clicking a notification while already on this page)
  useEffect(() => {
    if (initialConv?.conversation_id) {
      setActiveConv(initialConv);
      history.replaceState(null, "", `/messages/${initialConv.conversation_id}`);
    }
  }, [initialConv?.conversation_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Upgrade stub conv with full data once list loads
  useEffect(() => {
    if (!activeConv || !conversations.length) return;
    const full = conversations.find(c => c.conversation_id === activeConv.conversation_id);
    if (full) setActiveConv(full as Conversation);
  }, [conversations]); // eslint-disable-line react-hooks/exhaustive-deps

  function openConv(conv: Conversation | null) {
    setActiveConv(conv);
    history.replaceState(null, "", conv ? `/messages/${conv.conversation_id}` : "/messages");
  }

  function confirmDelete() {
    deleteConversation.mutate(convToDelete!, {
      onSuccess: () => {
        if (activeConv?.conversation_id === convToDelete) openConv(null);
        setConvToDelete(null);
      },
    });
  }

  const showList = !activeConv;

  return (
    <>
      <div className="msg-layout">
        <ConversationListPanel
          conversations={conversations as Conversation[]}
          isLoading={isLoading}
          activeConvId={activeConv?.conversation_id ?? null}
          currentUserId={user.id}
          onSelectConv={conv => openConv(conv)}
          onDeleteConv={id => setConvToDelete(id)}
          onlineUsers={onlineUsers}
          onBack={() => (onBack ?? (() => navigate("home")))()}
          onNewConv={() => setShowCompose(true)}
          hiddenOnMobile={!showList}
        />

        <main className={`msg-main${showList ? " msg-main--hidden-mobile" : ""}`}>
          {activeConv ? (
            <ThreadView
              conv={activeConv}
              user={user}
              keyPair={keyPair}
              onBack={() => openConv(null)}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              navigate={navigate}
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

      {showCompose && (
        <NewConversationModal
          userId={user.id}
          isPremium={isPremium}
          onClose={() => setShowCompose(false)}
          navigate={navigate}
          onUpgrade={onUpgrade}
        />
      )}
    </>
  );
}
