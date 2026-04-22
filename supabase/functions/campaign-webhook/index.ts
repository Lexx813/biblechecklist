import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET") ?? "";

async function verifySignature(req: Request, body: string): Promise<boolean> {
  if (!WEBHOOK_SECRET) return false; // fail CLOSED — never accept unverified webhooks
  const sigHeader = req.headers.get("svix-signature") ?? req.headers.get("resend-signature") ?? "";
  if (!sigHeader) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    // Resend signature format: "v1,<base64sig>"
    const sigB64 = sigHeader.split(",").find(p => p.startsWith("v1,"))?.slice(3) ?? sigHeader;
    const sigBytes = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));
    return await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(body));
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body = await req.text();
  const valid = await verifySignature(req, body);
  if (!valid) return new Response("Unauthorized", { status: 401 });

  const event = JSON.parse(body) as { type: string; data: { email_id: string } };
  const resendEmailId = event.data?.email_id;
  if (!resendEmailId) return new Response("ok", { status: 200 });

  const now = new Date().toISOString();

  const updateMap: Record<string, Record<string, string>> = {
    "email.delivered":  { status: "delivered",   delivered_at: now },
    "email.opened":     { status: "opened",      opened_at: now },
    "email.clicked":    { status: "clicked",     clicked_at: now },
    "email.bounced":    { status: "bounced",     bounced_at: now },
    "email.complained": { status: "unsubscribed", bounced_at: now },
  };

  const updates = updateMap[event.type];
  if (!updates) return new Response("ok", { status: 200 });

  const { data: sendRow } = await supabase
    .from("campaign_sends")
    .update(updates)
    .eq("resend_email_id", resendEmailId)
    .select("user_id")
    .single();

  // On complaint: globally unsubscribe the user from marketing emails
  if (event.type === "email.complained" && sendRow?.user_id) {
    await supabase
      .from("profiles")
      .update({ email_marketing_unsubscribed: true })
      .eq("id", sendRow.user_id);
  }

  return new Response("ok", { status: 200 });
});
