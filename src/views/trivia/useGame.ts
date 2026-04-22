import { useState } from "react";
import type { AnswerResult } from "../../lib/trivia/types";

interface GameActions {
  submitting: boolean;
  lastResult: AnswerResult | null;
  submitAnswer: (roomId: string, playerId: string, answerIndex: number) => Promise<AnswerResult | null>;
  startGame: (roomId: string, playerId: string) => Promise<boolean>;
  nextQuestion: (roomId: string, playerId: string) => Promise<{ game_over: boolean }>;
  clearResult: () => void;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import("../../lib/supabase");
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export function useGame(): GameActions {
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);

  async function startGame(roomId: string, playerId: string) {
    const res = await fetch("/api/trivia/start-game", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...await authHeaders() },
      body: JSON.stringify({ room_id: roomId, player_id: playerId }),
    });
    return res.ok;
  }

  async function submitAnswer(roomId: string, playerId: string, answerIndex: number) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/trivia/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...await authHeaders() },
        body: JSON.stringify({ room_id: roomId, player_id: playerId, answer_index: answerIndex }),
      });
      if (!res.ok) return null;
      const result: AnswerResult = await res.json();
      setLastResult(result);
      return result;
    } finally {
      setSubmitting(false);
    }
  }

  async function nextQuestion(roomId: string, playerId: string): Promise<{ game_over: boolean }> {
    const res = await fetch("/api/trivia/next-question", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...await authHeaders() },
      body: JSON.stringify({ room_id: roomId, player_id: playerId }),
    });
    if (!res.ok) return { game_over: false };
    const data = await res.json();
    return { game_over: data.game_over ?? false };
  }

  function clearResult() {
    setLastResult(null);
  }

  return { submitting, lastResult, submitAnswer, startGame, nextQuestion, clearResult };
}
