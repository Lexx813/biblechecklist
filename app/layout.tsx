import Script from "next/script";
import { Fraunces } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "./providers";
import {
  buildMetadata,
  OrganizationSchema,
  WebSiteSchema,
  WebApplicationSchema,
} from "@/seo";
import "./globals.css";

// Fraunces is only used at 600 (font-semibold) and 700 (font-bold), both
// normal and italic, in src/views/learn/* and HomePage. Trimmed from 8 files
// (4 weights × 2 styles) to 4 to cut ~250kb from first paint.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-fraunces",
});

const GA_ID = "G-D57FZ5E47V";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // resizes-content tells the browser to actually resize the layout viewport
  // when the on-screen keyboard appears, so chat input bars + buttons stay
  // above the keyboard instead of being covered. Critical for messaging UX.
  interactiveWidget: "resizes-content" as const,
};

export const metadata = {
  ...buildMetadata({
    route: "/",
    title: "Bible Reading Tracker for New World Translation | JW Study",
    description:
      "Track your New World Translation Bible reading progress across all 66 books, earn quiz badges, and connect with a community. Free Bible tracker app.",
  }),
  keywords:
    "NWT, New World Translation, Bible reading tracker, Bible tracker, Bible quiz, Jehovah's Witnesses, Bible progress app, Bible reading app",
  authors: [{ name: "JW Study" }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={fraunces.variable}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preload" href="/fonts/plus-jakarta-sans-variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* Apply saved theme before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){var t=localStorage.getItem("nwt-theme");document.documentElement.dataset.theme=t||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light")}()`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){try{var ok=false;var raw=localStorage.getItem("supabase.auth.token");if(raw&&JSON.parse(raw)?.currentSession?.refresh_token)ok=true;if(!ok){for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.startsWith("sb-")&&k.endsWith("-auth-token")){var v=localStorage.getItem(k);if(v&&JSON.parse(v).refresh_token){ok=true;break}}}}if(!ok)ok=location.search.indexOf("code=")>-1||location.hash.indexOf("access_token=")>-1;if(ok)document.documentElement.setAttribute("data-authed","")}catch(e){}}()`,
          }}
        />
        <style dangerouslySetInnerHTML={{ __html: `html{overflow-y:scroll;scrollbar-gutter:stable;}@font-face{font-family:'Plus Jakarta Sans Variable';src:url('/fonts/plus-jakarta-sans-variable.woff2') format('woff2');font-weight:200 800;font-style:normal;font-display:swap;}body{font-family:'Plus Jakarta Sans Variable',sans-serif;}.nwt-skeleton{display:flex;flex-direction:column;min-height:100vh;background:#F7F4FC;color:#1E1035}[data-theme=dark] .nwt-skeleton{background:#0d0820;color:#ede9fe}.nwt-skeleton-nav{height:56px;background:#fff;border-bottom:1px solid #DDD0F5;display:flex;align-items:center;padding:0 1.25rem;gap:.75rem}[data-theme=dark] .nwt-skeleton-nav{background:#160f2e;border-color:#2a1f4a}.nwt-skeleton-logo{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#6A3DAA,#C084FC);flex-shrink:0}.nwt-skeleton-title{width:110px;height:14px;border-radius:6px;background:#DDD0F5;animation:sk-pulse 1.6s ease-in-out infinite}[data-theme=dark] .nwt-skeleton-title{background:#2a1f4a}.nwt-skeleton-body{flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;padding:2rem}.nwt-skeleton-spinner{width:40px;height:40px;border-radius:50%;border:3px solid #DDD0F5;border-top-color:#6A3DAA;animation:sk-spin .8s linear infinite}[data-theme=dark] .nwt-skeleton-spinner{border-color:#2a1f4a;border-top-color:#C084FC}@keyframes sk-spin{to{transform:rotate(360deg)}}@keyframes sk-pulse{0%,100%{opacity:.6}50%{opacity:1}}[data-authed] #ssr-fallback{display:none!important}[data-authed] #ssr-landing{display:none!important}` }} />
        <link rel="alternate" type="application/rss+xml" title="JW Study Blog" href="/blog/feed.xml" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://yudyhigvqaodnoqwwtns.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://yudyhigvqaodnoqwwtns.supabase.co" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <meta name="theme-color" content="#1E0D3C" />
        <meta name="msapplication-TileColor" content="#1E0D3C" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="JW Study" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <WebApplicationSchema />
        <OrganizationSchema />
        <WebSiteSchema />
      </head>
      <body>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:true})`}</Script>
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
