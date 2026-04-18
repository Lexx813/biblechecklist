# Email Campaign System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full email campaign management system in the admin panel — broadcasts, newsletters, scheduled/recurring sends, advanced segmentation, and per-campaign analytics via Resend webhooks.

**Architecture:** Custom campaign engine in Supabase (3 new tables + 1 RPC) with segment resolution done in SQL at send time. Three Supabase edge functions handle sending, scheduling, and webhook events. Admin UI is a new Campaigns tab in AdminPage with four sub-views, all built in Tailwind CSS v4.

**Tech Stack:** Supabase (Postgres + Edge Functions/Deno), Resend API + webhooks, Next.js App Router API routes, TanStack Query v5, Tailwind CSS v4, Vitest

---

## File Map

| File | Status | Purpose |
|---|---|---|
| `supabase/migrations/20260418_email_campaigns.sql` | Create | Tables, RLS, RPC, profiles columns |
| `src/api/campaigns.ts` | Create | All Supabase queries for campaigns |
| `src/api/__tests__/campaigns.test.ts` | Create | Unit tests for API module |
| `src/hooks/useCampaigns.ts` | Create | TanStack Query hooks |
| `supabase/functions/send-campaign/index.ts` | Create | Core send + segment resolution |
| `supabase/functions/process-scheduled-campaigns/index.ts` | Create | pg_cron-triggered scheduler |
| `supabase/functions/campaign-webhook/index.ts` | Create | Resend webhook receiver |
| `app/api/unsubscribe/route.ts` | Create | One-click unsubscribe endpoint |
| `src/views/admin/tabs/campaigns/CampaignList.tsx` | Create | List view with stats |
| `src/views/admin/tabs/campaigns/CampaignEditor.tsx` | Create | Compose + segment builder |
| `src/views/admin/tabs/campaigns/CampaignAnalytics.tsx` | Create | Per-campaign analytics + SVG chart |
| `src/views/admin/tabs/campaigns/UserTagsManager.tsx` | Create | Admin user tagging UI |
| `src/views/admin/tabs/CampaignsTab.tsx` | Create | Tab router + entry point |
| `src/views/admin/AdminPage.tsx` | Modify | Add Campaigns tab button + render |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260418_email_campaigns.sql`

- [ ] **Step 1: Write migration file**

```sql
-- ── New columns on profiles ────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_marketing_unsubscribed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';

