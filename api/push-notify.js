/**
 * Vercel Serverless Function (Node.js) — Send push notifications for new messages
 * Called by a Supabase Database Webhook on messages INSERT.
 *
 * Required env vars (set in Vercel dashboard):
 *   VAPID_PUBLIC_KEY        — VAPID public key
 *   VAPID_PRIVATE_KEY       — VAPID private key
 *   VAPID_MAILTO            — e.g. mailto:admin@nwtprogress.com
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS)
 *   VITE_SUPABASE_URL       — Supabase project URL
 *   PUSH_WEBHOOK_SECRET     — shared secret to verify webhook origin
 */

import webpush from "web-push";

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_MAILTO  = process.env.VAPID_MAILTO ?? "mailto:admin@nwtprogress.com";
const SUPABASE_URL  = (process.env.VITE_SUPABASE_URL ?? "").trim();
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const WEBHOOK_SECRET = process.env.PUSH_WEBHOOK_SECRET ?? "";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC, VAPID_PRIVATE);
}

// ── Supabase REST helper (service role — bypasses RLS) ──────────────────────

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
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

  // Verify webhook secret
  const incomingSecret = req.headers["x-webhook-secret"] ?? "";
  if (WEBHOOK_SECRET && incomingSecret !== WEBHOOK_SECRET) {
    return res.status(401).end("Unauthorized");
  }

  const { type, record } = req.body ?? {};
  if (type !== "INSERT" || !record?.conversation_id || !record?.sender_id) {
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
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(200).end("OK");
    }

    // Get sender's display name
    const senderRows = await sbGet(
      `/profiles?id=eq.${record.sender_id}&select=display_name`
    );
    const senderName = senderRows?.[0]?.display_name ?? "Someone";

    // Get push subscriptions for each recipient
    const recipientIds = participants.map(p => p.user_id).join(",");
    const subs = await sbGet(
      `/push_subscriptions?user_id=in.(${recipientIds})&select=endpoint,p256dh,auth_key`
    );
    if (!Array.isArray(subs) || subs.length === 0) {
      return res.status(200).end("OK");
    }

    const payload = JSON.stringify({
      title: senderName,
      body: msgBody,
      url: "/messages",
      tag: `msg-${record.conversation_id}`,
    });

    // Send to all subscriptions, clean up expired ones
    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
            payload
          );
        } catch (err) {
          // 410 Gone = subscription expired/unsubscribed — remove it
          if (err.statusCode === 410) {
            await sbDelete(
              `/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`
            );
          }
        }
      })
    );

    return res.status(200).end("OK");
  } catch (err) {
    console.error("[push-notify]", err);
    return res.status(500).end("Internal Server Error");
  }
}
