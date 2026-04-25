import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";

interface Props {
  onOpenAI: (conversationId?: string) => void;
  onMeetingPrep: () => void;
}

type BriefState =
  | { status: "loading" }
  | { status: "dismissed" }
  | { status: "error" }
  | { status: "ready"; text: string };

export default function DailyBriefCard({ onOpenAI, onMeetingPrep }: Props) {
  const [state, setState] = useState<BriefState>({ status: "loading" });
  const [lastConvId, setLastConvId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setState({ status: "error" }); return; }

      const res = await fetch("/api/daily-brief", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) { setState({ status: "error" }); return; }

      const data = (await res.json()) as { brief: string | null; dismissed?: boolean };

      if (data.dismissed || !data.brief) {
        setState({ status: "dismissed" });
        return;
      }

      setState({ status: "ready", text: data.brief });

      // Fetch last conversation id for "continue chat" link
      const convRes = await fetch("/api/ai-conversations", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (convRes.ok) {
        const convData = (await convRes.json()) as { conversations: Array<{ id: string }> };
        setLastConvId(convData.conversations[0]?.id ?? null);
      }
    } catch {
      setState({ status: "error" });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dismiss = async () => {
    setState({ status: "dismissed" });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch("/api/daily-brief", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    } catch { /* silent */ }
  };

  if (state.status === "dismissed" || state.status === "error") return null;

  if (state.status === "loading") {
    return (
      <div className="daily-brief-card daily-brief-card--loading" aria-hidden>
        <div className="daily-brief-shimmer" />
        <div className="daily-brief-shimmer daily-brief-shimmer--short" />
      </div>
    );
  }

  return (
    <div className="daily-brief-card" role="region" aria-label="Your daily brief">
      {/* Dismiss */}
      <button
        className="daily-brief-dismiss"
        onClick={dismiss}
        aria-label="Dismiss today's brief"
        title="Dismiss until tomorrow"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Sparkle icon */}
      <div className="daily-brief-icon" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z"/>
          <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z"/>
        </svg>
      </div>

      {/* Brief text */}
      <p className="daily-brief-text">{state.text}</p>

      {/* Action bridges */}
      <div className="daily-brief-actions">
        <button
          className="daily-brief-action daily-brief-action--primary"
          onClick={() => onOpenAI(lastConvId ?? undefined)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {lastConvId ? "Continue chat" : "Open AI"}
        </button>
        <button
          className="daily-brief-action"
          onClick={onMeetingPrep}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Meeting prep
        </button>
      </div>
    </div>
  );
}
