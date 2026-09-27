export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

// Opens the native share sheet when available (mobile — most of our users),
// otherwise copies the link. A dismissed share sheet is "cancelled", not an
// error, so callers don't show a failure toast for it.
export async function shareInviteLink(url: string, text: string): Promise<ShareResult> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text, url });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      // Other share failures (e.g. NotAllowedError on desktop) fall through to copy.
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}
