# Friends, Invite Links & Messaging Completion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mutual friends system, invite links with premium sponsorship, and a compose button in the inbox so users can start conversations without hunting for profiles.

**Architecture:** Three Supabase tables (`friend_requests`, `friendships`, `invite_tokens`) with RLS. A `friendsApi` module and three hooks (`useFriends`, `useFriendRequests`, `useFriendStatus`) follow the existing `followsApi`/`useFollows` pattern. New pages (`/friends`, `/friends/requests`) and a `NewConversationModal` are added to the existing SPA router. The `FriendRequestButton` component is embedded in `ProfilePage`. Premium sponsorship is enforced inside `messagesApi.getConversations` and `useSendMessage`.

**Tech Stack:** React, TypeScript (ts-nocheck), Supabase (postgres + RLS + realtime), @tanstack/react-query, existing CSS variable design system (`--bg`, `--border`, `--card-bg`, `#7c3aed` purple palette).

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `supabase/migrations/20260402_friends.sql` | All 3 tables + RLS + indexes |
| Create | `src/api/friends.ts` | All Supabase calls for friends/requests/invites |
| Create | `src/hooks/useFriends.ts` | `useFriends`, `useFriendRequests`, `useFriendStatus`, `useInviteToken` |
| Create | `src/views/friends/FriendsPage.tsx` | `/friends` — friends list + copy invite link |
| Create | `src/views/friends/FriendRequestsPage.tsx` | `/friends/requests` — incoming/outgoing requests |
| Create | `src/components/FriendRequestButton.tsx` | Profile Add Friend / Pending / Accept button |
| Create | `src/components/NewConversationModal.tsx` | Compose modal in inbox sidebar |
| Create | `src/styles/friends.css` | Styles for all new friend UI |
| Modify | `src/lib/router.ts` | Add `/friends`, `/friends/requests`, `/invite/:token` routes |
| Modify | `src/AuthedApp.tsx` | Add lazy imports + page cases for friends pages + public invite page |
| Modify | `src/views/profile/ProfilePage.tsx` | Add `FriendRequestButton` next to `MessageButton` |
| Modify | `src/views/messages/MessagesPage.tsx` | Add compose pencil icon to `msg-sidebar-header` + `NewConversationModal` |
| Modify | `src/api/messages.ts` | Add sponsored messaging check in `getOrCreateDM` |
| Modify | `src/components/notifications/NotificationItem.tsx` (or equivalent) | Handle `friend_request` notification type → route to `/friends/requests` |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260402_friends.sql`

- [ ] **Step 1: Write the migration**

```sql
-- friend_requests
create table if not exists public.friend_requests (
  id          uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id   uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at   timestamptz not null default now(),
  unique(from_user_id, to_user_id)
);

alter table public.friend_requests enable row level security;

create policy "users can read their own requests"
  on public.friend_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "users can send requests"
  on public.friend_requests for insert
  with check (auth.uid() = from_user_id);

create policy "recipients can update status"
  on public.friend_requests for update
  using (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id);

create policy "sender can delete pending request"
  on public.friend_requests for delete
  using (auth.uid() = from_user_id and status = 'pending');

create index on public.friend_requests(to_user_id, status);
create index on public.friend_requests(from_user_id, status);

-- friendships
create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  user_a_id    uuid not null references auth.users(id) on delete cascade,
  user_b_id    uuid not null references auth.users(id) on delete cascade,
  sponsored_by uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique(user_a_id, user_b_id),
  check (user_a_id < user_b_id)
);

alter table public.friendships enable row level security;

create policy "users can read their own friendships"
  on public.friendships for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

create policy "system insert only"
  on public.friendships for insert
  with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

create index on public.friendships(user_a_id);
create index on public.friendships(user_b_id);

