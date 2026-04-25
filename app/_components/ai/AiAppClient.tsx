"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../src/lib/supabase";
import PublicNav from "../PublicNav";
import PublicFooter from "../PublicFooter";
import AiSidebar, { type Conversation } from "./AiSidebar";
import AiChatView from "./AiChatView";
import AiLanding from "./AiLanding";

type AuthState = "loading" | "anon" | "authed";

export default function AiAppClient() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const conversationId = params?.id ?? null;

  const [auth, setAuth] = useState<AuthState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Auth detection ─────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        setAuth("authed");
        setUserId(session.user.id);
      } else {
        setAuth("anon");
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuth("authed");
        setUserId(session.user.id);
      } else {
        setAuth("anon");
        setUserId(null);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ── Conversation list (authed only) ────────────────────────────────────
  const refreshConversations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const res = await fetch("/api/ai-conversations", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { conversations: Conversation[] };
      setConversations(data.conversations);
    } catch { /* silent — list refresh shouldn't break the chat */ }
  };

  useEffect(() => {
    if (auth === "authed") refreshConversations();
  }, [auth, conversationId]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleNewChat = () => {
    setDrawerOpen(false);
    router.push("/ai");
  };

  const handleSelectConversation = (id: string) => {
    setDrawerOpen(false);
    router.push(`/ai/${id}`);
  };

  const handleConversationCreated = (id: string, title: string) => {
    // Optimistically prepend so the sidebar updates instantly
    setConversations((prev) => [
      { id, title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ...prev.filter((c) => c.id !== id),
    ]);
    router.push(`/ai/${id}`);
  };

  const handleDeleteConversation = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      await fetch(`/api/ai-conversations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) router.push("/ai");
    } catch { /* silent */ }
  };

  const handleRenameConversation = async (id: string, title: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const res = await fetch(`/api/ai-conversations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) return;
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c)),
      );
    } catch { /* silent */ }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (auth === "loading") {
    return (
      <>
        <PublicNav />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-sm text-slate-500">Loading…</div>
        </div>
      </>
    );
  }

  // ── Anon: marketing landing ────────────────────────────────────────────
  if (auth === "anon") {
    return (
      <>
        <PublicNav />
        <AiLanding />
        <PublicFooter />
      </>
    );
  }

  // ── Authed: chat shell ─────────────────────────────────────────────────
  return (
    <div className="flex h-[100dvh] flex-col bg-white dark:bg-[#0d0820]">
      {/* Top bar — slimmer than PublicNav, with drawer toggle on mobile */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-[#160f2e]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            className="inline-flex size-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 lg:hidden dark:text-slate-200 dark:hover:bg-white/5"
            aria-label="Toggle conversation list"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50">
            <span aria-hidden className="inline-flex size-6 items-center justify-center rounded-md bg-violet-600 text-[10px] font-black text-white">JW</span>
            JW Study
          </Link>
          <span className="ml-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">AI</span>
        </div>
        <button
          type="button"
          onClick={handleNewChat}
          className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New chat
        </button>
      </header>

      {/* Body — sidebar + chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (always visible ≥lg, drawer on mobile) */}
        <AiSidebar
          conversations={conversations}
          activeId={conversationId}
          drawerOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSelect={handleSelectConversation}
          onDelete={handleDeleteConversation}
          onRename={handleRenameConversation}
        />

        {/* Main chat area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <AiChatView
            key={conversationId ?? "new"}
            conversationId={conversationId}
            userId={userId!}
            onConversationCreated={handleConversationCreated}
          />
        </main>
      </div>
    </div>
  );
}
