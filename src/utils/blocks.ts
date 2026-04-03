// Pure helper for building the blocked user set — no Supabase dependency.
export function buildBlockedSet(
  rows: { blocker_id: string; blocked_id: string }[],
  myId: string
): Set<string> {
  const set = new Set<string>();
  for (const row of rows) {
    const other = row.blocker_id === myId ? row.blocked_id : row.blocker_id;
    set.add(other);
  }
  return set;
}
