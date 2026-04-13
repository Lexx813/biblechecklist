/**
 * VideoUploaderPromo — 1920×1080, 40 s, 30 fps
 * Promotes the video posting feature: YouTube, TikTok, and file upload.
 * Light theme, consistent with AIPromoVideo.
 */

import {
  AbsoluteFill,
  Html5Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

// ── Colours ────────────────────────────────────────────────────────────────────
const BG        = "#F4F1FA";
const CARD_BG   = "#FFFFFF";
const PURPLE    = "#6A3DAA";
const PURPLE_LT = "#EDE8F8";
const TEAL      = "#0D9488";
const RED       = "#DC2626";
const YT_RED    = "#FF0000";
const TT_BLACK  = "#010101";
const TEXT_PRI  = "#1E0D3C";
const TEXT_SEC  = "#6B7280";
const TEXT_MUTED = "#9CA3AF";
const BORDER    = "#E5E0F3";
const SUCCESS   = "#10B981";

// ── Helpers ────────────────────────────────────────────────────────────────────
function fade(frame: number, start: number, end: number): number {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });
}

function fadeOut(frame: number, start: number, end: number): number {
  return interpolate(frame, [start, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function sp(frame: number, start: number, fps: number, cfg = { damping: 14, stiffness: 100, mass: 1 }): number {
  return spring({ frame: frame - start, fps, config: cfg, from: 0, to: 1 });
}

function reveal(text: string, frame: number, start: number, cps = 40): string {
  const chars = Math.round(Math.max(0, frame - start) * (cps / 30));
  return text.slice(0, chars);
}

function cursor(frame: number): string {
  return Math.floor(frame / 14) % 2 === 0 ? "|" : "";
}

// ── Timings ────────────────────────────────────────────────────────────────────
const T = {
  // Intro
  brandIn:    [0, 35],
  headlineIn: [25, 70],
  subIn:      [55, 95],
  introOut:   [170, 210],

  // Section 1 — YouTube
  ytPanelIn:  190,
  ytTabBlink: 210,
  ytType:     225,         // URL starts typing
  ytDone:     310,         // URL fully typed → validation tick appears
  ytBadgeIn:  325,
  ytOut:      400,

  // Section 2 — TikTok
  ttPanelIn:  410,
  ttType:     440,
  ttDone:     520,
  ttBadgeIn:  535,
  ttOut:      610,

  // Section 3 — Upload tab
  upPanelIn:  620,
  upTabBlink: 640,
  upDropIn:   660,
  upFileIn:   730,         // file selected state
  upBadgeIn:  760,
  upOut:      840,

  // Feature cards
  cardsIn:    [860, 900, 940],
  ctaIn:      980,
  ctaFull:    1020,
};

const TOTAL_FRAMES = 1200; // 40 s

// ── Mock URLs ──────────────────────────────────────────────────────────────────
const YT_URL  = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const TT_URL  = "https://www.tiktok.com/@jwstudy/video/7398203948172";

// ── Icons ──────────────────────────────────────────────────────────────────────

function VideoIcon({ size = 24, color = PURPLE }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  );
}

function YoutubeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill={YT_RED} d="M23.5 6.2s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.7 2 12 2 12 2s-4.7 0-7.3.1c-.6.1-1.9.1-3 1.3C.8 4.2.5 6.2.5 6.2S.2 8.5.2 10.8v2.1c0 2.3.3 4.6.3 4.6s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.7 12 21.8 12 21.8s4.7 0 7.3-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.3.3-4.6v-2.1c0-2.3-.3-4.6-.3-4.6zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z" />
    </svg>
  );
}

function TiktokIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill={TT_BLACK} d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.86 4.86 0 01-1.01-.06z" />
    </svg>
  );
}

function UploadIcon({ size = 28, color = PURPLE }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}

