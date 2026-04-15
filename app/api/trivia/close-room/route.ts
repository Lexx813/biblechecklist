import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { room_id } = await req.json();

  if (!room_id) {
    return NextResponse.json({ error: "room_id required" }, { status: 400 });
  }

  await supabase
    .from("trivia_rooms")
    .update({ status: "finished" })
    .eq("id", room_id)
    .in("status", ["lobby", "playing"]);

  return NextResponse.json({ ok: true });
}
