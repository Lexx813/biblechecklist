/**
 * Google Analytics 4 + conversion tracking utility.
 *
 * GA4 is loaded via the Next.js Script component in layout.jsx.
 * This module provides typed helpers so the rest of the app can fire events
 * without worrying about whether gtag is loaded yet.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

// ── Page view (called automatically by GA4, but useful for SPA transitions) ──
export function trackPageView(path: string): void {
  gtag("event", "page_view", { page_path: path });
}

// ── Conversion funnel events ─────────────────────────────────────────────────
export function trackSignup(method = "email"): void {
  gtag("event", "sign_up", { method });
}

export function trackLogin(method = "email"): void {
  gtag("event", "login", { method });
}

export function trackBeginCheckout(): void {
  gtag("event", "begin_checkout", {
    currency: "USD",
    value: 3.0,
    items: [{ item_name: "Premium Plan", price: 3.0 }],
  });
}

export function trackPurchase(transactionId: string): void {
  gtag("event", "purchase", {
    transaction_id: transactionId,
    currency: "USD",
    value: 3.0,
    items: [{ item_name: "Premium Plan", price: 3.0 }],
  });
}

export function trackTrialStart(): void {
  gtag("event", "trial_start", { plan: "premium" });
}

// ── Engagement events ────────────────────────────────────────────────────────
export function trackShare(contentType: string, itemId: string): void {
  gtag("event", "share", { content_type: contentType, item_id: itemId });
}

export function trackSearch(searchTerm: string): void {
  gtag("event", "search", { search_term: searchTerm });
}

export function trackContentView(contentType: string, contentId: string): void {
  gtag("event", "view_item", { content_type: contentType, content_id: contentId });
}

export function trackFeatureUse(featureName: string): void {
  gtag("event", "feature_use", { feature_name: featureName });
}

export function trackUpgradePromptView(feature: string): void {
  gtag("event", "upgrade_prompt_view", { feature });
}

export function trackUpgradePromptClick(feature: string): void {
  gtag("event", "upgrade_prompt_click", { feature });
}

// ── UTM parameter capture ────────────────────────────────────────────────────
export function captureUtmParams(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const utm: Record<string, string> = {};
  let hasUtm = false;

  for (const key of utmKeys) {
    const val = params.get(key);
    if (val) {
      utm[key] = val;
      hasUtm = true;
    }
  }

  if (hasUtm) {
    utm.landing_page = window.location.pathname;
    utm.timestamp = new Date().toISOString();
    sessionStorage.setItem("nwt_utm", JSON.stringify(utm));
    // Also send to GA4
    gtag("set", { campaign: utm });
  }
}

export function getStoredUtm(): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(sessionStorage.getItem("nwt_utm") ?? "null") as Record<string, string> | null;
  } catch {
    return null;
  }
}

// ── Referral code capture ────────────────────────────────────────────────────
export function captureReferralCode(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) {
    localStorage.setItem("nwt_referral_code", ref);
  }
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nwt_referral_code");
}

export function clearStoredReferralCode(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("nwt_referral_code");
}
