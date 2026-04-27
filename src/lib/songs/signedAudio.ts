import "server-only";
import { createClient } from "@supabase/supabase-js";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Server-only: generate a time-limited signed URL for audio streaming in the
 * private `songs` bucket. Default TTL: 1 hour (3600s). Mounted on <audio>.
 */
export async function getSignedAudioUrl(
  storagePath: string,
  ttlSeconds = 3600,
): Promise<string | null> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.storage
    .from("songs")
    .createSignedUrl(storagePath, ttlSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * Server-only: generate a download-flavored signed URL — same private bucket,
 * but Supabase sets `Content-Disposition: attachment; filename="<name>"` so
 * the browser saves the file instead of streaming. Default TTL: 1 hour.
 */
export async function getSignedDownloadUrl(
  storagePath: string,
  filename: string,
  ttlSeconds = 3600,
): Promise<string | null> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.storage
    .from("songs")
    .createSignedUrl(storagePath, ttlSeconds, { download: filename });
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
