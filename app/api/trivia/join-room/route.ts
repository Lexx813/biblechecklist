import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { room_code, display_name, team, user_id, avatar_url } = await req.json();

  if (!room_code || !display_name || !team) {
    return NextResponse.json({ error: "room_code, display_name, and team required" }, { status: 400 });
  }

  const { data: room, error: roomErr } = await supabase
    .from("trivia_rooms")
    .select("*")
    .eq("room_code", room_code.toUpperCase())
    .in("status", ["lobby", "playing"])
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: "Room not found or already finished" }, { status: 404 });
  }

  if (user_id) {
    const { data: existing } = await supabase
      .from("trivia_players")
      .select("id")
      .eq("room_id", room.id)
      .eq("user_id", user_id)
      .single();
    if (existing) {
      return NextResponse.json({ error: "Already in this room" }, { status: 409 });
    }
  }

  const { data: player, error: playerErr } = await supabase
    .from("trivia_players")
    .insert({
      room_id: room.id,
      user_id: user_id ?? null,
      name: display_name,
      display_name,
      team,
      is_host: false,
      avatar_url: avatar_url ?? null,
    })
    .select()
    .single();

  if (playerErr || !player) {
    return NextResponse.json({ error: playerErr?.message ?? "Failed to join room" }, { status: 500 });
  }

  return NextResponse.json({ room, player });
}
