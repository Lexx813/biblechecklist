import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Host redirect (www → apex) lives in vercel.json `redirects` so it runs at
// Vercel's edge router with no function invocation. This middleware only
// handles uppercase-path normalization (a rare condition that still benefits
// from a 308 to a canonical lowercase URL for SEO).
export function middleware(request: NextRequest) {
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
