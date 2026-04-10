import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REDIRECT_HOSTS = new Set(["jwstudy.org", "www.jwstudy.org", "www.nwtprogress.com"]);
const CANONICAL = "https://nwtprogress.com";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const bare = host.split(":")[0]; // strip port if present
  if (REDIRECT_HOSTS.has(bare)) {
    const url = new URL(request.url);
    url.host = "nwtprogress.com";
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url.toString(), { status: 301 });
  }
  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?|ttf|otf|map)$).*)"],
};
