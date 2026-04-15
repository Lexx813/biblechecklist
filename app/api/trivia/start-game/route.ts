import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { room_id, player_id } = await req.json();

  if (!room_id || !player_id) {
    return NextResponse.json({ error: "room_id and player_id required" }, { status: 400 });
  }

  const { data: player } = await supabase
    .from("trivia_players")
    .select("is_host")
    .eq("id", player_id)
    .eq("room_id", room_id)
    .single();

  if (!player?.is_host) {
    return NextResponse.json({ error: "Only the host can start the game" }, { status: 403 });
  }

  const { data: room } = await supabase
    .from("trivia_rooms")
    .select("status, question_count")
    .eq("id", room_id)
    .single();

  if (!room || room.status !== "lobby") {
    return NextResponse.json({ error: "Room not in lobby state" }, { status: 400 });
  }

  const { data: allQuestions } = await supabase
    .from("trivia_questions")
    .select("id")
    .order("id");

  if (!allQuestions || allQuestions.length === 0) {
    return NextResponse.json({ error: "No questions available" }, { status: 500 });
  }

  const ids = allQuestions.map((q) => q.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const selected = ids.slice(0, Math.min(room.question_count, ids.length));

  const { data: updated, error } = await supabase
    .from("trivia_rooms")
    .update({
      status: "playing",
      current_question_index: 0,
      current_team: "A",
      team_a_score: 0,
      team_b_score: 0,
      selected_question_ids: selected,
    })
    .eq("id", room_id)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Failed to start game" }, { status: 500 });
  }

  return NextResponse.json({ room: updated });
}
