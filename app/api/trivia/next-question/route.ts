import { NextRequest, NextResponse } from "next/server";
import { resolveAuthedUserId, getServiceClient } from "../_auth";

export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  const authedUserId = await resolveAuthedUserId(req);
  const { room_id, player_id } = await req.json();

  if (!room_id || !player_id) {
    return NextResponse.json({ error: "room_id and player_id required" }, { status: 400 });
  }

  const { data: player } = await supabase
    .from("trivia_players")
    .select("is_host, user_id")
    .eq("id", player_id)
    .eq("room_id", room_id)
    .single();

  if (!player?.is_host) {
    return NextResponse.json({ error: "Only the host can advance questions" }, { status: 403 });
  }
  if (player.user_id && player.user_id !== authedUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: room } = await supabase
    .from("trivia_rooms")
    .select("*")
    .eq("id", room_id)
    .single();

  if (!room || room.status !== "playing") {
    return NextResponse.json({ error: "Game not in progress" }, { status: 400 });
  }

  const questionIds: string[] = room.selected_question_ids ?? [];
  const nextIndex = room.current_question_index + 1;

  if (nextIndex >= questionIds.length) {
    const { data: updated } = await supabase
      .from("trivia_rooms")
      .update({ status: "finished" })
      .eq("id", room_id)
      .select()
      .single();
    return NextResponse.json({ room: updated, game_over: true });
  }

  const nextTeam = room.current_team === "A" ? "B" : "A";

  const { data: updated } = await supabase
    .from("trivia_rooms")
    .update({ current_question_index: nextIndex, current_team: nextTeam, pending_next: false, last_answer_index: null })
    .eq("id", room_id)
    .select()
    .single();

  return NextResponse.json({ room: updated, game_over: false, current_question_index: nextIndex });
}
