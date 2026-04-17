# Messenger-Style Chat Polish — Design Spec

**Date:** 2026-04-17
**Status:** Approved

---

## Goal

Polish the floating chat widget and full-page messages view to match the visual quality and UX feel of Facebook Messenger, while keeping the JW Study brand identity (purple palette). Both surfaces — floating widget and full-page — receive the same treatment for visual consistency.

## Design Decisions (from visual brainstorm)

- **Color direction:** JW Study Brand (Option C) — solid purple sent, soft lavender received
- **Message grouping:** Messenger-style (Option B) — corners morph, avatar only on first bubble
- **Composer:** Messenger pill (Option B) — input inside pill, emoji inside pill, icons outside

---

## Architecture

Two independent CSS files (`floating-chat.css` and `messages.css`) and three React components (`FCBubble`, `MiniThread`, `MessageThreadPanel`) are modified. No new files except one shared CSS token update. The grouping logic lives in the render layer (map over messages), not in a separate hook, to keep it simple.

---

## Section 1 — Bubble Visuals

### Colors

| Surface | Light mode | Dark mode |
|---|---|---|
| Sent background | `#7c3aed` (solid, no gradient) | `#7c3aed` (unchanged) |
| Sent text | `#ffffff` | `#ffffff` |
| Received background | `#f3f0ff` | `#2d1f4e` |
| Received text | `#1e1035` | `#e9d5ff` |
| Chat background | `#ffffff` | `#1a1028` |
| Composer background | `#ffffff` | `#1a1028` |
| Pill background | `#f3f0ff` | `#2d1f4e` |

Remove `--conv-accent` from sent bubble colors entirely. `--conv-accent` may remain as a subtle tint on the header only.

### Border Radius

Base radius: `18px` on all corners. Corners morph based on position within a consecutive group from the same sender:

| Position | Sent (right side) | Received (left side) |
|---|---|---|
| `solo` | `18px 18px 18px 18px` | `18px 18px 18px 18px` |
| `first` | `18px 18px 4px 18px` | `18px 18px 18px 4px` |
| `middle` | `18px 4px 4px 18px` | `4px 18px 18px 4px` |
| `last` | `18px 4px 18px 18px` | `4px 18px 18px 18px` |

### Shadows

- Received bubbles: no shadow (flat, like Messenger)
- Sent bubbles: `0 1px 4px rgba(0,0,0,0.18)` (subtle depth only)

---

## Section 2 — Message Grouping Logic

### Group Definition

Consecutive messages from the same `sender_id` where each message is within **5 minutes** of the previous one form a group. A different sender or a gap > 5 minutes breaks the group.

### Position Computation

When mapping messages to `<FCBubble>` components, compute `position` for each message:

```ts
type BubblePosition = "solo" | "first" | "middle" | "last";

function computePosition(messages: Message[], index: number): BubblePosition {
  const msg = messages[index];
  const prev = messages[index - 1];
  const next = messages[index + 1];
  const sameAsPrev = prev && prev.sender_id === msg.sender_id
    && (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) < 5 * 60 * 1000;
  const sameAsNext = next && next.sender_id === msg.sender_id
    && (new Date(next.created_at).getTime() - new Date(msg.created_at).getTime()) < 5 * 60 * 1000;
  if (!sameAsPrev && !sameAsNext) return "solo";
  if (!sameAsPrev && sameAsNext) return "first";
  if (sameAsPrev && sameAsNext) return "middle";
  return "last"; // sameAsPrev && !sameAsNext
}
```

Extract `computePosition` to `src/components/messages/chatHelpers.tsx` and export it so both `MiniThread.tsx` and `MessageThreadPanel.tsx` import from one place.

### FCBubble Props

Add `position: BubblePosition` to `FCBubbleProps`. The component uses it to:
1. Apply the correct border-radius CSS class
2. Decide whether to render the avatar (`position === "first" || position === "solo"`) or a ghost spacer

### Spacing

- Between bubbles in the same group: `2px` gap
- Between groups (after `last` or `solo`): `8px` gap
- Apply via CSS: `.fc-bubble-wrap--grouped { margin-bottom: 2px; }` and `.fc-bubble-wrap--group-end { margin-bottom: 8px; }`

---

## Section 3 — Composer (Pill Style)

### Structure

```
[📷] [📖]  [  Aa _______________________ 😊  ]  [●]
 icons          pill (flex, border-radius:22px)   send
```

- **Left icons:** photo upload + verse/plan picker. Render as 34×34px circular ghost buttons (`color: #7c3aed`).
- **Pill:** `flex: 1`, `background: #f3f0ff` (light) / `#2d1f4e` (dark), `border-radius: 22px`, `padding: 8px 13px`. Contains the text input and emoji button.
- **Emoji button:** inside pill on the right (`font-size: 17px`, `color: #7c3aed`).
- **Send button:** 36×36px circle, `background: #7c3aed`, no gradient. Icon:
  - When input is empty → 👍 thumb (unicode or SVG)
  - When input has text → send arrow SVG
  - Transition between states: instant swap (no animation needed)
- Composer top border: `1px solid #f0ebff` (light) / `1px solid #2d1f4e` (dark)

### Applies to

Both `MiniThread.tsx` (floating chat) and `MessageThreadPanel.tsx` (full-page). CSS classes `fc-composer` and `msg-composer` updated in their respective CSS files.

