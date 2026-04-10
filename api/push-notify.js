/**
 * Vercel Serverless Function (Node.js) — Send push notifications for new messages
 * Called by a Supabase Database Webhook on messages INSERT.
 *
 * Required env vars (set in Vercel dashboard):
 *   VAPID_PUBLIC_KEY        — VAPID public key
 *   VAPID_PRIVATE_KEY       — VAPID private key
 *   VAPID_MAILTO            — e.g. mailto:admin@nwtprogress.com
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS)
 *   NEXT_PUBLIC_SUPABASE_URL — Supabase project URL
 */

import webpush from "web-push";

// Strip surrounding quotes and whitespace — Vercel sometimes stores values with extra quotes
function cleanEnv(val) { return (val ?? "").trim().replace(/^["']|["']$/g, ""); }

const VAPID_PUBLIC   = cleanEnv(process.env.VAPID_PUBLIC_KEY);
const VAPID_PRIVATE  = cleanEnv(process.env.VAPID_PRIVATE_KEY);
const VAPID_MAILTO   = cleanEnv(process.env.VAPID_MAILTO) || "mailto:admin@nwtprogress.com";
const SUPABASE_URL   = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
const SERVICE_KEY    = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC, VAPID_PRIVATE);
  console.log("[push-notify] VAPID configured, public key length:", VAPID_PUBLIC.length);
} else {
  console.error("[push-notify] VAPID keys missing — PUBLIC:", !!VAPID_PUBLIC, "PRIVATE:", !!VAPID_PRIVATE);
}

// ── Supabase REST helper (service role — bypasses RLS) ──────────────────────

async function sbGet(path) {
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
  return res.json();
}

async function sbDelete(path) {
  await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  // Validate webhook secret — fail closed if not configured
  const secret = (process.env.PUSH_WEBHOOK_SECRET ?? "").trim();
  if (!secret) {
    console.error("[push-notify] PUSH_WEBHOOK_SECRET is not configured");
    return res.status(503).end("Server misconfigured");
  }
  if (req.headers["x-webhook-secret"] !== secret) {
    return res.status(401).end("Unauthorized");
  }

  const body = req.body ?? {};
  const { type, record, table } = body;

  console.log("[push-notify] webhook received — type:", type, "table:", table, "record keys:", Object.keys(record ?? {}));

  if (type !== "INSERT" || !record?.conversation_id || !record?.sender_id) {
    console.log("[push-notify] skipping — not an INSERT with conversation_id+sender_id");
    return res.status(200).end("OK");
  }

  // Skip encrypted content preview — show generic body
  const isEncrypted = typeof record.content === "string" && record.content.startsWith("enc:");
  const msgBody = isEncrypted
    ? "New message"
    : (record.content ?? "").slice(0, 120) || "New message";

  try {
    // Get other participant(s) in this conversation
    const participants = await sbGet(
      `/conversation_participants?conversation_id=eq.${record.conversation_id}&user_id=neq.${record.sender_id}&select=user_id`
    );
    console.log("[push-notify] participants found:", participants.length, participants);

    if (!Array.isArray(participants) || participants.length === 0) {
      console.log("[push-notify] no other participants, skipping");
      return res.status(200).end("OK");
    }

    // Get sender's display name
    const senderRows = await sbGet(
      `/profiles?id=eq.${record.sender_id}&select=display_name`
    );
    const senderName = senderRows?.[0]?.display_name ?? "Someone";
    console.log("[push-notify] sender:", senderName);

    // Get push subscriptions for each recipient
    const recipientIds = participants.map(p => p.user_id).join(",");
    const subs = await sbGet(
      `/push_subscriptions?user_id=in.(${recipientIds})&select=endpoint,p256dh,auth,user_id`
    );
    console.log("[push-notify] subscriptions found:", subs.length, subs.map(s => ({ user_id: s.user_id, ep: s.endpoint?.slice(0, 40) })));

    if (!Array.isArray(subs) || subs.length === 0) {
      console.log("[push-notify] no push subscriptions for recipients");
      return res.status(200).end("OK");
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
          console.error("[push-notify] sendNotification failed:", err.statusCode, err.body, sub.endpoint?.slice(0, 40));
          // 410 Gone = subscription expired/unsubscribed — remove it
          // 410/404 = expired; 401 = VAPID key mismatch — all mean remove
          if (err.statusCode === 410 || err.statusCode === 404 || err.statusCode === 401) {
            await sbDelete(
              `/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`
            );
            console.log("[push-notify] removed stale/invalid subscription, status:", err.statusCode);
          }
          return `err-${err.statusCode}`;
        }
      })
    );

    console.log("[push-notify] results:", results.map(r => r.value ?? r.reason));
    return res.status(200).end("OK");
  } catch (err) {
    console.error("[push-notify] unexpected error:", err);
    return res.status(500).end("Internal Server Error");
  }
}
