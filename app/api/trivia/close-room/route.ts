import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveAuthedUserId } from "../_auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const authedUserId = await resolveAuthedUserId(req);
  const { room_id } = await req.json();

  if (!room_id) {
    return NextResponse.json({ error: "room_id required" }, { status: 400 });
  }

  // Only the host may close a room. Load the room and verify caller = host.
  const { data: room } = await supabase
    .from("trivia_rooms")
    .select("host_id, status")
    .eq("id", room_id)
    .single();

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Host identity check: authed user must match room.host_id.
  // Guest-hosted rooms (host_id=null) can only be closed by an authed caller
  // who is the host player in that room.
  if (room.host_id) {
    if (!authedUserId || authedUserId !== room.host_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    if (!authedUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: hostPlayer } = await supabase
      .from("trivia_players")
      .select("id")
      .eq("room_id", room_id)
      .eq("user_id", authedUserId)
      .eq("is_host", true)
      .single();
    if (!hostPlayer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  await supabase
    .from("trivia_rooms")
    .update({ status: "finished" })
    .eq("id", room_id)
    .in("status", ["lobby", "playing"]);

  return NextResponse.json({ ok: true });
}
