/**
 * /share/[userId] — Public shareable progress card
 *
 * Server-rendered with Open Graph meta tags so sharing on WhatsApp,
 * Telegram, Facebook, or iMessage shows a rich preview card.
 *
 * Data is fetched server-side using the anon key (only public profiles).
 */

import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ClientShell from "../../_components/ClientShell";

export const revalidate = 300; // revalidate every 5 minutes

const BASE = "https://jwstudy.org";
const TOTAL_CHAPTERS = 1189; // NWT total

const LEVEL_EMOJIS: Record<number, string> = {
  1: "📖", 2: "📚", 3: "🌱", 4: "👨‍👩‍👦", 5: "🏺", 6: "⚔️",
  7: "🎵", 8: "📯", 9: "🕊️", 10: "🌍", 11: "🔮", 12: "👑",
};

async function getUserShareData(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, top_badge_level, created_at")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  // Count chapters read
  const { count: chaptersRead } = await supabase
    .from("chapter_reads")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Get current streak
  const { data: streakData } = await supabase.rpc("get_reading_streaks", { p_user_id: userId });

  // Get earned badges (levels with badge_earned = true)
  const { data: badgeRows } = await supabase
    .from("user_quiz_progress")
    .select("level")
    .eq("user_id", userId)
    .eq("badge_earned", true)
    .order("level");

  return {
    display_name: profile.display_name ?? "A JW Study Member",
    avatar_url: profile.avatar_url ?? null,
    top_badge_level: profile.top_badge_level ?? 0,
    chapters_read: chaptersRead ?? 0,
    current_streak: (streakData as any)?.current_streak ?? 0,
    badges: (badgeRows ?? []).map((b: { level: number }) => b.level),
    joined: profile.created_at,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const data = await getUserShareData(userId);
  if (!data) return {};

  const pct = Math.round((data.chapters_read / TOTAL_CHAPTERS) * 100);
  const topBadge = LEVEL_EMOJIS[data.top_badge_level] ?? "";
  const title = `${data.display_name}'s Bible Reading Progress ${topBadge}`;
  const description = `${pct}% of the Bible read · ${data.chapters_read} chapters · ${data.current_streak}-day streak. Join me on JW Study!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `${BASE}/share/${userId}`,
      images: [{ url: `${BASE}/og-image.jpg`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: { canonical: `${BASE}/share/${userId}` },
  };
}

export default async function SharePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const data = await getUserShareData(userId);
  if (!data) notFound();

  const pct = Math.round((data.chapters_read / TOTAL_CHAPTERS) * 100);
  const memberSince = new Date(data.joined).getFullYear();

  return (
    <>
      {/* SSR content for crawlers / link preview fallback */}
      <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
        <h1>{data.display_name}&apos;s Bible Reading Progress</h1>
        <p>{pct}% of the Bible read — {data.chapters_read} of {TOTAL_CHAPTERS} chapters</p>
        {data.current_streak > 0 && <p>{data.current_streak}-day reading streak</p>}
        {data.badges.length > 0 && (
          <p>Quiz badges earned: {data.badges.map(l => `Level ${l}`).join(", ")}</p>
        )}
        <p>Member since {memberSince}. Join at jwstudy.org</p>
      </div>

      {/* Visible share card — shown before the SPA hydrates */}
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #5c3d99 0%, #7c5cbf 50%, #4a2d80 100%)",
        padding: "24px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <div style={{
          background: "white", borderRadius: 20, padding: "32px 28px",
          maxWidth: 440, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
          textAlign: "center",
        }}>
          {/* Avatar */}
          <div style={{ marginBottom: 16 }}>
            {data.avatar_url ? (
              <img
                src={data.avatar_url}
                alt={data.display_name}
                width={72} height={72}
                style={{ borderRadius: "50%", border: "3px solid #7c5cbf", objectFit: "cover" }}
              />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, #7c5cbf, #5c3d99)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, color: "white", fontWeight: 700, margin: "0 auto",
              }}>
                {data.display_name[0].toUpperCase()}
              </div>
            )}
          </div>

          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>
            {data.display_name}
            {data.top_badge_level > 0 && (
              <span style={{ marginLeft: 8 }}>{LEVEL_EMOJIS[data.top_badge_level]}</span>
            )}
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 13, color: "#888" }}>
            📖 JW Study member since {memberSince}
          </p>

          {/* Progress bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Bible progress</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#7c5cbf" }}>{pct}%</span>
            </div>
            <div style={{ height: 10, background: "#ede8f7", borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: "linear-gradient(90deg, #7c5cbf, #5c3d99)",
                borderRadius: 999,
              }} />
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#888" }}>
              {data.chapters_read.toLocaleString()} of {TOTAL_CHAPTERS.toLocaleString()} chapters
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <div style={{
              flex: 1, background: "#f5f0ff", borderRadius: 12, padding: "12px 8px",
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#5c3d99" }}>
                {data.current_streak}
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>day streak 🔥</div>
            </div>
            <div style={{
              flex: 1, background: "#f5f0ff", borderRadius: 12, padding: "12px 8px",
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#5c3d99" }}>
                {data.badges.length}
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>quiz badges 🏅</div>
            </div>
            <div style={{
              flex: 1, background: "#f5f0ff", borderRadius: 12, padding: "12px 8px",
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#5c3d99" }}>
                {data.chapters_read}
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>chapters 📖</div>
            </div>
          </div>

          {/* Badge row */}
          {data.badges.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: "#888", margin: "0 0 8px" }}>Quiz badges earned</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {data.badges.map(level => (
                  <span key={level} style={{
                    fontSize: 20, background: "#f5f0ff", borderRadius: 8, padding: "4px 8px",
                  }} title={`Level ${level}`}>
                    {LEVEL_EMOJIS[level] ?? "🏅"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <a
            href={BASE}
            style={{
              display: "block", background: "linear-gradient(135deg, #7c5cbf, #5c3d99)",
              color: "white", borderRadius: 12, padding: "14px 24px",
              fontWeight: 700, fontSize: 15, textDecoration: "none",
            }}
          >
            Start your Bible reading journey →
          </a>
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "#bbb" }}>jwstudy.org</p>
        </div>
      </div>

      {/* Load SPA in background — user can log in from the share card */}
      <ClientShell />
    </>
  );
}
