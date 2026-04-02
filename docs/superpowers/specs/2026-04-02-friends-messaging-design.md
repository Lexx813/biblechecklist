# Friends, Invite Links & Messaging Completion — Design Spec

**Date:** 2026-04-02
**Status:** Approved

---

## Problem

The messaging system only shows people you've already talked to. The only way to start a new conversation is to hunt down a user's profile and tap Message. There is no friends list, no way to save people you want to stay connected with, and no way to invite people (inside or outside the app) to connect.

---

## Goals

1. Mutual friends system — add, accept, decline friend requests
2. Friends list page showing progress cards for each friend
3. Inbox compose button — start a new conversation from your friends list
4. Dedicated friend requests section with notification routing
5. Invite links — copy a personal link to share with anyone
6. Premium sponsorship — invitee can message the inviter permanently even without premium

---

## Data Model

### New Tables

#### `friend_requests`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `from_user_id` | uuid FK → users | sender |
| `to_user_id` | uuid FK → users | recipient |
| `status` | enum: `pending`, `accepted`, `declined` | |
| `created_at` | timestamptz | |

#### `friendships`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_a_id` | uuid FK → users | lower of the two user IDs |
| `user_b_id` | uuid FK → users | higher of the two user IDs |
| `sponsored_by` | uuid FK → users, nullable | set when a non-premium invitee is invited by a premium user |
| `created_at` | timestamptz | |

#### `invite_tokens`
| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid FK → users PK | one token per user |
| `token` | text unique | random, generated once |
| `created_at` | timestamptz | |

### RLS Policies
- `friend_requests`: users can read rows where they are `from_user_id` or `to_user_id`; insert only as `from_user_id`; update only as `to_user_id` (to accept/decline)
- `friendships`: users can read rows where they are `user_a_id` or `user_b_id`
- `invite_tokens`: users can read/insert their own row only

---

## Hooks

### `useFriends(userId)`
Fetches all friendships for the user, joins partner profile (name, avatar, reading progress, last active). Returns `{ friends, loading }`.

### `useFriendRequests(userId)`
Fetches pending `friend_requests` where `to_user_id = userId` (incoming) and `from_user_id = userId` (outgoing). Returns `{ incoming, outgoing, loading }`.

### `useFriendStatus(userId, targetId)`
Returns one of: `none | pending_sent | pending_received | friends`. Used to drive the Add Friend button state on profiles.

### `useInviteToken(userId)`
Returns the user's invite token, creating it if it doesn't exist yet.

---

## Components

### `FriendRequestButton`
Rendered on user profiles and avatars alongside the existing Message button. Reads from `useFriendStatus` and renders:
- `none` → "Add Friend" button
- `pending_sent` → "Request Sent" (disabled)
- `pending_received` → "Accept" + "Decline" buttons
- `friends` → "Friends" badge (no action)

### `FriendsPage` (`/friends`)
- Friends list as cards: avatar, name, reading progress bar, last active badge
- Quick actions per card: **Message**, **View Profile**
- "Copy invite link" button in the page header
- Empty state: prompt to invite friends or find people via search

### `FriendRequestsPage` (`/friends/requests`)
- Incoming request cards: avatar, name, Accept / Decline buttons
- Outgoing section: pending requests you sent with a Cancel option
- Reachable from the notification bell (friend request notifications route here)

### `NewConversationModal`
- Triggered by a compose (pencil) icon added to the existing `msg-sidebar-header`
- Search field at the top
- Friends list pre-populated below — tap any friend to open or create the conversation thread
- Falls back to searching all users if no friends match

### Notification Entry (existing system, new type)
- New notification type: `friend_request`
- Message: "{name} wants to be your friend"
- On tap: routes to `/friends/requests`
- Bell badge increments as normal

---

## Invite Links

### URL Format
```
https://nwtprogress.com/invite/[token]
```

### Sender Experience
- "Copy invite link" button on the Friends page
- One click copies the URL — no share sheet needed
- Token is permanent and reusable

### Recipient — New User
1. Visits invite URL → landing page showing inviter's avatar + name: "Alexi invited you to NWT Progress"
2. Signs up normally
3. On account creation, a `friend_request` row is automatically inserted from inviter → new user
4. New user lands in app with a friend request notification waiting

### Recipient — Existing User (logged in)
1. Visits invite URL → modal: "Accept friend request from Alexi?"
2. Accept → friendship created immediately
3. Decline → dismissed, no request stored

### Premium Sponsorship Rule
- When a friendship is created via invite link AND the inviter is premium AND the invitee is not:
  - `friendships.sponsored_by` is set to the inviter's `user_id`
- Messaging permission check: if `sponsored_by IS NOT NULL` on the friendship between two users, messaging is allowed for the non-premium user for that specific conversation — permanently, regardless of future subscription state
- All other messaging for non-premium users remains behind the premium gate

---

## UI Design

Follows the existing app design system:
- Primary: `#7c3aed` purple
- CSS variables: `var(--bg)`, `var(--border)`, `var(--card-bg)` — matches existing patterns
- Friend cards use the same card style as leaderboard/social components
- Transitions: 150–300ms, `transform`/`opacity` only
- Touch targets: minimum 44×44px
- All icons: SVG (Lucide/Heroicons), no emojis
- `cursor-pointer` on all interactive elements
- Focus states visible for keyboard navigation
- Responsive: 375px, 768px, 1024px, 1440px

---

## Routing

| Path | Component |
|---|---|
| `/friends` | `FriendsPage` |
| `/friends/requests` | `FriendRequestsPage` |
| `/invite/[token]` | `InviteLandingPage` |

---

## Out of Scope

- Friend suggestions / "people you may know"
- Blocking / reporting (separate feature)
- Group invites via link
- Invite link expiry
