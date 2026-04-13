/**
 * Remotion composition — Animated Bible Reading Progress Card
 * 9:16 portrait (1080×1920) @ 30fps, 5 seconds
 *
 * Sections animate in sequence:
 *  0–15f  → brand fade in
 * 15–45f  → name + avatar pop
 * 45–75f  → percentage counter
 * 75–105f → progress bar fill
 * 105–135f→ stat cards
 * 135–150f→ CTA
 */

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

export interface ProgressVideoProps {
  displayName: string;
  avatarInitial: string;
  avatarUrl?: string | null;
  chaptersRead: number;
  totalChapters: number;
  currentStreak: number;
  badgeCount: number;
  topBadgeEmoji: string;
  pct: number; // 0–100
}

const W = 1080;
const H = 1920;

function useSpring(frame: number, startFrame: number, fps: number, delay = 0) {
  return spring({
    frame: frame - startFrame - delay,
    fps,
    config: { damping: 14, stiffness: 120, mass: 1 },
    from: 0,
    to: 1,
  });
}

function useFade(frame: number, startFrame: number, endFrame: number) {
  return interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });
}

export default function ProgressVideo({
  displayName,
  avatarInitial,
  avatarUrl,
  chaptersRead,
  totalChapters,
  currentStreak,
  badgeCount,
  topBadgeEmoji,
  pct,
}: ProgressVideoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation values
  const brandFade    = useFade(frame, 0, 15);
  const nameScale    = useSpring(frame, 15, fps);
  const nameFade     = useFade(frame, 15, 35);
  const pctFade      = useFade(frame, 45, 60);
  const barProgress  = interpolate(frame, [75, 115], [0, pct / 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const statsScale   = useSpring(frame, 105, fps);
  const statsFade    = useFade(frame, 105, 125);
  const ctaFade      = useFade(frame, 135, 150);

  // Animated chapter counter
  const pctDisplay   = Math.round(interpolate(frame, [45, 90], [0, pct], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  const barW = (W - 120) * barProgress;

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(160deg, #120829 0%, #341C5C 55%, #6A3DAA 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflow: "hidden",
    }}>
      {/* Background blobs */}
      <div style={{
        position: "absolute", top: -200, right: -200,
        width: 700, height: 700, borderRadius: "50%",
        background: "rgba(192, 132, 252, 0.07)",
      }} />
      <div style={{
        position: "absolute", bottom: -300, left: -200,
        width: 800, height: 800, borderRadius: "50%",
        background: "rgba(106, 61, 170, 0.12)",
      }} />

      {/* Brand header */}
      <div style={{
        position: "absolute", top: 120, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 20,
        opacity: brandFade,
      }}>
        <span style={{ fontSize: 52 }}>📖</span>
        <span style={{ fontSize: 44, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: -1 }}>
          JW Study
        </span>
      </div>

      {/* Avatar + Name */}
      <div style={{
        position: "absolute", top: 280, left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 28,
        opacity: nameFade,
        transform: `scale(${interpolate(nameScale, [0, 1], [0.7, 1])})`,
      }}>
        {/* Avatar */}
        <div style={{
          width: 180, height: 180, borderRadius: "50%",
          border: "6px solid rgba(192,132,252,0.6)",
          background: "linear-gradient(135deg, #7c5cbf, #5c3d99)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 72, fontWeight: 700, color: "white",
          overflow: "hidden",
        }}>
          {avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : avatarInitial
          }
        </div>

        {/* Name */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: "white", lineHeight: 1.1 }}>
            {displayName}
            {topBadgeEmoji && <span style={{ marginLeft: 12 }}>{topBadgeEmoji}</span>}
          </div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.45)", marginTop: 10 }}>
            Bible Reading Progress
          </div>
        </div>
      </div>

      {/* Big percentage */}
      <div style={{
        position: "absolute", top: 680, left: 0, right: 0,
        textAlign: "center", opacity: pctFade,
      }}>
        <div style={{
          fontSize: 220, fontWeight: 900, lineHeight: 1,
          color: "#C084FC",
          textShadow: "0 0 80px rgba(192,132,252,0.4)",
        }}>
          {pctDisplay}%
        </div>
        <div style={{ fontSize: 36, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
          of the Bible read
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position: "absolute", top: 1010, left: 60, right: 60 }}>
        {/* Track */}
        <div style={{
          height: 18, background: "rgba(255,255,255,0.1)",
          borderRadius: 999, overflow: "hidden",
        }}>
          {/* Fill */}
          <div style={{
            height: "100%", width: barW,
            background: "linear-gradient(90deg, #9B59B6, #C084FC)",
            borderRadius: 999,
            transition: "width 0.016s linear",
          }} />
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between",
          marginTop: 16, fontSize: 28, color: "rgba(255,255,255,0.4)",
        }}>
          <span>{chaptersRead.toLocaleString()} chapters</span>
          <span>of {totalChapters.toLocaleString()}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{
        position: "absolute", top: 1160, left: 60, right: 60,
        display: "flex", gap: 32,
        opacity: statsFade,
        transform: `translateY(${interpolate(statsScale, [0, 1], [40, 0])}px)`,
      }}>
        {[
          { label: "Day streak", value: currentStreak.toString(), icon: "🔥" },
          { label: "Quiz badges", value: badgeCount.toString(), icon: "🏅" },
          { label: "Chapters", value: chaptersRead.toLocaleString(), icon: "📖" },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{
            flex: 1, background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.13)",
            borderRadius: 28, padding: "36px 20px", textAlign: "center",
          }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{icon}</div>
            <div style={{ fontSize: 60, fontWeight: 900, color: "white", lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 24, color: "rgba(255,255,255,0.45)", marginTop: 10 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Streak banner */}
      {currentStreak > 0 && (
        <div style={{
          position: "absolute", top: 1520, left: 60, right: 60,
          background: "rgba(234,88,12,0.15)",
          border: "1.5px solid rgba(234,88,12,0.35)",
          borderRadius: 20, padding: "24px 40px",
          textAlign: "center",
          opacity: statsFade,
        }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: "#fb923c" }}>
            🔥 {currentStreak}-day reading streak!
          </span>
        </div>
      )}

      {/* CTA */}
      <div style={{
        position: "absolute", bottom: 120, left: 0, right: 0,
        textAlign: "center", opacity: ctaFade,
      }}>
        <div style={{
          display: "inline-block",
          background: "linear-gradient(135deg, #7c5cbf, #5c3d99)",
          borderRadius: 24, padding: "28px 80px",
          fontSize: 36, fontWeight: 700, color: "white",
          letterSpacing: 0.5,
        }}>
          Join me at jwstudy.org
        </div>
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.28)", marginTop: 20 }}>
          Free Bible reading tracker for Jehovah's Witnesses
        </div>
      </div>
    </AbsoluteFill>
  );
}
