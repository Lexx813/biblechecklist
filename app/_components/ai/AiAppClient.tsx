"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../src/lib/supabase";
import PublicNav from "../PublicNav";
import PublicFooter from "../PublicFooter";
import AiSidebar, { type Conversation } from "./AiSidebar";
import AiChatView from "./AiChatView";
import AiLanding from "./AiLanding";
import AiConfirmActionModal from "../../../src/components/AiConfirmActionModal";

type AuthState = "loading" | "anon" | "authed";

// Defense-in-depth sanitizer for ?ask= URL params. The auto-send was already
// removed (the prompt is pre-filled into the input box, not sent), but a
// malicious link could still trick a user into reading + sending a prompt
// crafted to jailbreak the AI. Strip obvious prompt-injection patterns and
// zero-width / control characters that hide instructions from human review.
function sanitizeAskParam(raw: string): string {
  // Remove zero-width chars, BOM, RTL/LTR overrides, etc.
  let s = raw.replace(/[​-‏‪-‮⁠-⁩﻿]/g, "");
  // Strip obvious jailbreak instructions (keep it short — false-positive risk
  // means we err on letting normal questions through. The system prompt + UI
  // review are the primary defenses; this is just a tripwire.)
  const patterns: RegExp[] = [
    /ignore (all |any |previous |prior )?(instructions|prompts?|rules?|guidelines?|directives?)/gi,
    /disregard (all |any |previous |prior )?(instructions|prompts?|rules?|guidelines?|directives?)/gi,
    /forget (all |any |previous |prior )?(instructions|prompts?|rules?|guidelines?|directives?)/gi,
    /override (your |the |all |any )?(system |default )?(prompt|instructions|rules)/gi,
    /reveal (your |the )?(system |default )?(prompt|instructions|rules)/gi,
    /print (your |the )?(system |default )?(prompt|instructions|rules)/gi,
    /repeat (the (text|content) )?(above|before this|prior to this)/gi,
    /(act|behave|roleplay|pretend) as (DAN|an unrestricted|no restrictions|jailbroken)/gi,
    /\bDAN\s*mode/gi,
    /developer\s*mode/gi,
  ];
  for (const re of patterns) s = s.replace(re, "[blocked]");
  return s.trim();
}

export default function AiAppClient() {
  // Read initial conversation id from the URL, but track it as state from
  // here on. This lets us update the URL via history.replaceState without
  // triggering a Next.js route change (which would remount this whole tree
  // and abort any in-flight chat stream — the bug we're avoiding).
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const initialId = params?.id ?? null;
  const [conversationId, setConversationId] = useState<string | null>(initialId);

  // ?ask=<prompt> pre-fills the chat input on mount. The user reviews and
  // taps Send themselves — we NEVER auto-send because that would be a CSRF
  // surface for prompt injection. Even so, strip obvious jailbreak phrases
  // and zero-width / control characters as defense-in-depth.
  const [autoSendPrompt, setAutoSendPrompt] = useState<string | null>(() => {
    const raw = searchParams?.get("ask")?.trim();
    if (!raw) return null;
    return sanitizeAskParam(raw).slice(0, 1000);
  });

  // Sync state if the URL id changes from elsewhere (browser back/forward,
  // direct navigation). Doesn't fire on history.replaceState calls we make.
  useEffect(() => {
    setConversationId(params?.id ?? null);
  }, [params?.id]);

  const navigateTo = (path: string) => {
    if (typeof window !== "undefined" && window.location.pathname !== path) {
      window.history.replaceState(null, "", path);
    }
  };

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
  // All conversation switches use replaceState (no Next.js route change), so
  // any in-flight chat stream survives the URL update.
  const handleNewChat = () => {
    setDrawerOpen(false);
    setConversationId(null);
    navigateTo("/ai");
  };

  const handleSelectConversation = (id: string) => {
    setDrawerOpen(false);
    setConversationId(id);
    navigateTo(`/ai/${id}`);
  };

  const handleConversationCreated = (id: string, title: string) => {
    // Optimistically prepend so the sidebar updates instantly
    setConversations((prev) => [
      { id, title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ...prev.filter((c) => c.id !== id),
    ]);
    setConversationId(id);
    navigateTo(`/ai/${id}`);
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
      if (conversationId === id) {
        setConversationId(null);
        navigateTo("/ai");
      }
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
    <div className="ai-app flex h-[100dvh] flex-col bg-white dark:bg-[#0d0820]">
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

        {/* Hard confirmation modal for destructive AI actions (delete_note, …) */}
        <AiConfirmActionModal />

        {/* Main chat area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <AiChatView
            conversationId={conversationId}
            userId={userId!}
            onConversationCreated={handleConversationCreated}
            autoSendPrompt={autoSendPrompt}
            onAutoSendConsumed={() => {
              setAutoSendPrompt(null);
              // Strip ?ask= from URL once consumed so a refresh doesn't re-send
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                if (url.searchParams.has("ask")) {
                  url.searchParams.delete("ask");
                  window.history.replaceState(null, "", url.pathname + url.search);
                }
              }
            }}
          />
        </main>
      </div>
    </div>
  );
}
