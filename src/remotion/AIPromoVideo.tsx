/**
 * AIPromoVideo — YouTube-style (1920×1080) promotional video
 * Light theme — high contrast, readable on any background.
 *
 * 40 seconds · 30fps · 1200 frames
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

// ── Dimensions ─────────────────────────────────────────────────────────────────
const W = 1920;
const H = 1080;
const CHAT_W = 640;
const CHAT_H = 780;
const CHAT_X = (W - CHAT_W) / 2 + 220;
const CHAT_Y = (H - CHAT_H) / 2;

// ── Colours — light theme ──────────────────────────────────────────────────────
const BG         = "#F4F1FA";           // soft lavender white
const CARD_BG    = "#FFFFFF";
const PURPLE     = "#6A3DAA";           // main brand purple
const PURPLE_LT  = "#EDE8F8";           // light purple fill
const TEAL       = "#0D9488";
const TEXT_PRI   = "#1E0D3C";           // near-black purple
const TEXT_SEC   = "#6B7280";
const TEXT_MUTED = "#9CA3AF";
const BORDER     = "#E5E0F3";
const USER_BUBBLE_BG = "#6A3DAA";
const AI_BUBBLE_BG   = "#F3F0FB";

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

function reveal(text: string, frame: number, start: number, cps = 35): string {
  const chars = Math.round(Math.max(0, frame - start) * (cps / 30));
  return text.slice(0, chars);
}

function cursor(frame: number): string {
  return Math.floor(frame / 14) % 2 === 0 ? "▋" : "";
}

// ── Message data ───────────────────────────────────────────────────────────────
const Q1_USER = "What does John 1:1 mean in the NWT?";
const Q1_AI =
  `The NWT renders John 1:1 as "the Word was a god" — not THE God.\n\nThe Greek word theos appears without the definite article here, showing the Word (Jesus) is divine but distinct from Jehovah. The Reasoning From the Scriptures (rs p. 212) confirms: since the Word had a beginning, he cannot be the eternal God.\n\n🔗 wol.jw.org/en/wol/d/r1/lp-e/rs`;

const Q2_USER = "What does the Reasoning book say about the soul?";
const Q2_AI =
  `The Reasoning From the Scriptures (rs p. 375) is clear: the soul IS the living person — not something inside them.\n\nEcclesiastes 9:5 says "the dead know nothing at all." Genesis 2:7 shows man "became a living soul" — not that he received one.\n\n🔗 wol.jw.org/en/wol/d/r1/lp-e/it-2`;

const Q3_USER = "How do I explain the ransom to my Bible student?";
const Q3_AI =
  `Start with Romans 5:12 — one man (Adam) brought sin and death to all. Jesus, as the "last Adam" (1 Cor. 15:45), gave his perfect human life as the corresponding ransom.\n\nUse Enjoy Life Forever! Lesson 4 — it walks students through this step by step with clear visuals.\n\n🔗 wol.jw.org/en/wol/d/r1/lp-e/lff`;

// ── Timings ────────────────────────────────────────────────────────────────────
const T = {
  brandFade:    [0,  40],
  taglineFade:  [30, 70],
  titleFade:    [60, 110],
  subtitleFade: [90, 130],

  chatIn:      150,

  q1UserType:  240,
  q1AIType:    320,
  q1Done:      500,

  badge1In:    460,
  badge1Out:   560,

  q2UserType:  530,
  q2AIType:    610,
  q2Done:      790,

  badge2In:    750,
  badge2Out:   850,

  q3UserType:  820,
  q3AIType:    900,
  q3Done:      1050,

  cardsIn:     [960, 1000, 1040],
  ctaIn:       1080,
  ctaFull:     1120,
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function SparkleIcon({ size = 20, color = PURPLE }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z" />
    </svg>
  );
}

interface MsgBubbleProps {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
  frame: number;
}

function MsgBubble({ role, content, isTyping, frame }: MsgBubbleProps) {
  const isUser = role === "user";
  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      gap: 10,
      alignItems: "flex-start",
      marginBottom: 14,
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: PURPLE_LT,
          border: `1.5px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginTop: 2,
        }}>
          <SparkleIcon size={16} color={PURPLE} />
        </div>
      )}
      <div style={{
        maxWidth: "82%",
        background: isUser ? USER_BUBBLE_BG : AI_BUBBLE_BG,
        border: isUser ? "none" : `1px solid ${BORDER}`,
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "10px 14px",
        fontSize: 13.5,
        color: isUser ? "white" : TEXT_PRI,
        lineHeight: 1.55,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        boxShadow: isUser ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        {content}
        {isTyping && (
          <span style={{ color: PURPLE, opacity: 0.7 }}>{cursor(frame)}</span>
        )}
      </div>
    </div>
  );
}

interface FeatureBadgeProps {
  icon: string;
  text: string;
  sub: string;
  opacity: number;
  y: number;
}

function FeatureBadge({ icon, text, sub, opacity, y }: FeatureBadgeProps) {
  return (
    <div style={{
      position: "absolute",
      left: 80,
      top: y,
      opacity,
      transform: `translateY(${interpolate(opacity, [0, 1], [20, 0])}px)`,
      background: CARD_BG,
      border: `2px solid ${PURPLE}`,
      borderRadius: 20,
      padding: "20px 30px",
      display: "flex",
      alignItems: "center",
      gap: 20,
      maxWidth: 520,
      boxShadow: "0 4px 24px rgba(106,61,170,0.12)",
    }}>
      <span style={{ fontSize: 42 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRI, marginBottom: 4 }}>{text}</div>
        <div style={{ fontSize: 14, color: TEXT_SEC }}>{sub}</div>
      </div>
    </div>
  );
}

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
      borderRadius: 24,
      padding: "36px 28px",
      textAlign: "center",
      opacity,
      transform: `scale(${scale}) translateY(${interpolate(scale, [0.8, 1], [30, 0])}px)`,
      boxShadow: "0 4px 24px rgba(106,61,170,0.08)",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: PURPLE_LT,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 18px",
        fontSize: 32,
      }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: TEXT_PRI, marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 14, color: TEXT_SEC, lineHeight: 1.7 }}>{body}</div>
    </div>
  );
}

// ── Main composition ───────────────────────────────────────────────────────────

export default function AIPromoVideo() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Intro
  const brandOpacity    = fade(frame, T.brandFade[0],    T.brandFade[1]);
  const taglineOpacity  = fade(frame, T.taglineFade[0],  T.taglineFade[1]);
  const titleOpacity    = fade(frame, T.titleFade[0],    T.titleFade[1]);
  const subtitleOpacity = fade(frame, T.subtitleFade[0], T.subtitleFade[1]);
  const titleOut        = frame > 200 ? fadeOut(frame, 200, 240) : 1;

  // Chat panel
  const chatSpring  = sp(frame, T.chatIn, fps, { damping: 18, stiffness: 90, mass: 1 });
  const chatOpacity = fade(frame, T.chatIn, T.chatIn + 20);
  const chatX       = interpolate(chatSpring, [0, 1], [CHAT_X + 120, CHAT_X]);

  // Q1
  const showQ1      = frame >= T.q1UserType;
  const q1UserDone  = frame >= T.q1AIType;
  const q1UserText  = q1UserDone ? Q1_USER : reveal(Q1_USER, frame, T.q1UserType, 30);
  const showQ1AI    = frame >= T.q1AIType;
  const q1AIDone    = frame >= T.q1Done;
  const q1AIText    = q1AIDone ? Q1_AI : reveal(Q1_AI, frame, T.q1AIType, 28);

  // Badge 1
  const badge1Opacity = frame >= T.badge1Out
    ? fadeOut(frame, T.badge1Out, T.badge1Out + 20)
    : fade(frame, T.badge1In, T.badge1In + 25);

  // Q2 (crossfade out Q1)
  const q1PanelOpacity = frame >= T.q2UserType ? fadeOut(frame, T.q2UserType, T.q2UserType + 15) : 1;
  const q2PanelOpacity = fade(frame, T.q2UserType, T.q2UserType + 20);

  const showQ2     = frame >= T.q2UserType;
  const q2UserDone = frame >= T.q2AIType;
  const q2UserText = q2UserDone ? Q2_USER : reveal(Q2_USER, frame, T.q2UserType, 30);
  const showQ2AI   = frame >= T.q2AIType;
  const q2AIDone   = frame >= T.q2Done;
  const q2AIText   = q2AIDone ? Q2_AI : reveal(Q2_AI, frame, T.q2AIType, 28);

  // Badge 2
  const badge2Opacity = frame >= T.badge2Out
    ? fadeOut(frame, T.badge2Out, T.badge2Out + 20)
    : fade(frame, T.badge2In, T.badge2In + 25);

  // Q3
  const q2PanelOut    = frame >= T.q3UserType ? fadeOut(frame, T.q3UserType, T.q3UserType + 15) : 1;
  const q3PanelOpacity = fade(frame, T.q3UserType, T.q3UserType + 20);

  const showQ3     = frame >= T.q3UserType;
  const q3UserDone = frame >= T.q3AIType;
  const q3UserText = q3UserDone ? Q3_USER : reveal(Q3_USER, frame, T.q3UserType, 30);
  const showQ3AI   = frame >= T.q3AIType;
  const q3AIDone   = frame >= T.q3Done;
  const q3AIText   = q3AIDone ? Q3_AI : reveal(Q3_AI, frame, T.q3AIType, 28);

  // Feature cards
  const chatPanelOutOpacity = frame >= T.cardsIn[0]
    ? fadeOut(frame, T.cardsIn[0], T.cardsIn[0] + 30)
    : 1;

  const cards = T.cardsIn.map((start) => ({
    opacity: fade(frame, start, start + 30),
    scale: interpolate(sp(frame, start, fps), [0, 1], [0.85, 1]),
  }));

  // CTA
  const ctaOpacity = fade(frame, T.ctaIn, T.ctaFull);
  const ctaScale   = interpolate(sp(frame, T.ctaIn, fps, { damping: 12, stiffness: 80, mass: 1 }), [0, 1], [0.9, 1]);
  const showCards  = frame >= T.cardsIn[0];

  const leftOpacity = frame < T.cardsIn[0]
    ? fade(frame, T.chatIn, T.chatIn + 40)
    : fadeOut(frame, T.cardsIn[0], T.cardsIn[0] + 30);

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

      {/* Soft background shapes */}
      <div style={{
        position: "absolute", top: -200, right: -200,
        width: 800, height: 800, borderRadius: "50%",
        background: "rgba(106,61,170,0.06)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -250, left: -150,
        width: 700, height: 700, borderRadius: "50%",
        background: "rgba(13,148,136,0.05)",
        pointerEvents: "none",
      }} />

      {/* ── Intro title card ── */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 0,
        opacity: titleOut,
        pointerEvents: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: brandOpacity, marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: PURPLE,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(106,61,170,0.3)",
          }}>
            <SparkleIcon size={38} color="white" />
          </div>
          <span style={{ fontSize: 46, fontWeight: 800, color: TEXT_PRI, letterSpacing: -1 }}>JW Study</span>
        </div>

        <div style={{
          fontSize: 88, fontWeight: 900, color: TEXT_PRI,
          lineHeight: 1.05, textAlign: "center",
          opacity: titleOpacity, letterSpacing: -2, maxWidth: 1100,
        }}>
          Your AI Bible
          <span style={{ color: PURPLE }}> Study Companion</span>
        </div>

        <div style={{
          fontSize: 28, color: TEXT_SEC, marginTop: 28,
          textAlign: "center", opacity: subtitleOpacity, fontWeight: 500,
        }}>
          Powered by JW sources only · wol.jw.org · 20+ publications
        </div>
      </div>

      {/* ── Left panel labels ── */}
      {frame >= T.chatIn && frame < T.cardsIn[0] && (
        <div style={{
          position: "absolute",
          left: 80, top: 0, bottom: 0, width: 600,
          display: "flex", flexDirection: "column", justifyContent: "center",
          opacity: leftOpacity,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 52 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: PURPLE,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <SparkleIcon size={22} color="white" />
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: TEXT_SEC }}>JW Study</span>
          </div>

          {frame < T.q2UserType && (
            <div style={{ opacity: fade(frame, T.chatIn + 10, T.chatIn + 40) }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: TEAL, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 }}>
                Ask Anything
              </div>
              <div style={{ fontSize: 52, fontWeight: 900, color: TEXT_PRI, lineHeight: 1.1, marginBottom: 18, letterSpacing: -1.5 }}>
                Bible questions answered from Scripture
              </div>
              <div style={{ fontSize: 18, color: TEXT_SEC, lineHeight: 1.7 }}>
                Doctrine · Publications · Ministry help · Congregation life
              </div>
            </div>
          )}

          {frame >= T.q2UserType && frame < T.q3UserType && (
            <div style={{ opacity: fade(frame, T.q2UserType, T.q2UserType + 30) }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: TEAL, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 }}>
                Publications
              </div>
              <div style={{ fontSize: 52, fontWeight: 900, color: TEXT_PRI, lineHeight: 1.1, marginBottom: 18, letterSpacing: -1.5 }}>
                20+ Watch Tower publications indexed
              </div>
              <div style={{ fontSize: 18, color: TEXT_SEC, lineHeight: 1.7 }}>
                Insight · Reasoning · Organized · Draw Close · Keep Yourselves in God's Love
              </div>
            </div>
          )}

          {frame >= T.q3UserType && frame < T.cardsIn[0] && (
            <div style={{ opacity: fade(frame, T.q3UserType, T.q3UserType + 30) }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: TEAL, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 }}>
                Ministry Ready
              </div>
              <div style={{ fontSize: 52, fontWeight: 900, color: TEXT_PRI, lineHeight: 1.1, marginBottom: 18, letterSpacing: -1.5 }}>
                Practical help for the field
              </div>
              <div style={{ fontSize: 18, color: TEXT_SEC, lineHeight: 1.7 }}>
                Scripture chains, talking points, and publication links — ready to use
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Feature badges ── */}
      {frame >= T.badge1In && frame < T.badge2In && (
        <FeatureBadge
          icon="🛡️" text="JW Sources Only"
          sub="wol.jw.org · jw.org · NWT — never outside commentaries"
          opacity={badge1Opacity} y={H - 260}
        />
      )}
      {frame >= T.badge2In && frame < T.cardsIn[0] && (
        <FeatureBadge
          icon="📚" text="20+ Watch Tower Publications"
          sub="Insight · Reasoning · Organized · Enjoy Life Forever! · and more"
          opacity={badge2Opacity} y={H - 260}
        />
      )}

      {/* ── Chat panel ── */}
      {frame >= T.chatIn && frame < T.cardsIn[0] && (
        <div style={{
          position: "absolute",
          left: chatX, top: CHAT_Y,
          width: CHAT_W, height: CHAT_H,
          opacity: chatOpacity * chatPanelOutOpacity,
          display: "flex", flexDirection: "column",
          background: CARD_BG,
          border: `1.5px solid ${BORDER}`,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 20px 80px rgba(106,61,170,0.15), 0 4px 16px rgba(0,0,0,0.06)",
        }}>
          {/* Header */}
          <div style={{
            padding: "18px 20px 16px",
            borderBottom: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", gap: 12,
            background: CARD_BG,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: PURPLE,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <SparkleIcon size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRI }}>Study Companion</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED }}>JW sources only · wol.jw.org</div>
            </div>
            <div style={{
              marginLeft: "auto",
              width: 8, height: 8, borderRadius: "50%",
              background: TEAL,
              boxShadow: `0 0 8px ${TEAL}`,
            }} />
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: "16px 16px 8px", overflowY: "hidden", background: "#FAFAF9" }}>
            {showQ1 && frame < T.q2UserType && (
              <div style={{ opacity: q1PanelOpacity }}>
                <MsgBubble role="user" content={q1UserText} isTyping={!q1UserDone} frame={frame} />
                {showQ1AI && <MsgBubble role="assistant" content={q1AIText} isTyping={showQ1AI && !q1AIDone} frame={frame} />}
              </div>
            )}
            {showQ2 && frame < T.q3UserType && (
              <div style={{ opacity: Math.min(q2PanelOpacity, q2PanelOut) }}>
                <MsgBubble role="user" content={q2UserText} isTyping={showQ2 && !q2UserDone} frame={frame} />
                {showQ2AI && <MsgBubble role="assistant" content={q2AIText} isTyping={showQ2AI && !q2AIDone} frame={frame} />}
              </div>
            )}
            {showQ3 && (
              <div style={{ opacity: q3PanelOpacity }}>
                <MsgBubble role="user" content={q3UserText} isTyping={showQ3 && !q3UserDone} frame={frame} />
                {showQ3AI && <MsgBubble role="assistant" content={q3AIText} isTyping={showQ3AI && !q3AIDone} frame={frame} />}
              </div>
            )}
          </div>

          {/* Input row */}
          <div style={{
            padding: "10px 14px 14px",
            borderTop: `1px solid ${BORDER}`,
            display: "flex", gap: 10, alignItems: "center",
            background: CARD_BG,
          }}>
            <div style={{
              flex: 1, background: "#F9F7FF",
              border: `1px solid ${BORDER}`,
              borderRadius: 12, padding: "10px 14px",
              fontSize: 13, color: TEXT_MUTED,
            }}>
              Ask a Bible question…
            </div>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: PURPLE,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(106,61,170,0.3)",
            }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </div>
          </div>
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
            <div style={{ fontSize: 13, fontWeight: 800, color: TEAL, letterSpacing: 3, textTransform: "uppercase", textAlign: "center", marginBottom: 8 }}>
              Everything in one place
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: TEXT_PRI, textAlign: "center", letterSpacing: -1.5 }}>
              Built for Jehovah's Witnesses
            </div>
          </div>

          <div style={{ display: "flex", gap: 40, width: "100%" }}>
            <FeatureCard icon="📖" title="All 66 NWT Books"
              body="Ask about any book, chapter, or verse. Get scripture chains and cross-references from Watch Tower publications."
              opacity={cards[0].opacity} scale={cards[0].scale} />
            <FeatureCard icon="🔗" title="Direct wol.jw.org Links"
              body="Every answer includes working links to the exact publication or Bible passage on the Watch Tower Online Library."
              opacity={cards[1].opacity} scale={cards[1].scale} />
            <FeatureCard icon="🛡️" title="JW Sources Only"
              body="No outside commentaries. No other denominations. Every answer drawn exclusively from Watch Tower publications and jw.org."
              opacity={cards[2].opacity} scale={cards[2].scale} />
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      {frame >= T.ctaIn && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: showCards ? "flex-end" : "center",
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
                    <SparkleIcon size={38} color="white" />
                  </div>
                  <span style={{ fontSize: 46, fontWeight: 800, color: TEXT_PRI }}>JW Study</span>
                </div>
                <div style={{ fontSize: 72, fontWeight: 900, color: TEXT_PRI, letterSpacing: -2, textAlign: "center", lineHeight: 1.1 }}>
                  Try it free today
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
              Every feature free · No account required to browse
            </div>
          </div>
        </div>
      )}

    </AbsoluteFill>
  );
}
