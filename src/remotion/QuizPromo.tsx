/**
 * QuizPromo — 1920×1080, 40 s, 30 fps
 * Showcases the Bible Knowledge Quiz: level grid, live question,
 * badge unlock, and feature highlights.
 * Light theme, consistent with other promo videos.
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
const BG         = "#F4F1FA";
const CARD_BG    = "#FFFFFF";
const PURPLE     = "#6A3DAA";
const PURPLE_LT  = "#EDE8F8";
const TEXT_PRI   = "#1E0D3C";
const TEXT_SEC   = "#6B7280";
const TEXT_MUTED = "#9CA3AF";
const BORDER     = "#E5E0F3";
const SUCCESS    = "#10B981";

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

// ── Timings ────────────────────────────────────────────────────────────────────
const T = {
  // Intro
  brandIn:    [0,   35],
  headlineIn: [25,  75],
  subIn:      [60, 100],
  introOut:   [170, 210],

  // Level grid
  gridIn:   195,
  card1In:  210,
  card2In:  235,
  card3In:  258,
  card4In:  280,
  gridOut:  [390, 430],

  // Quiz question
  qCardIn:   435,
  qTextIn:   455,
  opt1In:    475,
  opt2In:    500,
  opt3In:    523,
  opt4In:    546,
  selectAt:  610,  // correct option highlights
  correctIn: 625,
  qOut:      [700, 740],

  // Badge earned
  badgeIn:     745,
  badgeIconIn: 770,
  badgeTextIn: 795,
  badgeOut:    [890, 930],

  // Feature cards + CTA
  feat1In:  940,
  feat2In:  975,
  feat3In: 1010,
  ctaIn:   1080,
  ctaFull: 1115,
};

// ── Level mock data ────────────────────────────────────────────────────────────
const LEVELS = [
  { level: 1, badge: "📖", theme: "God's Purpose",    done: true,  score: 90 },
  { level: 2, badge: "📚", theme: "Jehovah's Name",   done: false, locked: false },
  { level: 3, badge: "🌱", theme: "God's Kingdom",    done: false, locked: true  },
  { level: 4, badge: "👪", theme: "Family & Morals",  done: false, locked: true  },
];

// ── Sample question ────────────────────────────────────────────────────────────
const Q_TEXT = "What does Ecclesiastes 9:5 say about the dead?";
const OPTIONS = [
  { label: "A", text: "They watch over the living",   correct: false },
  { label: "B", text: "They are conscious in heaven", correct: false },
  { label: "C", text: "They are aware of nothing at all", correct: true },
  { label: "D", text: "They suffer in purgatory",     correct: false },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function LevelCard({ data, scale }: { data: typeof LEVELS[0]; scale: number }) {
  const { level, badge, theme, done, score, locked } = data as any;
  return (
    <div style={{
      width: 210,
      background: done ? PURPLE_LT : locked ? "#F8F7FC" : CARD_BG,
      border: `1.5px solid ${done ? PURPLE : BORDER}`,
      borderRadius: 18, padding: "22px 18px",
      transform: `scale(${scale})`,
      boxShadow: done
        ? "0 6px 24px rgba(106,61,170,0.18)"
        : "0 2px 8px rgba(0,0,0,0.06)",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 12,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: locked ? TEXT_MUTED : PURPLE,
          textTransform: "uppercase" as const, letterSpacing: 0.8,
        }}>
          Level {level}
        </span>
        {done && (
          <span style={{
            background: SUCCESS, borderRadius: 20, padding: "2px 10px",
            fontSize: 11, fontWeight: 700, color: "#fff",
          }}>✓ Done</span>
        )}
        {locked && <span style={{ fontSize: 18 }}>🔒</span>}
      </div>
      <div style={{ fontSize: 38, marginBottom: 10 }}>{badge}</div>
      <div style={{
        fontSize: 14, fontWeight: 700, color: locked ? TEXT_MUTED : TEXT_PRI,
        lineHeight: 1.3,
      }}>{theme}</div>
      {done && (
        <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: PURPLE }}>
          Best: {score}%
        </div>
      )}
    </div>
  );
}

function OptionRow({ opt, selected, frame, appearAt, fps }: {
  opt: typeof OPTIONS[0]; selected: boolean;
  frame: number; appearAt: number; fps: number;
}) {
  const opacity = fade(frame, appearAt, appearAt + 20);
  const scale   = sp(frame, appearAt, fps, { damping: 16, stiffness: 120, mass: 1 });
  const isCorrectSelected = selected && opt.correct;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "13px 16px", borderRadius: 12,
      background: isCorrectSelected ? "rgba(16,185,129,0.1)" : CARD_BG,
      border: `1.5px solid ${isCorrectSelected ? SUCCESS : BORDER}`,
      opacity, transform: `scale(${scale})`,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: isCorrectSelected ? SUCCESS : PURPLE_LT,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800,
        color: isCorrectSelected ? "#fff" : PURPLE,
      }}>
        {isCorrectSelected ? "✓" : opt.label}
      </div>
      <span style={{ fontSize: 15, fontWeight: 500, color: TEXT_PRI }}>{opt.text}</span>
    </div>
  );
}

function FeatCard({ emoji, title, sub, opacity, scale }: {
  emoji: string; title: string; sub: string;
  opacity: number; scale: number;
}) {
  return (
    <div style={{
      width: 270, background: CARD_BG, border: `1.5px solid ${BORDER}`,
      borderRadius: 22, padding: "34px 26px",
      opacity, transform: `scale(${scale})`,
      boxShadow: "0 8px 32px rgba(106,61,170,0.09)",
    }}>
      <div style={{ fontSize: 46, marginBottom: 18 }}>{emoji}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRI, marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 14, color: TEXT_SEC, lineHeight: 1.55 }}>{sub}</div>
    </div>
  );
}

// ── Main composition ────────────────────────────────────────────────────────────

export function QuizPromo() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Intro
  const introOut    = frame >= T.introOut[0] ? fadeOut(frame, T.introOut[0], T.introOut[1]) : 1;
  const brandOp     = fade(frame, T.brandIn[0], T.brandIn[1]);
  const headlineOp  = fade(frame, T.headlineIn[0], T.headlineIn[1]);
  const subOp       = fade(frame, T.subIn[0], T.subIn[1]);

  // Grid
  const gridOp = interpolate(frame,
    [T.gridIn, T.gridIn + 25, T.gridOut[0], T.gridOut[1]],
    [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cs = [T.card1In, T.card2In, T.card3In, T.card4In]
    .map(s => sp(frame, s, fps, { damping: 13, stiffness: 90, mass: 1 }));

  // Question
  const qOp   = interpolate(frame,
    [T.qCardIn, T.qCardIn + 25, T.qOut[0], T.qOut[1]],
    [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const qSc   = sp(frame, T.qCardIn, fps, { damping: 12, stiffness: 85, mass: 1 });
  const qTxt  = fade(frame, T.qTextIn, T.qTextIn + 25);
  const sel   = frame >= T.selectAt;
  const corr  = frame >= T.correctIn;

  // Badge
  const badgeOp  = interpolate(frame,
    [T.badgeIn, T.badgeIn + 25, T.badgeOut[0], T.badgeOut[1]],
    [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badgeSc  = sp(frame, T.badgeIn, fps, { damping: 10, stiffness: 75, mass: 1.1 });
  const iconSc   = sp(frame, T.badgeIconIn, fps, { damping: 7, stiffness: 60, mass: 1.3 });
  const badgeTxt = fade(frame, T.badgeTextIn, T.badgeTextIn + 30);

  // Features / CTA
  const f1op = fade(frame, T.feat1In, T.feat1In + 35);
  const f1sc = sp(frame, T.feat1In, fps);
  const f2op = fade(frame, T.feat2In, T.feat2In + 35);
  const f2sc = sp(frame, T.feat2In, fps);
  const f3op = fade(frame, T.feat3In, T.feat3In + 35);
  const f3sc = sp(frame, T.feat3In, fps);
  const ctaOp = fade(frame, T.ctaIn, T.ctaFull);

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
          interpolate(f,
            [0, 30, durationInFrames - 60, durationInFrames],
            [0, 0.32, 0.32, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        }
      />

      {/* Decorative blobs */}
      <div style={{
        position: "absolute", top: -220, right: -220,
        width: 720, height: 720, borderRadius: "50%",
        background: "rgba(106,61,170,0.05)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -180, left: -180,
        width: 560, height: 560, borderRadius: "50%",
        background: "rgba(13,148,136,0.04)", pointerEvents: "none",
      }} />

      {/* ── INTRO ──────────────────────────────────────────────────────── */}
      {frame < T.introOut[1] && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          opacity: introOut,
        }}>
          <div style={{
            opacity: brandOp,
            background: PURPLE_LT, border: `1.5px solid rgba(106,61,170,0.2)`,
            borderRadius: 40, padding: "8px 26px", marginBottom: 36,
            fontSize: 17, fontWeight: 700, color: PURPLE, letterSpacing: 0.5,
          }}>
            JW Study
          </div>

          <div style={{
            opacity: headlineOp,
            fontSize: 92, fontWeight: 900, color: TEXT_PRI,
            textAlign: "center", lineHeight: 1.05,
            marginBottom: 28, letterSpacing: -2,
          }}>
            Bible Knowledge<br />
            <span style={{ color: PURPLE }}>Quiz</span>
          </div>

          <div style={{
            opacity: subOp,
            fontSize: 28, color: TEXT_SEC,
            textAlign: "center", lineHeight: 1.6,
          }}>
            12 levels · Themed questions · Earn badges<br />
            How well do you know the Scriptures?
          </div>
        </div>
      )}

      {/* ── LEVEL GRID ─────────────────────────────────────────────────── */}
      {frame >= T.gridIn && frame < T.gridOut[1] && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          opacity: gridOp,
        }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              fontSize: 17, fontWeight: 700, color: PURPLE,
              textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 14,
            }}>
              12 Levels · Themed Topics
            </div>
            <div style={{ fontSize: 52, fontWeight: 900, color: TEXT_PRI }}>
              Choose Your Level
            </div>
          </div>

          <div style={{ display: "flex", gap: 22 }}>
            {LEVELS.map((lv, i) => (
              <LevelCard key={lv.level} data={lv} scale={cs[i]} />
            ))}
          </div>

          <div style={{
            marginTop: 44, fontSize: 18, color: TEXT_MUTED,
            fontWeight: 500, opacity: fade(frame, T.card4In + 20, T.card4In + 50),
          }}>
            Complete a level to unlock the next one
          </div>
        </div>
      )}

      {/* ── QUIZ QUESTION ──────────────────────────────────────────────── */}
      {frame >= T.qCardIn && frame < T.qOut[1] && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: qOp,
        }}>
          {/* Left label */}
          <div style={{
            position: "absolute", left: 120, top: "50%",
            transform: "translateY(-50%)",
            opacity: fade(frame, T.qCardIn + 30, T.qCardIn + 55),
          }}>
            <div style={{
              fontSize: 17, fontWeight: 700, color: PURPLE,
              textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12,
            }}>
              Level 1 · Question 3 of 5
            </div>
            <div style={{
              fontSize: 42, fontWeight: 900, color: TEXT_PRI,
              lineHeight: 1.15, maxWidth: 400,
            }}>
              Answer &amp;<br />earn points
            </div>
            <div style={{
              marginTop: 24,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                background: PURPLE_LT, borderRadius: 40,
                padding: "8px 18px",
                fontSize: 15, fontWeight: 700, color: PURPLE,
              }}>
                📖 Scholar Badge
              </div>
            </div>
          </div>

          {/* Question card */}
          <div style={{
            width: 660, transform: `scale(${qSc})`,
            background: CARD_BG, border: `1.5px solid ${BORDER}`,
            borderRadius: 24, overflow: "hidden",
            boxShadow: "0 24px 80px rgba(106,61,170,0.14), 0 4px 16px rgba(0,0,0,0.06)",
          }}>
            {/* Card header */}
            <div style={{
              background: PURPLE, padding: "18px 24px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 22 }}>📖</span>
              <span style={{
                fontSize: 15, fontWeight: 700,
                color: "rgba(255,255,255,0.8)", flex: 1,
              }}>
                Level 1 · Question 3 of 5
              </span>
              {corr && (
                <div style={{
                  background: SUCCESS, borderRadius: 20,
                  padding: "4px 16px",
                  fontSize: 14, fontWeight: 700, color: "#fff",
                }}>
                  Correct! +20 pts
                </div>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: "26px 24px 28px", opacity: qTxt }}>
              <div style={{
                fontSize: 20, fontWeight: 700, color: TEXT_PRI,
                lineHeight: 1.45, marginBottom: 22,
              }}>
                {Q_TEXT}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {OPTIONS.map((opt, i) => (
                  <OptionRow
                    key={opt.label}
                    opt={opt}
                    selected={sel && opt.correct}
                    frame={frame}
                    appearAt={[T.opt1In, T.opt2In, T.opt3In, T.opt4In][i]}
                    fps={fps}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BADGE EARNED ────────────────────────────────────────────────── */}
      {frame >= T.badgeIn && frame < T.badgeOut[1] && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: badgeOp,
        }}>
          <div style={{
            width: 500, transform: `scale(${badgeSc})`,
            background: CARD_BG, border: `1.5px solid ${BORDER}`,
            borderRadius: 28, padding: "52px 44px", textAlign: "center",
            boxShadow: "0 32px 100px rgba(106,61,170,0.18), 0 8px 24px rgba(0,0,0,0.07)",
          }}>
            <div style={{ fontSize: 26, marginBottom: 10, opacity: badgeTxt }}>
              ⭐ ⭐ ⭐
            </div>
            <div style={{
              fontSize: 100,
              transform: `scale(${iconSc})`,
              display: "inline-block", marginBottom: 22,
            }}>
              📖
            </div>
            <div style={{
              fontSize: 34, fontWeight: 900, color: TEXT_PRI,
              marginBottom: 8, opacity: badgeTxt,
            }}>
              Level 1 Complete!
            </div>
            <div style={{
              fontSize: 21, fontWeight: 700, color: PURPLE,
              marginBottom: 24, opacity: badgeTxt,
            }}>
              Scholar Badge Earned
            </div>
            <div style={{
              background: PURPLE_LT, borderRadius: 40,
              padding: "11px 30px", display: "inline-block",
              fontSize: 18, fontWeight: 700, color: PURPLE,
              opacity: badgeTxt,
            }}>
              Score: 90% · Level 2 Unlocked 🔓
            </div>
          </div>
        </div>
      )}

      {/* ── FEATURES ───────────────────────────────────────────────────── */}
      {frame >= T.feat1In && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            marginBottom: 58, textAlign: "center",
            opacity: f1op,
          }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: TEXT_PRI }}>
              Grow in Bible Knowledge
            </div>
          </div>

          <div style={{ display: "flex", gap: 28 }}>
            <FeatCard
              emoji="📋"
              title="12 Bible Levels"
              sub="From Creation to Revelation — themed questions that build on each other."
              opacity={f1op} scale={f1sc}
            />
            <FeatCard
              emoji="🏅"
              title="Earn Badges"
              sub="Pass each level with 80%+ to earn a unique badge for your profile."
              opacity={f2op} scale={f2sc}
            />
            <FeatCard
              emoji="📈"
              title="Track Your Scores"
              sub="See your best score per level and improve with every attempt."
              opacity={f3op} scale={f3sc}
            />
          </div>

          {/* CTA */}
          {frame >= T.ctaIn && (
            <div style={{
              marginTop: 64, opacity: ctaOp,
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 18,
            }}>
              <div style={{
                background: PURPLE, borderRadius: 50,
                padding: "18px 58px",
                fontSize: 22, fontWeight: 800, color: "#fff",
                boxShadow: "0 8px 32px rgba(106,61,170,0.38)",
              }}>
                Start the Quiz — jwstudy.org/quiz
              </div>
              <div style={{ fontSize: 16, color: TEXT_MUTED, fontWeight: 500 }}>
                Free · No download needed
              </div>
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
}
