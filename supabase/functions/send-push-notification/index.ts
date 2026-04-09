/**
 * send-push-notification Edge Function
 *
 * Triggered by a Supabase Database Webhook on notifications INSERT.
 * Sends a Web Push notification to all of the recipient's subscribed devices.
 *
 * Required secrets (Supabase dashboard → Edge Functions → Secrets):
 *   VAPID_PUBLIC_KEY        — base64url P-256 public key
 *   VAPID_PRIVATE_KEY       — base64url P-256 private key
 *   VAPID_SUBJECT           — mailto: or https: URI (e.g. mailto:admin@nwtprogress.com)
 *   SUPABASE_URL            — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ── Utility helpers ──────────────────────────────────────────────────────────

function base64urlToBytes(b64url: string): Uint8Array {
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function bytesToBase64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function utf8Encode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const len = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(len);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

// ── VAPID JWT (ES256) ────────────────────────────────────────────────────────

async function buildVapidHeader(audience: string): Promise<string> {
  const privateKeyB64 = Deno.env.get("VAPID_PRIVATE_KEY")!;
  const publicKeyB64 = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const subject = Deno.env.get("VAPID_SUBJECT")!;

  const header = bytesToBase64url(utf8Encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = bytesToBase64url(utf8Encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  })));

  const signingInput = `${header}.${payload}`;

  // Import the raw P-256 private key scalar (32 bytes) as JWK
  const dBytes = base64urlToBytes(privateKeyB64);
  // Derive the uncompressed public key point from base64url
  const pubBytes = base64urlToBytes(publicKeyB64);
  // pubBytes is uncompressed (65 bytes: 0x04 || x || y) or compressed (33 bytes)
  let xBytes: Uint8Array, yBytes: Uint8Array;
  if (pubBytes.length === 65 && pubBytes[0] === 0x04) {
    xBytes = pubBytes.slice(1, 33);
    yBytes = pubBytes.slice(33, 65);
  } else {
    // Try importing as raw key to get x/y
    const tempKey = await crypto.subtle.importKey(
      "raw", pubBytes, { name: "ECDH", namedCurve: "P-256" }, true, []
    );
    const exported = await crypto.subtle.exportKey("jwk", tempKey);
    xBytes = base64urlToBytes(exported.x!);
    yBytes = base64urlToBytes(exported.y!);
  }

  const jwk = {
    kty: "EC", crv: "P-256",
    d: bytesToBase64url(dBytes),
    x: bytesToBase64url(xBytes),
    y: bytesToBase64url(yBytes),
  };

  const key = await crypto.subtle.importKey(
    "jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
  );

  const sigBytes = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    utf8Encode(signingInput),
  );

  const sig = bytesToBase64url(new Uint8Array(sigBytes));
  const jwt = `${signingInput}.${sig}`;
  const pubKeyHeader = bytesToBase64url(pubBytes);

  return `vapid t=${jwt},k=${pubKeyHeader}`;
}

// ── RFC 8291 Web Push payload encryption ─────────────────────────────────────

async function encryptPayload(
  payload: string,
  p256dhB64: string,
  authB64: string,
): Promise<{ body: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const authSecret = base64urlToBytes(authB64);
  const receiverPublicKey = base64urlToBytes(p256dhB64);

  // Generate ephemeral ECDH key pair
  const ephemeral = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]
  );

  // Export ephemeral public key (uncompressed)
  const localPublicKey = new Uint8Array(
    await crypto.subtle.exportKey("raw", ephemeral.publicKey)
  );

  // Import receiver public key
  const receiverKey = await crypto.subtle.importKey(
    "raw", receiverPublicKey, { name: "ECDH", namedCurve: "P-256" }, false, []
  );

  // ECDH shared secret (32 bytes)
  const sharedBits = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: receiverKey }, ephemeral.privateKey, 256)
  );

  // Salt (16 random bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // PRK_key = HKDF-Extract(auth_secret, shared_secret)  [RFC 8291 §3.3]
  const prkKeyMaterial = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveBits"]);
  const keyInfoLabel = concat(
    utf8Encode("WebPush: info\x00"),
    receiverPublicKey,
    localPublicKey,
  );
  const prkKeyBuf = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: authSecret, info: keyInfoLabel },
    prkKeyMaterial, 256
  );

  // IKM = PRK_key
  const ikmMaterial = await crypto.subtle.importKey("raw", prkKeyBuf, "HKDF", false, ["deriveBits"]);

  // CEK (16 bytes) and Nonce (12 bytes) via HKDF with salt
  const cekInfo = utf8Encode("Content-Encoding: aes128gcm\x00");
  const nonceInfo = utf8Encode("Content-Encoding: nonce\x00");

  const cekBuf = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: cekInfo }, ikmMaterial, 128
  ));
  const nonceBuf = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo }, ikmMaterial, 96
  ));

  const cek = await crypto.subtle.importKey("raw", cekBuf, "AES-GCM", false, ["encrypt"]);

  // Padding: record size = 4096, pad delimiter = 0x02
  const plaintext = utf8Encode(payload);
  const paddedLen = 4096 - 16 - 1; // max record content length minus GCM tag minus delimiter byte
  const recordContent = new Uint8Array(Math.min(plaintext.length + 1, paddedLen));
  recordContent.set(plaintext.slice(0, plaintext.length));
  recordContent[plaintext.length] = 0x02; // padding delimiter

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonceBuf }, cek, recordContent)
  );

  // Build the aes128gcm content-encoding header (RFC 8188):
  // salt (16) | rs (4, big-endian uint32) | keyid_len (1) | keyid | ciphertext
  const rs = new DataView(new ArrayBuffer(4));
  rs.setUint32(0, 4096, false);
  const header = concat(
    salt,
    new Uint8Array(rs.buffer),
    new Uint8Array([localPublicKey.length]),
    localPublicKey,
  );

  return { body: concat(header, ciphertext), salt, localPublicKey };
}

// ── Send a single push message ────────────────────────────────────────────────

async function sendPush(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: string,
): Promise<{ ok: boolean; status: number }> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const authorization = await buildVapidHeader(audience);
  const { body } = await encryptPayload(payload, p256dh, auth);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
    },
    body,
  });

  return { ok: res.ok, status: res.status };
}

// ── Notification type labels ──────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  reply: "replied to your thread",
  mention: "mentioned you in a reply",
  comment: "commented on your post",
  message: "sent you a message",
  meeting_prep_reminder: "Meeting Prep Reminder",
};

// System notification types have no actor — use the type label directly as the title.
const SYSTEM_TYPES = new Set(["meeting_prep_reminder"]);

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const payload = await req.json();
  const notif = payload.record;

  if (!notif?.id || !notif?.user_id) {
    return new Response(JSON.stringify({ skipped: "missing record" }), { status: 200 });
  }

  // Fetch all push subscriptions for this user
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", notif.user_id);

  if (error || !subs?.length) {
    return new Response(JSON.stringify({ skipped: "no subscriptions" }), { status: 200 });
  }

  let title: string;
  let body: string;

  if (!notif.actor_id || SYSTEM_TYPES.has(notif.type)) {
    // System-generated notification — no actor, use type label as title and body_preview as body.
    title = TYPE_LABEL[notif.type] || "JW Study";
    body = notif.body_preview || title;
  } else {
    // User-triggered notification — fetch actor name and build "Name did X" body.
    const { data: actor } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", notif.actor_id)
      .single();

    const actorName = actor?.display_name || "Someone";
    const action = TYPE_LABEL[notif.type] || "sent you a notification";
    title = "JW Study";
    body = `${actorName} ${action}`;
  }
  const url = notif.link_hash ? `/${notif.link_hash}` : "/";

  const message = JSON.stringify({ title, body, url, tag: `notif-${notif.id}` });

  // Send to all subscriptions, remove stale ones (410 Gone)
  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      const result = await sendPush(sub.endpoint, sub.p256dh, sub.auth, message);
      if (result.status === 410 || result.status === 404) {
        // Subscription expired — remove it
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
      return result;
    })
  );

  const summary = results.map((r) => r.status === "fulfilled" ? r.value : { ok: false, error: String(r.reason) });
  return new Response(JSON.stringify({ sent: summary }), {
    headers: { "Content-Type": "application/json" },
  });
});
