import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REDIRECT_HOSTS = new Set(["nwtprogress.com", "www.nwtprogress.com", "www.jwstudy.org"]);

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
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|_next/webpack-hmr|api/|favicon\\.|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?|ttf|otf|map|xml|txt|json)$).*)"],
};
