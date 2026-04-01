import Providers from "./providers";

export const metadata = {
  title: "Bible Reading Tracker for New World Translation | NWT Progress",
  description:
    "Track your New World Translation Bible reading progress across all 66 books, earn quiz badges, and connect with a community. Free Bible tracker app.",
  keywords:
    "NWT, New World Translation, Bible reading tracker, Bible tracker, Bible quiz, Jehovah's Witnesses, Bible progress app, Bible reading app",
  authors: [{ name: "NWT Progress" }],
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  metadataBase: new URL("https://nwtprogress.com"),
  openGraph: {
    type: "website",
    url: "https://nwtprogress.com/",
    title: "Bible Reading Tracker for New World Translation | NWT Progress",
    description:
      "Track your New World Translation Bible reading progress across all 66 books, earn quiz badges, and connect with a community. Free Bible tracker app.",
    siteName: "NWT Progress",
    images: [{ url: "/og-image.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bible Reading Tracker for New World Translation | NWT Progress",
    description:
      "Track your New World Translation Bible reading progress across all 66 books, earn quiz badges, and connect with a community. Free Bible tracker app.",
    images: [{ url: "/og-image.webp", alt: "NWT Progress — Bible Reading Tracker" }],
  },
};

const schemaWebApp = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "NWT Progress",
  description:
    "Track your New World Translation Bible reading progress across all 66 books, earn quiz badges, and connect with a community.",
  url: "https://nwtprogress.com",
  image: "https://nwtprogress.com/og-image.webp",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript. Requires a modern browser.",
  availability: "https://schema.org/OnlineOnly",
  inLanguage: ["en", "es", "pt", "fr", "tl", "zh"],
  screenshot: "https://nwtprogress.com/og-image.webp",
  featureList: [
    "Bible reading progress tracker for all 66 books",
    "Bible knowledge quizzes with badge rewards",
    "Community forum and blog",
    "Reading plans and study notes",
    "Direct messaging and study groups",
    "Offline support via PWA",
    "6-language support",
  ],
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free Plan", description: "Track Bible reading progress, access blog, forum, and quiz" },
    { "@type": "Offer", price: "3.00", priceCurrency: "USD", name: "Premium Plan", description: "Reading plans, study notes, direct messaging, and study groups" },
  ],
};

const schemaOrg = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://nwtprogress.com/#organization",
  name: "NWT Progress",
  url: "https://nwtprogress.com",
  logo: {
    "@type": "ImageObject",
    url: "https://nwtprogress.com/icon-512.png",
    width: 512,
    height: 512,
  },
  description: "A community-driven Bible reading tracker for the New World Translation",
  contactPoint: { "@type": "ContactPoint", contactType: "customer support", availableLanguage: ["English", "Spanish", "Portuguese", "French", "Tagalog", "Chinese"] },
};

const schemaWebSite = { "@context": "https://schema.org", "@type": "WebSite", "@id": "https://nwtprogress.com/#website", name: "NWT Progress", url: "https://nwtprogress.com/" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preload" href="/fonts/plus-jakarta-sans-variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* Apply saved theme before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){var t=localStorage.getItem("nwt-theme");document.documentElement.dataset.theme=t||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light")}()`,
          }}
        />
        <style dangerouslySetInnerHTML={{ __html: `@font-face{font-family:'Plus Jakarta Sans Variable';src:url('/fonts/plus-jakarta-sans-variable.woff2') format('woff2');font-weight:200 800;font-style:normal;font-display:swap;}body{font-family:'Plus Jakarta Sans Variable',sans-serif;}.nwt-skeleton{display:flex;flex-direction:column;min-height:100vh;background:#F7F4FC;color:#1E1035}[data-theme=dark] .nwt-skeleton{background:#0d0820;color:#ede9fe}.nwt-skeleton-nav{height:56px;background:#fff;border-bottom:1px solid #DDD0F5;display:flex;align-items:center;padding:0 1.25rem;gap:.75rem}[data-theme=dark] .nwt-skeleton-nav{background:#160f2e;border-color:#2a1f4a}.nwt-skeleton-logo{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#6A3DAA,#C084FC);flex-shrink:0}.nwt-skeleton-title{width:110px;height:14px;border-radius:6px;background:#DDD0F5;animation:sk-pulse 1.6s ease-in-out infinite}[data-theme=dark] .nwt-skeleton-title{background:#2a1f4a}.nwt-skeleton-body{flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;padding:2rem}.nwt-skeleton-spinner{width:40px;height:40px;border-radius:50%;border:3px solid #DDD0F5;border-top-color:#6A3DAA;animation:sk-spin .8s linear infinite}[data-theme=dark] .nwt-skeleton-spinner{border-color:#2a1f4a;border-top-color:#C084FC}@keyframes sk-spin{to{transform:rotate(360deg)}}@keyframes sk-pulse{0%,100%{opacity:.6}50%{opacity:1}}` }} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://yudyhigvqaodnoqwwtns.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://yudyhigvqaodnoqwwtns.supabase.co" />
        <meta name="theme-color" content="#1E0D3C" />
        <meta name="msapplication-TileColor" content="#1E0D3C" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NWT Progress" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebApp) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebSite) }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
