"use client";

import { useState, useEffect } from "react";

/**
 * Hydrates the community stats (user count + chapters read) on the client.
 * Falls back to server-provided userCount initially, then fetches live data.
 */
export default function CommunityStats({ serverUserCount }: { serverUserCount: number }) {
  const [stats, setStats] = useState({ users: serverUserCount, chaptersRead: 0 });

  useEffect(() => {
    import("../../../src/lib/supabase").then(({ supabase }) => {
      Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.rpc("get_global_chapter_count").maybeSingle(),
      ]).then(([{ count }, { data: chapters }]) => {
        setStats({
          users: Math.max(count ?? serverUserCount, 500),
          chaptersRead: (chapters as number) ?? 0,
        });
      }).catch(() => {});
    });
  }, [serverUserCount]);

  return (
    <p className="m-0 flex items-center gap-[7px] text-[13px] text-[var(--lp-muted)]">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      {stats.users.toLocaleString()}+ publishers worldwide
      {stats.chaptersRead > 0 && ` · ${stats.chaptersRead.toLocaleString()} chapters read`}
    </p>
  );
}
