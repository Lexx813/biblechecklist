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
  alternates: { canonical: "/" },
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
  image: "https://nwtprogress.com/og-image.png",
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
    "AI-powered Bible study tools",
    "Reading plans and study notes",
    "Direct messaging and study groups",
    "Offline support via PWA",
    "6-language support",
  ],
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free Plan", description: "Track Bible reading progress, access blog, forum, and quiz" },
    { "@type": "Offer", price: "4.99", priceCurrency: "USD", name: "Premium Plan", description: "Reading plans, study notes, AI companion, direct messaging, and study groups" },
  ],
};

const schemaOrg = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "NWT Progress",
  url: "https://nwtprogress.com",
  logo: "https://nwtprogress.com/icon-512.png",
  description: "A community-driven Bible reading tracker for the New World Translation",
  contactPoint: { "@type": "ContactPoint", contactType: "customer support", availableLanguage: ["English", "Spanish", "Portuguese", "French", "Tagalog", "Chinese"] },
};

const schemaWebSite = { "@context": "https://schema.org", "@type": "WebSite", name: "NWT Progress", url: "https://nwtprogress.com/" };

const schemaFAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is NWT Progress?", acceptedAnswer: { "@type": "Answer", text: "NWT Progress is a free Bible reading tracker designed specifically for the New World Translation (NWT). It lets you track your reading progress chapter by chapter through all 66 books of the Bible — both the Hebrew Scriptures and the Christian Greek Scriptures. You can also take Bible knowledge quizzes to earn badges, join a community forum, read spiritual blog posts, and use AI-powered study tools grounded in Watch Tower teachings." } },
    { "@type": "Question", name: "Is NWT Progress free?", acceptedAnswer: { "@type": "Answer", text: "Yes. NWT Progress has a free plan that includes the full Bible reading tracker for all 66 books, Bible knowledge quizzes, badge rewards, the community blog and forum, and basic study tools. A premium plan unlocks additional features including structured reading plans, personal study notes, AI-powered Bible study tools, direct messaging with other users, and study groups." } },
    { "@type": "Question", name: "How many books does the Bible tracker cover?", acceptedAnswer: { "@type": "Answer", text: "The NWT Progress tracker covers all 66 books of the Bible as organized in the New World Translation — 39 books of the Hebrew Scriptures and 27 books of the Christian Greek Scriptures. You can mark individual chapters as read and see your overall progress for each book and for the entire Bible." } },
    { "@type": "Question", name: "Can I track my Bible reading offline?", acceptedAnswer: { "@type": "Answer", text: "Yes. NWT Progress is built as a Progressive Web App (PWA), which means you can install it on your phone or tablet's home screen just like a native app. Once installed, the app works offline — you can view your reading progress and mark chapters as read even without an internet connection. Your changes will sync automatically when you reconnect." } },
    { "@type": "Question", name: "What languages does NWT Progress support?", acceptedAnswer: { "@type": "Answer", text: "NWT Progress currently supports six languages: English, Spanish (Español), Portuguese (Português), French (Français), Tagalog, and Mandarin Chinese (中文). The app automatically detects your browser language and can be switched at any time from the navigation menu." } },
    { "@type": "Question", name: "How does the Bible quiz work?", acceptedAnswer: { "@type": "Answer", text: "The Bible quiz tests your knowledge of the New World Translation with questions drawn from across the entire Bible. You earn badge rewards for completing quizzes and demonstrating knowledge of different books." } },
    { "@type": "Question", name: "Can I connect with other Bible readers on NWT Progress?", acceptedAnswer: { "@type": "Answer", text: "Yes. NWT Progress includes a community forum where you can start or join discussions about Bible topics, ask questions, and share insights. There is also a blog with spiritual articles. Premium members can send direct messages to other users and join or create study groups." } },
  ],
};

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
        <link rel="preconnect" href="https://api.anthropic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
