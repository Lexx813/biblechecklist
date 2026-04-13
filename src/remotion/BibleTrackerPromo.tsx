/**
 * BibleTrackerPromo — 1920×1080, 40 s, 30 fps
 * Showcases the NWT Bible reading tracker: book grid, chapter marking,
 * streaks, progress stats, and feature highlights.
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
const TEAL       = "#0D9488";
const TEXT_PRI   = "#1E0D3C";
const TEXT_SEC   = "#6B7280";
const TEXT_MUTED = "#9CA3AF";
const BORDER     = "#E5E0F3";
const SUCCESS    = "#10B981";
const AMBER      = "#F59E0B";

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
  brandIn:    [0,  35],
  headlineIn: [28, 78],
  subIn:      [62, 102],
  introOut:   [170, 210],

  // Book grid
  gridIn:  195,
  booksIn: [210, 230, 250, 268, 285, 302, 318, 334],  // 8 books stagger
  gridOut: [400, 440],

  // Chapter marking (zoom into one book)
  chapterIn:  445,
  ch1:        470,   // chapter 1 fills
  ch2:        510,   // chapter 2 fills
  ch3:        548,   // chapter 3 fills
  ch4:        586,
  ch5:        622,
  chapterOut: [680, 720],

  // Stats card
  statsIn:  725,
  stat1In:  750,
  stat2In:  785,
  stat3In:  820,
  statsOut: [900, 940],

  // Features + CTA
  feat1In:  948,
  feat2In:  983,
  feat3In: 1018,
  ctaIn:   1085,
  ctaFull: 1120,
};

// ── Mock book data ─────────────────────────────────────────────────────────────
const BOOKS = [
  { name: "Genesis",     chapters: 50, done: 50, color: "#7C3AED" },
  { name: "Exodus",      chapters: 40, done: 40, color: "#7C3AED" },
  { name: "Leviticus",   chapters: 27, done: 14, color: "#7C3AED" },
  { name: "Numbers",     chapters: 36, done: 0,  color: "#7C3AED" },
  { name: "Matthew",     chapters: 28, done: 28, color: "#0D9488" },
  { name: "Mark",        chapters: 16, done: 16, color: "#0D9488" },
  { name: "Luke",        chapters: 24, done: 18, color: "#0D9488" },
  { name: "John",        chapters: 21, done: 7,  color: "#0D9488" },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function BookCard({ book, scale }: { book: typeof BOOKS[0]; scale: number }) {
  const pct = book.chapters > 0 ? book.done / book.chapters : 0;
  const done = pct >= 1;
  return (
    <div style={{
      width: 190,
      background: done ? PURPLE_LT : CARD_BG,
      border: `1.5px solid ${done ? PURPLE : BORDER}`,
      borderRadius: 16, padding: "18px 16px",
      transform: `scale(${scale})`,
      boxShadow: done
        ? "0 6px 24px rgba(106,61,170,0.15)"
        : "0 2px 8px rgba(0,0,0,0.05)",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 12,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700,
          color: done ? PURPLE : TEXT_MUTED,
          textTransform: "uppercase" as const, letterSpacing: 0.5,
        }}>
          {book.name}
        </span>
        {done && <span style={{ fontSize: 14 }}>✓</span>}
      </div>
      {/* Progress bar */}
      <div style={{
        height: 6, borderRadius: 3,
        background: "rgba(106,61,170,0.1)", marginBottom: 8,
      }}>
        <div style={{
          height: "100%", borderRadius: 3,
          width: `${pct * 100}%`,
          background: done ? PURPLE : book.color,
          transition: "width 0.3s",
        }} />
      </div>
      <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500 }}>
        {book.done} / {book.chapters} chapters
      </div>
    </div>
  );
}

