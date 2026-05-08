/**
 * Vercel Serverless Function (Node.js) — Send push notifications for new messages
 * Called by a Supabase Database Webhook on messages INSERT.
 *
 * Required env vars (set in Vercel dashboard):
 *   VAPID_PUBLIC_KEY        — VAPID public key
 *   VAPID_PRIVATE_KEY       — VAPID private key
 *   VAPID_MAILTO            — e.g. mailto:admin@jwstudy.org
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS)
 *   NEXT_PUBLIC_SUPABASE_URL — Supabase project URL
 *   PUSH_WEBHOOK_SECRET      — shared secret in `x-webhook-secret` header
 */

import webpush from "web-push";

// Vercel's classic Node serverless function shape — req has .body parsed by
// the runtime, res is a Node ServerResponse with Express-like helpers.
type VercelReq = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};
type VercelRes = {
  status: (code: number) => VercelRes;
  end: (body?: string) => void;
};

interface ParticipantRow { user_id: string }
interface ProfileRow { display_name?: string | null }
interface PushSubRow {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
}
interface WebhookBody {
  type?: string;
  table?: string;
  record?: {
    conversation_id?: string;
    sender_id?: string;
    content?: string;
  };
}

interface WebPushError extends Error {
  statusCode?: number;
  body?: string;
}

// Strip surrounding quotes and whitespace — Vercel sometimes stores values with extra quotes.
function cleanEnv(val: string | undefined): string {
  return (val ?? "").trim().replace(/^["']|["']$/g, "");
}

const VAPID_PUBLIC   = cleanEnv(process.env.VAPID_PUBLIC_KEY);
const VAPID_PRIVATE  = cleanEnv(process.env.VAPID_PRIVATE_KEY);
const VAPID_MAILTO   = cleanEnv(process.env.VAPID_MAILTO) || "mailto:admin@jwstudy.org";
const SUPABASE_URL   = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
const SERVICE_KEY    = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC, VAPID_PRIVATE);
  console.log("[push-notify] VAPID configured, public key length:", VAPID_PUBLIC.length);
} else {
  console.error("[push-notify] VAPID keys missing — PUBLIC:", !!VAPID_PUBLIC, "PRIVATE:", !!VAPID_PRIVATE);
}

// ── Supabase REST helper (service role — bypasses RLS) ──────────────────────

async function sbGet<T>(path: string): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[push-notify] sbGet failed:", res.status, url, text.slice(0, 200));
    return [];
  }
  return (await res.json()) as T[];
}

async function sbDelete(path: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
}

function headerValue(headers: VercelReq["headers"], name: string): string | undefined {
  const v = headers[name];
  if (Array.isArray(v)) return v[0];
  return v;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelReq, res: VercelRes): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).end("Method Not Allowed");
    return;
  }

  // Validate webhook secret — fail closed if not configured
  const secret = (process.env.PUSH_WEBHOOK_SECRET ?? "").trim();
  if (!secret) {
    console.error("[push-notify] PUSH_WEBHOOK_SECRET is not configured");
    res.status(503).end("Server misconfigured");
    return;
  }
  if (headerValue(req.headers, "x-webhook-secret") !== secret) {
    res.status(401).end("Unauthorized");
    return;
  }

  const body = (req.body ?? {}) as WebhookBody;
  const { type, record, table } = body;

  console.log("[push-notify] webhook received — type:", type, "table:", table, "record keys:", Object.keys(record ?? {}));

  if (type !== "INSERT" || !record?.conversation_id || !record?.sender_id) {
    console.log("[push-notify] skipping — not an INSERT with conversation_id+sender_id");
    res.status(200).end("OK");
    return;
  }

  // Skip encrypted content preview — show generic body
  const isEncrypted = typeof record.content === "string" && record.content.startsWith("enc:");
  const msgBody = isEncrypted
    ? "New message"
    : (record.content ?? "").slice(0, 120) || "New message";

  try {
    // Get other participant(s) in this conversation
    const participants = await sbGet<ParticipantRow>(
      `/conversation_participants?conversation_id=eq.${record.conversation_id}&user_id=neq.${record.sender_id}&select=user_id`
    );
    console.log("[push-notify] participants found:", participants.length, participants);

    if (participants.length === 0) {
      console.log("[push-notify] no other participants, skipping");
      res.status(200).end("OK");
      return;
    }

    // Get sender's display name
    const senderRows = await sbGet<ProfileRow>(
      `/profiles?id=eq.${record.sender_id}&select=display_name`
    );
    const senderName = senderRows[0]?.display_name ?? "Someone";
    console.log("[push-notify] sender:", senderName);

    // Get push subscriptions for each recipient
    const recipientIds = participants.map((p) => p.user_id).join(",");
    const subs = await sbGet<PushSubRow>(
      `/push_subscriptions?user_id=in.(${recipientIds})&select=endpoint,p256dh,auth,user_id`
    );
    console.log("[push-notify] subscriptions found:", subs.length, subs.map(s => ({ user_id: s.user_id, ep: s.endpoint?.slice(0, 40) })));

    if (subs.length === 0) {
      console.log("[push-notify] no push subscriptions for recipients");
      res.status(200).end("OK");
      return;
    }

    const recipientPayloads = participants.map((p) => ({
      user_id: p.user_id,
      payload: JSON.stringify({
        title: senderName,
        body: msgBody,
        url: "/messages",
        tag: `msg-${record.conversation_id}`,
        badge: 1,
      }),
    }));

    // Send to all subscriptions, clean up expired ones
    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        const recipPayload = recipientPayloads.find(r => r.user_id === sub.user_id)?.payload
          ?? recipientPayloads[0]?.payload;
        try {
          const result = await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            recipPayload,
            { urgency: "high", TTL: 3600 }
          );
          console.log("[push-notify] sent OK to", sub.endpoint?.slice(0, 40), "status:", result.statusCode);
          return "ok";
        } catch (err) {
          const e = err as WebPushError;
          console.error("[push-notify] sendNotification failed:", e.statusCode, e.body, sub.endpoint?.slice(0, 40));
          // 410 Gone = subscription expired/unsubscribed — remove it.
          // 410/404 = expired; 401 = VAPID key mismatch — all mean remove.
          if (e.statusCode === 410 || e.statusCode === 404 || e.statusCode === 401) {
            await sbDelete(
              `/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`
            );
            console.log("[push-notify] removed stale/invalid subscription, status:", e.statusCode);
          }
          return `err-${e.statusCode}`;
        }
      })
    );

    console.log("[push-notify] results:", results.map((r) => r.status === "fulfilled" ? r.value : r.reason));
    res.status(200).end("OK");
  } catch (err) {
    console.error("[push-notify] unexpected error:", err);
    res.status(500).end("Internal Server Error");
  }
}
