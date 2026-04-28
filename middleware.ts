import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REDIRECT_HOSTS = new Set(["www.jwstudy.org"]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const bare = host.split(":")[0]; // strip port if present
  if (REDIRECT_HOSTS.has(bare)) {
    const url = new URL(request.url);
    url.host = "jwstudy.org";
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url.toString(), { status: 301 });
  }

  // Normalize uppercase paths to lowercase. /BLOG → /blog (308). The matcher
  // already excludes _next, api, and static files, so this only affects
  // user-facing routes. Casing in the query string is left alone.
  const url = new URL(request.url);
  if (url.pathname !== url.pathname.toLowerCase()) {
    url.pathname = url.pathname.toLowerCase();
    return NextResponse.redirect(url.toString(), { status: 308 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|_next/webpack-hmr|api/|favicon\\.|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?|ttf|otf|map|xml|txt|json)$).*)"],
};
