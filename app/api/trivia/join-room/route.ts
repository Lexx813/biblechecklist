import { NextRequest, NextResponse } from "next/server";
import { resolveAuthedUserId, getServiceClient } from "../_auth";

const SAFE_HTTPS_URL = /^https:\/\/[^\s<>"'`\\]+$/i;

export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  const authedUserId = await resolveAuthedUserId(req);
  const body = await req.json();
  const { room_code, team, user_id: bodyUserId } = body;

  const display_name = typeof body.display_name === "string"
    ? body.display_name.trim().slice(0, 40)
    : "";
  const avatar_url = typeof body.avatar_url === "string" && SAFE_HTTPS_URL.test(body.avatar_url)
    ? body.avatar_url.slice(0, 500)
    : null;

  if (!room_code || !display_name || !team) {
    return NextResponse.json({ error: "room_code, display_name, and team required" }, { status: 400 });
  }
  if (team !== "A" && team !== "B") {
    return NextResponse.json({ error: "Invalid team" }, { status: 400 });
  }
  if (typeof room_code !== "string" || !/^[A-Z0-9]{4,10}$/i.test(room_code)) {
    return NextResponse.json({ error: "Invalid room_code" }, { status: 400 });
  }

  if (bodyUserId && bodyUserId !== authedUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user_id = authedUserId;

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
    console.error("[trivia.join-room] player insert failed", { message: playerErr?.message });
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }

  return NextResponse.json({ room, player });
}
