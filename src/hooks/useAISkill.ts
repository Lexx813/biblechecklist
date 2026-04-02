// @ts-nocheck
import { useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

/**
 * Hook for streaming Claude AI Bible study skills from /api/ai-skills.
 *
 * Usage:
 *   const { text, loading, error, run, reset } = useAISkill();
 *   run("prayer", { situation: "I'm struggling with anxiety" });
 *   run("character", { character: "Moses" });
 */
export function useAISkill() {
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const abortRef              = useRef(null);

  const run = useCallback(async (skill, context = {}) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setText("");
    setError(null);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in to use AI skills.");

      const res = await fetch("/api/ai-skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ skill, ...context }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "Unknown error");
        throw new Error(msg);
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") return;
          try {
            const evt = JSON.parse(raw);
            if (
              evt.type === "content_block_delta" &&
              evt.delta?.type === "text_delta"
            ) {
              setText(prev => prev + evt.delta.text);
            }
          } catch {
            // skip malformed SSE chunks
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Something went wrong. Please try again.");
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

  return { text, loading, error, run, reset };
}
