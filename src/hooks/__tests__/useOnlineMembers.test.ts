// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";

vi.mock("../../lib/supabase", () => ({ supabase: {} }));

import { splitByOnlineStatus, ONLINE_THRESHOLD_MS } from "../useOnlineMembers";

const NOW = 1_700_000_000_000;

function makeTs(msAgo: number) {
  return new Date(NOW - msAgo).toISOString();
}

describe("splitByOnlineStatus", () => {
  it("puts users active within threshold into onlineNow", () => {
    const members = [
      { id: "1", display_name: "Alice", avatar_url: null, last_active_at: makeTs(5 * 60 * 1000) },
    ];
    const { onlineNow, recentlyActive } = splitByOnlineStatus(members, NOW);
    expect(onlineNow).toHaveLength(1);
    expect(recentlyActive).toHaveLength(0);
  });

  it("puts users active past threshold into recentlyActive", () => {
    const members = [
      { id: "2", display_name: "Bob", avatar_url: null, last_active_at: makeTs(ONLINE_THRESHOLD_MS + 1) },
    ];
    const { onlineNow, recentlyActive } = splitByOnlineStatus(members, NOW);
    expect(onlineNow).toHaveLength(0);
    expect(recentlyActive).toHaveLength(1);
  });

  it("excludes members with null last_active_at from both lists", () => {
    const members = [
      { id: "3", display_name: "Carol", avatar_url: null, last_active_at: null },
    ];
    const { onlineNow, recentlyActive } = splitByOnlineStatus(members, NOW);
    expect(onlineNow).toHaveLength(0);
    expect(recentlyActive).toHaveLength(0);
  });

  it("handles empty input", () => {
    const { onlineNow, recentlyActive } = splitByOnlineStatus([], NOW);
    expect(onlineNow).toHaveLength(0);
    expect(recentlyActive).toHaveLength(0);
  });

  it("correctly splits a mixed list, preserving order", () => {
    const members = [
      { id: "1", display_name: "Online", avatar_url: null, last_active_at: makeTs(1 * 60 * 1000) },
      { id: "2", display_name: "Recent", avatar_url: null, last_active_at: makeTs(30 * 60 * 1000) },
      { id: "3", display_name: "Never", avatar_url: null, last_active_at: null },
    ];
    const { onlineNow, recentlyActive } = splitByOnlineStatus(members, NOW);
    expect(onlineNow.map(m => m.id)).toEqual(["1"]);
    expect(recentlyActive.map(m => m.id)).toEqual(["2"]);
  });

  it("treats a user active exactly at threshold boundary as recently active", () => {
    const members = [
      { id: "4", display_name: "Edge", avatar_url: null, last_active_at: makeTs(ONLINE_THRESHOLD_MS) },
    ];
    const { onlineNow, recentlyActive } = splitByOnlineStatus(members, NOW);
    expect(onlineNow).toHaveLength(0);
    expect(recentlyActive).toHaveLength(1);
  });
});
