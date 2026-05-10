// Rewrite Supabase Storage public URLs to go through the image-render endpoint
// with a width/quality transform, so mobile clients receive a right-sized JPEG
// instead of the full-resolution upload. Safe pass-through for any other host.
//
// Object form:  /storage/v1/object/public/<bucket>/<path>
// Render form:  /storage/v1/render/image/public/<bucket>/<path>?width=...&quality=...
const SUPABASE_HOSTS = new Set([
  "yudyhigvqaodnoqwwtns.supabase.co",
  "auth.jwstudy.org",
]);

export function imgUrl(
  src: string | null | undefined,
  opts: { width: number; quality?: number } = { width: 640 },
): string {
  if (!src) return "";
  try {
    const u = new URL(src);
    if (!SUPABASE_HOSTS.has(u.hostname)) return src;
    if (!u.pathname.startsWith("/storage/v1/object/public/")) return src;
    u.pathname = u.pathname.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/",
    );
    u.searchParams.set("width", String(opts.width));
    u.searchParams.set("quality", String(opts.quality ?? 75));
    u.searchParams.set("resize", "cover");
    return u.toString();
  } catch {
    return src;
  }
}
