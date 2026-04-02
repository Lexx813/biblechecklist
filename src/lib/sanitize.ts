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

/** Sanitize user-generated rich HTML, preserving safe inline styles. */
export function sanitizeRich(html: string): string {
  return DOMPurify.sanitize(html || "", { ADD_ATTR: ["style"] });
}

/** Plain sanitize for non-rich content (no styles allowed). */
export function sanitize(html: string): string {
  return DOMPurify.sanitize(html || "");
}