---

## Section 4 — Seamless Typing & Animations

### Typing Indicator

- Rendered as a bubble in the same position/grouping system — same avatar logic as a received message.
- Bubble background matches received bubble color (`#f3f0ff` light / `#2d1f4e` dark).
- Three bouncing dots: `#7c3aed` (light) / `#9d6dff` (dark), 7px diameter, 300ms stagger.
- Fade in/out: `transition: opacity 150ms ease, transform 150ms ease`. Appears with `opacity: 0 → 1, translateY(4px → 0)`.
- Already implemented in both surfaces — only needs visual restyling.

### New Message Scroll Behavior

Current behavior: scrolls to bottom on every new message regardless of scroll position.

New behavior:
- If user is within **100px** of the bottom → smooth scroll to bottom (existing behavior, keep it).
- If user is scrolled up more than 100px → show a `"↓ New message"` chip at the bottom of the messages area instead of force-scrolling. Clicking the chip scrolls to bottom and dismisses it.
- Chip style: pill, `background: #7c3aed`, white text, `font-size: 12px`, centered horizontally, `position: absolute; bottom: 70px`.

### Timestamps

- Hidden by default (remove `fc-bubble-time` from always-visible footer).
- Revealed on **hover** over any bubble. Show a single timestamp centered above the hovered group, `font-size: 10px`, `color: var(--text-muted)`.
- Implementation: CSS `opacity: 0` by default on `.fc-bubble-time`, `.fc-bubble-wrap:hover .fc-bubble-time { opacity: 1 }`.
- The `title` attribute already on the bubble element acts as a fallback for accessibility.

---

## Section 5 — Header & Shell

### Floating Chat Header

- Background: solid `#7c3aed` (remove gradient). If `--conv-accent` is set, use it as solid color (not gradient).
- Content: avatar (32×32px circle) + name (bold, 14px) + status line (`● Active now` or `○ Away`, 11px, 70% opacity).
- Online status dot: green `#22c55e` when online, gray `#888` when away.

### Full-Page Sidebar

- Same conversation item styling as floating chat conversation list.
- Header: solid `#7c3aed`, same as floating.

### Panel Backgrounds

| Element | Light | Dark |
|---|---|---|
| Floating panel | `#ffffff` | `#1a1028` |
| Panel border | `1px solid #ede9fe` | `1px solid #2d1f4e` |
| Messages area | `#ffffff` | `#1a1028` |
| Full-page main | `#ffffff` | `#1a1028` |
| Sidebar | `#faf8ff` | `#150d22` |

### Empty State (Full-Page Messages)

When no conversation is selected, replace the current centered icon + text with a Messenger-style empty state:

- Background: `#ffffff` (light) / `#1a1028` (dark)
- Large speech bubble icon (SVG, 64px, `color: #ede9fe` light / `#2d1f4e` dark)
- Heading: `"Your Messages"`, 18px, semibold
- Subtitle: `"Select a conversation to start chatting"`, 14px, muted
- A `"New Conversation"` button: pill shape, `background: #7c3aed`, white text — links to start a new conversation (same action as the pencil icon in the sidebar header)

### Day Dividers

- Centered text, `font-size: 10.5px`, `color: var(--text-muted)`, `letter-spacing: 0.04em`.
- `margin: 8px auto`, max-width 120px, with `1px solid` line on each side (use flexbox + `::before`/`::after` pseudo-elements).

---

## Files Changed

| File | Change |
|---|---|
| `src/styles/floating-chat.css` | Bubble colors, radius, grouping classes, composer pill, header, typing indicator, timestamps |
| `src/styles/messages.css` | Same as above for full-page view |
| `src/components/messages/chatHelpers.tsx` | Add `computePosition` + `BubblePosition` type |
| `src/components/messages/FCBubble.tsx` | Add `position` prop, apply grouping classes, avatar ghost logic |
| `src/components/messages/MiniThread.tsx` | Compute `position` per message, pass to `FCBubble`, "↓ New message" chip |
| `src/views/messages/MessageThreadPanel.tsx` | Compute `position` per message, pass to bubble component, "↓ New message" chip, empty state redesign |

---

## What's Not Changing

- Encryption, reactions, reply quotes, star, edit, delete — behavior unchanged
- `--conv-accent` variable stays for header tint (just removed from bubble gradient)
- Verse cards, image cards, plan cards — not restyled in this pass
- Mobile responsiveness — no layout changes, only visual polish
- i18n — no new strings except the "↓ New message" chip label (needs translation key)

---

## Acceptance Criteria

- [ ] Sent bubbles are solid `#7c3aed` with no gradient in both light and dark mode
- [ ] Received bubbles are `#f3f0ff` (light) / `#2d1f4e` (dark)
- [ ] Consecutive messages from the same sender within 5 min have morphing corners and tight 2px spacing
- [ ] Avatar renders only on the first bubble of a group
- [ ] Composer has pill-style input with emoji inside, icons outside, thumb/arrow send button
- [ ] Typing indicator fades in/out smoothly
- [ ] Timestamps hidden by default, visible on hover
- [ ] "↓ New message" chip appears when scrolled up and a new message arrives
- [ ] Both floating chat and full-page view look identical in style
- [ ] Full-page empty state shows new design with "New Conversation" button
- [ ] Dark mode looks correct with the new palette
- [ ] All existing tests pass