-- ── email_campaigns ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  subject         text NOT NULL,
  preview_text    text,
  html_body       text NOT NULL DEFAULT '',
  type            text NOT NULL DEFAULT 'broadcast'
                    CHECK (type IN ('broadcast', 'newsletter', 'sequence')),
  status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'recurring')),
  segment_config  jsonb NOT NULL DEFAULT '{}',
  schedule_at     timestamptz,
  recurrence_cron text,
  next_run_at     timestamptz,
  last_sent_at    timestamptz,
  sent_count      integer NOT NULL DEFAULT 0,
  created_by      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_admin_all" ON email_campaigns
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- ── campaign_sends ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_sends (
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

ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sends_admin_read" ON campaign_sends
  FOR SELECT USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- ── user_tags ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_tags (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag        text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tag)
);

ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_admin_all" ON user_tags
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- ── estimate_campaign_audience RPC ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION estimate_campaign_audience(segment_config jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count        integer;
  v_plan         text;
  v_languages    text[];
  v_inactive     integer;
  v_joined_bef   timestamptz;
  v_joined_aft   timestamptz;
  v_min_chapters integer;
  v_inc_tags     text[];
  v_exc_tags     text[];
BEGIN
  v_plan         := segment_config->>'plan';
  v_languages    := ARRAY(SELECT jsonb_array_elements_text(COALESCE(segment_config->'languages', '[]'::jsonb)));
  v_inactive     := (segment_config->>'inactive_days')::integer;
  v_joined_bef   := (segment_config->>'joined_before')::timestamptz;
  v_joined_aft   := (segment_config->>'joined_after')::timestamptz;
  v_min_chapters := (segment_config->>'min_chapters_read')::integer;
  v_inc_tags     := ARRAY(SELECT jsonb_array_elements_text(COALESCE(segment_config->'tags', '[]'::jsonb)));
  v_exc_tags     := ARRAY(SELECT jsonb_array_elements_text(COALESCE(segment_config->'exclude_tags', '[]'::jsonb)));

  SELECT COUNT(DISTINCT p.id) INTO v_count
  FROM profiles p
  WHERE p.email_marketing_unsubscribed = false
    AND p.is_banned = false
    AND (
      v_plan IS NULL OR v_plan = 'all' OR
      (v_plan = 'premium' AND p.subscription_status = 'active') OR
      (v_plan = 'free'    AND p.subscription_status != 'active')
    )
    AND (array_length(v_languages, 1) IS NULL OR p.preferred_language = ANY(v_languages))
    AND (v_inactive IS NULL OR p.last_active_at < now() - (v_inactive || ' days')::interval)
    AND (v_joined_bef IS NULL OR p.created_at < v_joined_bef)
    AND (v_joined_aft IS NULL OR p.created_at > v_joined_aft)
    AND (
      v_min_chapters IS NULL OR
      (SELECT COUNT(*) FROM chapter_reads cr WHERE cr.user_id = p.id) >= v_min_chapters
    )
    AND (
      array_length(v_inc_tags, 1) IS NULL OR
      EXISTS (SELECT 1 FROM user_tags ut WHERE ut.user_id = p.id AND ut.tag = ANY(v_inc_tags))
    )
    AND (
      array_length(v_exc_tags, 1) IS NULL OR
      NOT EXISTS (SELECT 1 FROM user_tags ut WHERE ut.user_id = p.id AND ut.tag = ANY(v_exc_tags))
    );

  RETURN COALESCE(v_count, 0);
END;
$$;
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use the `mcp__claude_ai_Supabase__apply_migration` tool:
- name: `email_campaigns`
- query: (full SQL above)

- [ ] **Step 3: Set up pg_cron for scheduled campaigns**

Run this SQL in the Supabase SQL editor (Dashboard → SQL Editor):

```sql
SELECT cron.schedule(
  'process-scheduled-campaigns',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url      := 'https://yudyhigvqaodnoqwwtns.supabase.co/functions/v1/process-scheduled-campaigns',
      headers  := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true),
        'Content-Type', 'application/json'
      ),
      body     := '{}'::jsonb
    ) AS request_id;
  $$
);
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260418_email_campaigns.sql
git commit -m "feat(db): add email_campaigns, campaign_sends, user_tags tables and audience RPC"
```

---

## Task 2: Types & API Module

**Files:**
- Create: `src/api/campaigns.ts`
- Create: `src/api/__tests__/campaigns.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/api/__tests__/campaigns.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase before importing campaigns
vi.mock("../../lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}));

import { campaignApi, buildSegmentSummary } from "../campaigns";

describe("buildSegmentSummary", () => {
  it("returns 'All users' for empty config", () => {
    expect(buildSegmentSummary({})).toBe("All users");
  });

  it("includes plan label", () => {
    expect(buildSegmentSummary({ plan: "premium" })).toContain("Premium");
    expect(buildSegmentSummary({ plan: "free" })).toContain("Free");
  });

  it("includes language list", () => {
    expect(buildSegmentSummary({ languages: ["en", "es"] })).toContain("en, es");
  });

  it("includes inactive days", () => {
    expect(buildSegmentSummary({ inactive_days: 14 })).toContain("14 days inactive");
  });

  it("includes tags", () => {
    expect(buildSegmentSummary({ tags: ["early_adopter"] })).toContain("early_adopter");
  });

  it("combines multiple filters", () => {
    const summary = buildSegmentSummary({ plan: "free", inactive_days: 7, languages: ["en"] });
    expect(summary).toContain("Free");
    expect(summary).toContain("7 days inactive");
    expect(summary).toContain("en");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/alexi/projects/nwt-progress
npx vitest run src/api/__tests__/campaigns.test.ts
```

Expected: FAIL — `buildSegmentSummary` is not defined

- [ ] **Step 3: Create the API module**

Create `src/api/campaigns.ts`:

```typescript
import { supabase } from "../lib/supabase";

export interface SegmentConfig {
  plan?: "all" | "free" | "premium";
  languages?: string[];
  inactive_days?: number;
  joined_before?: string;
  joined_after?: string;
  min_chapters_read?: number;
  tags?: string[];
  exclude_tags?: string[];
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  preview_text: string | null;
  html_body: string;
  type: "broadcast" | "newsletter" | "sequence";
  status: "draft" | "scheduled" | "sending" | "sent" | "recurring";
  segment_config: SegmentConfig;
  schedule_at: string | null;
  recurrence_cron: string | null;
  next_run_at: string | null;
  last_sent_at: string | null;
  sent_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignSend {
  id: string;
  campaign_id: string;
  user_id: string;
  resend_email_id: string | null;
  status: "sent" | "delivered" | "opened" | "clicked" | "bounced" | "unsubscribed";
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  profiles: { display_name: string | null; email: string } | null;
}

export interface UserTag {
  user_id: string;
  tag: string;
  created_at: string;
}

export function buildSegmentSummary(config: SegmentConfig): string {
  const parts: string[] = [];
  if (config.plan === "premium") parts.push("Premium users");
  else if (config.plan === "free") parts.push("Free users");
  if (config.languages?.length) parts.push(config.languages.join(", "));
  if (config.inactive_days) parts.push(`${config.inactive_days} days inactive`);
  if (config.joined_after) parts.push(`joined after ${config.joined_after.slice(0, 10)}`);
  if (config.joined_before) parts.push(`joined before ${config.joined_before.slice(0, 10)}`);
  if (config.min_chapters_read) parts.push(`${config.min_chapters_read}+ chapters read`);
  if (config.tags?.length) parts.push(`tags: ${config.tags.join(", ")}`);
  if (config.exclude_tags?.length) parts.push(`excluding: ${config.exclude_tags.join(", ")}`);
  return parts.length ? parts.join(" · ") : "All users";
}

export const campaignApi = {
  list: async (): Promise<Campaign[]> => {
    const { data, error } = await supabase
      .from("email_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  get: async (id: string): Promise<Campaign> => {
    const { data, error } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (payload: Omit<Campaign, "id" | "created_at" | "updated_at" | "sent_count" | "last_sent_at" | "next_run_at">): Promise<Campaign> => {
    const { data, error } = await supabase
      .from("email_campaigns")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, payload: Partial<Campaign>): Promise<Campaign> => {
    const { data, error } = await supabase
      .from("email_campaigns")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from("email_campaigns").delete().eq("id", id);
    if (error) throw error;
  },

  duplicate: async (id: string): Promise<Campaign> => {
    const original = await campaignApi.get(id);
    return campaignApi.create({
      ...original,
      name: `${original.name} (copy)`,
      status: "draft",
      schedule_at: null,
      recurrence_cron: null,
    });
  },

  estimateAudience: async (segmentConfig: SegmentConfig): Promise<number> => {
    const { data, error } = await supabase.rpc("estimate_campaign_audience", {
      segment_config: segmentConfig,
    });
    if (error) throw error;
    return data ?? 0;
  },

  getSends: async (campaignId: string, page = 0, pageSize = 50): Promise<CampaignSend[]> => {
    const { data, error } = await supabase
      .from("campaign_sends")
      .select("*, profiles(display_name, email)")
      .eq("campaign_id", campaignId)
      .order("sent_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    return (data ?? []) as CampaignSend[];
  },

  getSendStats: async (campaignId: string): Promise<{
    sent: number; delivered: number; opened: number; clicked: number;
    bounced: number; unsubscribed: number;
  }> => {
    const { data, error } = await supabase
      .from("campaign_sends")
      .select("status")
      .eq("campaign_id", campaignId);
    if (error) throw error;
    const counts = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 };
    for (const row of data ?? []) counts[row.status as keyof typeof counts]++;
    counts.sent = data?.length ?? 0;
    return counts;
  },

  getDailyTimeline: async (campaignId: string): Promise<Array<{ date: string; opens: number; clicks: number }>> => {
    const { data, error } = await supabase
      .from("campaign_sends")
      .select("opened_at, clicked_at")
      .eq("campaign_id", campaignId)
      .not("opened_at", "is", null);
    if (error) throw error;
    const byDay: Record<string, { opens: number; clicks: number }> = {};
    for (const row of data ?? []) {
      if (row.opened_at) {
        const d = row.opened_at.slice(0, 10);
        byDay[d] = byDay[d] ?? { opens: 0, clicks: 0 };
        byDay[d].opens++;
      }
      if (row.clicked_at) {
        const d = row.clicked_at.slice(0, 10);
        byDay[d] = byDay[d] ?? { opens: 0, clicks: 0 };
        byDay[d].clicks++;
      }
    }
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));
  },

  listUserTags: async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("user_tags")
      .select("tag")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map(r => r.tag);
  },

  addUserTag: async (userId: string, tag: string, createdBy: string): Promise<void> => {
    const { error } = await supabase
      .from("user_tags")
      .insert({ user_id: userId, tag, created_by: createdBy });
    if (error && error.code !== "23505") throw error; // ignore duplicate
  },

  removeUserTag: async (userId: string, tag: string): Promise<void> => {
    const { error } = await supabase
      .from("user_tags")
      .delete()
      .eq("user_id", userId)
      .eq("tag", tag);
    if (error) throw error;
  },

  listDistinctTags: async (): Promise<Array<{ tag: string; count: number }>> => {
    const { data, error } = await supabase
      .from("user_tags")
      .select("tag");
    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const row of data ?? []) counts[row.tag] = (counts[row.tag] ?? 0) + 1;
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  },

  sendNow: async (campaignId: string): Promise<void> => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-campaign`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ campaign_id: campaignId }),
      }
    );
    if (!res.ok) throw new Error(await res.text());
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/api/__tests__/campaigns.test.ts
```

Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/api/campaigns.ts src/api/__tests__/campaigns.test.ts
git commit -m "feat(api): add campaigns API module and types"
```