function CheckIcon({ size = 18, color = SUCCESS }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Composer mock ──────────────────────────────────────────────────────────────

interface ComposerProps {
  activeTab: "link" | "upload";
  linkValue: string;
  linkIsTyping: boolean;
  showValidBadge: boolean;
  showFile: boolean;
  showDropzone: boolean;
  frame: number;
  opacity: number;
  scale: number;
}

function ComposerMock({
  activeTab, linkValue, linkIsTyping, showValidBadge,
  showFile, showDropzone, frame, opacity, scale,
}: ComposerProps) {
  return (
    <div style={{
      width: 560, opacity, transform: `scale(${scale})`,
      background: CARD_BG,
      border: `1.5px solid ${BORDER}`,
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: "0 20px 80px rgba(106,61,170,0.15), 0 4px 16px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 20px",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <VideoIcon size={18} color={PURPLE} />
        <span style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRI }}>Post a Video</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>
        {(["link", "upload"] as const).map(tab => (
          <div key={tab} style={{
            flex: 1, padding: "10px 0", textAlign: "center" as const,
            fontSize: 13, fontWeight: 600,
            color: activeTab === tab ? PURPLE : TEXT_MUTED,
            borderBottom: activeTab === tab ? `2.5px solid ${PURPLE}` : "2.5px solid transparent",
            marginBottom: -1,
          }}>
            {tab === "link" ? "Paste Link" : "Upload File"}
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding: 20 }}>
        {/* Title field */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TEXT_MUTED, marginBottom: 5, letterSpacing: 0.8, textTransform: "uppercase" as const }}>
            Title *
          </div>
          <div style={{
            padding: "9px 13px", borderRadius: 9,
            background: "rgba(106,61,170,0.06)", border: `1px solid rgba(106,61,170,0.18)`,
            fontSize: 13, color: TEXT_PRI,
          }}>
            The Good News About Jehovah's Kingdom
          </div>
        </div>

        {/* Link tab content */}
        {activeTab === "link" && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: TEXT_MUTED, marginBottom: 5, letterSpacing: 0.8, textTransform: "uppercase" as const }}>
              YouTube, TikTok, or Rumble URL
            </div>
            <div style={{
              padding: "9px 13px", borderRadius: 9,
              background: "rgba(106,61,170,0.06)", border: `1.5px solid ${linkIsTyping ? PURPLE : "rgba(106,61,170,0.18)"}`,
              fontSize: 12, color: linkValue ? TEXT_PRI : TEXT_MUTED,
              minHeight: 38, display: "flex", alignItems: "center",
              fontFamily: "monospace",
              transition: "border-color 0.15s",
            }}>
              {linkValue || "https://…"}
              {linkIsTyping && (
                <span style={{ color: PURPLE, marginLeft: 1 }}>{cursor(frame)}</span>
              )}
            </div>
            {showValidBadge && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                marginTop: 8,
                background: "rgba(16,185,129,0.1)", border: `1px solid rgba(16,185,129,0.3)`,
                borderRadius: 8, padding: "4px 12px",
                fontSize: 12, fontWeight: 700, color: SUCCESS,
              }}>
                <CheckIcon size={14} />
                Valid link detected
              </div>
            )}
          </div>
        )}

        {/* Upload tab content */}
        {activeTab === "upload" && (
          <div>
            {showDropzone && !showFile && (
              <div style={{
                border: `1.5px dashed rgba(106,61,170,0.4)`,
                borderRadius: 10, padding: "30px 20px",
                textAlign: "center" as const,
                background: "rgba(106,61,170,0.03)",
              }}>
                <UploadIcon size={32} color={PURPLE} />
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRI, marginTop: 10 }}>
                  Drop video here or click to browse
                </div>
                <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 5 }}>
                  MP4 · MOV · WebM · max 50 MB
                </div>
              </div>
            )}
            {showFile && (
              <div style={{
                background: "rgba(106,61,170,0.06)", border: `1px solid rgba(106,61,170,0.2)`,
                borderRadius: 10, padding: "14px 16px",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRI }}>📁 kingdom_video.mp4</div>
                <div style={{ fontSize: 11, color: TEXT_SEC, marginTop: 3 }}>38 MB · Click to remove</div>
              </div>
            )}
          </div>
        )}

        {/* Submit button */}
        <div style={{
          marginTop: 18,
          padding: "11px 0", borderRadius: 9, textAlign: "center" as const,
          background: `linear-gradient(90deg, #5b21b6, ${PURPLE})`,
          color: "white", fontSize: 14, fontWeight: 700,
        }}>
          Post
        </div>
      </div>
    </div>
  );
}

