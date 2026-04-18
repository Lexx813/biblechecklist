# Email Campaign System — Design Spec
**Date:** 2026-04-18
**Status:** Approved

## Overview

A full email campaign management system built into the admin panel. Supports one-off broadcasts, scheduled sends, recurring newsletters, and automated sequences. Uses the existing Resend integration for delivery, Resend webhooks for open/click/bounce/unsubscribe tracking, and Supabase for campaign state and analytics. All new UI is built with Tailwind CSS.

## Approach

Hybrid: custom campaign engine in Supabase (full SQL-based segmentation) + Resend for delivery + Resend webhooks for tracking events. No additional vendors required.

---

## 1. Data Model

### New Tables

#### `email_campaigns`
```sql
CREATE TABLE email_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  subject         text NOT NULL,
  preview_text    text,
  html_body       text NOT NULL,
  type            text NOT NULL CHECK (type IN ('broadcast', 'newsletter', 'sequence')),
  status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'recurring')),
  segment_config  jsonb NOT NULL DEFAULT '{}',
  schedule_at     timestamptz,           -- for one-time future sends
  recurrence_cron text,                  -- cron expression for recurring campaigns
  next_run_at     timestamptz,           -- updated after each recurring send
  last_sent_at    timestamptz,
  sent_count      integer NOT NULL DEFAULT 0,
  created_by      uuid NOT NULL REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

#### `campaign_sends`
One row per user per campaign send. `resend_email_id` is the key used to match Resend webhook events.
```sql
CREATE TABLE campaign_sends (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resend_email_id text,
  status          text NOT NULL DEFAULT 'sent'
                    CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  sent_at         timestamptz NOT NULL DEFAULT now(),
  delivered_at    timestamptz,
  opened_at       timestamptz,
  clicked_at      timestamptz,
  bounced_at      timestamptz,
  UNIQUE (campaign_id, user_id)
);
```

#### `user_tags`
Admin-assigned labels for manual segmentation.
```sql
CREATE TABLE user_tags (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag        text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tag)
);
```

### Profiles Column
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_marketing_unsubscribed boolean NOT NULL DEFAULT false;
```

### Segment Config JSON Spec
```json
{
  "plan": "all" | "free" | "premium",
  "languages": ["en", "es", "pt"],
  "inactive_days": 30,
  "joined_before": "2026-01-01T00:00:00Z",
  "joined_after": "2025-06-01T00:00:00Z",
  "min_chapters_read": 10,
  "tags": ["early_adopter"],
  "exclude_tags": ["no_marketing"]
}
```

Users with `email_marketing_unsubscribed = true` are **always excluded** regardless of segment config.

### RLS Policies
- `email_campaigns`: admin read/write only (check `profiles.is_admin`)
- `campaign_sends`: admin read only
- `user_tags`: admin read/write only

---

## 2. Backend

### Supabase Edge Functions

#### `send-campaign`
Called with `{ campaign_id: string }`. Performs the full send flow:

1. Load campaign from `email_campaigns`
2. Resolve segment: SQL query against `profiles` + `user_tags` applying all `segment_config` filters. Always excludes `email_marketing_unsubscribed = true` and users already in `campaign_sends` for this campaign.
3. Count chapters read per user via `reading_checklist` if `min_chapters_read` is set.
4. Send in batches of 50 via Resend. Each email includes:
   - Unsubscribe link in footer: `https://jwstudy.org/unsubscribe?token=<signed-jwt>`
   - `resend_email_id` stored in `campaign_sends`
5. Insert rows into `campaign_sends` as emails are sent.
6. On completion: update `campaign.status`, `last_sent_at`, `sent_count`.
7. For recurring campaigns: recalculate `next_run_at` from `recurrence_cron`.

#### `process-scheduled-campaigns`
Runs via pg_cron every 15 minutes. No per-campaign cron jobs needed.

1. Query `email_campaigns` for:
   - `status = 'scheduled'` AND `schedule_at <= now()`
   - `status = 'recurring'` AND `next_run_at <= now()`
2. For each match, call `send-campaign` with the campaign id.
3. Mark campaign `status = 'sending'` before invoking to prevent double-sends.

#### `campaign-webhook`
Public endpoint registered with Resend as the webhook URL. Validates Resend webhook signature.

Handles events:
| Resend event | Action |
|---|---|
| `email.delivered` | Update `campaign_sends.status = 'delivered'`, set `delivered_at` |
| `email.opened` | Update `status = 'opened'`, set `opened_at` |
| `email.clicked` | Update `status = 'clicked'`, set `clicked_at` |
| `email.bounced` | Update `status = 'bounced'`, set `bounced_at` |
| `email.complained` | Update `status = 'unsubscribed'` + set `profiles.email_marketing_unsubscribed = true` |

Lookup key: `resend_email_id` on `campaign_sends`.

### Unsubscribe Flow

Every campaign email footer includes:
```
<a href="https://jwstudy.org/unsubscribe?token=JWT">Unsubscribe</a>
```

