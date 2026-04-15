import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function randomCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function sendTriviaInvites(
  hostUserId: string,
  hostName: string,
  friendIds: string[],
  roomId: string,
  roomCode: string,
  questionCount: number,
  timeLimitSeconds: number,
  hasTimer: boolean,
  pointsToWin: number,
) {
  if (!friendIds.length || !hostUserId) return;

  const inviteData = {
    room_id: roomId,
    room_code: roomCode,
    host_name: hostName,
    question_count: questionCount,
    time_limit_seconds: timeLimitSeconds,
    has_timer: hasTimer,
    points_to_win: pointsToWin,
  };

  for (const friendId of friendIds) {
    try {
      await Promise.all([
        // Notification
        supabase.from("notifications").insert({
          user_id: friendId,
          type: "trivia_invite",
          data: inviteData,
          read: false,
        }),

        // DM message
        (async () => {
          // Find existing direct conversation between host and friend
          const { data: hostConvs } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("user_id", hostUserId);

          const hostConvIds = (hostConvs ?? []).map((r: { conversation_id: string }) => r.conversation_id);

          let conversationId: string | null = null;

          if (hostConvIds.length > 0) {
            const { data: shared } = await supabase
              .from("conversation_participants")
              .select("conversation_id")
              .eq("user_id", friendId)
              .in("conversation_id", hostConvIds)
              .limit(1)
              .single();
            conversationId = shared?.conversation_id ?? null;
          }

          // Create DM conversation if none exists
          if (!conversationId) {
            const { data: newConv } = await supabase
              .from("conversations")
              .insert({ type: "direct" })
              .select("id")
              .single();
            if (newConv) {
              conversationId = newConv.id;
              await supabase.from("conversation_participants").insert([
                { conversation_id: conversationId, user_id: hostUserId },
                { conversation_id: conversationId, user_id: friendId },
              ]);
            }
          }

          if (!conversationId) return;

          await supabase.from("messages").insert({
            conversation_id: conversationId,
            sender_id: hostUserId,
            content: "I challenged you to a Bible Trivia Battle!",
            message_type: "trivia_invite",
            metadata: inviteData,
          });
        })(),
      ]);
    } catch (err) {
      console.error(`[trivia-invite] failed for friend ${friendId}:`, err);
    }
  }
}

export async function POST(req: NextRequest) {
  const { display_name, team, user_id, avatar_url, question_count = 10, time_limit_seconds = 30, player_count = 2, has_timer = true, points_to_win = 0, invited_friend_ids = [] } = await req.json();

  if (!display_name || !team) {
    return NextResponse.json({ error: "display_name and team required" }, { status: 400 });
  }

  // Generate a unique room code
  let room_code = randomCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from("trivia_rooms")
      .select("id")
      .eq("room_code", room_code)
      .eq("status", "lobby")
      .single();
    if (!existing) break;
    room_code = randomCode();
  }

  const { data: room, error: roomErr } = await supabase
    .from("trivia_rooms")
    .insert({
      room_code,
      host_id: user_id ?? null,
      status: "lobby",
      current_question_index: 0,
      current_team: "A",
      team_a_score: 0,
      team_b_score: 0,
      time_limit_seconds,
      question_count,
      allow_custom: true,
      player_count,
      has_timer,
      points_to_win,
      selected_question_ids: [],
    })
    .select()
    .single();

  if (roomErr || !room) {
    return NextResponse.json({ error: roomErr?.message ?? "Failed to create room" }, { status: 500 });
  }

  const { data: player, error: playerErr } = await supabase
    .from("trivia_players")
    .insert({
      room_id: room.id,
      user_id: user_id ?? null,
      name: display_name,
      display_name,
      team,
      is_host: true,
      avatar_url: avatar_url ?? null,
    })
    .select()
    .single();

  if (playerErr || !player) {
    return NextResponse.json({ error: playerErr?.message ?? "Failed to add player" }, { status: 500 });
  }

  // Send invites best-effort — never blocks room creation
  if ((invited_friend_ids as string[]).length > 0 && user_id) {
    sendTriviaInvites(
      user_id,
      display_name,
      invited_friend_ids as string[],
      room.id,
      room_code,
      question_count,
      time_limit_seconds,
      has_timer,
      points_to_win,
    ).catch((e) => console.error("[trivia-invite] unexpected error:", e));
  }

  return NextResponse.json({ room, player });
}