// ── Platform badge ─────────────────────────────────────────────────────────────
interface PlatformBadgeProps {
  icon: React.ReactNode;
  name: string;
  sub: string;
  opacity: number;
}
function PlatformBadge({ icon, name, sub, opacity }: PlatformBadgeProps) {
  return (
    <div style={{
      position: "absolute" as const,
      left: 80, bottom: 120,
      opacity,
      transform: `translateY(${interpolate(opacity, [0, 1], [24, 0])}px)`,
      display: "flex", alignItems: "center", gap: 18,
      background: CARD_BG, border: `2px solid ${BORDER}`,
      borderRadius: 18, padding: "18px 28px",
      boxShadow: "0 4px 24px rgba(106,61,170,0.1)",
    }}>
      {icon}
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRI }}>{name}</div>
        <div style={{ fontSize: 13, color: TEXT_SEC }}>{sub}</div>
      </div>
    </div>
  );
}

// ── Feature card ───────────────────────────────────────────────────────────────
interface FeatureCardProps {
  icon: string;
  title: string;
  body: string;
  opacity: number;
  scale: number;
}
function FeatureCard({ icon, title, body, opacity, scale }: FeatureCardProps) {
  return (
    <div style={{
      flex: 1,
      background: CARD_BG,
      border: `1.5px solid ${BORDER}`,
      borderRadius: 24, padding: "36px 28px",
      textAlign: "center" as const,
      opacity,
      transform: `scale(${scale}) translateY(${interpolate(scale, [0.85, 1], [28, 0])}px)`,
      boxShadow: "0 4px 24px rgba(106,61,170,0.08)",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: PURPLE_LT,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 18px", fontSize: 32,
      }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: TEXT_PRI, marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 14, color: TEXT_SEC, lineHeight: 1.7 }}>{body}</div>
    </div>
  );
}

// ── Left panel label ───────────────────────────────────────────────────────────
interface LeftLabelProps {
  tag: string;
  headline: string;
  sub: string;
  opacity: number;
}
function LeftLabel({ tag, headline, sub, opacity }: LeftLabelProps) {
  return (
    <div style={{ opacity }}>
      <div style={{
        fontSize: 12, fontWeight: 800, color: TEAL,
        letterSpacing: 2.5, textTransform: "uppercase" as const, marginBottom: 14,
      }}>{tag}</div>
      <div style={{
        fontSize: 52, fontWeight: 900, color: TEXT_PRI,
        lineHeight: 1.1, marginBottom: 18, letterSpacing: -1.5,
      }}>{headline}</div>
      <div style={{ fontSize: 18, color: TEXT_SEC, lineHeight: 1.7 }}>{sub}</div>
    </div>
  );
}

// ── Main composition ───────────────────────────────────────────────────────────

