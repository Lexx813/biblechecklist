/**
 * Client-side helper to log a song event. Fire-and-forget — never throws,
 * never blocks rendering. Called from <SongAudioPlayer>, <ShareSheet>, and
 * <JwOrgLinks>-style components.
 */
export type SongEvent = {
  song_id: string;
  event_type: "play" | "complete" | "share" | "jw_org_click" | "download";
  share_platform?: string;
  jw_org_url?: string;
};

export function trackSongEvent(ev: SongEvent): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify(ev);
    // Prefer sendBeacon — survives page unload (e.g. user clicks an outbound jw.org link)
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/song-events", blob);
      return;
    }
    void fetch("/api/song-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // swallow
  }
}