-- invite_tokens
create table if not exists public.invite_tokens (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  token      text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

alter table public.invite_tokens enable row level security;

create policy "users can read their own token"
  on public.invite_tokens for select
  using (auth.uid() = user_id);

create policy "users can insert their own token"
  on public.invite_tokens for insert
  with check (auth.uid() = user_id);

-- public read for invite landing page (token lookup by visitors)
create policy "anyone can look up token owner"
  on public.invite_tokens for select
  using (true);
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: migration applied with no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260402_friends.sql
git commit -m "feat: add friend_requests, friendships, invite_tokens tables with RLS"
```

---

## Task 2: Friends API

**Files:**
- Create: `src/api/friends.ts`

- [ ] **Step 1: Create the API module**

```typescript
// @ts-nocheck
import { supabase } from "../lib/supabase";

export const friendsApi = {
  // ── Friend requests ──────────────────────────────────────

  sendRequest: async (toUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("friend_requests")
      .insert({ from_user_id: user.id, to_user_id: toUserId });
    if (error) throw new Error(error.message);
  },

  cancelRequest: async (toUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("friend_requests")
      .delete()
      .eq("from_user_id", user.id)
      .eq("to_user_id", toUserId)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
  },

  acceptRequest: async (fromUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Update request status
    const { error: reqErr } = await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("from_user_id", fromUserId)
      .eq("to_user_id", user.id)
      .eq("status", "pending");
    if (reqErr) throw new Error(reqErr.message);

    // Create friendship (user_a_id < user_b_id enforced)
    const [a, b] = [fromUserId, user.id].sort();
    const { error: friendErr } = await supabase
      .from("friendships")
      .insert({ user_a_id: a, user_b_id: b });
    if (friendErr && friendErr.code !== "23505") throw new Error(friendErr.message); // ignore duplicate
  },

  declineRequest: async (fromUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("friend_requests")
      .update({ status: "declined" })
      .eq("from_user_id", fromUserId)
      .eq("to_user_id", user.id)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
  },

  getIncoming: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("friend_requests")
      .select("*, sender:from_user_id(id, display_name, avatar_url)")
      .eq("to_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getOutgoing: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("friend_requests")
      .select("*, recipient:to_user_id(id, display_name, avatar_url)")
      .eq("from_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getStatus: async (targetId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "none";

    // Check friendship first
    const [a, b] = [user.id, targetId].sort();
    const { count: friendCount } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("user_a_id", a)
      .eq("user_b_id", b);
    if (friendCount > 0) return "friends";

    // Check sent request
    const { count: sentCount } = await supabase
      .from("friend_requests")
      .select("*", { count: "exact", head: true })
      .eq("from_user_id", user.id)
      .eq("to_user_id", targetId)
      .eq("status", "pending");
    if (sentCount > 0) return "pending_sent";

    // Check received request
    const { count: recvCount } = await supabase
      .from("friend_requests")
      .select("*", { count: "exact", head: true })
      .eq("from_user_id", targetId)
      .eq("to_user_id", user.id)
      .eq("status", "pending");
    if (recvCount > 0) return "pending_received";

    return "none";
  },

  // ── Friends list ─────────────────────────────────────────

  getFriends: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("friendships")
      .select(`
        id, sponsored_by, created_at,
        user_a:user_a_id(id, display_name, avatar_url, last_active_at),
        user_b:user_b_id(id, display_name, avatar_url, last_active_at)
      `)
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    // Normalize: return the "other" user with friendship metadata
    return (data ?? []).map(f => {
      const friend = f.user_a?.id === user.id ? f.user_b : f.user_a;
      return { ...friend, friendship_id: f.id, sponsored_by: f.sponsored_by, friendship_created_at: f.created_at };
    });
  },

  removeFriend: async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);
    if (error) throw new Error(error.message);
  },

  // ── Invite tokens ────────────────────────────────────────

  getOrCreateToken: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Try to get existing
    const { data: existing } = await supabase
      .from("invite_tokens")
      .select("token")
      .eq("user_id", user.id)
      .single();
    if (existing?.token) return existing.token;

    // Create new
    const { data: created, error } = await supabase
      .from("invite_tokens")
      .insert({ user_id: user.id })
      .select("token")
      .single();
    if (error) throw new Error(error.message);
    return created.token;
  },

  getInviterByToken: async (token: string) => {
    const { data, error } = await supabase
      .from("invite_tokens")
      .select("user_id, profiles:user_id(id, display_name, avatar_url)")
      .eq("token", token)
      .single();
    if (error || !data) return null;
    return data.profiles;
  },

  // Called after signup when an invite token is present in the URL
  processInviteSignup: async (token: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const inviter = await friendsApi.getInviterByToken(token);
    if (!inviter || inviter.id === user.id) return;

    // Check inviter premium status
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("subscription_status, is_admin")
      .eq("id", inviter.id)
      .single();

    const inviterIsPremium =
      inviterProfile?.is_admin ||
      ["active","trialing","gifted"].includes(inviterProfile?.subscription_status);

    // Check invitee premium status
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("subscription_status, is_admin")
      .eq("id", user.id)
      .single();

    const myIsPremium =
      myProfile?.is_admin ||
      ["active","trialing","gifted"].includes(myProfile?.subscription_status);

    // Auto-send friend request from inviter → new user
    const { error: reqErr } = await supabase
      .from("friend_requests")
      .insert({ from_user_id: inviter.id, to_user_id: user.id })
      .select();

    // If they both exist and inviter is premium and invitee is not, auto-accept and set sponsored_by
    if (!reqErr && inviterIsPremium && !myIsPremium) {
      const [a, b] = [inviter.id, user.id].sort();
      await supabase.from("friend_requests")
        .update({ status: "accepted" })
        .eq("from_user_id", inviter.id)
        .eq("to_user_id", user.id);
      await supabase.from("friendships")
        .insert({ user_a_id: a, user_b_id: b, sponsored_by: inviter.id });
    }
  },

  // ── Sponsored messaging check ────────────────────────────

  isSponsoredWith: async (otherUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const [a, b] = [user.id, otherUserId].sort();
    const { data } = await supabase
      .from("friendships")
      .select("sponsored_by")
      .eq("user_a_id", a)
      .eq("user_b_id", b)
      .single();
    return !!data?.sponsored_by;
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/api/friends.ts
git commit -m "feat: add friendsApi (requests, friends list, invite tokens, sponsorship)"
```

---

## Task 3: Friends Hooks

**Files:**
- Create: `src/hooks/useFriends.ts`

- [ ] **Step 1: Create the hooks file**

```typescript
// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { friendsApi } from "../api/friends";

export function useFriends(userId: string) {
  return useQuery({
    queryKey: ["friends", userId],
    queryFn: friendsApi.getFriends,
    enabled: !!userId,
    staleTime: 2 * 60_000,
  });
}

export function useFriendRequests(userId: string) {
  const incoming = useQuery({
    queryKey: ["friendRequests", "incoming", userId],
    queryFn: friendsApi.getIncoming,
    enabled: !!userId,
    staleTime: 30_000,
  });
  const outgoing = useQuery({
    queryKey: ["friendRequests", "outgoing", userId],
    queryFn: friendsApi.getOutgoing,
    enabled: !!userId,
    staleTime: 30_000,
  });
  return { incoming, outgoing };
}

export function useFriendStatus(userId: string, targetId: string) {
  return useQuery({
    queryKey: ["friendStatus", userId, targetId],
    queryFn: () => friendsApi.getStatus(targetId),
    enabled: !!userId && !!targetId && userId !== targetId,
    staleTime: 60_000,
  });
}

export function useInviteToken(userId: string) {
  return useQuery({
    queryKey: ["inviteToken", userId],
    queryFn: friendsApi.getOrCreateToken,
    enabled: !!userId,
    staleTime: Infinity,
  });
}

export function useSendFriendRequest(userId: string, targetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => friendsApi.sendRequest(targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendStatus", userId, targetId] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests", "outgoing", userId] });
    },
  });
}

