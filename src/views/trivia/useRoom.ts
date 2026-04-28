import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { subscribeWithMonitor } from "../../lib/realtime";
import type { TriviaRoom, TriviaPlayer, ActiveQuestion } from "../../lib/trivia/types";

export interface RoomState {
  room: TriviaRoom | null;
  players: TriviaPlayer[];
  currentQuestion: ActiveQuestion | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRoom(roomId: string | null): RoomState {
  const [state, setState] = useState<Omit<RoomState, "refresh">>({
    room: null,
    players: [],
    currentQuestion: null,
    loading: true,
    error: null,
  });

  const roomRef = useRef<TriviaRoom | null>(null);

  const fetchQuestion = useCallback(async (room: TriviaRoom) => {
    const ids: string[] = room.selected_question_ids ?? [];
    const qId = ids[room.current_question_index];
    if (!qId) {
      setState((s) => ({ ...s, currentQuestion: null }));
      return;
    }
    const { data } = await supabase
      .from("trivia_questions")
      .select("id, question, options, correct_index, scripture_ref, difficulty, category")
      .eq("id", qId)
      .single();
    if (data) {
      setState((s) => ({
        ...s,
        currentQuestion: {
          id: data.id,
          question: data.question,
          options: data.options,
          correct_index: data.correct_index,
          book_reference: data.scripture_ref ?? null,  // map scripture_ref → book_reference
          difficulty: data.difficulty,
          is_custom: false,
        },
      }));
    }
  }, []);

  // Expose a refresh that re-fetches room + question directly (bypasses realtime)
  const refresh = useCallback(async () => {
    if (!roomId) return;
    const [{ data: room }, { data: players }] = await Promise.all([
      supabase.from("trivia_rooms").select("*").eq("id", roomId).single(),
      supabase.from("trivia_players").select("*").eq("room_id", roomId).order("joined_at"),
    ]);
    if (!room) return;
    roomRef.current = room as TriviaRoom;
    setState((s) => ({
      ...s,
      room: room as TriviaRoom,
      players: (players ?? []) as TriviaPlayer[],
    }));
    if (room.status === "playing") {
      await fetchQuestion(room as TriviaRoom);
    }
  }, [roomId, fetchQuestion]);

  useEffect(() => {
    if (!roomId) return;

    let channel: ReturnType<typeof supabase.channel>;

    async function init() {
      const { data: room, error } = await supabase
        .from("trivia_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (error || !room) {
        setState((s) => ({ ...s, loading: false, error: "Room not found" }));
        return;
      }

      roomRef.current = room as TriviaRoom;

      const { data: players } = await supabase
        .from("trivia_players")
        .select("*")
        .eq("room_id", roomId)
        .order("joined_at");

      setState((s) => ({
        ...s,
        room: room as TriviaRoom,
        players: (players ?? []) as TriviaPlayer[],
        loading: false,
      }));

      if (room.status === "playing") {
        await fetchQuestion(room as TriviaRoom);
      }

      channel = supabase
        .channel(`trivia_room:${roomId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "trivia_rooms", filter: `id=eq.${roomId}` },
          async (payload) => {
            const updated = payload.new as TriviaRoom;
            roomRef.current = updated;
            setState((s) => ({ ...s, room: updated }));
            if (updated.status === "playing") {
              await fetchQuestion(updated);
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "trivia_players", filter: `room_id=eq.${roomId}` },
          async () => {
            const { data: players } = await supabase
              .from("trivia_players")
              .select("*")
              .eq("room_id", roomId)
              .order("joined_at");
            setState((s) => ({ ...s, players: (players ?? []) as TriviaPlayer[] }));
          }
        );
      // Live multiplayer is the most fragile place for a silent dropout —
      // a frozen room state means a half-dead game with no signal.
      subscribeWithMonitor(channel, `trivia-room:${roomId}`, (status) => {
        if (status !== "SUBSCRIBED") {
          setState((s) => ({ ...s, error: "Reconnecting…" }));
        } else {
          setState((s) => (s.error === "Reconnecting…" ? { ...s, error: null } : s));
          // Re-pull state on reconnect.
          refresh();
        }
      });
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [roomId, fetchQuestion]);

  return { ...state, refresh };
}
