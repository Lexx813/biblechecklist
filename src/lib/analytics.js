/**
 * Google Analytics 4 + conversion tracking utility.
 *
 * GA4 is loaded via the Next.js Script component in layout.jsx.
 * This module provides typed helpers so the rest of the app can fire events
 * without worrying about whether gtag is loaded yet.
 */

function gtag(...args) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

// ── Page view (called automatically by GA4, but useful for SPA transitions) ──
export function trackPageView(path) {
  gtag("event", "page_view", { page_path: path });
}

// ── Conversion funnel events ─────────────────────────────────────────────────
export function trackSignup(method = "email") {
  gtag("event", "sign_up", { method });
}

export function trackLogin(method = "email") {
  gtag("event", "login", { method });
}

export function trackBeginCheckout() {
  gtag("event", "begin_checkout", {
    currency: "USD",
    value: 3.0,
    items: [{ item_name: "Premium Plan", price: 3.0 }],
  });
}

export function trackPurchase(transactionId) {
  gtag("event", "purchase", {
    transaction_id: transactionId,
    currency: "USD",
    value: 3.0,
    items: [{ item_name: "Premium Plan", price: 3.0 }],
  });
}

export function trackTrialStart() {
  gtag("event", "trial_start", { plan: "premium" });
}

// ── Engagement events ────────────────────────────────────────────────────────
export function trackShare(contentType, itemId) {
  gtag("event", "share", { content_type: contentType, item_id: itemId });
}

export function trackSearch(searchTerm) {
  gtag("event", "search", { search_term: searchTerm });
}

export function trackContentView(contentType, contentId) {
  gtag("event", "view_item", { content_type: contentType, content_id: contentId });
}

export function trackFeatureUse(featureName) {
  gtag("event", "feature_use", { feature_name: featureName });
}

export function trackUpgradePromptView(feature) {
  gtag("event", "upgrade_prompt_view", { feature });
}

export function trackUpgradePromptClick(feature) {
  gtag("event", "upgrade_prompt_click", { feature });
}

// ── UTM parameter capture ────────────────────────────────────────────────────
export function captureUtmParams() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const utm = {};
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

export function getStoredUtm() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(sessionStorage.getItem("nwt_utm"));
  } catch {
    return null;
  }
}

// ── Referral code capture ────────────────────────────────────────────────────
export function captureReferralCode() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) {
    localStorage.setItem("nwt_referral_code", ref);
  }
}

export function getStoredReferralCode() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nwt_referral_code");
}

export function clearStoredReferralCode() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("nwt_referral_code");
}