function ChapterPill({ filled, frame, fillAt }: {
  filled: boolean; frame: number; fillAt: number;
}) {
  const isNowFilled = filled || frame >= fillAt;
  const fillProgress = isNowFilled ? Math.min(1, (frame - fillAt) / 15) : 0;
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8,
      background: isNowFilled
        ? `rgba(106,61,170,${0.15 + fillProgress * 0.85})`
        : "rgba(106,61,170,0.08)",
      border: `1.5px solid ${isNowFilled ? PURPLE : BORDER}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 700,
      color: isNowFilled ? PURPLE : TEXT_MUTED,
      transition: "background 0.2s, border-color 0.2s",
    }}>
      {isNowFilled ? "✓" : ""}
    </div>
  );
}

function StatRow({ label, value, icon, opacity }: {
  label: string; value: string; icon: string; opacity: number;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 20,
      padding: "18px 24px",
      borderBottom: `1px solid ${BORDER}`,
      opacity,
    }}>
      <span style={{ fontSize: 32 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 500, marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRI }}>
          {value}
        </div>
      </div>
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

export function BibleTrackerPromo() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Intro
  const introOut   = frame >= T.introOut[0] ? fadeOut(frame, T.introOut[0], T.introOut[1]) : 1;
  const brandOp    = fade(frame, T.brandIn[0], T.brandIn[1]);
  const headlineOp = fade(frame, T.headlineIn[0], T.headlineIn[1]);
  const subOp      = fade(frame, T.subIn[0], T.subIn[1]);

  // Book grid
  const gridOp  = interpolate(frame,
    [T.gridIn, T.gridIn + 25, T.gridOut[0], T.gridOut[1]],
    [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bookScs = T.booksIn.map(s => sp(frame, s, fps, { damping: 13, stiffness: 92, mass: 1 }));

  // Chapter marking
  const chapOp  = interpolate(frame,
    [T.chapterIn, T.chapterIn + 25, T.chapterOut[0], T.chapterOut[1]],
    [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chapSc  = sp(frame, T.chapterIn, fps, { damping: 12, stiffness: 88, mass: 1 });

  // Stats card
  const statsOp  = interpolate(frame,
    [T.statsIn, T.statsIn + 25, T.statsOut[0], T.statsOut[1]],
    [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const statsSc  = sp(frame, T.statsIn, fps, { damping: 12, stiffness: 88, mass: 1 });

  // Features / CTA
  const f1op  = fade(frame, T.feat1In, T.feat1In + 35);
  const f1sc  = sp(frame, T.feat1In, fps);
  const f2op  = fade(frame, T.feat2In, T.feat2In + 35);
  const f2sc  = sp(frame, T.feat2In, fps);
  const f3op  = fade(frame, T.feat3In, T.feat3In + 35);
  const f3sc  = sp(frame, T.feat3In, fps);
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
        position: "absolute", top: -200, right: -200,
        width: 720, height: 720, borderRadius: "50%",
        background: "rgba(13,148,136,0.05)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -160, left: -160,
        width: 560, height: 560, borderRadius: "50%",
        background: "rgba(106,61,170,0.04)", pointerEvents: "none",
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
            fontSize: 88, fontWeight: 900, color: TEXT_PRI,
            textAlign: "center", lineHeight: 1.05,
            marginBottom: 28, letterSpacing: -2,
          }}>
            NWT Bible<br />
            <span style={{ color: TEAL }}>Reading Tracker</span>
          </div>

          <div style={{
            opacity: subOp,
            fontSize: 28, color: TEXT_SEC,
            textAlign: "center", lineHeight: 1.6,
          }}>
            Track every chapter of all 66 books.<br />
            Build your streak · Share your progress.
          </div>
        </div>
      )}

      {/* ── BOOK GRID ──────────────────────────────────────────────────── */}
      {frame >= T.gridIn && frame < T.gridOut[1] && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          opacity: gridOp,
        }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              fontSize: 17, fontWeight: 700, color: TEAL,
              textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 14,
            }}>
              66 Books · 1,189 Chapters
            </div>
            <div style={{ fontSize: 52, fontWeight: 900, color: TEXT_PRI }}>
              Track Your Reading
            </div>
          </div>

          {/* Two rows of 4 books */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", gap: 18 }}>
              {BOOKS.slice(0, 4).map((b, i) => (
                <BookCard key={b.name} book={b} scale={bookScs[i]} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 18 }}>
              {BOOKS.slice(4, 8).map((b, i) => (
                <BookCard key={b.name} book={b} scale={bookScs[i + 4]} />
              ))}
            </div>
          </div>

          <div style={{
            marginTop: 40, fontSize: 18, color: TEXT_MUTED, fontWeight: 500,
            opacity: fade(frame, T.booksIn[7] + 20, T.booksIn[7] + 50),
          }}>
            Tap any chapter to mark it read
          </div>
        </div>
      )}

      {/* ── CHAPTER MARKING ────────────────────────────────────────────── */}
      {frame >= T.chapterIn && frame < T.chapterOut[1] && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: chapOp,
        }}>
          {/* Left label */}
          <div style={{
            position: "absolute", left: 120,
            opacity: fade(frame, T.chapterIn + 25, T.chapterIn + 55),
          }}>
            <div style={{
              fontSize: 17, fontWeight: 700, color: TEAL,
              textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 14,
            }}>
              Chapter by Chapter
            </div>
            <div style={{
              fontSize: 46, fontWeight: 900, color: TEXT_PRI,
              lineHeight: 1.15, maxWidth: 380,
            }}>
              Tap to mark<br />chapters read
            </div>
            <div style={{ marginTop: 24, display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: SUCCESS,
              }} />
              <span style={{ fontSize: 15, color: TEXT_SEC, fontWeight: 500 }}>
                Progress saves automatically
              </span>
            </div>
          </div>

          {/* Chapter grid card */}
          <div style={{
            width: 600, transform: `scale(${chapSc})`,
            background: CARD_BG, border: `1.5px solid ${BORDER}`,
            borderRadius: 24, overflow: "hidden",
            boxShadow: "0 24px 80px rgba(13,148,136,0.12), 0 4px 16px rgba(0,0,0,0.06)",
          }}>
            {/* Header */}
            <div style={{
              background: TEAL, padding: "18px 24px",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span style={{ fontSize: 22 }}>📗</span>
              <span style={{
                fontSize: 18, fontWeight: 800, color: "#fff", flex: 1,
              }}>
                John
              </span>
              <span style={{
                fontSize: 14, fontWeight: 600,
                color: "rgba(255,255,255,0.75)",
              }}>
                21 chapters
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ padding: "16px 24px 8px" }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 13, fontWeight: 600,
                color: TEXT_MUTED, marginBottom: 8,
              }}>
                <span>
                  {(() => {
                    const marked = (frame >= T.ch1 ? 1 : 0) + (frame >= T.ch2 ? 1 : 0) + (frame >= T.ch3 ? 1 : 0) + (frame >= T.ch4 ? 1 : 0) + (frame >= T.ch5 ? 1 : 0);
                    return Math.min(5, marked) + 2;
                  })()} chapters read
                </span>
                <span>21 total</span>
              </div>
              <div style={{
                height: 6, borderRadius: 3,
                background: "rgba(13,148,136,0.1)",
              }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  background: TEAL,
                  width: `${(
                    2 +
                    (frame >= T.ch1 ? 1 : 0) +
                    (frame >= T.ch2 ? 1 : 0) +
                    (frame >= T.ch3 ? 1 : 0) +
                    (frame >= T.ch4 ? 1 : 0) +
                    (frame >= T.ch5 ? 1 : 0)
                  ) / 21 * 100}%`,
                }} />
              </div>
            </div>

            {/* Chapter pills */}
            <div style={{ padding: "16px 24px 28px" }}>
              <div style={{
                display: "flex", flexWrap: "wrap" as const,
                gap: 10,
              }}>
                {/* Pre-read chapters 1-2 */}
                {[1, 2].map(n => (
                  <div key={n} style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: PURPLE_LT,
                    border: `1.5px solid ${PURPLE}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: PURPLE,
                  }}>✓</div>
                ))}
                {/* Animated chapters 3-7 */}
                <ChapterPill filled={false} frame={frame} fillAt={T.ch1} />
                <ChapterPill filled={false} frame={frame} fillAt={T.ch2} />
                <ChapterPill filled={false} frame={frame} fillAt={T.ch3} />
                <ChapterPill filled={false} frame={frame} fillAt={T.ch4} />
                <ChapterPill filled={false} frame={frame} fillAt={T.ch5} />
                {/* Remaining chapters (unread) */}
                {Array.from({ length: 14 }, (_, i) => (
                  <div key={i + 8} style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: "rgba(106,61,170,0.05)",
                    border: `1.5px solid ${BORDER}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 500, color: TEXT_MUTED,
                  }}>{i + 8}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STATS CARD ─────────────────────────────────────────────────── */}
      {frame >= T.statsIn && frame < T.statsOut[1] && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: statsOp,
        }}>
          {/* Left label */}
          <div style={{
            position: "absolute", left: 120,
            opacity: fade(frame, T.statsIn + 25, T.statsIn + 55),
          }}>
            <div style={{
              fontSize: 17, fontWeight: 700, color: PURPLE,
              textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 14,
            }}>
              Your Progress
            </div>
            <div style={{
              fontSize: 46, fontWeight: 900, color: TEXT_PRI,
              lineHeight: 1.15, maxWidth: 380,
            }}>
              Watch your<br />knowledge grow
            </div>
          </div>

          {/* Stats card */}
          <div style={{
            width: 480, transform: `scale(${statsSc})`,
            background: CARD_BG, border: `1.5px solid ${BORDER}`,
            borderRadius: 24, overflow: "hidden",
            boxShadow: "0 24px 80px rgba(106,61,170,0.13), 0 4px 16px rgba(0,0,0,0.06)",
          }}>
            <div style={{
              background: PURPLE, padding: "18px 24px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 22 }}>📊</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
                Reading Progress
              </span>
            </div>

            <StatRow
              label="Chapters Read"
              value="892 / 1,189"
              icon="📖"
              opacity={fade(frame, T.stat1In, T.stat1In + 30)}
            />
            <StatRow
              label="Books Completed"
              value="47 of 66"
              icon="✅"
              opacity={fade(frame, T.stat2In, T.stat2In + 30)}
            />
            <div style={{
              display: "flex", alignItems: "center", gap: 20,
              padding: "18px 24px",
              opacity: fade(frame, T.stat3In, T.stat3In + 30),
            }}>
              <span style={{ fontSize: 32 }}>🔥</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 500, marginBottom: 2 }}>
                  Reading Streak
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: AMBER }}>
                  21 days in a row!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FEATURES + CTA ─────────────────────────────────────────────── */}
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
              Build a Reading Habit
            </div>
          </div>

          <div style={{ display: "flex", gap: 28 }}>
            <FeatCard
              emoji="📚"
              title="All 66 Books"
              sub="Old and New Testament — track every chapter of the complete NWT."
              opacity={f1op} scale={f1sc}
            />
            <FeatCard
              emoji="🔥"
              title="Reading Streaks"
              sub="Keep your daily streak alive and watch your consistency grow."
              opacity={f2op} scale={f2sc}
            />
            <FeatCard
              emoji="📤"
              title="Share Progress"
              sub="Generate a beautiful progress card to encourage friends and family."
              opacity={f3op} scale={f3sc}
            />
          </div>

          {frame >= T.ctaIn && (
            <div style={{
              marginTop: 64, opacity: ctaOp,
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 18,
            }}>
              <div style={{
                background: TEAL, borderRadius: 50,
                padding: "18px 58px",
                fontSize: 22, fontWeight: 800, color: "#fff",
                boxShadow: "0 8px 32px rgba(13,148,136,0.38)",
              }}>
                Start Tracking — jwstudy.org
              </div>
              <div style={{ fontSize: 16, color: TEXT_MUTED, fontWeight: 500 }}>
                Free · Sign up in seconds
              </div>
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
}