The JWT is signed with `SUPABASE_JWT_SECRET`, payload: `{ sub: userId, purpose: 'unsubscribe' }`.

New Next.js route `app/api/unsubscribe/route.ts`:
- Verifies the JWT
- Sets `profiles.email_marketing_unsubscribed = true`
- Returns a simple confirmation page (no login required — CAN-SPAM/GDPR compliant)

---

## 3. Admin UI

New **"Campaigns"** tab in `src/views/admin/AdminPage.tsx`. All components use Tailwind CSS.

### Tab Entry Point
New file: `src/views/admin/tabs/CampaignsTab.tsx`

Sub-views navigated via internal tab state: `list` | `editor` | `analytics` | `tags`

---

### 3a. Campaign List View

Table layout with:
- **Columns**: Name, Type badge, Status badge, Audience, Sent, Open rate, Click rate, Actions
- **Status badges**: color-coded (draft=gray, scheduled=blue, sending=yellow, sent=green, recurring=purple)
- **Actions**: Edit (drafts only), Duplicate, View Analytics, Delete
- **"New Campaign"** button top-right opens the editor with a blank campaign

---

### 3b. Campaign Editor

Full-page form with two columns on desktop (body left, settings right).

**Left column — Content**
- Name field
- Subject line field
- Preview text field (shows in email client preview)
- HTML body textarea with toggle: Edit / Preview
  - Preview renders the HTML in a sandboxed iframe

**Right column — Settings**
- **Type** selector: Broadcast / Newsletter / Sequence (radio pills)
- **Segment Builder** (collapsible panel):
  - Plan: All / Free / Premium (radio)
  - Languages: multi-select checkboxes (EN, ES, PT, FR, TL, ZH)
  - Joined: date range pickers (after / before)
  - Inactive for: number input + "days" (optional)
  - Min chapters read: number input (optional)
  - Include tags: tag input with autocomplete from `user_tags`
  - Exclude tags: same
  - **Audience estimate**: live count shown below segment builder, debounced 500ms, calls Postgres RPC `estimate_campaign_audience(segment_config jsonb) RETURNS integer` — defined in migration, runs the same filter logic as `send-campaign` but returns COUNT only
- **Send options** (radio):
  - Send Now
  - Schedule — datetime-local picker
  - Recurring — cron preset dropdown (Daily 8am / Weekly Monday 8am / Monthly 1st / Custom) with cron expression field for Custom

**Footer actions**: Save Draft | Send / Schedule (primary button, label changes per send option)

---

### 3c. Analytics View

Per-campaign. Accessed from the list "View Analytics" action.

**Summary cards** (4-up grid):
- Sent, Open rate %, Click rate %, Unsubscribed

**Timeline chart**: Opens and clicks by day over the 7 days post-send — rendered as inline SVG bars, no chart library dependency

**Per-user table**: 
- Columns: Avatar + Name, Email, Status badge, Sent, Opened, Clicked
- Sortable, filterable by status
- Paginated (50/page)

---

### 3d. User Tags View

- Search users by name/email
- User rows show current tags as chips
- Click a user → tag editor: type to add a tag, click chip × to remove
- **Bulk tag**: checkbox-select multiple users → "Add tag to selected" / "Remove tag from selected"
- Tag summary list: all distinct tags with user count

---

## 4. New Files

| Path | Purpose |
|---|---|
| `supabase/functions/send-campaign/index.ts` | Core send + segment resolution |
| `supabase/functions/process-scheduled-campaigns/index.ts` | pg_cron scheduler |
| `supabase/functions/campaign-webhook/index.ts` | Resend webhook receiver |
| `app/api/unsubscribe/route.ts` | One-click unsubscribe endpoint |
| `src/views/admin/tabs/CampaignsTab.tsx` | Admin UI entry point |
| `src/views/admin/tabs/campaigns/CampaignList.tsx` | List view |
| `src/views/admin/tabs/campaigns/CampaignEditor.tsx` | Compose + segment builder |
| `src/views/admin/tabs/campaigns/CampaignAnalytics.tsx` | Analytics view |
| `src/views/admin/tabs/campaigns/UserTagsManager.tsx` | User tags view |
| `src/hooks/useCampaigns.ts` | React Query hooks for campaigns |
| `supabase/migrations/20260418_email_campaigns.sql` | DB migration |

---

## 5. Environment / Config

- `RESEND_API_KEY` — already set
- `RESEND_WEBHOOK_SECRET` — new: Resend signing secret for webhook validation
- `SUPABASE_JWT_SECRET` — already set (used for unsubscribe token signing)

Register the Supabase edge function URL as the Resend webhook endpoint in the Resend dashboard:
`https://yudyhigvqaodnoqwwtns.supabase.co/functions/v1/campaign-webhook`

Subscribe to: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`.

---

## 6. Out of Scope

- A/B testing subject lines
- Drag-and-drop visual email builder (HTML textarea + preview is sufficient for now)
- Per-language campaign variants (campaigns are single-language; target by language segment filter)
- Migrating the existing `onboarding-emails` sequences into the campaign editor (those remain as edge functions)