export function useCancelFriendRequest(userId: string, targetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => friendsApi.cancelRequest(targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendStatus", userId, targetId] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests", "outgoing", userId] });
    },
  });
}

export function useAcceptFriendRequest(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fromUserId: string) => friendsApi.acceptRequest(fromUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests", "incoming", userId] });
      queryClient.invalidateQueries({ queryKey: ["friends", userId] });
    },
  });
}

export function useDeclineFriendRequest(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fromUserId: string) => friendsApi.declineRequest(fromUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests", "incoming", userId] });
    },
  });
}

export function useRemoveFriend(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => friendsApi.removeFriend(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", userId] });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useFriends.ts
git commit -m "feat: add useFriends hooks (status, requests, mutations)"
```

---

## Task 4: Friends CSS

**Files:**
- Create: `src/styles/friends.css`

- [ ] **Step 1: Create styles**

```css
/* ── Friends pages ──────────────────────────────────────────────────────────── */

/* ── Page layout ── */
.friends-page {
  max-width: 680px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.friends-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
}

.friends-page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
}

/* ── Invite link ── */
.friends-invite-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.friends-invite-btn:hover { opacity: 0.88; }
.friends-invite-btn--copied {
  background: #16a34a;
}

/* ── Friend card ── */
.friends-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.friend-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  transition: border-color 0.15s;
}
.friend-card:hover { border-color: rgba(124,58,237,0.35); }

.friend-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.friend-avatar-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed22, #7c3aed44);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #7c3aed;
  flex-shrink: 0;
}

.friend-info {
  flex: 1;
  min-width: 0;
}

.friend-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friend-progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.friend-progress-bar {
  flex: 1;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.friend-progress-fill {
  height: 100%;
  background: #7c3aed;
  border-radius: 2px;
  transition: width 0.3s;
}

.friend-progress-label {
  font-size: 11px;
  color: var(--text-muted, #888);
  white-space: nowrap;
}

.friend-last-active {
  font-size: 11px;
  color: var(--text-muted, #888);
  margin-top: 2px;
}

.friend-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.friend-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.friend-action-btn:hover {
  background: rgba(124,58,237,0.08);
  border-color: rgba(124,58,237,0.35);
}

/* ── Empty state ── */
.friends-empty {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-muted, #888);
}
.friends-empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}
.friends-empty-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
}
.friends-empty-sub {
  font-size: 13px;
}

/* ── Friend request page ── */
.freq-section {
  margin-bottom: 32px;
}

.freq-section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted, #888);
  margin-bottom: 12px;
}

.freq-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 10px;
}

.freq-card-info {
  flex: 1;
  min-width: 0;
}

