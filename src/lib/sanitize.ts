import DOMPurify from "dompurify";

// Allow a curated set of CSS properties in rich content (color, highlight, alignment).
// This hook runs on every DOMPurify.sanitize() call that includes ADD_ATTR:['style'].
const SAFE_CSS = ["color", "background-color", "text-align", "text-decoration"];

if (typeof window !== "undefined") {
  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    if (data.attrName !== "style") return;
    const el = document.createElement("span");
    el.style.cssText = data.attrValue;
    const safe: string[] = [];
    for (const prop of SAFE_CSS) {
      const val = el.style.getPropertyValue(prop);
      if (val) safe.push(`${prop}:${val}`);
    }
    if (safe.length) {
      data.attrValue = safe.join(";");
      data.forceKeepAttr = true;
    }
    // else: no safe properties — attribute gets removed normally
  });
}

// Allow https, http, and mailto URIs in rich content (DOMPurify blocks mailto by default).
const RICH_URI_REGEXP = /^(?:https?|mailto):/i;

/** Sanitize user-generated rich HTML, preserving safe inline styles and class names. */
export function sanitizeRich(html: string): string {
  return DOMPurify.sanitize(html || "", {
    ADD_ATTR: ["style", "class"],
    ALLOWED_URI_REGEXP: RICH_URI_REGEXP,
  });
}

/** Plain sanitize for non-rich content (no styles allowed). */
export function sanitize(html: string): string {
  return DOMPurify.sanitize(html || "");
}

/** Strip all tags, return plain text. Safe for non-browser contexts. */
export function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
