import { useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

/**
 * Hook for streaming AI Bible study explanations from /api/ai-explain.
 *
 * Usage:
 *   const { text, loading, error, ask, reset } = useAICompanion();
 *   ask("John 3:16", "What does 'eternal life' mean here?");
 */
export function useAICompanion() {
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const abortRef              = useRef<AbortController | null>(null);

  const ask = useCallback(async (passage: string, question: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setText("");
    setError(null);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in to use AI Study Companion.");

      const res = await fetch("/api/ai-explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ passage, question }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "Unknown error");
        throw new Error(msg);
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // hold back incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") return;
          try {
            const evt = JSON.parse(raw) as { type: string; delta?: { type: string; text: string } };
            if (
              evt.type === "content_block_delta" &&
              evt.delta?.type === "text_delta"
            ) {
              setText(prev => prev + evt.delta!.text);
            }
          } catch {
            // skip malformed SSE chunks
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setText("");
    setError(null);
    setLoading(false);
  }, []);

  return { text, loading, error, ask, reset };
}