export default function VideoUploaderPromo() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // ── Intro ──
  const brandOpacity    = fade(frame, T.brandIn[0], T.brandIn[1]);
  const headlineOpacity = fade(frame, T.headlineIn[0], T.headlineIn[1]);
  const subOpacity      = fade(frame, T.subIn[0], T.subIn[1]);
  const introOut        = frame > T.introOut[0] ? fadeOut(frame, T.introOut[0], T.introOut[1]) : 1;

  // ── YouTube section ──
  const ytIn      = frame >= T.ytPanelIn;
  const ytOpacity = ytIn
    ? (frame >= T.ytOut ? fadeOut(frame, T.ytOut, T.ytOut + 30) : fade(frame, T.ytPanelIn, T.ytPanelIn + 25))
    : 0;
  const ytScale = interpolate(sp(frame, T.ytPanelIn, fps, { damping: 18, stiffness: 90, mass: 1 }), [0, 1], [0.92, 1]);

  const ytTyping    = frame >= T.ytType && frame < T.ytDone;
  const ytFullText  = frame >= T.ytDone;
  const ytUrl       = ytFullText ? YT_URL : (frame >= T.ytType ? reveal(YT_URL, frame, T.ytType, 38) : "");
  const ytBadge     = frame >= T.ytBadgeIn && frame < T.ytOut
    ? fade(frame, T.ytBadgeIn, T.ytBadgeIn + 20)
    : 0;

  const leftYtOpacity = ytIn && frame < T.ttPanelIn
    ? (frame >= T.ytOut ? fadeOut(frame, T.ytOut, T.ytOut + 20) : fade(frame, T.ytPanelIn, T.ytPanelIn + 35))
    : 0;

  // ── TikTok section ──
  const ttIn      = frame >= T.ttPanelIn;
  const ttOpacity = ttIn
    ? (frame >= T.ttOut ? fadeOut(frame, T.ttOut, T.ttOut + 30) : fade(frame, T.ttPanelIn, T.ttPanelIn + 25))
    : 0;
  const ttScale = interpolate(sp(frame, T.ttPanelIn, fps, { damping: 18, stiffness: 90, mass: 1 }), [0, 1], [0.92, 1]);

  const ttTyping   = frame >= T.ttType && frame < T.ttDone;
  const ttFullText = frame >= T.ttDone;
  const ttUrl      = ttFullText ? TT_URL : (frame >= T.ttType ? reveal(TT_URL, frame, T.ttType, 38) : "");
  const ttBadge    = frame >= T.ttBadgeIn && frame < T.ttOut
    ? fade(frame, T.ttBadgeIn, T.ttBadgeIn + 20)
    : 0;

  const leftTtOpacity = ttIn && frame < T.upPanelIn
    ? (frame >= T.ttOut ? fadeOut(frame, T.ttOut, T.ttOut + 20) : fade(frame, T.ttPanelIn, T.ttPanelIn + 35))
    : 0;

  // ── Upload section ──
  const upIn      = frame >= T.upPanelIn;
  const upOpacity = upIn
    ? (frame >= T.upOut ? fadeOut(frame, T.upOut, T.upOut + 30) : fade(frame, T.upPanelIn, T.upPanelIn + 25))
    : 0;
  const upScale = interpolate(sp(frame, T.upPanelIn, fps, { damping: 18, stiffness: 90, mass: 1 }), [0, 1], [0.92, 1]);

  const showDropzone = frame >= T.upDropIn;
  const showFile     = frame >= T.upFileIn;
  const upBadgeOpacity = frame >= T.upBadgeIn && frame < T.upOut
    ? fade(frame, T.upBadgeIn, T.upBadgeIn + 20)
    : 0;

  const leftUpOpacity = upIn && frame < T.cardsIn[0]
    ? (frame >= T.upOut ? fadeOut(frame, T.upOut, T.upOut + 20) : fade(frame, T.upPanelIn, T.upPanelIn + 35))
    : 0;

  // ── Feature cards ──
  const showCards = frame >= T.cardsIn[0];
  const cards = T.cardsIn.map((start) => ({
    opacity: fade(frame, start, start + 30),
    scale: interpolate(sp(frame, start, fps), [0, 1], [0.85, 1]),
  }));

  // ── CTA ──
  const ctaOpacity = fade(frame, T.ctaIn, T.ctaFull);
  const ctaScale   = interpolate(sp(frame, T.ctaIn, fps, { damping: 12, stiffness: 80, mass: 1 }), [0, 1], [0.9, 1]);

  // Determine which composer is showing
  const showYt = frame >= T.ytPanelIn && frame < T.ttPanelIn + 20;
  const showTt = frame >= T.ttPanelIn && frame < T.upPanelIn + 20;
  const showUp = frame >= T.upPanelIn && frame < T.cardsIn[0] + 20;

  // Composer X position (right side, centred in right half)
  const composerX = 1920 / 2 + 60;
  const composerY = (1080 - 440) / 2;

  return (
    <AbsoluteFill style={{
      background: BG,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflow: "hidden",
    }}>
      <Html5Audio
        src={staticFile("audio/bg-music.mp3")}
        loop
        volume={(f) =>
          interpolate(
            f,
            [0, 30, durationInFrames - 60, durationInFrames],
            [0, 0.32, 0.32, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />
      {/* Background blobs */}
      <div style={{
        position: "absolute", top: -180, right: -180,
        width: 700, height: 700, borderRadius: "50%",
        background: "rgba(106,61,170,0.06)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -220, left: -120,
        width: 600, height: 600, borderRadius: "50%",
        background: "rgba(13,148,136,0.05)", pointerEvents: "none",
      }} />

      {/* ── Intro ── */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        opacity: introOut, pointerEvents: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: brandOpacity, marginBottom: 44 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: PURPLE,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(106,61,170,0.3)",
          }}>
            <VideoIcon size={36} color="white" />
          </div>
          <span style={{ fontSize: 46, fontWeight: 800, color: TEXT_PRI, letterSpacing: -1 }}>JW Study</span>
        </div>

        <div style={{
          fontSize: 88, fontWeight: 900, color: TEXT_PRI,
          lineHeight: 1.05, textAlign: "center",
          opacity: headlineOpacity, letterSpacing: -2, maxWidth: 1200,
        }}>
          Share Videos with the
          <span style={{ color: PURPLE }}> Community</span>
        </div>

        <div style={{
          fontSize: 28, color: TEXT_SEC, marginTop: 28,
          textAlign: "center", opacity: subOpacity, fontWeight: 500,
        }}>
          Post YouTube · TikTok · or upload your own video (up to 50 MB)
        </div>
      </div>

      {/* ── Left panel — section labels ── */}
      {frame >= T.ytPanelIn && frame < T.cardsIn[0] && (
        <div style={{
          position: "absolute",
          left: 80, top: 0, bottom: 0, width: 640,
          display: "flex", flexDirection: "column", justifyContent: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 52 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: PURPLE,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <VideoIcon size={22} color="white" />
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: TEXT_SEC }}>JW Study Videos</span>
          </div>

          {leftYtOpacity > 0 && (
            <LeftLabel
              tag="YouTube"
              headline={"Paste any YouTube link"}
              sub={"Paste the video URL — the app validates it instantly and embeds it in the reel."}
              opacity={leftYtOpacity}
            />
          )}
          {leftTtOpacity > 0 && (
            <LeftLabel
              tag="TikTok"
              headline={"TikTok videos too"}
              sub={"Share TikTok content from the full video page URL. Portrait videos display in full portrait mode."}
              opacity={leftTtOpacity}
            />
          )}
          {leftUpOpacity > 0 && (
            <LeftLabel
              tag="Upload"
              headline={"Upload your own video"}
              sub={"Drag & drop or browse for MP4, MOV, or WebM files up to 50 MB. Compressed automatically for fast streaming."}
              opacity={leftUpOpacity}
            />
          )}
        </div>
      )}

      {/* ── Platform badges ── */}
      {frame >= T.ytBadgeIn && frame < T.ttPanelIn && (
        <PlatformBadge
          icon={<YoutubeIcon size={36} />}
          name="YouTube"
          sub="Full URL — youtube.com/watch?v=…"
          opacity={ytBadge}
        />
      )}
      {frame >= T.ttBadgeIn && frame < T.upPanelIn && (
        <PlatformBadge
          icon={<TiktokIcon size={36} />}
          name="TikTok"
          sub="Full URL — tiktok.com/@user/video/…"
          opacity={ttBadge}
        />
      )}
      {frame >= T.upBadgeIn && frame < T.cardsIn[0] && (
        <div style={{
          position: "absolute" as const,
          left: 80, bottom: 120,
          opacity: upBadgeOpacity,
          transform: `translateY(${interpolate(upBadgeOpacity, [0, 1], [24, 0])}px)`,
          display: "flex", alignItems: "center", gap: 18,
          background: CARD_BG, border: `2px solid ${BORDER}`,
          borderRadius: 18, padding: "18px 28px",
          boxShadow: "0 4px 24px rgba(106,61,170,0.1)",
        }}>
          <span style={{ fontSize: 36 }}>📁</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRI }}>Max 50 MB</div>
            <div style={{ fontSize: 13, color: TEXT_SEC }}>MP4 · MOV · WebM — auto-compressed</div>
          </div>
        </div>
      )}

      {/* ── Composer panels (right side) ── */}
      {(showYt || showTt || showUp) && (
        <div style={{
          position: "absolute",
          left: composerX, top: composerY,
        }}>
          {showYt && (
            <ComposerMock
              activeTab="link"
              linkValue={ytUrl}
              linkIsTyping={ytTyping}
              showValidBadge={frame >= T.ytBadgeIn}
              showFile={false}
              showDropzone={false}
              frame={frame}
              opacity={ytOpacity}
              scale={ytScale}
            />
          )}
          {showTt && (
            <ComposerMock
              activeTab="link"
              linkValue={ttUrl}
              linkIsTyping={ttTyping}
              showValidBadge={frame >= T.ttBadgeIn}
              showFile={false}
              showDropzone={false}
              frame={frame}
              opacity={ttOpacity}
              scale={ttScale}
            />
          )}
          {showUp && (
            <ComposerMock
              activeTab="upload"
              linkValue=""
              linkIsTyping={false}
              showValidBadge={false}
              showFile={showFile}
              showDropzone={showDropzone}
              frame={frame}
              opacity={upOpacity}
              scale={upScale}
            />
          )}
        </div>
      )}

      {/* ── Feature cards ── */}
      {showCards && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "80px 120px", gap: 56,
        }}>
          <div style={{ opacity: cards[0].opacity }}>
            <div style={{
              fontSize: 12, fontWeight: 800, color: TEAL,
              letterSpacing: 3, textTransform: "uppercase" as const,
              textAlign: "center" as const, marginBottom: 8,
            }}>
              All in one place
            </div>
            <div style={{
              fontSize: 48, fontWeight: 900, color: TEXT_PRI,
              textAlign: "center" as const, letterSpacing: -1.5,
            }}>
              Three ways to share video
            </div>
          </div>

          <div style={{ display: "flex", gap: 40, width: "100%" }}>
            <FeatureCard
              icon="▶️"
              title="YouTube & Rumble"
              body="Paste any YouTube or Rumble link. Instantly embedded and streamed — no download needed."
              opacity={cards[0].opacity}
              scale={cards[0].scale}
            />
            <FeatureCard
              icon="🎵"
              title="TikTok"
              body="Share TikTok videos with the full URL. Portrait mode displays them perfectly in the reel."
              opacity={cards[1].opacity}
              scale={cards[1].scale}
            />
            <FeatureCard
              icon="📤"
              title="Upload Your Own"
              body="Drag & drop MP4, MOV, or WebM. Auto-compressed to save bandwidth. Up to 50 MB."
              opacity={cards[2].opacity}
              scale={cards[2].scale}
            />
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      {frame >= T.ctaIn && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center",
          justifyContent: showCards ? "flex-end" : "center",
          paddingBottom: showCards ? 80 : 0,
          opacity: ctaOpacity,
        }}>
          <div style={{
            transform: `scale(${ctaScale})`,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
          }}>
            {!showCards && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 20, background: PURPLE,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 8px 32px rgba(106,61,170,0.3)",
                  }}>
                    <VideoIcon size={36} color="white" />
                  </div>
                  <span style={{ fontSize: 46, fontWeight: 800, color: TEXT_PRI }}>JW Study</span>
                </div>
                <div style={{
                  fontSize: 72, fontWeight: 900, color: TEXT_PRI,
                  letterSpacing: -2, textAlign: "center" as const, lineHeight: 1.1,
                }}>
                  Start sharing today
                </div>
              </>
            )}
            <div style={{
              background: PURPLE,
              borderRadius: 20, padding: showCards ? "18px 56px" : "22px 72px",
              fontSize: showCards ? 20 : 28, fontWeight: 800, color: "white",
              boxShadow: "0 8px 40px rgba(106,61,170,0.35)",
              letterSpacing: 0.3,
            }}>
              jwstudy.org — Free for all publishers
            </div>
            <div style={{ fontSize: 16, color: TEXT_MUTED }}>
              Post · Like · Comment · Share
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