---

## Task 3: React Query Hooks

**Files:**
- Create: `src/hooks/useCampaigns.ts`

- [ ] **Step 1: Create hooks file**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignApi, Campaign, SegmentConfig } from "../api/campaigns";
import { useCallback, useRef } from "react";

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: campaignApi.list,
    staleTime: 30 * 1000,
  });
}

export function useCampaign(id: string | null) {
  return useQuery({
    queryKey: ["campaign", id],
    queryFn: () => campaignApi.get(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Campaign> }) =>
      campaignApi.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useDuplicateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignApi.duplicate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useAudienceEstimate(segmentConfig: SegmentConfig, enabled = true) {
  return useQuery({
    queryKey: ["audienceEstimate", segmentConfig],
    queryFn: () => campaignApi.estimateAudience(segmentConfig),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useCampaignSends(campaignId: string, page = 0) {
  return useQuery({
    queryKey: ["campaignSends", campaignId, page],
    queryFn: () => campaignApi.getSends(campaignId, page),
    staleTime: 30 * 1000,
  });
}

export function useCampaignStats(campaignId: string) {
  return useQuery({
    queryKey: ["campaignStats", campaignId],
    queryFn: () => campaignApi.getSendStats(campaignId),
    staleTime: 30 * 1000,
  });
}

export function useCampaignTimeline(campaignId: string) {
  return useQuery({
    queryKey: ["campaignTimeline", campaignId],
    queryFn: () => campaignApi.getDailyTimeline(campaignId),
    staleTime: 30 * 1000,
  });
}

export function useSendCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignApi.sendNow,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useUserTags(userId: string) {
  return useQuery({
    queryKey: ["userTags", userId],
    queryFn: () => campaignApi.listUserTags(userId),
    staleTime: 60 * 1000,
  });
}

export function useAddUserTag(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tag, createdBy }: { tag: string; createdBy: string }) =>
      campaignApi.addUserTag(userId, tag, createdBy),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userTags", userId] }),
  });
}

export function useRemoveUserTag(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tag: string) => campaignApi.removeUserTag(userId, tag),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userTags", userId] }),
  });
}

