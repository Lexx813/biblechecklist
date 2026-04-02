# Friend Request Notifications + Clickable Avatars Design

**Date:** 2026-04-02  
**Status:** Approved

## Summary

Two small, focused changes to the social/friends UX:

1. **Inline Accept/Decline in NotificationBell** — friend request notifications get action buttons directly in the dropdown instead of navigating away to the Friend Requests page.
2. **Clickable avatars in FriendRequestsPage** — the only remaining page where other users' avatars have no navigate-to-profile behaviour.

All other avatar locations (Forum, Blog, Activity Feed, Leaderboard, Friends list, Search) already navigate to `publicProfile` — no changes needed there.

## What Already Exists

- `notifications` table with `actor_id` column (the sender's user ID)
- `sendRequest` in `friends.ts` already calls `create_notification` with `type: "friend_request"`
- `NotificationBell` already handles `friend_request` type: shows "wants to be your friend", navigates to `friendRequests` on click
- `useAcceptFriendRequest(userId)` and `useDeclineFriendRequest(userId)` hooks already exist in `useFriends.ts`
- `deleteOne` mutation already in `NotificationBell`
- `navigate("publicProfile", { userId })` pattern works everywhere else

## Part 1: Inline Accept/Decline in NotificationBell

### Behaviour

For notifications where `n.type === "friend_request"`:
- Show Accept and Decline buttons below the notification body text
- The whole-item `onClick` is suppressed (buttons handle the action)
- **Accept:** calls `friendsApi.acceptRequest(n.actor_id)`, then `deleteOne.mutate(n.id)`
- **Decline:** calls `friendsApi.declineRequest(n.actor_id)`, then `deleteOne.mutate(n.id)`
- Both buttons are disabled while their mutation is pending
- On completion the notification disappears from the list (deleted, not just marked read)

### Data

`n.actor_id` is already in the query result (the `*` selector pulls all columns). It equals `fromUserId` required by both `acceptRequest` and `declineRequest`. No API or DB changes needed.

### Implementation

- `useAcceptFriendRequest(userId)` and `useDeclineFriendRequest(userId)` added as single instances at the `NotificationBell` component level (called once, `actor_id` passed as mutate argument per item)
- Per-item: render `<div class="notif-friend-actions">` with two buttons when `n.type === "friend_request"`
- The existing whole-item click handler skips navigation for `friend_request` type (the buttons handle it)
- After mutation success: `deleteOne.mutate(n.id)` removes the item

### Files

- `src/components/notifications/NotificationBell.tsx` — add hooks + conditional button render
- `src/styles/notifications.css` — add `.notif-friend-actions`, `.notif-accept-btn`, `.notif-decline-btn` styles

## Part 2: Clickable Avatars in FriendRequestsPage

### Behaviour

- **Incoming request** sender avatar/initials: `onClick={() => navigate("publicProfile", { userId: req.from_user_id })}`
- **Outgoing request** recipient avatar/initials (in `OutgoingRow`): `onClick={() => navigate("publicProfile", { userId: req.to_user_id })}`

### Implementation

- `FriendRequestsPage` already receives `navigate` prop
- `OutgoingRow` currently receives `userId` and `req` — add `navigate` prop
- Wrap the avatar `<img>` and placeholder `<div>` in a `<button>` or add `onClick` + `style={{ cursor: "pointer" }}` directly
- Caller passes `navigate` to `OutgoingRow`

### Files

- `src/views/friends/FriendRequestsPage.tsx` — add onClick to avatars, pass navigate to OutgoingRow

## Files Changed

| File | Change |
|------|--------|
| `src/components/notifications/NotificationBell.tsx` | Add accept/decline hooks + button render for friend_request type |
| `src/styles/notifications.css` | Add friend action button styles |
| `src/views/friends/FriendRequestsPage.tsx` | Add onClick to avatars, pass navigate to OutgoingRow |

## No DB or API Changes

The `actor_id` is already stored on notification rows and included in the existing query. The accept/decline API functions already exist. No migrations needed.

## Success Criteria

- Opening the notification bell and seeing a friend request shows Accept and Decline buttons
- Clicking Accept: friend is added, notification disappears, friends list updates
- Clicking Decline: request is declined, notification disappears
- Clicking a sender/recipient avatar in Friend Requests navigates to their public profile
