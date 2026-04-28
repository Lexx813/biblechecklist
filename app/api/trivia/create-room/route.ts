import { NextRequest, NextResponse } from "next/server";
import { resolveAuthedUserId, getServiceClient } from "../_auth";

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
  const supabase = getServiceClient();

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE_HTTPS_URL = /^https:\/\/[^\s<>"'`\\]+$/i;

export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  const authedUserId = await resolveAuthedUserId(req);
  const body = await req.json();
  const {
    team,
    user_id: bodyUserId,
    question_count = 10,
    time_limit_seconds = 30,
    player_count = 2,
    has_timer = true,
    points_to_win = 0,
    invited_friend_ids = [],
  } = body;

  // ── Input validation ───────────────────────────────────────────────────────
  const display_name = typeof body.display_name === "string"
    ? body.display_name.trim().slice(0, 40)
    : "";
  const avatar_url = typeof body.avatar_url === "string" && SAFE_HTTPS_URL.test(body.avatar_url)
    ? body.avatar_url.slice(0, 500)
    : null;

  if (!display_name || !team) {
    return NextResponse.json({ error: "display_name and team required" }, { status: 400 });
  }
  if (team !== "A" && team !== "B") {
    return NextResponse.json({ error: "Invalid team" }, { status: 400 });
  }
  if (!Number.isInteger(question_count) || question_count < 1 || question_count > 100) {
    return NextResponse.json({ error: "Invalid question_count" }, { status: 400 });
  }
  if (!Number.isInteger(time_limit_seconds) || time_limit_seconds < 5 || time_limit_seconds > 300) {
    return NextResponse.json({ error: "Invalid time_limit_seconds" }, { status: 400 });
  }
  if (!Number.isInteger(player_count) || player_count < 2 || player_count > 10) {
    return NextResponse.json({ error: "Invalid player_count" }, { status: 400 });
  }
  if (!Number.isInteger(points_to_win) || points_to_win < 0 || points_to_win > 100) {
    return NextResponse.json({ error: "Invalid points_to_win" }, { status: 400 });
  }
  if (!Array.isArray(invited_friend_ids) || invited_friend_ids.length > 20) {
    return NextResponse.json({ error: "Invalid invited_friend_ids" }, { status: 400 });
  }

  // A user_id in the body is only honored if it matches the authenticated user.
  // Guests (no auth token) get host_id=null.
  if (bodyUserId && bodyUserId !== authedUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user_id = authedUserId;

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
    console.error("[trivia.create-room] room insert failed", { message: roomErr?.message });
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
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
    console.error("[trivia.create-room] player insert failed", { message: playerErr?.message });
    return NextResponse.json({ error: "Failed to add player" }, { status: 500 });
  }

  // Send invites best-effort — never blocks room creation.
  // Every invited id must (a) be a valid UUID and (b) be an actual accepted friend
  // of the host. Otherwise an attacker could spam notifications/DMs to any user.
  if ((invited_friend_ids as string[]).length > 0 && user_id) {
    const candidates = (invited_friend_ids as unknown[])
      .filter((id): id is string => typeof id === "string" && UUID_RE.test(id));

    if (candidates.length > 0) {
      const { data: friendships } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .eq("status", "accepted")
        .or(
          `and(user_id.eq.${user_id},friend_id.in.(${candidates.join(",")})),` +
          `and(friend_id.eq.${user_id},user_id.in.(${candidates.join(",")}))`,
        );
      const verified = new Set<string>();
      for (const row of friendships ?? []) {
        const other = row.user_id === user_id ? row.friend_id : row.user_id;
        if (other) verified.add(other);
      }
      const safeFriends = candidates.filter((id) => verified.has(id));
      if (safeFriends.length > 0) {
        sendTriviaInvites(
          user_id,
          display_name,
          safeFriends,
          room.id,
          room_code,
          question_count,
          time_limit_seconds,
          has_timer,
          points_to_win,
        ).catch((e) => console.error("[trivia-invite] unexpected error:", e));
      }
    }
  }

  return NextResponse.json({ room, player });
}