export function useDistinctTags() {
  return useQuery({
    queryKey: ["distinctTags"],
    queryFn: campaignApi.listDistinctTags,
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useCampaigns.ts
git commit -m "feat(hooks): add useCampaigns TanStack Query hooks"
```

---

## Task 4: send-campaign Edge Function

**Files:**
- Create: `supabase/functions/send-campaign/index.ts`

- [ ] **Step 1: Create the edge function**

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;
const SITE       = "https://jwstudy.org";
const FROM       = "JW Study <notifications@jwstudy.org>";
const BATCH_SIZE = 50;

// ── Unsubscribe token (HMAC-SHA256) ───────────────────────────────────────────

async function makeUnsubToken(userId: string): Promise<string> {
  const secret = Deno.env.get("UNSUB_SECRET") ?? Deno.env.get("SUPABASE_JWT_SECRET") ?? "fallback";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(userId));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const idB64 = btoa(userId).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return `${idB64}.${sigB64}`;
}

function wrapHtml(html: string, unsubUrl: string): string {
  return html + `
<p style="text-align:center;font-size:12px;color:rgba(255,255,255,0.3);margin-top:24px">
  <a href="${unsubUrl}" style="color:rgba(139,92,246,0.5)">Unsubscribe</a>
</p>`;
}

// ── Segment resolution ────────────────────────────────────────────────────────

async function resolveSegment(config: Record<string, unknown>, campaignId: string): Promise<Array<{ id: string; email: string; name: string }>> {
  let query = supabase
    .from("profiles")
    .select("id, email, display_name")
    .eq("email_marketing_unsubscribed", false)
    .eq("is_banned", false);

  const plan = config.plan as string | undefined;
  if (plan === "premium") query = query.eq("subscription_status", "active");
  else if (plan === "free") query = query.neq("subscription_status", "active");

  const languages = config.languages as string[] | undefined;
  if (languages?.length) query = query.in("preferred_language", languages);

  const inactiveDays = config.inactive_days as number | undefined;
  if (inactiveDays) {
    const cutoff = new Date(Date.now() - inactiveDays * 86400_000).toISOString();
    query = query.lt("last_active_at", cutoff);
  }

  const joinedBefore = config.joined_before as string | undefined;
  if (joinedBefore) query = query.lt("created_at", joinedBefore);

  const joinedAfter = config.joined_after as string | undefined;
  if (joinedAfter) query = query.gt("created_at", joinedAfter);

  const { data: candidates, error } = await query;
  if (error) throw error;

  let users = candidates ?? [];

  // Filter by min_chapters_read (requires subquery — done in-memory after fetch)
  const minChapters = config.min_chapters_read as number | undefined;
  if (minChapters) {
    const ids = users.map(u => u.id);
    const { data: chapCounts } = await supabase
      .from("chapter_reads")
      .select("user_id")
      .in("user_id", ids);
    const countMap: Record<string, number> = {};
    for (const r of chapCounts ?? []) countMap[r.user_id] = (countMap[r.user_id] ?? 0) + 1;
    users = users.filter(u => (countMap[u.id] ?? 0) >= minChapters);
  }

  // Filter by include tags
  const incTags = config.tags as string[] | undefined;
  if (incTags?.length) {
    const ids = users.map(u => u.id);
    const { data: tagRows } = await supabase
      .from("user_tags")
      .select("user_id, tag")
      .in("user_id", ids)
      .in("tag", incTags);
    const hasTag = new Set((tagRows ?? []).map(r => r.user_id));
    users = users.filter(u => hasTag.has(u.id));
  }

  // Filter by exclude tags
  const excTags = config.exclude_tags as string[] | undefined;
  if (excTags?.length) {
    const ids = users.map(u => u.id);
    const { data: tagRows } = await supabase
      .from("user_tags")
      .select("user_id, tag")
      .in("user_id", ids)
      .in("tag", excTags);
    const hasExcTag = new Set((tagRows ?? []).map(r => r.user_id));
    users = users.filter(u => !hasExcTag.has(u.id));
  }

  // Exclude users already sent this campaign
  const { data: alreadySent } = await supabase
    .from("campaign_sends")
    .select("user_id")
    .eq("campaign_id", campaignId);
  const sentSet = new Set((alreadySent ?? []).map(r => r.user_id));
  users = users.filter(u => !sentSet.has(u.id));

  return users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.display_name ?? u.email.split("@")[0],
  }));
}

// ── Next run calculation for recurring campaigns ──────────────────────────────

function nextCronRun(cronExpr: string): Date {
  // Simple: always 1 hour from now as a safe default.
  // For production accuracy, use a cron-parser library deployed with the function.
  return new Date(Date.now() + 60 * 60 * 1000);
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body = await req.json().catch(() => ({}));
  const { campaign_id } = body;
  if (!campaign_id) return new Response("Missing campaign_id", { status: 400 });

  const { data: campaign, error: campErr } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("id", campaign_id)
    .single();

  if (campErr || !campaign) return new Response("Campaign not found", { status: 404 });

  // Mark as sending
  await supabase
    .from("email_campaigns")
    .update({ status: "sending" })
    .eq("id", campaign_id);

  const users = await resolveSegment(campaign.segment_config ?? {}, campaign_id);
  let sentCount = 0;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (user) => {
      const unsubToken = await makeUnsubToken(user.id);
      const unsubUrl = `${SITE}/unsubscribe?token=${unsubToken}`;
      const html = wrapHtml(campaign.html_body, unsubUrl);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: user.email,
          subject: campaign.subject,
          html,
          headers: { "X-Campaign-Id": campaign_id, "X-User-Id": user.id },
          tags: [{ name: "campaign_id", value: campaign_id }],
        }),
      });

      if (res.ok) {
        const { id: resendEmailId } = await res.json();
        await supabase.from("campaign_sends").insert({
          campaign_id,
          user_id: user.id,
          resend_email_id: resendEmailId,
          status: "sent",
        });
        sentCount++;
      } else {
        console.error(`Failed for ${user.email}:`, await res.text());
      }
    }));
  }

  // Update campaign on completion
  const isRecurring = campaign.status === "recurring" || campaign.recurrence_cron;
  await supabase.from("email_campaigns").update({
    status: isRecurring ? "recurring" : "sent",
    last_sent_at: new Date().toISOString(),
    sent_count: (campaign.sent_count ?? 0) + sentCount,
    next_run_at: isRecurring ? nextCronRun(campaign.recurrence_cron).toISOString() : null,
  }).eq("id", campaign_id);

  return new Response(JSON.stringify({ ok: true, sent: sentCount }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/send-campaign/index.ts
git commit -m "feat(edge): add send-campaign function with segment resolution"
```

---

## Task 5: process-scheduled-campaigns Edge Function

**Files:**
- Create: `supabase/functions/process-scheduled-campaigns/index.ts`

- [ ] **Step 1: Create the edge function**

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function triggerSend(campaignId: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-campaign`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ campaign_id: campaignId }),
  });
  if (!res.ok) console.error(`Failed to trigger send for ${campaignId}:`, await res.text());
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("CRON_SECRET");
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date().toISOString();

  // Find one-time scheduled campaigns that are due
  const { data: scheduled } = await supabase
    .from("email_campaigns")
    .select("id")
    .eq("status", "scheduled")
    .lte("schedule_at", now);

  // Find recurring campaigns whose next_run_at is due
  const { data: recurring } = await supabase
    .from("email_campaigns")
    .select("id")
    .eq("status", "recurring")
    .lte("next_run_at", now);

  const due = [...(scheduled ?? []), ...(recurring ?? [])];

  if (!due.length) {
    return new Response(JSON.stringify({ ok: true, triggered: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Mark all as "sending" before triggering to prevent double-sends
  await supabase
    .from("email_campaigns")
    .update({ status: "sending" })
    .in("id", due.map(c => c.id));

  await Promise.all(due.map(c => triggerSend(c.id)));

  console.log(`process-scheduled-campaigns: triggered ${due.length} campaigns`);
  return new Response(JSON.stringify({ ok: true, triggered: due.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/process-scheduled-campaigns/index.ts
git commit -m "feat(edge): add process-scheduled-campaigns scheduler function"
```

---

## Task 6: campaign-webhook Edge Function

**Files:**
- Create: `supabase/functions/campaign-webhook/index.ts`

- [ ] **Step 1: Create the edge function**

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET") ?? "";

async function verifySignature(req: Request, body: string): Promise<boolean> {
  if (!WEBHOOK_SECRET) return true; // skip in dev
  const sigHeader = req.headers.get("svix-signature") ?? req.headers.get("resend-signature") ?? "";
  if (!sigHeader) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  // Extract signature from "v1,<base64sig>" format
  const sigB64 = sigHeader.split(",").find(p => p.startsWith("v1,"))?.slice(3) ?? sigHeader;
  const sigBytes = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));
  return crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(body));
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body = await req.text();
  const valid = await verifySignature(req, body);
  if (!valid) return new Response("Unauthorized", { status: 401 });

  const event = JSON.parse(body) as { type: string; data: { email_id: string } };
  const resendEmailId = event.data?.email_id;
  if (!resendEmailId) return new Response("ok", { status: 200 });

  const { type } = event;
  const now = new Date().toISOString();

  const updateMap: Record<string, Record<string, string>> = {
    "email.delivered":  { status: "delivered",    delivered_at: now },
    "email.opened":     { status: "opened",       opened_at: now },
    "email.clicked":    { status: "clicked",      clicked_at: now },
    "email.bounced":    { status: "bounced",      bounced_at: now },
    "email.complained": { status: "unsubscribed", bounced_at: now },
  };

  const updates = updateMap[type];
  if (!updates) return new Response("ok", { status: 200 });

  const { data: sendRow } = await supabase
    .from("campaign_sends")
    .update(updates)
    .eq("resend_email_id", resendEmailId)
    .select("user_id")
    .single();

  // On complaint: globally unsubscribe the user from marketing emails
  if (type === "email.complained" && sendRow?.user_id) {
    await supabase
      .from("profiles")
      .update({ email_marketing_unsubscribed: true })
      .eq("id", sendRow.user_id);
  }

  return new Response("ok", { status: 200 });
});
```

- [ ] **Step 2: Register webhook in Resend dashboard**

In the Resend dashboard (resend.com → Webhooks), add:
- URL: `https://yudyhigvqaodnoqwwtns.supabase.co/functions/v1/campaign-webhook`
- Events: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`

Copy the signing secret and add it to Supabase Edge Function secrets as `RESEND_WEBHOOK_SECRET`.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/campaign-webhook/index.ts
git commit -m "feat(edge): add campaign-webhook for Resend event tracking"
```

---

## Task 7: Unsubscribe API Route

**Files:**
- Create: `app/api/unsubscribe/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function verifyToken(token: string): Promise<string | null> {
  const [idB64, sigB64] = token.split(".");
  if (!idB64 || !sigB64) return null;
  try {
    const userId = atob(idB64.replace(/-/g, "+").replace(/_/g, "/"));
    const secret = process.env.UNSUB_SECRET ?? process.env.SUPABASE_JWT_SECRET ?? "fallback";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const sigBytes = Uint8Array.from(
      atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")),
      c => c.charCodeAt(0),
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(userId),
    );
    return valid ? userId : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const userId = await verifyToken(token);

  if (!userId) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>Invalid unsubscribe link</h2>
        <p>This link is invalid or has expired. <a href="https://jwstudy.org/settings">Manage preferences</a>.</p>
      </body></html>`,
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }

  await supabase
    .from("profiles")
    .update({ email_marketing_unsubscribed: true })
    .eq("id", userId);

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0514;color:#fff">
      <h2 style="color:#c084fc">You've been unsubscribed</h2>
      <p style="color:rgba(255,255,255,0.6)">You will no longer receive marketing emails from JW Study.</p>
      <a href="https://jwstudy.org/settings" style="color:#7c3aed">Manage all email preferences →</a>
    </body></html>`,
    { status: 200, headers: { "Content-Type": "text/html" } },
  );
}
```

