# Meeting Prep — CLAM Checklist

**Date:** 2026-04-02  
**Status:** Approved  
**Premium gate:** Full feature is premium-only. The existing `MeetingPrepPage.jsx` is already behind the premium gate.

---

## Overview

The midweek meeting (Life and Ministry Meeting / CLAM) has a consistent structure every week. This feature gives premium users a personal preparation checklist for each meeting part, with optional notes per item and a progress ring. The checklist auto-resets each week, and past weeks are preserved in a History tab.

This is the core Phase 3 deliverable — it creates a weekly habit loop that dramatically improves retention.

---

## DB Schema

**New table:**
```sql
create table meeting_prep (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  week_of date not null,               -- Monday of the week (normalized)
  data jsonb not null default '{}',    -- checked state + notes per item
  updated_at timestamptz default now(),
  unique(user_id, week_of)
);
create index on meeting_prep (user_id, week_of desc);
```

**`data` JSONB structure:**
```json
{
  "treasures_talk":      { "checked": true,  "note": "Focus on para 3" },
  "treasures_digging":   { "checked": false, "note": "" },
  "treasures_reading":   { "checked": true,  "note": "" },
  "ministry_video":      { "checked": false, "note": "" },
  "ministry_demo1":      { "checked": true,  "note": "Practice with Maria" },
  "ministry_demo2":      { "checked": false, "note": "" },
  "christian_cbs":       { "checked": false, "note": "" },
  "christian_local":     { "checked": false, "note": "" },
  "christian_review":    { "checked": false, "note": "" }
}
```

Storing as JSONB avoids a wide table with 9 boolean columns and makes it easy to add/rename items without migrations. The item keys are the source of truth and defined in the static config (see below).

**RLS:** Users can only read and write their own rows.

---

## CLAM Item Configuration (static, `src/data/meeting-prep-items.js`)

```js
export const CLAM_SECTIONS = [
  {
    key: 'treasures',
    label: 'Treasures from God\'s Word',
    color: '#f59e0b', // gold
    items: [
      { key: 'treasures_talk',    label: '10-min talk' },
      { key: 'treasures_digging', label: 'Digging for spiritual gems' },
      { key: 'treasures_reading', label: 'Bible reading' },
    ],
  },
  {
    key: 'ministry',
    label: 'Apply Yourself to the Field Ministry',
    color: '#10b981', // green
    items: [
      { key: 'ministry_video',  label: 'Endorsement / video' },
      { key: 'ministry_demo1',  label: 'First demonstration' },
      { key: 'ministry_demo2',  label: 'Second demonstration' },
    ],
  },
  {
    key: 'christian',
    label: 'Living as Christians',
    color: '#7c3aed', // purple
    items: [
      { key: 'christian_cbs',    label: 'Congregation Bible Study' },
      { key: 'christian_local',  label: 'Local needs / announcements' },
      { key: 'christian_review', label: 'Song and prayer review' },
    ],
  },
];
```

The label strings are used as translation keys for i18n support.

---

## Week Normalization

`week_of` is always set to the Monday of the current week:
```js
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}
```

On load, the page fetches (or creates) the record for the current week. If no record exists yet, it's created with empty `data` on first save.

---

## UI

**Page layout (`MeetingPrepPage.jsx`):**

Tab bar: **Preparation** | **History**

The existing tab structure in `MeetingPrepPage.jsx` is extended with these tabs.

**Preparation tab:**
- Week header: "Week of [Mon Date] – [Sun Date]"  
- Progress ring: X / 9 parts prepared (fills as checkboxes ticked)
- Three section cards (Treasures / Ministry / Christian), each with:
  - Section header with color indicator
  - 3 checklist items, each with:
    - Checkbox (large, 44px touch target)
    - Item label
    - Expand arrow → reveals text note field (textarea, auto-saves on blur)
- Auto-save on every checkbox toggle (debounced upsert)
- "Prepared!" celebration state when all 9 are checked (confetti dots, reuses existing animation)

**History tab:**
- List of past weeks (most recent first)
- Each row: week date range + X/9 prepared + expand to see checked state
- Non-destructive: users can view but not edit past weeks

**Empty state (no premium):**
- Already handled by existing premium gate in `MeetingPrepPage.jsx`

---

## Push Notification

**Trigger:** The night before the midweek meeting (Tuesday evening, 7pm user local time — configurable in notification settings).

**Content:** "📋 Meeting tomorrow — you're X/9 prepared for this week's CLAM."

**Implementation:**
- Extend existing push notification system (VAPID already configured)
- New notification type: `meeting_prep_reminder`
- Scheduled by the existing weekly digest edge function or a new cron trigger
- Opt-in default: on for premium users; shown in notification settings

---

## Non-Goals
- WT Study tab (Watchtower Study preparation) — designed but deferred to Sprint 2
- Automatic content pull from WOL/JW.org — not in scope (dependency risk)
- Congregation-level shared prep — not in scope
- Assignment tracking (student/householder roles) — deferred to Sprint 2