.freq-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.freq-card-time {
  font-size: 11px;
  color: var(--text-muted, #888);
  margin-top: 2px;
}

.freq-card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.freq-accept-btn {
  padding: 7px 14px;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.freq-accept-btn:hover { opacity: 0.88; }

.freq-decline-btn {
  padding: 7px 14px;
  background: transparent;
  color: var(--text-muted, #888);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.freq-decline-btn:hover { background: rgba(0,0,0,0.06); }

.freq-cancel-btn {
  padding: 7px 14px;
  background: transparent;
  color: var(--text-muted, #888);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.freq-cancel-btn:hover { background: rgba(0,0,0,0.06); }

/* ── FriendRequestButton (on profiles) ── */
.pf-friend-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.pf-friend-btn--add {
  background: #7c3aed;
  border-color: #7c3aed;
  color: #fff;
}
.pf-friend-btn--add:hover { opacity: 0.88; }
.pf-friend-btn--pending { opacity: 0.6; cursor: default; }
.pf-friend-btn--friends {
  border-color: #16a34a;
  color: #16a34a;
  background: transparent;
}

/* ── NewConversationModal ── */
.new-conv-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.new-conv-modal {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0,0,0,0.35);
}

.new-conv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.new-conv-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.new-conv-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted, #888);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.new-conv-close:hover { background: var(--border); }

.new-conv-search {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
}

.new-conv-search-input {
  width: 100%;
  padding: 9px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.new-conv-search-input:focus { border-color: #7c3aed; }

.new-conv-list {
  overflow-y: auto;
  flex: 1;
  padding: 8px 0;
}

.new-conv-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  cursor: pointer;
  transition: background 0.15s;
}
.new-conv-row:hover { background: rgba(124,58,237,0.06); }

.new-conv-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.new-conv-avatar-placeholder {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed22, #7c3aed44);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  color: #7c3aed;
  flex-shrink: 0;
}
.new-conv-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

/* ── Invite landing page ── */
.invite-landing {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: var(--bg);
}
.invite-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 40px 32px;
  text-align: center;
  max-width: 380px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
}
.invite-card-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 16px;
}
.invite-card-avatar-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0 auto 16px;
}
.invite-card-heading {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}
.invite-card-sub {
  font-size: 14px;
  color: var(--text-muted, #888);
  margin-bottom: 28px;
  line-height: 1.5;
}
.invite-card-cta {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-bottom: 12px;
}
.invite-card-cta:hover { opacity: 0.88; }
.invite-card-login {
  font-size: 13px;
  color: var(--text-muted, #888);
}
.invite-card-login a {
  color: #7c3aed;
  text-decoration: none;
  font-weight: 600;
}

/* ── Compose icon in msg-sidebar-header ── */
.msg-compose-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted, #888);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
  margin-left: auto;
}
.msg-compose-btn:hover {
  background: rgba(124,58,237,0.1);
  color: #7c3aed;
}

/* ── Notification: friend_request type ── */
.notif-item--friend_request .notif-icon {
  background: rgba(124,58,237,0.12);
  color: #7c3aed;
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .friends-page { padding: 16px 12px 48px; }
  .friend-card { padding: 12px; }
  .freq-card { padding: 12px; }
  .new-conv-modal { border-radius: 12px; }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/friends.css
git commit -m "feat: add friends.css design system"
```

---

## Task 5: FriendRequestButton Component

**Files:**
- Create: `src/components/FriendRequestButton.tsx`

- [ ] **Step 1: Create the component**

```tsx
// @ts-nocheck
import { useFriendStatus, useSendFriendRequest, useCancelFriendRequest, useAcceptFriendRequest, useDeclineFriendRequest } from "../hooks/useFriends";

interface Props {
  currentUserId: string;
  targetId: string;
}

export function FriendRequestButton({ currentUserId, targetId }: Props) {
  const { data: status = "none", isLoading } = useFriendStatus(currentUserId, targetId);
  const send = useSendFriendRequest(currentUserId, targetId);
  const cancel = useCancelFriendRequest(currentUserId, targetId);
  const accept = useAcceptFriendRequest(currentUserId);
  const decline = useDeclineFriendRequest(currentUserId);

  if (!currentUserId || !targetId || currentUserId === targetId) return null;
  if (isLoading) return null;

  if (status === "friends") {
    return (
      <button className="pf-friend-btn pf-friend-btn--friends" disabled>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        Friends
      </button>
    );
  }

  if (status === "pending_sent") {
    return (
      <button
        className="pf-friend-btn pf-friend-btn--pending"
        onClick={() => cancel.mutate()}
        disabled={cancel.isPending}
      >
        Request Sent
      </button>
    );
  }

  if (status === "pending_received") {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="pf-friend-btn pf-friend-btn--add"
          onClick={() => accept.mutate(targetId)}
          disabled={accept.isPending}
        >
          Accept
        </button>
        <button
          className="pf-friend-btn"
          onClick={() => decline.mutate(targetId)}
          disabled={decline.isPending}
        >
          Decline
        </button>
      </div>
    );
  }

  // none
  return (
    <button
      className="pf-friend-btn pf-friend-btn--add"
      onClick={() => send.mutate()}
      disabled={send.isPending}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
      Add Friend
    </button>
  );
}
```

- [ ] **Step 2: Add `FriendRequestButton` to `ProfilePage.tsx`**

Find the `MessageButton` usage in `ProfilePage.tsx` (around line 440–470 where profiles show action buttons) and add `FriendRequestButton` alongside it:

```tsx
// At the top of ProfilePage.tsx, add import:
import { FriendRequestButton } from "../../components/FriendRequestButton";

// In the profile header action buttons section, alongside MessageButton:
{!isOwner && (
  <FriendRequestButton
    currentUserId={user.id}
    targetId={viewedUserId ?? user.id}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FriendRequestButton.tsx src/views/profile/ProfilePage.tsx
git commit -m "feat: add FriendRequestButton to profiles"
```

---

## Task 6: NewConversationModal

**Files:**
- Create: `src/components/NewConversationModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
// @ts-nocheck
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useFriends } from "../hooks/useFriends";
import { useGetOrCreateDM } from "../hooks/useMessages";

interface Props {
  userId: string;
  isPremium: boolean;
  onClose: () => void;
  navigate: (page: string, params?: object) => void;
  onUpgrade: () => void;
}

export function NewConversationModal({ userId, isPremium, onClose, navigate, onUpgrade }: Props) {
  const [search, setSearch] = useState("");
  const { data: friends = [] } = useFriends(userId);
  const getOrCreate = useGetOrCreateDM();

  const filtered = friends.filter(f =>
    !search || f.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(friend) {
    if (!isPremium) { onUpgrade(); return; }
    getOrCreate.mutate(friend.id, {
      onSuccess: (conversationId) => {
        onClose();
        navigate("messages", {
          conversationId,
          otherDisplayName: friend.display_name,
          otherAvatarUrl: friend.avatar_url,
        });
      },
    });
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div className="new-conv-backdrop" onClick={onClose}>
      <div className="new-conv-modal" onClick={e => e.stopPropagation()}>
        <div className="new-conv-header">
          <span className="new-conv-title">New Message</span>
          <button className="new-conv-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="new-conv-search">
          <input
            className="new-conv-search-input"
            type="search"
            placeholder="Search friends…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="new-conv-list">
          {filtered.length === 0 && (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted, #888)", fontSize: 13 }}>
              {friends.length === 0 ? "Add friends to start a conversation" : "No friends match your search"}
            </div>
          )}
          {filtered.map(friend => (
            <div
              key={friend.id}
              className="new-conv-row"
              onClick={() => handleSelect(friend)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === "Enter" && handleSelect(friend)}
            >
              {friend.avatar_url
                ? <img className="new-conv-avatar" src={friend.avatar_url} alt={friend.display_name || "User"} />
                : <div className="new-conv-avatar-placeholder">{(friend.display_name || "?")[0].toUpperCase()}</div>
              }
              <span className="new-conv-name">{friend.display_name || "Unknown"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 2: Add compose button to `MessagesPage.tsx`**

In `MessagesPage.tsx`, add the compose state and button to `msg-sidebar-header`:

```tsx
// Near the top of the MessagesPage component, add state:
const [showCompose, setShowCompose] = useState(false);

// Add import at the top of the file:
import { NewConversationModal } from "../../components/NewConversationModal";

// In the msg-sidebar-header div (around line 1332), add the compose button after the title:
<button
  className="msg-compose-btn"
  onClick={() => setShowCompose(true)}
  aria-label="New conversation"
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
</button>

// Just before the closing </div> of msg-page, add the modal:
{showCompose && (
  <NewConversationModal
    userId={user.id}
    isPremium={isPremium}
    onClose={() => setShowCompose(false)}
    navigate={navigate}
    onUpgrade={onUpgrade}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/NewConversationModal.tsx src/views/messages/MessagesPage.tsx
git commit -m "feat: add NewConversationModal and compose button to inbox"
```

---

## Task 7: FriendsPage

**Files:**
- Create: `src/views/friends/FriendsPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
// @ts-nocheck
import { useState } from "react";
import { useFriends, useInviteToken, useRemoveFriend } from "../../hooks/useFriends";
import { useGetOrCreateDM } from "../../hooks/useMessages";
import "../../styles/friends.css";

function timeAgo(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

export default function FriendsPage({ user, navigate, isPremium, onUpgrade }) {
  const { data: friends = [], isLoading } = useFriends(user.id);
  const { data: token } = useInviteToken(user.id);
  const removeFriend = useRemoveFriend(user.id);
  const getOrCreate = useGetOrCreateDM();
  const [copied, setCopied] = useState(false);

  function copyInviteLink() {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleMessage(friend) {
    if (!isPremium && !friend.sponsored_by) { onUpgrade?.(); return; }
    getOrCreate.mutate(friend.id, {
      onSuccess: (conversationId) => navigate("messages", {
        conversationId,
        otherDisplayName: friend.display_name,
        otherAvatarUrl: friend.avatar_url,
      }),
    });
  }

  return (
    <div className="friends-page">
      <div className="friends-page-header">
        <h1 className="friends-page-title">Friends</h1>
        <button
          className={`friends-invite-btn${copied ? " friends-invite-btn--copied" : ""}`}
          onClick={copyInviteLink}
          disabled={!token}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          {copied ? "Copied!" : "Copy Invite Link"}
        </button>
      </div>

      {/* Friend requests shortcut */}
      <button
        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#7c3aed", width: "100%" }}
        onClick={() => navigate("friendRequests")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        View Friend Requests
      </button>

      {isLoading && <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted, #888)", fontSize: 14 }}>Loading…</div>}

      {!isLoading && friends.length === 0 && (
        <div className="friends-empty">
          <div className="friends-empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#7c3aed", opacity: 0.5 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="friends-empty-text">No friends yet</div>
          <div className="friends-empty-sub">Share your invite link to connect with others</div>
        </div>
      )}

      <div className="friends-list">
        {friends.map(friend => {
          const lastActive = timeAgo(friend.last_active_at);
          return (
            <div key={friend.id} className="friend-card">
              {friend.avatar_url
                ? <img className="friend-avatar" src={friend.avatar_url} alt={friend.display_name || "User"} />
                : <div className="friend-avatar-placeholder">{(friend.display_name || "?")[0].toUpperCase()}</div>
              }
              <div className="friend-info">
                <div className="friend-name">{friend.display_name || "Unknown"}</div>
                {lastActive && <div className="friend-last-active">Active {lastActive}</div>}
              </div>
              <div className="friend-actions">
                <button
                  className="friend-action-btn"
                  onClick={() => handleMessage(friend)}
                  aria-label="Message"
                  title="Message"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>
                <button
                  className="friend-action-btn"
                  onClick={() => navigate("publicProfile", { userId: friend.id })}
                  aria-label="View profile"
                  title="View profile"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/friends/FriendsPage.tsx
git commit -m "feat: add FriendsPage with invite link and friend cards"
```

---

## Task 8: FriendRequestsPage

**Files:**
- Create: `src/views/friends/FriendRequestsPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
// @ts-nocheck
import { useFriendRequests, useAcceptFriendRequest, useDeclineFriendRequest, useCancelFriendRequest } from "../../hooks/useFriends";
import "../../styles/friends.css";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function FriendRequestsPage({ user, navigate }) {
  const { incoming, outgoing } = useFriendRequests(user.id);
  const accept = useAcceptFriendRequest(user.id);
  const decline = useDeclineFriendRequest(user.id);
  const cancel = useCancelFriendRequest(user.id);

  const incomingList = incoming.data ?? [];
  const outgoingList = outgoing.data ?? [];

  return (
    <div className="friends-page">
      <div className="friends-page-header">
        <button
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted, #888)", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}
          onClick={() => navigate("friends")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <h1 className="friends-page-title">Friend Requests</h1>
        <div style={{ width: 60 }} />
      </div>

      {/* Incoming */}
      <div className="freq-section">
        <div className="freq-section-label">Incoming ({incomingList.length})</div>
        {incomingList.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--text-muted, #888)", padding: "12px 0" }}>No incoming requests</div>
        )}
        {incomingList.map(req => (
          <div key={req.id} className="freq-card">
            {req.sender?.avatar_url
              ? <img className="friend-avatar" src={req.sender.avatar_url} alt={req.sender.display_name || "User"} style={{ width: 40, height: 40 }} />
              : <div className="friend-avatar-placeholder" style={{ width: 40, height: 40, fontSize: 16 }}>{(req.sender?.display_name || "?")[0].toUpperCase()}</div>
            }
            <div className="freq-card-info">
              <div className="freq-card-name">{req.sender?.display_name || "Unknown"}</div>
              <div className="freq-card-time">{timeAgo(req.created_at)}</div>
            </div>
            <div className="freq-card-actions">
              <button
                className="freq-accept-btn"
                onClick={() => accept.mutate(req.from_user_id)}
                disabled={accept.isPending}
              >
                Accept
              </button>
              <button
                className="freq-decline-btn"
                onClick={() => decline.mutate(req.from_user_id)}
                disabled={decline.isPending}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Outgoing */}
      <div className="freq-section">
        <div className="freq-section-label">Sent ({outgoingList.length})</div>
        {outgoingList.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--text-muted, #888)", padding: "12px 0" }}>No pending requests</div>
        )}
        {outgoingList.map(req => (
          <div key={req.id} className="freq-card">
            {req.recipient?.avatar_url
              ? <img className="friend-avatar" src={req.recipient.avatar_url} alt={req.recipient.display_name || "User"} style={{ width: 40, height: 40 }} />
              : <div className="friend-avatar-placeholder" style={{ width: 40, height: 40, fontSize: 16 }}>{(req.recipient?.display_name || "?")[0].toUpperCase()}</div>
            }
            <div className="freq-card-info">
              <div className="freq-card-name">{req.recipient?.display_name || "Unknown"}</div>
              <div className="freq-card-time">{timeAgo(req.created_at)}</div>
            </div>
            <div className="freq-card-actions">
              <button
                className="freq-cancel-btn"
                onClick={() => cancel.mutate(req.to_user_id)}
                disabled={cancel.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/friends/FriendRequestsPage.tsx
git commit -m "feat: add FriendRequestsPage (incoming + outgoing requests)"
```

---

## Task 9: Invite Landing Page

**Files:**
- Create: `src/views/friends/InviteLandingPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
// @ts-nocheck
import { useEffect, useState } from "react";
import { friendsApi } from "../../api/friends";
import "../../styles/friends.css";

export default function InviteLandingPage({ token, navigate }) {
  const [inviter, setInviter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    friendsApi.getInviterByToken(token).then(profile => {
      setInviter(profile);
      setLoading(false);
    });
    // Store token so post-signup handler can process it
    if (token) sessionStorage.setItem("invite_token", token);
  }, [token]);

  if (loading) return null;

  if (!inviter) {
    return (
      <div className="invite-landing">
        <div className="invite-card">
          <div className="invite-card-heading">Invalid Invite Link</div>
          <div className="invite-card-sub">This invite link is invalid or has expired.</div>
          <button className="invite-card-cta" onClick={() => navigate("home")}>Go to App</button>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-landing">
      <div className="invite-card">
        {inviter.avatar_url
          ? <img className="invite-card-avatar" src={inviter.avatar_url} alt={inviter.display_name || "User"} />
          : <div className="invite-card-avatar-placeholder">{(inviter.display_name || "?")[0].toUpperCase()}</div>
        }
        <div className="invite-card-heading">
          {inviter.display_name || "Someone"} invited you!
        </div>
        <div className="invite-card-sub">
          Join NWT Progress to track your Bible reading and connect with friends.
        </div>
        <button className="invite-card-cta" onClick={() => navigate("signup")}>
          Create Free Account
        </button>
        <div className="invite-card-login">
          Already have an account?{" "}
          <a href="#" onClick={e => { e.preventDefault(); navigate("login"); }}>Sign in</a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Process invite token after signup**

In `src/views/auth/` (or wherever the post-signup handler is), add this after successful account creation:

```typescript
// After user signs up successfully, check for a stored invite token:
const inviteToken = sessionStorage.getItem("invite_token");
if (inviteToken) {
  sessionStorage.removeItem("invite_token");
  await friendsApi.processInviteSignup(inviteToken);
}
```

Find the signup success handler — look for `supabase.auth.signUp` calls and add the above after the user is confirmed.

- [ ] **Step 3: Commit**

```bash
git add src/views/friends/InviteLandingPage.tsx
git commit -m "feat: add InviteLandingPage for invite token flow"
```

---

## Task 10: Router + AuthedApp Wiring

**Files:**
- Modify: `src/lib/router.ts`
- Modify: `src/AuthedApp.tsx`

- [ ] **Step 1: Add routes to `router.ts`**

In `parsePath()`, add before the final `return { page: "notFound" }`:

```typescript
if (h === "friends") return { page: "friends" };
if (h === "friends/requests") return { page: "friendRequests" };
if (h.startsWith("invite/")) return { page: "invite", token: h.slice(7) };
```

In `buildPath()`, add to the switch:

```typescript
case "friends":        return "/friends";
case "friendRequests": return "/friends/requests";
case "invite":         return `/invite/${params.token ?? ""}`;
```

- [ ] **Step 2: Wire pages in `AuthedApp.tsx`**

Add lazy imports at the top with the other lazy imports:

```typescript
const FriendsPage        = lazy(() => import("./views/friends/FriendsPage"));
const FriendRequestsPage = lazy(() => import("./views/friends/FriendRequestsPage"));
const InviteLandingPage  = lazy(() => import("./views/friends/InviteLandingPage"));
```

Add page cases alongside the other `else if` blocks:

```typescript
else if (nav.page === "friends")
  pageContent = <Page><FriendsPage user={user} navigate={navigate} isPremium={isPremium} onUpgrade={openUpgrade} {...sharedNav} /></Page>;
else if (nav.page === "friendRequests")
  pageContent = <Page><FriendRequestsPage user={user} navigate={navigate} {...sharedNav} /></Page>;
```

For the public invite landing (shown before login), add to the public routes section where blog and other public pages are handled:

```typescript
if (publicNav.page === "invite")
  publicPageContent = <InviteLandingPage token={publicNav.token} navigate={publicNavigate} />;
```

Also add `"friends"` and `"friendRequests"` to `VALID_PAGES` if that array exists in `AuthedApp.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/router.ts src/AuthedApp.tsx
git commit -m "feat: add /friends, /friends/requests, /invite/:token routes"
```

---

## Task 11: Notification Integration

**Files:**
- Modify: whichever file renders individual notification items (search for `notif-item` or `NotificationItem`)

- [ ] **Step 1: Find the notification renderer**

```bash
grep -r "notif-item\|NotificationItem\|notification.type" src/ --include="*.tsx" -l
```

- [ ] **Step 2: Add `friend_request` type handling**

In the notification item renderer, add a case for `friend_request` type. The pattern will look like the existing type cases (e.g. `follow`, `reply`). Add:

```tsx
// In the notification type → icon/label mapping:
case "friend_request":
  icon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  );
  label = `${notification.actor?.display_name ?? "Someone"} wants to be your friend`;
  onClick = () => navigate("friendRequests");
  break;
```

- [ ] **Step 3: Send friend_request notification when request is sent**

In `friendsApi.sendRequest`, after the insert succeeds, fire a notification:

```typescript
// After successful insert in sendRequest:
const { data: { user } } = await supabase.auth.getUser();
// ... existing insert code ...
// Then notify recipient:
await supabase.rpc("create_notification", {
  p_user_id: toUserId,
  p_actor_id: user.id,
  p_type: "friend_request",
  p_thread_id: null,
  p_post_id: null,
  p_preview: null,
  p_link_hash: null,
});
```

- [ ] **Step 4: Commit**

```bash
git add src/api/friends.ts
git commit -m "feat: send friend_request notification on request, handle in notification UI"
```

---

## Task 12: Sponsored Messaging Check

**Files:**
- Modify: `src/api/messages.ts`

- [ ] **Step 1: Find `getOrCreateDM` in messages.ts**

```bash
grep -n "getOrCreateDM\|canMessage\|isPremium" src/api/messages.ts | head -20
```

- [ ] **Step 2: Add sponsorship bypass**

The messaging premium gate is enforced in `MessagesPage.tsx` and `ProfilePage.tsx` (`if (!isPremium)`). We need to also allow it when a sponsorship exists.

Add a helper to `messagesApi`:

```typescript
// In src/api/messages.ts, add:
canMessageUser: async (otherUserId: string, userIsPremium: boolean) => {
  if (userIsPremium) return true;
  // Check for sponsored friendship
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const [a, b] = [user.id, otherUserId].sort();
  const { data } = await supabase
    .from("friendships")
    .select("sponsored_by")
    .eq("user_a_id", a)
    .eq("user_b_id", b)
    .single();
  return !!data?.sponsored_by;
},
```

In `MessagesPage.tsx`, the DM button already checks `isPremium`. The `NewConversationModal` already handles this via the `isPremium` prop passed through. The `FriendsPage` message button checks `friend.sponsored_by` directly.

For the profile `MessageButton` component, update it to also check sponsored status:

```tsx
// In ProfilePage.tsx MessageButton, modify handleClick:
async function handleClick() {
  if (!isPremium) {
    const sponsored = await messagesApi.canMessageUser(targetId, isPremium);
    if (!sponsored) { onUpgrade?.(); return; }
  }
  getOrCreate.mutate(targetId, {
    onSuccess: (conversationId) => navigate("messages", {
      conversationId,
      otherDisplayName,
      otherAvatarUrl,
    }),
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/api/messages.ts src/views/profile/ProfilePage.tsx
git commit -m "feat: add sponsored messaging bypass for premium invitees"
```

---

## Task 13: Add friends.css import

**Files:**
- Modify: `src/styles/app.css` or the main CSS entry point

- [ ] **Step 1: Find where styles are imported**

```bash
grep -n "messages.css\|notifications.css\|@import" src/styles/app.css | head -10
```

- [ ] **Step 2: Add the import**

In `app.css` (or wherever other feature CSS files are imported), add:

```css
@import "./friends.css";
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/app.css
git commit -m "feat: import friends.css"
```

---

## Task 14: Final — Push

- [ ] **Step 1: Smoke test locally**
  - Sign up two test accounts
  - Send a friend request from account A → account B
  - Check notification appears on B
  - Accept on B → both appear in each other's friends list
  - Open inbox on A → compose icon → B appears in list → tap → conversation opens
  - Generate invite link on A → open in incognito → verify landing page shows A's name
  - Open `/friends/requests` directly — verify works

- [ ] **Step 2: Push**

```bash
git push
```
