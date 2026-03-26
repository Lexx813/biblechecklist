---
name: Planned Feature — Premium Private Messaging
description: User wants to add a paywalled private messaging system in the future. Architecture and UI concept already designed.
type: project
---

User wants to build private messaging locked behind a paid subscription. Not building yet — keep in mind for future sessions.

**Why:** Monetization strategy. Only premium users can message, preventing spam and adding value to the subscription.

**How to apply:** When the user brings this up, resume from the agreed design without re-discussing the basics.

## Agreed Architecture

- **Stripe** subscription → webhook sets `is_premium` on `profiles` table (`is_premium bool`, `premium_since timestamptz`)
- RLS policies enforce premium check server-side on both sender and recipient
- Tables: `conversations`, `conversation_participants`, `messages (id, conversation_id, sender_id, content, created_at, read_at)`
- **Supabase Realtime** for instant message delivery (no polling)
- Route: `/messages`

## UI: Split-panel layout
- Left: conversation list (avatar, name, last message preview, timestamp, unread dot)
- Right: chat thread with bubbles, date separators, message input
- Non-premium users see a locked screen with paywall CTA ($3/mo suggested)

## Key decisions
- Both sender AND recipient must be premium to message
- Soft delete messages (`deleted_at`) to preserve history across subscription lapses
- Premium badge (✦) shown on avatars in forum, leaderboard, profile as social incentive
