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

  create: async (
    payload: Omit<Campaign, "id" | "created_at" | "updated_at" | "sent_count" | "last_sent_at" | "next_run_at">
  ): Promise<Campaign> => {
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
    if (error && error.code !== "23505") throw error;
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
