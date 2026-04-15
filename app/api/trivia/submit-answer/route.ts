import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { room_id, player_id, answer_index } = await req.json();

  if (!room_id || !player_id || answer_index === undefined) {
    return NextResponse.json({ error: "room_id, player_id, and answer_index required" }, { status: 400 });
  }

  const { data: room } = await supabase
    .from("trivia_rooms")
    .select("*")
    .eq("id", room_id)
    .single();

  if (!room || room.status !== "playing") {
    return NextResponse.json({ error: "Game not in progress" }, { status: 400 });
  }

  const { data: player } = await supabase
    .from("trivia_players")
    .select("team")
    .eq("id", player_id)
    .eq("room_id", room_id)
    .single();

  if (!player) {
    return NextResponse.json({ error: "Player not found in room" }, { status: 404 });
  }

  const questionIds: string[] = room.selected_question_ids ?? [];
  const currentId = questionIds[room.current_question_index];
  if (!currentId) {
    return NextResponse.json({ error: "No current question" }, { status: 400 });
  }

  const { data: question } = await supabase
    .from("trivia_questions")
    .select("correct_index")
    .eq("id", currentId)
    .single();

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 500 });
  }

  const is_correct = answer_index === question.correct_index;

  await supabase.from("trivia_game_log").insert({
    room_id,
    question_id: currentId,
    team: player.team,
    is_correct,
  });

  // Update score (if correct) + signal that an answer is pending review
  const newScore = is_correct
    ? (player.team === "A" ? room.team_a_score + 1 : room.team_b_score + 1)
    : null;
  const scoreField = is_correct ? (player.team === "A" ? "team_a_score" : "team_b_score") : null;
  const scoreUpdate = scoreField && newScore !== null ? { [scoreField]: newScore } : {};

  // Check if this correct answer hits the points_to_win target
  const pointsTarget: number = room.points_to_win ?? 0;
  const game_over = pointsTarget > 0 && newScore !== null && newScore >= pointsTarget;

  const { data: updatedRoom } = await supabase
    .from("trivia_rooms")
    .update({
      ...scoreUpdate,
      pending_next: true,
      last_answer_index: answer_index,
      ...(game_over ? { status: "finished" } : {}),
    })
    .eq("id", room_id)
    .select()
    .single();

  const r = updatedRoom ?? room;
  return NextResponse.json({
    is_correct,
    correct_index: question.correct_index,
    team_a_score: r.team_a_score,
    team_b_score: r.team_b_score,
    game_over,
  });
}
