# Friend Request Notifications + Clickable Avatars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add inline Accept/Decline buttons to friend-request notifications in the NotificationBell, and make sender/recipient avatars in FriendRequestsPage navigate to the user's public profile.

**Architecture:** Two independent UI changes — no API or DB changes required. `actor_id` is already on notification rows. `useAcceptFriendRequest` and `useDeclineFriendRequest` hooks already exist. `navigate("publicProfile", { userId })` already works everywhere else.

**Tech Stack:** React, TypeScript, @tanstack/react-query, custom CSS variables

---

## File Map

| File | Change |
|------|--------|
| `src/components/notifications/NotificationBell.tsx` | Add `actor_id` to interface; import + instantiate accept/decline hooks; suppress nav for friend_request; render action buttons |
| `src/styles/notifications.css` | Add `.notif-friend-actions`, `.notif-accept-btn`, `.notif-decline-btn` |
| `src/views/friends/FriendRequestsPage.tsx` | Add onClick to incoming avatars; add `navigate` prop to `OutgoingRow` and onClick to its avatars |

---

## Task 1: NotificationBell — inline Accept/Decline buttons

**Files:**
- Modify: `src/components/notifications/NotificationBell.tsx`
- Modify: `src/styles/notifications.css`

- [ ] **Step 1: Add `actor_id` to the `AppNotification` interface**

In `src/components/notifications/NotificationBell.tsx`, update the interface (currently lines 14–26):

```typescript
interface AppNotification {
  id: string;
  read: boolean;
  link_hash?: string;
  type?: string;
  actor_id?: string;
  conversation_id?: string;
  thread_id?: string;
  post?: { slug?: string };
  thread?: { category_id?: string };
  actor?: { display_name?: string; avatar_url?: string };
  body_preview?: string;
  created_at: string;
}
```

- [ ] **Step 2: Import the accept/decline hooks**

At the top of `src/components/notifications/NotificationBell.tsx`, update the import from `useFriends` (add after the existing imports):

```typescript
import { useAcceptFriendRequest, useDeclineFriendRequest } from "../../hooks/useFriends";
```

- [ ] **Step 3: Instantiate the hooks inside `NotificationBell`**

Inside the `NotificationBell` component body, after the existing hook calls (after line 40 `const clearAll = useClearAllNotifications(userId);`), add:

```typescript
const acceptRequest  = useAcceptFriendRequest(userId ?? "");
const declineRequest = useDeclineFriendRequest(userId ?? "");
```

- [ ] **Step 4: Suppress navigation for `friend_request` in `handleClick`**

Find the `friend_request` branch in `handleClick` (currently lines 101–105):

```typescript
// Friend request — navigate to friend requests page
if (n.type === "friend_request") {
  navigate("friendRequests");
  return;
}
```

Replace with (buttons handle the action; clicking the item body does nothing):

```typescript
// Friend request — handled by inline Accept/Decline buttons
if (n.type === "friend_request") {
  return;
}
```

- [ ] **Step 5: Render Accept/Decline buttons inside the `notif-body` for friend_request items**

In the `notif-body` div (currently lines 170–177), add the action buttons block after `notif-time`:

```tsx
<div className="notif-body">
  <span className="notif-actor">{n.actor?.display_name || "Someone"}</span>
  {" "}<span className="notif-verb">{getVerb(n)}</span>
  {n.body_preview && n.type !== "message" && (
    <p className="notif-preview">"{n.body_preview}"</p>
  )}
  <span className="notif-time">{timeAgo(n.created_at)}</span>
  {n.type === "friend_request" && n.actor_id && (
    <div className="notif-friend-actions">
      <button
        className="notif-accept-btn"
        disabled={acceptRequest.isPending || declineRequest.isPending}
        onClick={(e) => {
          e.stopPropagation();
          acceptRequest.mutate(n.actor_id!, { onSuccess: () => deleteOne.mutate(n.id) });
        }}
      >
        Accept
      </button>
      <button
        className="notif-decline-btn"
        disabled={acceptRequest.isPending || declineRequest.isPending}
        onClick={(e) => {
          e.stopPropagation();
          declineRequest.mutate(n.actor_id!, { onSuccess: () => deleteOne.mutate(n.id) });
        }}
      >
        Decline
      </button>
    </div>
  )}
</div>
```

- [ ] **Step 6: Add CSS for the friend action buttons**

Append to `src/styles/notifications.css`:

```css
/* Friend request inline actions */
.notif-friend-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.notif-accept-btn,
.notif-decline-btn {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
}

.notif-accept-btn:disabled,
.notif-decline-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notif-accept-btn {
  background: var(--teal, #38b2ac);
  color: #fff;
}
.notif-accept-btn:hover:not(:disabled) { opacity: 0.85; }

.notif-decline-btn {
  background: rgba(229, 62, 62, 0.12);
  color: #e53e3e;
}
.notif-decline-btn:hover:not(:disabled) { background: rgba(229, 62, 62, 0.22); }
```

- [ ] **Step 7: Verify in dev — open notification bell, confirm friend_request shows Accept/Decline buttons**

Run: `npm run dev`

Expected:
- A friend_request notification shows "Name wants to be your friend" + timestamp + **Accept** and **Decline** buttons
- Clicking Accept: friend added, notification disappears
- Clicking Decline: request declined, notification disappears
- Clicking the notification body area does nothing (no navigation to friendRequests)
- The X delete button still works as before

- [ ] **Step 8: Commit**

```bash
git add src/components/notifications/NotificationBell.tsx src/styles/notifications.css
git commit -m "feat: add inline accept/decline buttons to friend request notifications"
```

---

## Task 2: FriendRequestsPage — clickable avatars

**Files:**
- Modify: `src/views/friends/FriendRequestsPage.tsx`

- [ ] **Step 1: Add `navigate` prop to `OutgoingRow` and make its avatars clickable**

Find the `OutgoingRow` component (currently lines 35–69). Replace it entirely:

```tsx
function OutgoingRow({
  userId,
  req,
  navigate,
}: {
  userId: string;
  req: OutgoingRequest;
  navigate: (page: string, params?: Record<string, unknown>) => void;
}) {
  const cancel = useCancelFriendRequest(userId, req.to_user_id);
  return (
    <div className="freq-card">
      {req.recipient?.avatar_url ? (
        <img
          className="friend-avatar"
          src={req.recipient.avatar_url}
          alt={req.recipient.display_name ?? "User"}
          style={{ width: 40, height: 40, cursor: "pointer" }}
          onClick={() => navigate("publicProfile", { userId: req.to_user_id })}
        />
      ) : (
        <div
          className="friend-avatar-placeholder"
          style={{ width: 40, height: 40, fontSize: 16, cursor: "pointer" }}
          onClick={() => navigate("publicProfile", { userId: req.to_user_id })}
        >
          {(req.recipient?.display_name ?? "?")[0].toUpperCase()}
        </div>
      )}
      <div className="freq-card-info">
        <div className="freq-card-name">{req.recipient?.display_name ?? "Unknown"}</div>
        <div className="freq-card-time">{timeAgo(req.created_at)}</div>
      </div>
      <div className="freq-card-actions">
        <button
          className="freq-cancel-btn"
          onClick={() => cancel.mutate()}
          disabled={cancel.isPending}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add onClick to incoming request avatars**

Find the incoming request avatar block (currently lines 123–138). Replace with:

```tsx
{incomingList.map((req) => (
  <div key={req.id} className="freq-card">
    {req.sender?.avatar_url ? (
      <img
        className="friend-avatar"
        src={req.sender.avatar_url}
        alt={req.sender.display_name ?? "User"}
        style={{ width: 40, height: 40, cursor: "pointer" }}
        onClick={() => navigate("publicProfile", { userId: req.from_user_id })}
      />
    ) : (
      <div
        className="friend-avatar-placeholder"
        style={{ width: 40, height: 40, fontSize: 16, cursor: "pointer" }}
        onClick={() => navigate("publicProfile", { userId: req.from_user_id })}
      >
        {(req.sender?.display_name ?? "?")[0].toUpperCase()}
      </div>
    )}
    <div className="freq-card-info">
      <div className="freq-card-name">{req.sender?.display_name ?? "Unknown"}</div>
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
```

- [ ] **Step 3: Pass `navigate` to OutgoingRow**

Find the `OutgoingRow` usage (currently line 171):

```tsx
<OutgoingRow key={req.id} userId={user.id} req={req} />
```

Replace with:

```tsx
<OutgoingRow key={req.id} userId={user.id} req={req} navigate={navigate} />
```

- [ ] **Step 4: Verify in dev — open Friend Requests, click avatars**

Run: `npm run dev`

Expected:
- Clicking a sender avatar in Incoming requests → navigates to their public profile
- Clicking a recipient avatar in Sent requests → navigates to their public profile
- Cursor is `pointer` on avatars
- Accept/Decline/Cancel buttons still work normally

- [ ] **Step 5: Commit**

```bash
git add src/views/friends/FriendRequestsPage.tsx
git commit -m "feat: make avatars in FriendRequestsPage navigate to public profile"
```
