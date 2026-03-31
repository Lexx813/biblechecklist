import { useEffect } from "react";

const SITE = "NWT Progress";
const DEFAULT_DESC = "Track your New World Translation Bible reading progress across all 66 books, earn quiz badges, and connect with a community.";
const DEFAULT_IMG = "https://nwtprogress.com/og-image.png";

function setMetaContent(selector, value) {
  const el = document.querySelector(selector);
  if (el && value) el.setAttribute("content", value);
}

const BASE_URL = "https://nwtprogress.com";

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

function setOgUrl(url) {
  setMetaContent('meta[property="og:url"]', url);
  setMetaContent('meta[name="twitter:url"]', url);
}

export function useMeta({ title, description, image, path } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE}` : SITE;
    const desc = description || DEFAULT_DESC;
    const img = image || DEFAULT_IMG;
    const canonicalUrl = path ? `${BASE_URL}${path}` : `${BASE_URL}/`;

    document.title = fullTitle;
    setMetaContent('meta[name="description"]', desc);
    setMetaContent('meta[property="og:title"]', fullTitle);
    setMetaContent('meta[property="og:description"]', desc);
    setMetaContent('meta[property="og:image"]', img);
    setMetaContent('meta[name="twitter:title"]', fullTitle);
    setMetaContent('meta[name="twitter:description"]', desc);
    setMetaContent('meta[name="twitter:image"]', img);
    setCanonical(canonicalUrl);
    setOgUrl(canonicalUrl);

    return () => {
      document.title = SITE;
      setMetaContent('meta[name="description"]', DEFAULT_DESC);
      setMetaContent('meta[property="og:title"]', SITE);
      setMetaContent('meta[property="og:description"]', DEFAULT_DESC);
      setMetaContent('meta[property="og:image"]', DEFAULT_IMG);
      setMetaContent('meta[name="twitter:title"]', SITE);
      setMetaContent('meta[name="twitter:description"]', DEFAULT_DESC);
      setMetaContent('meta[name="twitter:image"]', DEFAULT_IMG);
      setCanonical(`${BASE_URL}/`);
      setOgUrl(`${BASE_URL}/`);
    };
  }, [title, description, image, path]);
}
