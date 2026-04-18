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
  const token  = req.nextUrl.searchParams.get("token") ?? "";
  const userId = await verifyToken(token);

  if (!userId) {
    console.warn("unsubscribe: invalid token", { token: token.slice(0, 20) });
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0514;color:#fff">
        <h2 style="color:#f87171">Invalid unsubscribe link</h2>
        <p style="color:rgba(255,255,255,0.5)">This link is invalid or has expired.</p>
        <a href="https://jwstudy.org/settings" style="color:#7c3aed">Manage preferences →</a>
      </body></html>`,
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ email_marketing_unsubscribed: true })
    .eq("id", userId);

  if (error) console.error("unsubscribe: db update failed", { userId, error: error.message });
  else console.log("unsubscribe: user unsubscribed", { userId });

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0514;color:#fff">
      <h2 style="color:#c084fc">You've been unsubscribed</h2>
      <p style="color:rgba(255,255,255,0.6)">You will no longer receive marketing emails from JW Study.</p>
      <a href="https://jwstudy.org/settings" style="color:#7c3aed">Manage all email preferences →</a>
    </body></html>`,
    { status: 200, headers: { "Content-Type": "text/html" } },
  );
}