- [ ] **Step 2: Add UNSUB_SECRET to Vercel env**

```bash
# Add to Vercel project environment variables:
# UNSUB_SECRET = <random 32-char secret, same value as added to Supabase edge function secrets>
```

- [ ] **Step 3: Commit**

```bash
git add app/api/unsubscribe/route.ts
git commit -m "feat(api): add one-click unsubscribe route"
```

---

## Task 8: CampaignList Component

**Files:**
- Create: `src/views/admin/tabs/campaigns/CampaignList.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { useState } from "react";
import { useCampaigns, useDeleteCampaign, useDuplicateCampaign } from "../../../../hooks/useCampaigns";
import { Campaign, buildSegmentSummary } from "../../../../api/campaigns";

const STATUS_STYLES: Record<string, string> = {
  draft:     "bg-gray-800 text-gray-300",
  scheduled: "bg-blue-900/50 text-blue-300",
  sending:   "bg-yellow-900/50 text-yellow-300",
  sent:      "bg-green-900/50 text-green-300",
  recurring: "bg-purple-900/50 text-purple-300",
};

const TYPE_STYLES: Record<string, string> = {
  broadcast:  "bg-[#1e1040] text-purple-300",
  newsletter: "bg-[#0e1e30] text-blue-300",
  sequence:   "bg-[#0e2010] text-green-300",
};

function pct(num: number, den: number) {
  if (!den) return "—";
  return `${Math.round((num / den) * 100)}%`;
}

interface Props {
  onEdit:      (id: string) => void;
  onAnalytics: (id: string) => void;
  onNew:       () => void;
}

export function CampaignList({ onEdit, onAnalytics, onNew }: Props) {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const deleteCampaign    = useDeleteCampaign();
  const duplicateCampaign = useDuplicateCampaign();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[0,1,2].map(i => (
          <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Email Campaigns</h2>
          <p className="text-sm text-gray-400 mt-0.5">{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Campaign
        </button>
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📧</p>
          <p className="font-medium">No campaigns yet</p>
          <p className="text-sm mt-1">Create your first broadcast to get started.</p>
        </div>
      )}

      {/* Table */}
      {campaigns.length > 0 && (
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/8">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Campaign</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Segment</th>
                <th className="text-center px-4 py-3 text-gray-400 font-medium">Sent</th>
                <th className="text-center px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLES[c.type]}`}>
                        {c.type}
                      </span>
                      <span className="text-white font-medium truncate max-w-[200px]">{c.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]">{c.subject}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-[180px]">
                    <span className="truncate block">{buildSegmentSummary(c.segment_config)}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-white font-medium">{c.sent_count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {c.status === "draft" && (
                        <button
                          onClick={() => onEdit(c.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      )}
                      <button
                        onClick={() => onAnalytics(c.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Analytics"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                      </button>
                      <button
                        onClick={() => duplicateCampaign.mutate(c.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Duplicate"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </button>
                      {confirmDelete === c.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { deleteCampaign.mutate(c.id); setConfirmDelete(null); }}
                            className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs px-2 py-1 bg-white/10 hover:bg-white/15 text-gray-300 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(c.id)}
                          className="p-1.5 rounded-lg hover:bg-red-900/40 text-gray-500 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/admin/tabs/campaigns/CampaignList.tsx
git commit -m "feat(ui): add CampaignList admin component"
```

---

## Task 9: CampaignEditor Component

**Files:**
- Create: `src/views/admin/tabs/campaigns/CampaignEditor.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { useState, useCallback, useRef } from "react";
import { useCampaign, useCreateCampaign, useUpdateCampaign, useSendCampaign, useAudienceEstimate, useDistinctTags } from "../../../../hooks/useCampaigns";
import { Campaign, SegmentConfig } from "../../../../api/campaigns";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "tl", label: "Filipino" },
  { code: "zh", label: "中文" },
];

const CRON_PRESETS = [
  { label: "Daily at 8am UTC",           value: "0 8 * * *" },
  { label: "Weekly Monday 8am UTC",       value: "0 8 * * 1" },
  { label: "Monthly 1st at 8am UTC",      value: "0 8 1 * *" },
  { label: "Custom",                      value: "custom" },
];

type SendMode = "now" | "scheduled" | "recurring";

interface Props {
  campaignId: string | null;
  currentUserId: string;
  onBack: () => void;
  onSent: () => void;
}

export function CampaignEditor({ campaignId, currentUserId, onBack, onSent }: Props) {
  const { data: existing } = useCampaign(campaignId);
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const sendCampaign   = useSendCampaign();
  const { data: allTags = [] } = useDistinctTags();

  const [name,        setName]        = useState(existing?.name        ?? "");
  const [subject,     setSubject]     = useState(existing?.subject     ?? "");
  const [previewText, setPreviewText] = useState(existing?.preview_text ?? "");
  const [htmlBody,    setHtmlBody]    = useState(existing?.html_body   ?? "");
  const [type,        setType]        = useState<Campaign["type"]>(existing?.type ?? "broadcast");
  const [preview,     setPreview]     = useState(false);
  const [sendMode,    setSendMode]    = useState<SendMode>("now");
  const [scheduleAt,  setScheduleAt]  = useState("");
  const [cronPreset,  setCronPreset]  = useState("0 8 * * 1");
  const [cronCustom,  setCronCustom]  = useState("");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  const [segment, setSegment] = useState<SegmentConfig>(existing?.segment_config ?? {});

  const { data: audienceCount } = useAudienceEstimate(segment);

  function updateSegment(patch: Partial<SegmentConfig>) {
    setSegment(prev => ({ ...prev, ...patch }));
  }

  function toggleLanguage(code: string) {
    const langs = segment.languages ?? [];
    updateSegment({
      languages: langs.includes(code) ? langs.filter(l => l !== code) : [...langs, code],
    });
  }

  function toggleTag(tag: string, kind: "tags" | "exclude_tags") {
    const current = (segment[kind] ?? []) as string[];
    updateSegment({
      [kind]: current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag],
    });
  }

  async function handleSave(andSend = false) {
    if (!name || !subject || !htmlBody) {
      setError("Name, subject, and body are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const effectiveCron = cronPreset === "custom" ? cronCustom : cronPreset;
      const payload: Omit<Campaign, "id" | "created_at" | "updated_at" | "sent_count" | "last_sent_at" | "next_run_at"> = {
        name,
        subject,
        preview_text: previewText || null,
        html_body: htmlBody,
        type,
        status: sendMode === "scheduled" ? "scheduled"
              : sendMode === "recurring" ? "recurring"
              : "draft",
        segment_config: segment,
        schedule_at:    sendMode === "scheduled" ? new Date(scheduleAt).toISOString() : null,
        recurrence_cron: sendMode === "recurring" ? effectiveCron : null,
        created_by: currentUserId,
      };

      let savedId = campaignId;
      if (campaignId) {
        await updateCampaign.mutateAsync({ id: campaignId, payload });
      } else {
        const created = await createCampaign.mutateAsync(payload);
        savedId = created.id;
      }

      if (andSend && savedId) {
        await sendCampaign.mutateAsync(savedId);
        onSent();
      } else {
        onBack();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 className="text-xl font-bold text-white">{campaignId ? "Edit Campaign" : "New Campaign"}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left: Content */}
        <div className="space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            {(["broadcast", "newsletter", "sequence"] as Campaign["type"][]).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  type === t
                    ? "bg-purple-600 text-white"
                    : "bg-white/8 text-gray-400 hover:text-white hover:bg-white/12"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Campaign name (internal)"
            className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Email subject line"
            className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <input
            value={previewText}
            onChange={e => setPreviewText(e.target.value)}
            placeholder="Preview text (shows in inbox)"
            className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />

          {/* HTML editor with preview toggle */}
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between bg-white/5 border-b border-white/10 px-4 py-2">
              <span className="text-sm text-gray-400 font-medium">Email Body (HTML)</span>
              <button
                onClick={() => setPreview(p => !p)}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                {preview ? "← Edit" : "Preview →"}
              </button>
            </div>
            {preview ? (
              <iframe
                srcDoc={htmlBody || "<p style='padding:20px;color:#888'>Nothing to preview</p>"}
                className="w-full h-[480px] bg-white"
                sandbox="allow-same-origin"
                title="Email preview"
              />
            ) : (
              <textarea
                value={htmlBody}
                onChange={e => setHtmlBody(e.target.value)}
                placeholder="Paste your HTML email here…"
                className="w-full h-[480px] bg-transparent px-4 py-3 text-sm text-gray-200 placeholder-gray-600 font-mono focus:outline-none resize-none"
              />
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        {/* Right: Settings */}
        <div className="space-y-4">
          {/* Segment Builder */}
          <div className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Audience</h3>
              <span className="text-xs text-purple-300 font-medium">
                ~{audienceCount?.toLocaleString() ?? "…"} users
              </span>
            </div>

            {/* Plan */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider">Plan</label>
              <div className="flex gap-2 mt-1.5">
                {(["all", "free", "premium"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => updateSegment({ plan: p })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      (segment.plan ?? "all") === p
                        ? "bg-purple-600 text-white"
                        : "bg-white/6 text-gray-400 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider">Languages</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => toggleLanguage(l.code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      (segment.languages ?? []).includes(l.code)
                        ? "bg-purple-700 text-white"
                        : "bg-white/6 text-gray-400 hover:text-white"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Joined date range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Joined after</label>
                <input type="date" value={segment.joined_after?.slice(0,10) ?? ""}
                  onChange={e => updateSegment({ joined_after: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })}
                  className="w-full mt-1 bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Joined before</label>
                <input type="date" value={segment.joined_before?.slice(0,10) ?? ""}
                  onChange={e => updateSegment({ joined_before: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })}
                  className="w-full mt-1 bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Inactive days */}
            <div>
              <label className="text-xs text-gray-500">Inactive for (days)</label>
              <input type="number" min="1" placeholder="e.g. 14"
                value={segment.inactive_days ?? ""}
                onChange={e => updateSegment({ inactive_days: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full mt-1 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Min chapters */}
            <div>
              <label className="text-xs text-gray-500">Min chapters read</label>
              <input type="number" min="0" placeholder="e.g. 10"
                value={segment.min_chapters_read ?? ""}
                onChange={e => updateSegment({ min_chapters_read: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full mt-1 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Include tags */}
            {allTags.length > 0 && (
              <div>
                <label className="text-xs text-gray-500">Include tags</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {allTags.map(({ tag }) => (
                    <button key={tag} onClick={() => toggleTag(tag, "tags")}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        (segment.tags ?? []).includes(tag)
                          ? "bg-green-700 text-white"
                          : "bg-white/6 text-gray-400 hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Exclude tags */}
            {allTags.length > 0 && (
              <div>
                <label className="text-xs text-gray-500">Exclude tags</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {allTags.map(({ tag }) => (
                    <button key={tag} onClick={() => toggleTag(tag, "exclude_tags")}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        (segment.exclude_tags ?? []).includes(tag)
                          ? "bg-red-700 text-white"
                          : "bg-white/6 text-gray-400 hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Send Options */}
          <div className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Send Options</h3>
            {(["now", "scheduled", "recurring"] as SendMode[]).map(mode => (
              <label key={mode} className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="sendMode" value={mode} checked={sendMode === mode}
                  onChange={() => setSendMode(mode)}
                  className="mt-0.5 accent-purple-500"
                />
                <div>
                  <p className="text-sm text-white font-medium capitalize">
                    {mode === "now" ? "Send Now" : mode === "scheduled" ? "Schedule" : "Recurring"}
                  </p>
                  {mode === "scheduled" && sendMode === "scheduled" && (
                    <input type="datetime-local" value={scheduleAt}
                      onChange={e => setScheduleAt(e.target.value)}
                      className="mt-1.5 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  )}
                  {mode === "recurring" && sendMode === "recurring" && (
                    <div className="mt-1.5 space-y-2">
                      <select value={cronPreset} onChange={e => setCronPreset(e.target.value)}
                        className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        {CRON_PRESETS.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                      {cronPreset === "custom" && (
                        <input value={cronCustom} onChange={e => setCronCustom(e.target.value)}
                          placeholder="0 8 * * 1"
                          className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                        />
                      )}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleSave(sendMode === "now")}
              disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              {saving ? "Saving…" : sendMode === "now" ? "Send Now" : sendMode === "scheduled" ? "Schedule Send" : "Save Recurring"}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full bg-white/8 hover:bg-white/12 text-gray-300 font-medium py-2 rounded-xl transition-colors"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/admin/tabs/campaigns/CampaignEditor.tsx
git commit -m "feat(ui): add CampaignEditor with segment builder and send options"
```

---

## Task 10: CampaignAnalytics Component

**Files:**
- Create: `src/views/admin/tabs/campaigns/CampaignAnalytics.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { useState } from "react";
import { useCampaign, useCampaignStats, useCampaignTimeline, useCampaignSends } from "../../../../hooks/useCampaigns";
import { buildSegmentSummary } from "../../../../api/campaigns";

function pct(num: number, den: number) {
  if (!den) return "—";
  return `${Math.round((num / den) * 100)}%`;
}

const STATUS_COLORS: Record<string, string> = {
  sent:          "bg-gray-700 text-gray-300",
  delivered:     "bg-blue-900/50 text-blue-300",
  opened:        "bg-green-900/50 text-green-300",
  clicked:       "bg-purple-900/50 text-purple-300",
  bounced:       "bg-orange-900/50 text-orange-300",
  unsubscribed:  "bg-red-900/50 text-red-300",
};

function SvgBarChart({ data }: { data: Array<{ date: string; opens: number; clicks: number }> }) {
  if (!data.length) return <p className="text-center text-gray-600 py-8 text-sm">No event data yet</p>;

  const maxVal = Math.max(...data.flatMap(d => [d.opens, d.clicks]), 1);
  const W = 480, H = 120, PADDING = 8, BAR_W = Math.max(4, (W - PADDING * 2) / data.length / 2.5);
  const scale = (v: number) => H - PADDING - (v / maxVal) * (H - PADDING * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Timeline chart">
      {data.map((d, i) => {
        const slotW = (W - PADDING * 2) / data.length;
        const x = PADDING + i * slotW;
        return (
          <g key={d.date}>
            <rect x={x} y={scale(d.opens)} width={BAR_W} height={H - PADDING - scale(d.opens)} fill="#22c55e" fillOpacity={0.7} rx={2}>
              <title>{d.date}: {d.opens} opens</title>
            </rect>
            <rect x={x + BAR_W + 2} y={scale(d.clicks)} width={BAR_W} height={H - PADDING - scale(d.clicks)} fill="#a855f7" fillOpacity={0.7} rx={2}>
              <title>{d.date}: {d.clicks} clicks</title>
            </rect>
            <text x={x + BAR_W / 2} y={H - 1} fontSize={8} fill="#6b7280" textAnchor="middle">
              {d.date.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

interface Props {
  campaignId: string;
  onBack: () => void;
}

export function CampaignAnalytics({ campaignId, onBack }: Props) {
  const { data: campaign }  = useCampaign(campaignId);
  const { data: stats }     = useCampaignStats(campaignId);
  const { data: timeline = [] } = useCampaignTimeline(campaignId);
  const [sendsPage, setSendsPage] = useState(0);
  const { data: sends = [] }     = useCampaignSends(campaignId, sendsPage);
  const [statusFilter, setStatusFilter] = useState("all");

  const totalSent = stats?.sent ?? 0;
  const kpis = [
    { label: "Sent",          value: totalSent.toLocaleString() },
    { label: "Open Rate",     value: pct(stats?.opened ?? 0, totalSent) },
    { label: "Click Rate",    value: pct(stats?.clicked ?? 0, totalSent) },
    { label: "Unsubscribed",  value: stats?.unsubscribed ?? 0 },
  ];

  const filteredSends = statusFilter === "all" ? sends : sends.filter(s => s.status === statusFilter);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">{campaign?.name ?? "Analytics"}</h2>
          {campaign && <p className="text-xs text-gray-500 mt-0.5">{buildSegmentSummary(campaign.segment_config)}</p>}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white/4 border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Timeline chart */}
      <div className="bg-white/4 border border-white/8 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Opens &amp; Clicks Over Time</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 opacity-70 inline-block" /> Opens</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500 opacity-70 inline-block" /> Clicks</span>
          </div>
        </div>
        <SvgBarChart data={timeline} />
      </div>

      {/* Per-user table */}
      <div className="bg-white/4 border border-white/8 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <h3 className="text-sm font-semibold text-white">Recipients</h3>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/6 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
          >
            <option value="all">All</option>
            {["sent","delivered","opened","clicked","bounced","unsubscribed"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">User</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Status</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Sent</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Opened</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Clicked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredSends.map(s => (
              <tr key={s.id} className="hover:bg-white/3 transition-colors">
                <td className="px-4 py-2.5">
                  <p className="text-white text-xs font-medium">{s.profiles?.display_name ?? "—"}</p>
                  <p className="text-gray-500 text-xs">{s.profiles?.email}</p>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status]}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-400">{s.sent_at ? new Date(s.sent_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-2.5 text-xs text-gray-400">{s.opened_at ? new Date(s.opened_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-2.5 text-xs text-gray-400">{s.clicked_at ? new Date(s.clicked_at).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
            {filteredSends.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-600 text-sm">No recipients found</td></tr>
            )}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
          <button
            disabled={sendsPage === 0}
            onClick={() => setSendsPage(p => p - 1)}
            className="text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-500">Page {sendsPage + 1}</span>
          <button
            disabled={sends.length < 50}
            onClick={() => setSendsPage(p => p + 1)}
            className="text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/admin/tabs/campaigns/CampaignAnalytics.tsx
git commit -m "feat(ui): add CampaignAnalytics with SVG timeline chart"
```

---

## Task 11: UserTagsManager Component

**Files:**
- Create: `src/views/admin/tabs/campaigns/UserTagsManager.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { useState } from "react";
import { useUsers } from "../../../../hooks/useAdmin";
import { useDistinctTags } from "../../../../hooks/useCampaigns";
import { campaignApi } from "../../../../api/campaigns";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  currentUserId: string;
}

export function UserTagsManager({ currentUserId }: Props) {
  const { data: users = [] }   = useUsers();
  const { data: allTags = [] } = useDistinctTags();
  const queryClient            = useQueryClient();

  const [search,       setSearch]       = useState("");
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [userTags,     setUserTags]     = useState<Record<string, string[]>>({});
  const [loadedUser,   setLoadedUser]   = useState<string | null>(null);
  const [newTag,       setNewTag]       = useState("");
  const [bulkTag,      setBulkTag]      = useState("");
  const [bulkMode,     setBulkMode]     = useState<"add" | "remove">("add");

  const filtered = users.filter(u =>
    (u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
     u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  async function loadTagsForUser(userId: string) {
    if (loadedUser === userId) return;
    const tags = await campaignApi.listUserTags(userId);
    setUserTags(prev => ({ ...prev, [userId]: tags }));
    setLoadedUser(userId);
  }

  async function addTag(userId: string, tag: string) {
    if (!tag.trim()) return;
    await campaignApi.addUserTag(userId, tag.trim().toLowerCase(), currentUserId);
    setUserTags(prev => ({
      ...prev,
      [userId]: [...new Set([...(prev[userId] ?? []), tag.trim().toLowerCase()])],
    }));
    setNewTag("");
    queryClient.invalidateQueries({ queryKey: ["distinctTags"] });
  }

  async function removeTag(userId: string, tag: string) {
    await campaignApi.removeUserTag(userId, tag);
    setUserTags(prev => ({ ...prev, [userId]: (prev[userId] ?? []).filter(t => t !== tag) }));
    queryClient.invalidateQueries({ queryKey: ["distinctTags"] });
  }

  async function applyBulkTag() {
    if (!bulkTag.trim() || !selected.size) return;
    const tag = bulkTag.trim().toLowerCase();
    for (const uid of selected) {
      if (bulkMode === "add") await campaignApi.addUserTag(uid, tag, currentUserId);
      else await campaignApi.removeUserTag(uid, tag);
    }
    queryClient.invalidateQueries({ queryKey: ["distinctTags"] });
    setBulkTag("");
    setSelected(new Set());
  }

  function toggleSelect(userId: string) {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(userId) ? s.delete(userId) : s.add(userId);
      return s;
    });
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">User Tags</h2>
        <p className="text-sm text-gray-500 mt-0.5">Assign custom labels to users for targeted campaigns.</p>
      </div>

      {/* Tag summary */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map(({ tag, count }) => (
            <span key={tag} className="flex items-center gap-1.5 bg-purple-900/30 border border-purple-700/30 text-purple-300 text-xs px-2.5 py-1 rounded-full">
              {tag}
              <span className="bg-purple-700/40 text-purple-200 text-[10px] px-1.5 py-0.5 rounded-full">{count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-purple-900/20 border border-purple-700/30 rounded-xl px-4 py-3">
          <span className="text-sm text-purple-300 font-medium">{selected.size} selected</span>
          <div className="flex gap-1">
            {(["add", "remove"] as const).map(m => (
              <button key={m} onClick={() => setBulkMode(m)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  bulkMode === m ? "bg-purple-600 text-white" : "bg-white/8 text-gray-400 hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <input value={bulkTag} onChange={e => setBulkTag(e.target.value)}
            placeholder="tag name"
            list="existing-tags"
            className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <datalist id="existing-tags">
            {allTags.map(({ tag }) => <option key={tag} value={tag} />)}
          </datalist>
          <button onClick={applyBulkTag}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Apply
          </button>
          <button onClick={() => setSelected(new Set())}
            className="px-3 py-1.5 bg-white/8 hover:bg-white/12 text-gray-400 text-xs rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search users by name or email…"
        className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
      />

      {/* User list */}
      <div className="space-y-1">
        {filtered.slice(0, 50).map(u => (
          <div key={u.id}
            className={`rounded-xl border transition-colors ${
              loadedUser === u.id
                ? "border-purple-700/40 bg-purple-900/10"
                : "border-white/6 bg-white/3 hover:border-white/10"
            }`}
          >
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => { toggleSelect(u.id); loadTagsForUser(u.id); }}
            >
              <input type="checkbox" checked={selected.has(u.id)} readOnly
                className="accent-purple-500 w-3.5 h-3.5 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{u.display_name ?? "—"}</p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
              </div>
              {(userTags[u.id] ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 justify-end">
                  {(userTags[u.id] ?? []).map(tag => (
                    <span key={tag} className="text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Expanded tag editor */}
            {loadedUser === u.id && (
              <div className="px-4 pb-3 border-t border-white/6 pt-3">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(userTags[u.id] ?? []).map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-purple-900/30 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                      {tag}
                      <button onClick={() => removeTag(u.id, tag)} className="hover:text-red-400 transition-colors">×</button>
                    </span>
                  ))}
                  {!(userTags[u.id]?.length) && (
                    <span className="text-xs text-gray-600">No tags yet</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input value={newTag} onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addTag(u.id, newTag)}
                    placeholder="Add tag…"
                    list="existing-tags"
                    className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  <button onClick={() => addTag(u.id, newTag)}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-600 py-8 text-sm">No users found</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/admin/tabs/campaigns/UserTagsManager.tsx
git commit -m "feat(ui): add UserTagsManager with bulk tagging"
```

---

## Task 12: CampaignsTab + Wire AdminPage

**Files:**
- Create: `src/views/admin/tabs/CampaignsTab.tsx`
- Modify: `src/views/admin/AdminPage.tsx`

- [ ] **Step 1: Create CampaignsTab**

```typescript
import { useState } from "react";
import { CampaignList }     from "./campaigns/CampaignList";
import { CampaignEditor }   from "./campaigns/CampaignEditor";
import { CampaignAnalytics } from "./campaigns/CampaignAnalytics";
import { UserTagsManager }  from "./campaigns/UserTagsManager";

type View = "list" | "editor" | "analytics" | "tags";

interface Props {
  currentUserId: string;
}

export function CampaignsTab({ currentUserId }: Props) {
  const [view,        setView]        = useState<View>("list");
  const [editId,      setEditId]      = useState<string | null>(null);
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);

  const subTabs: Array<{ key: View; label: string }> = [
    { key: "list",     label: "Campaigns" },
    { key: "tags",     label: "User Tags" },
  ];

  // Full-page sub-views (editor + analytics) don't show the sub-tab bar
  const showSubTabs = view === "list" || view === "tags";

  return (
    <div>
      {showSubTabs && (
        <div className="flex gap-1 px-6 pt-4 border-b border-white/6">
          {subTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                view === t.key
                  ? "text-white border-b-2 border-purple-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {view === "list" && (
        <CampaignList
          onEdit={id => { setEditId(id); setView("editor"); }}
          onAnalytics={id => { setAnalyticsId(id); setView("analytics"); }}
          onNew={() => { setEditId(null); setView("editor"); }}
        />
      )}
      {view === "editor" && (
        <CampaignEditor
          campaignId={editId}
          currentUserId={currentUserId}
          onBack={() => setView("list")}
          onSent={() => setView("list")}
        />
      )}
      {view === "analytics" && analyticsId && (
        <CampaignAnalytics
          campaignId={analyticsId}
          onBack={() => setView("list")}
        />
      )}
      {view === "tags" && (
        <UserTagsManager currentUserId={currentUserId} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add Campaigns tab to AdminPage**

In `src/views/admin/AdminPage.tsx`:

After the `AIUsageTab` import at the top, add:
```typescript
import { CampaignsTab } from "./tabs/CampaignsTab";
```

In the tabs button list, after the `aiUsage` button block, add:
```typescript
{isCurrentUserAdmin && (
  <button className={`admin-tab${tab === "campaigns" ? " admin-tab--active" : ""}`} onClick={() => setTab("campaigns")}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    Campaigns
  </button>
)}
```

In the tab content section, after the `aiUsage` content line, add:
```typescript
{tab === "campaigns" && isCurrentUserAdmin && <CampaignsTab currentUserId={currentUser.id} />}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /home/alexi/projects/nwt-progress
npx tsc --noEmit 2>&1 | head -40
```

Fix any type errors before continuing.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all existing tests pass + 6 new campaigns tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/views/admin/tabs/CampaignsTab.tsx src/views/admin/AdminPage.tsx
git commit -m "feat(admin): add Campaigns tab with full campaign management UI"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ DB: email_campaigns, campaign_sends, user_tags, profiles.email_marketing_unsubscribed, profiles.preferred_language
- ✅ `estimate_campaign_audience` RPC
- ✅ `send-campaign` edge function with segment resolution and batch sending
- ✅ `process-scheduled-campaigns` edge function triggered every 15 min
- ✅ `campaign-webhook` edge function for Resend events
- ✅ One-click unsubscribe route with HMAC token
- ✅ Admin UI: list, editor (with segment builder + send options), analytics (SVG chart), user tags
- ✅ All new UI in Tailwind CSS
- ✅ Resend webhook registration instructions included

**Post-deploy manual step:** Register the `campaign-webhook` edge function URL in the Resend dashboard and add `RESEND_WEBHOOK_SECRET` to Supabase edge function secrets. Also add `UNSUB_SECRET` to both Supabase and Vercel env vars (same value).
