// Pure helper for building the blocked user set — no Supabase dependency.
export function buildBlockedSet(
  rows: { blocker_id: string; blocked_id: string }[],
  myId: string
): Set<string> {
  const set = new Set<string>();
  for (const row of rows) {
    if (row.blocker_id === myId) {
      set.add(row.blocked_id);
    } else if (row.blocked_id === myId) {
      set.add(row.blocker_id);
    }
  }
  return set;
}
