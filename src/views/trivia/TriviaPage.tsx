/**
 * Bible Trivia Battle Room — Dev preview
 * Single unified room: all players see same state.
 * Teams: A = var(--teal) purple, B = amber #d97706
 * Uses app CSS variables for light/dark mode compatibility.
 */

import React, { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import type { TriviaRoom, TriviaPlayer, TeamId } from "../../lib/trivia/types";
import { useRoom } from "./useRoom";
import { useGame } from "./useGame";
import { useFriends } from "../../hooks/useFriends";
import type { FriendProfile } from "../../hooks/useFriends";

// ── Helpers ────────────────────────────────────────────────────────────────

function teamHex(team: TeamId) {
  return team === "A" ? "#7c3aed" : "#d97706";
}
function teamName(team: TeamId) {
  return team === "A" ? "Team Alpha" : "Team Omega";
}

// ── Confetti ──────────────────────────────────────────────────────────────

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: Math.random() * 8 + 4,
      d: Math.random() * 80,
      color: ["#7c3aed", "#d97706", "#10b981", "#ec4899", "#60a5fa"][Math.floor(Math.random() * 5)],
      tiltAngle: 0,
      tiltSpeed: Math.random() * 0.1 + 0.05,
    }));
    let angle = 0;
    let frame: number;
    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      angle += 0.01;
      pieces.forEach((p) => {
        p.tiltAngle += p.tiltSpeed;
        p.y += (Math.cos(angle + p.d) + 2) * 1.5;
        p.x += Math.sin(angle) * 0.5;
        const tilt = Math.sin(p.tiltAngle) * 12;
        if (p.y > canvas!.height) { p.y = -10; p.x = Math.random() * canvas!.width; }
        ctx!.beginPath();
        ctx!.lineWidth = p.r / 2;
        ctx!.strokeStyle = p.color;
        ctx!.moveTo(p.x + tilt + p.r / 4, p.y);
        ctx!.lineTo(p.x + tilt, p.y + tilt + p.r / 4);
        ctx!.stroke();
      });
      frame = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 50 }} />;
}

// ── Option Button ─────────────────────────────────────────────────────────

type OptionState = "idle" | "selected" | "correct" | "wrong";

function OptionButton({
  label, index, onClick, state, disabled,
}: {
  label: string; index: number; onClick: () => void;
  state: OptionState; disabled: boolean;
}) {
  const letters = ["A", "B", "C", "D"];

  const stateStyles: Record<OptionState, { bg: string; border: string; color: string; badge: string }> = {
    idle: {
      bg: "var(--card-bg)",
      border: "var(--border)",
      color: "var(--text-primary)",
      badge: "rgba(124,58,237,0.12)",
    },
    selected: {
      bg: "rgba(217,119,6,0.08)",
      border: "#d97706",
      color: "var(--text-primary)",
      badge: "#d97706",
    },
    correct: {
      bg: "rgba(16,185,129,0.10)",
      border: "#10b981",
      color: "#065f46",
      badge: "#10b981",
    },
    wrong: {
      bg: "rgba(239,68,68,0.08)",
      border: "#ef4444",
      color: "#991b1b",
      badge: "#ef4444",
    },
  };

  const s = stateStyles[state];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="trivia-opt-btn"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "12px 16px",
        borderRadius: 12,
        border: `2px solid ${s.border}`,
        background: s.bg,
        color: s.color,
        fontFamily: "Chakra Petch, sans-serif",
        fontWeight: 600,
        fontSize: 15,
        textAlign: "left",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled && state === "idle" ? 0.55 : 1,
        transition: "all 0.2s ease",
      }}
    >
      <span
        style={{
          minWidth: 28,
          height: 28,
          borderRadius: 8,
          background: s.badge,
          color: state === "idle" ? "var(--teal)" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {letters[index]}
      </span>
      {label}
    </button>
  );
}

// ── Score Bar ─────────────────────────────────────────────────────────────

function ScoreBar({ teamAScore, teamBScore, questionCount, currentIndex }: {
  teamAScore: number; teamBScore: number; questionCount: number; currentIndex: number;
}) {
  const progress = questionCount > 0 ? Math.min((currentIndex / questionCount) * 100, 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontFamily: "Russo One, sans-serif", fontSize: 22, color: "var(--teal)", fontWeight: 900 }}>
          {teamAScore}
        </span>
        <span style={{ fontSize: 10, color: "var(--teal)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Alpha
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "Chakra Petch, sans-serif" }}>
          Q {Math.min(currentIndex + 1, questionCount)} / {questionCount}
        </span>
        <div style={{ width: "100%", height: 5, borderRadius: 4, background: "var(--border)" }}>
          <div style={{ height: "100%", borderRadius: 4, width: `${progress}%`, background: "linear-gradient(90deg, var(--teal), #d97706)", transition: "width 0.5s ease" }} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, color: "#d97706", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Omega
        </span>
        <span style={{ fontFamily: "Russo One, sans-serif", fontSize: 22, color: "#d97706", fontWeight: 900 }}>
          {teamBScore}
        </span>
      </div>
    </div>
  );
}

// ── Timer Ring ────────────────────────────────────────────────────────────

function TimerRing({ seconds, total, onExpire }: { seconds: number; total: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(seconds);
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(timerRef.current!); onExpire(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [seconds, total]);

  const pct = remaining / total;
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color = remaining > total * 0.5 ? "#10b981" : remaining > total * 0.25 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle
          cx="30" cy="30" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s linear, stroke 0.3s" }}
        />
      </svg>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Russo One, sans-serif", fontSize: 15, fontWeight: 900, color }}>
        {remaining}
      </span>
    </div>
  );
}

// ── Player Chip (small) ───────────────────────────────────────────────────

function PlayerChip({ player, active }: { player: TriviaPlayer; active?: boolean }) {
  const hex = teamHex(player.team);
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderRadius: 10,
      border: `1px solid ${active ? hex : "var(--border)"}`,
      background: active ? `${hex}1a` : "var(--card-bg)",
      transition: "all 0.2s",
    }}>
      {player.avatar_url ? (
        <img src={player.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: hex, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {player.display_name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "Chakra Petch, sans-serif", lineHeight: 1.2 }}>
          {player.display_name}
        </div>
        {player.is_host && (
          <div style={{ fontSize: 9, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.1em" }}>HOST</div>
        )}
      </div>
    </div>
  );
}

// ── Team Panel (for unified game view) ───────────────────────────────────

function TeamPanel({ team, players, isActive, score }: {
  team: TeamId; players: TriviaPlayer[]; isActive: boolean; score: number;
}) {
  const hex = teamHex(team);
  return (
    <div style={{
      padding: "16px 12px",
      borderRadius: 14,
      border: `2px solid ${isActive ? hex : "var(--border)"}`,
      background: isActive ? `${hex}12` : "var(--card-bg)",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      transition: "all 0.3s",
      boxShadow: isActive ? `0 0 32px ${hex}30, 0 2px 8px ${hex}18` : "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: hex, fontFamily: "Russo One, sans-serif" }}>
            {teamName(team)}
          </div>
          {isActive && (
            <div style={{ fontSize: 10, color: hex, opacity: 0.7, fontFamily: "Chakra Petch, sans-serif" }}>
              ● Active
            </div>
          )}
        </div>
        <span style={{ fontFamily: "Russo One, sans-serif", fontSize: 28, fontWeight: 900, color: hex }}>
          {score}
        </span>
      </div>
      {players.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>No players yet</p>
      ) : (
        players.map((p) => <PlayerChip key={p.id} player={p} active={isActive} />)
      )}
    </div>
  );
}

// ── HOME VIEW ─────────────────────────────────────────────────────────────

const TIME_OPTIONS = [15, 30, 45, 60];

function HomeView({ user, onRoomJoined, prefillCode }: {
  user: User | null;
  onRoomJoined: (room: TriviaRoom, player: TriviaPlayer) => void;
  prefillCode?: string;
}) {
  const [mode, setMode] = useState<"pick" | "create" | "join">("pick");
  const [displayName, setDisplayName] = useState("");
  const [team, setTeam] = useState<TeamId>("A");
  const [roomCode, setRoomCode] = useState("");
  const [teamSize, setTeamSize] = useState(1); // players per team (1=1v1, 2=2v2, ...)
  const [hasTimer, setHasTimer] = useState(true);
  const [timeLimit, setTimeLimit] = useState(30);
  const [customTime, setCustomTime] = useState("");
  const [pointsToWin, setPointsToWin] = useState<number>(0); // 0 = play all questions
  const [customPoints, setCustomPoints] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invitedFriendIds, setInvitedFriendIds] = useState<string[]>([]);
  const { data: allFriends = [] } = useFriends(user?.id ?? "");
  const ONLINE_MS = 10 * 60 * 1000;
  const onlineFriends: FriendProfile[] = allFriends.filter(
    (f) => f.last_active_at != null && Date.now() - new Date(f.last_active_at).getTime() < ONLINE_MS
  );

  function toggleFriend(id: string) {
    setInvitedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  useEffect(() => {
    if (!user?.id) return;
    import("../../lib/supabase").then(({ supabase }) => {
      supabase.from("profiles").select("display_name").eq("id", user.id).single()
        .then(({ data }) => { if (data?.display_name) setDisplayName(data.display_name); });
    });
  }, [user?.id]);

  useEffect(() => {
    if (prefillCode) {
      setMode("join");
      setRoomCode(prefillCode);
    }
  }, [prefillCode]);

  const effectiveTime = hasTimer ? (customTime ? parseInt(customTime, 10) || 30 : timeLimit) : 60;

  async function handleCreate() {
    setLoading(true); setError("");
    const { supabase } = await import("../../lib/supabase");
    const { data: { session } } = await supabase.auth.getSession();
    const authHeader = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    const res = await fetch("/api/trivia/create-room", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({
        display_name: displayName || "Player",
        team,
        user_id: user?.id ?? null,
        avatar_url: user?.user_metadata?.avatar_url ?? null,
        question_count: 10,
        time_limit_seconds: effectiveTime,
        player_count: teamSize * 2,
        has_timer: hasTimer,
        points_to_win: pointsToWin,
        invited_friend_ids: invitedFriendIds,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed to create room"); return; }
    onRoomJoined(data.room, data.player);
  }

  async function handleJoin() {
    if (!roomCode.trim()) { setError("Enter a room code"); return; }
    setLoading(true); setError("");
    const { supabase } = await import("../../lib/supabase");
    const { data: { session } } = await supabase.auth.getSession();
    const authHeader = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    const res = await fetch("/api/trivia/join-room", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({
        room_code: roomCode.trim().toUpperCase(),
        display_name: displayName || "Player",
        team,
        user_id: user?.id ?? null,
        avatar_url: user?.user_metadata?.avatar_url ?? null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed to join room"); return; }
    onRoomJoined(data.room, data.player);
  }

  const accentStyle = {
    background: "var(--teal)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "13px 0",
    width: "100%",
    fontFamily: "Russo One, sans-serif",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
    transition: "opacity 0.15s",
  } as const;

  const outlineStyle = {
    background: "transparent",
    color: "var(--teal)",
    border: "2px solid var(--teal)",
    borderRadius: 10,
    padding: "13px 0",
    width: "100%",
    fontFamily: "Russo One, sans-serif",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
    transition: "opacity 0.15s",
  } as const;

  return (
    <div style={{ minHeight: "100vh", background: "var(--trivia-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "Chakra Petch, sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Russo One, sans-serif", fontSize: "clamp(36px, 8vw, 56px)", fontWeight: 900, lineHeight: 1.05, color: "var(--text-primary)" }}>
          Bible Trivia
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", marginTop: 6 }}>
          Battle Room · Team vs. Team
        </p>
      </div>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 420, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 18, padding: 28, boxShadow: "var(--shadow-md)" }}>

        {mode === "pick" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button style={accentStyle} onClick={() => setMode("create")}>Create Room</button>
            <button style={outlineStyle} onClick={() => setMode("join")}>Join Room</button>
          </div>
        )}

        {(mode === "create" || mode === "join") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <button
              onClick={() => { setMode("pick"); setError(""); }}
              style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.12em", padding: 0 }}
            >
              ← Back
            </button>

            {/* Playing as */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                {(displayName || "?").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 2 }}>Playing as</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{displayName || "Loading…"}</div>
              </div>
            </div>

            {/* Room code — join only */}
            {mode === "join" && (
              <div>
                <label style={{ display: "block", fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  maxLength={6}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 10,
                    border: "2px solid #d97706", background: "var(--bg)",
                    color: "var(--text-primary)", fontSize: 24, fontFamily: "Russo One, sans-serif",
                    textAlign: "center", letterSpacing: "0.3em", textTransform: "uppercase", outline: "none",
                  }}
                />
              </div>
            )}

            {/* Team size — create only */}
            {mode === "create" && (
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Team Size</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => setTeamSize(n)}
                      style={{
                        padding: "10px 0",
                        borderRadius: 8,
                        border: `2px solid ${teamSize === n ? "var(--teal)" : "var(--border)"}`,
                        background: teamSize === n ? "var(--active-bg)" : "var(--bg)",
                        color: teamSize === n ? "var(--teal)" : "var(--text-muted)",
                        fontFamily: "Russo One, sans-serif",
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {n}v{n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Timer options — create only */}
            {mode === "create" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Timer</span>
                  <button
                    onClick={() => setHasTimer((v) => !v)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      border: `1px solid ${hasTimer ? "var(--teal)" : "var(--border)"}`,
                      background: hasTimer ? "var(--active-bg)" : "var(--bg)",
                      color: hasTimer ? "var(--teal)" : "var(--text-muted)",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "Chakra Petch, sans-serif",
                    }}
                  >
                    {hasTimer ? "ON" : "OFF"}
                  </button>
                </div>

                {hasTimer && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {TIME_OPTIONS.map((t) => (
                      <button
                        key={t}
                        onClick={() => { setTimeLimit(t); setCustomTime(""); }}
                        style={{
                          padding: "7px 12px",
                          borderRadius: 8,
                          border: `2px solid ${timeLimit === t && !customTime ? "var(--teal)" : "var(--border)"}`,
                          background: timeLimit === t && !customTime ? "var(--active-bg)" : "var(--bg)",
                          color: timeLimit === t && !customTime ? "var(--teal)" : "var(--text-muted)",
                          fontFamily: "Chakra Petch, sans-serif",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {t}s
                      </button>
                    ))}
                    <input
                      type="number"
                      min={5}
                      max={300}
                      placeholder="Custom"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="trivia-custom-time"
                      style={{
                        flex: 1, minWidth: 76, padding: "7px 10px", borderRadius: 8,
                        border: `2px solid ${customTime ? "var(--teal)" : "var(--border)"}`,
                        background: customTime ? "var(--active-bg)" : "var(--bg)",
                        color: customTime ? "var(--teal)" : "var(--text-muted)",
                        fontSize: 13, fontFamily: "Chakra Petch, sans-serif",
                        fontWeight: 700, outline: "none",
                        transition: "all 0.15s",
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Points to Win — create only */}
            {mode === "create" && (
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Points to Win</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[0, 10, 15, 20, 25].map((n) => (
                    <button
                      key={n}
                      onClick={() => { setPointsToWin(n); setCustomPoints(""); }}
                      style={{
                        padding: "7px 13px",
                        borderRadius: 8,
                        border: `2px solid ${pointsToWin === n && !customPoints ? "var(--teal)" : "var(--border)"}`,
                        background: pointsToWin === n && !customPoints ? "var(--active-bg)" : "var(--bg)",
                        color: pointsToWin === n && !customPoints ? "var(--teal)" : "var(--text-muted)",
                        fontFamily: "Chakra Petch, sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {n === 0 ? "None" : `${n}`}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={999}
                    placeholder="Custom"
                    value={customPoints}
                    onChange={(e) => { setCustomPoints(e.target.value); setPointsToWin(parseInt(e.target.value, 10) || 0); }}
                    className="trivia-custom-time"
                    style={{
                      flex: 1, minWidth: 76, padding: "7px 10px", borderRadius: 8,
                      border: `2px solid ${customPoints ? "var(--teal)" : "var(--border)"}`,
                      background: customPoints ? "var(--active-bg)" : "var(--bg)",
                      color: customPoints ? "var(--teal)" : "var(--text-muted)",
                      fontSize: 13, fontFamily: "Chakra Petch, sans-serif",
                      fontWeight: 700, outline: "none", transition: "all 0.15s",
                    }}
                  />
                </div>
                {pointsToWin > 0 && (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, fontFamily: "Chakra Petch, sans-serif" }}>
                    First team to {pointsToWin} correct answers wins
                  </p>
                )}
              </div>
            )}

            {/* Online Friends Picker — create only */}
            {mode === "create" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    Invite Online Friends
                  </span>
                  {invitedFriendIds.length > 0 && (
                    <span style={{ background: "var(--teal)", color: "#fff", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>
                      {invitedFriendIds.length}
                    </span>
                  )}
                </div>
                {onlineFriends.length === 0 ? (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>No friends online right now</p>
                ) : (
                  <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                    {onlineFriends.map((f) => {
                      const selected = invitedFriendIds.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          onClick={() => toggleFriend(f.id)}
                          style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", minWidth: 44, padding: 0 }}
                          aria-pressed={selected}
                          aria-label={`Invite ${f.display_name ?? "friend"}`}
                        >
                          <div style={{ position: "relative", width: 44, height: 44 }}>
                            {f.avatar_url ? (
                              <img
                                src={f.avatar_url}
                                alt={f.display_name ?? ""}
                                style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: selected ? "2.5px solid var(--teal)" : "2.5px solid var(--border)" }}
                              />
                            ) : (
                              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--card-bg)", border: selected ? "2.5px solid var(--teal)" : "2.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "var(--text-muted)", fontWeight: 700 }}>
                                {(f.display_name ?? "?")[0].toUpperCase()}
                              </div>
                            )}
                            {selected && (
                              <div style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 16, borderRadius: "50%", background: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: 10, color: "var(--text)", maxWidth: 48, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.display_name ?? "Friend"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Team picker */}
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Choose Team</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["A", "B"] as TeamId[]).map((t) => {
                  const hex = teamHex(t);
                  const selected = team === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTeam(t)}
                      style={{
                        padding: "13px 0",
                        borderRadius: 10,
                        border: `2px solid ${selected ? hex : "var(--border)"}`,
                        background: selected ? `${hex}14` : "var(--bg)",
                        color: selected ? hex : "var(--text-muted)",
                        fontFamily: "Russo One, sans-serif",
                        fontSize: 14,
                        fontWeight: 900,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {t === "A" ? "Alpha" : "Omega"}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2", color: "#991b1b", fontSize: 13 }}>
                {error}
              </div>
            )}

            <button
              onClick={mode === "create" ? handleCreate : handleJoin}
              disabled={loading}
              style={{ ...accentStyle, background: mode === "create" ? "var(--teal)" : "#d97706", opacity: loading ? 0.5 : 1 }}
            >
              {loading ? "…" : mode === "create" ? "Create Room" : "Join Room"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── LOBBY VIEW ────────────────────────────────────────────────────────────

function LobbyView({ room, players, myPlayer, onStart, onRefresh, onExit }: {
  room: TriviaRoom; players: TriviaPlayer[]; myPlayer: TriviaPlayer;
  onStart: () => void; onRefresh: () => Promise<void>; onExit: () => void;
}) {
  const [starting, setStarting] = useState(false);
  const teamA = players.filter((p) => p.team === "A");
  const teamB = players.filter((p) => p.team === "B");
  const roomFull = players.length >= room.player_count;

  // Everyone polls — host needs to see players joining, non-host needs to see game start
  useEffect(() => {
    const id = setInterval(onRefresh, 3000);
    return () => clearInterval(id);
  }, [onRefresh]);

  async function handleStart() {
    setStarting(true);
    await onStart();
    setStarting(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--trivia-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "Chakra Petch, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* Exit */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            onClick={onExit}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Chakra Petch, sans-serif" }}
          >
            ✕ Leave Room
          </button>
        </div>

        {/* Room code */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>Room Code</p>
          <div style={{ display: "inline-block", padding: "10px 28px", borderRadius: 14, border: "2px solid var(--teal)", background: "var(--active-bg)", fontFamily: "Russo One, sans-serif", fontSize: 32, fontWeight: 900, letterSpacing: "0.2em", color: "var(--teal)" }}>
            {room.room_code}
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 6 }}>Share this code to invite players</p>
        </div>

        {/* Teams */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          {(["A", "B"] as TeamId[]).map((t) => {
            const hex = teamHex(t);
            const members = t === "A" ? teamA : teamB;
            return (
              <div key={t} style={{ padding: "14px", borderRadius: 14, border: `1px solid ${hex}44`, background: `${hex}08` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: hex, boxShadow: `0 0 6px ${hex}` }} />
                  <span style={{ fontFamily: "Russo One, sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: hex }}>
                    {teamName(t)}
                  </span>
                  <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 12 }}>{members.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 50 }}>
                  {members.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: 12, fontStyle: "italic" }}>Waiting…</p>
                  ) : (
                    members.map((p) => <PlayerChip key={p.id} player={p} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 16, fontSize: 12, color: "var(--text-muted)" }}>
          <span>{room.question_count} questions</span>
          <span>·</span>
          <span>{room.has_timer ? `${room.time_limit_seconds}s timer` : "No timer"}</span>
          {room.points_to_win > 0 && <><span>·</span><span>First to {room.points_to_win} pts</span></>}
          <span>·</span>
          <span>{players.length}/{room.player_count} players</span>
        </div>

        {myPlayer.is_host ? (
          <>
            {!roomFull ? (
              <div style={{ textAlign: "center", padding: "14px", borderRadius: 12, border: "1px solid rgba(167, 139, 250, 0.4)", background: "rgba(124, 58, 237, 0.12)", color: "#c4b5fd", fontSize: 13, fontWeight: 600, fontFamily: "Chakra Petch, sans-serif" }}>
                Waiting for {room.player_count - players.length} more player{room.player_count - players.length !== 1 ? "s" : ""} to join via code
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            ) : (
              <button
                onClick={handleStart}
                disabled={starting}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
                  background: "var(--teal)", color: "#fff",
                  fontFamily: "Russo One, sans-serif", fontSize: 18, fontWeight: 900,
                  cursor: starting ? "not-allowed" : "pointer",
                  opacity: starting ? 0.6 : 1,
                  boxShadow: "0 0 20px rgba(124,58,237,0.3)",
                  transition: "all 0.2s",
                }}
              >
                {starting ? "Starting…" : "Start Battle!"}
              </button>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "16px", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-muted)", fontSize: 14 }}>
            Waiting for host to start…
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--teal)", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── GAME VIEW ─────────────────────────────────────────────────────────────

function GameView({
  room, players, myPlayer, currentQuestion, onGameEnd, onRefresh, onExit,
}: {
  room: TriviaRoom;
  players: TriviaPlayer[];
  myPlayer: TriviaPlayer;
  currentQuestion: import("../../lib/trivia/types").ActiveQuestion | null;
  onGameEnd: () => void;
  onRefresh: () => Promise<void>;
  onExit: () => void;
}) {
  const { submitting, nextQuestion } = useGame();
  const [localSelectedIndex, setLocalSelectedIndex] = useState<number | null>(null);
  const [timerKey, setTimerKey] = useState(0);

  const teamA = players.filter((p) => p.team === "A");
  const teamB = players.filter((p) => p.team === "B");
  const isMyTurn = room.current_team === myPlayer.team;
  const questionIds: string[] = room.selected_question_ids ?? [];
  const totalQ = questionIds.length;

  // Poll every 3s for everyone — detects pending_next, score changes, question advances
  useEffect(() => {
    const id = setInterval(onRefresh, 3000);
    return () => clearInterval(id);
  }, [onRefresh]);

  // Reset local state when question changes
  useEffect(() => {
    setLocalSelectedIndex(null);
    setTimerKey((k) => k + 1);
  }, [room.current_question_index]);

  // Reset local state when pending_next is cleared (question advanced)
  useEffect(() => {
    if (!room.pending_next) setLocalSelectedIndex(null);
  }, [room.pending_next]);

  // Game over
  useEffect(() => {
    if (room.status === "finished") onGameEnd();
  }, [room.status]);

  async function handleAnswer(idx: number) {
    if (localSelectedIndex !== null || submitting || !isMyTurn || room.pending_next) return;
    setLocalSelectedIndex(idx);
    const { supabase } = await import("../../lib/supabase");
    const { data: { session } } = await supabase.auth.getSession();
    const authHeader = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    await fetch("/api/trivia/submit-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ room_id: room.id, player_id: myPlayer.id, answer_index: idx }),
    });
    await onRefresh();
  }

  async function handleTimeExpire() {
    if (room.pending_next || localSelectedIndex !== null || !isMyTurn) return;
    setLocalSelectedIndex(-2); // sentinel: "timed out"
    const { supabase } = await import("../../lib/supabase");
    const { data: { session } } = await supabase.auth.getSession();
    const authHeader = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
    await fetch("/api/trivia/submit-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ room_id: room.id, player_id: myPlayer.id, answer_index: -1 }),
    });
    await onRefresh();
  }

  async function handleNext() {
    await nextQuestion(room.id, myPlayer.id);
    await onRefresh();
  }

  function getOptionState(idx: number): OptionState {
    if (room.pending_next && currentQuestion) {
      if (idx === currentQuestion.correct_index) return "correct";
      if (idx === room.last_answer_index && room.last_answer_index !== currentQuestion.correct_index) return "wrong";
      return "idle";
    }
    if (localSelectedIndex !== null && idx === localSelectedIndex) return "selected";
    return "idle";
  }

  const canAdvance = myPlayer.is_host && room.pending_next;
  const showTimer = room.has_timer && isMyTurn && !room.pending_next && currentQuestion !== null;

  const answerWasCorrect =
    room.pending_next && currentQuestion &&
    room.last_answer_index !== null &&
    room.last_answer_index === currentQuestion.correct_index;

  return (
    <div style={{ minHeight: "100vh", background: "var(--trivia-bg)", fontFamily: "Chakra Petch, sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "var(--card-bg)", borderBottom: "1px solid var(--border)", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button
          onClick={onExit}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          ✕ Exit
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Russo One, sans-serif", fontSize: 15, fontWeight: 900, color: "var(--text-primary)" }}>
            BIBLE TRIVIA BATTLE
          </div>
        </div>
        <div style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)", fontFamily: "Russo One, sans-serif", letterSpacing: "0.1em" }}>
          {room.room_code}
        </div>
      </div>

      {/* Score */}
      <div className="trivia-score-bar" style={{ padding: "12px 16px", background: "var(--card-bg)", borderBottom: "1px solid var(--border)" }}>
        <ScoreBar
          teamAScore={room.team_a_score}
          teamBScore={room.team_b_score}
          questionCount={totalQ}
          currentIndex={room.current_question_index}
        />
      </div>

      {/* Main: 3-column on desktop, stacked on mobile */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr", gap: 12, padding: "12px 12px 80px", maxWidth: 1100, width: "100%", margin: "0 auto" }}
        className="trivia-game-grid">

        {/* Team A (left on desktop) */}
        <TeamPanel
          team="A"
          players={teamA}
          isActive={room.current_team === "A"}
          score={room.team_a_score}
        />

        {/* Question center */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Turn banner */}
          <div style={{
            textAlign: "center", padding: "9px 16px", borderRadius: 10,
            border: `1.5px solid ${teamHex(room.current_team)}88`,
            background: `${teamHex(room.current_team)}18`,
            color: teamHex(room.current_team),
            fontSize: 13, fontWeight: 700, fontFamily: "Russo One, sans-serif",
            boxShadow: `0 0 18px ${teamHex(room.current_team)}22`,
          }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: teamHex(room.current_team), marginRight: 8, animation: "pulse 1.2s ease-in-out infinite" }} />
            {isMyTurn ? "Your turn — answer now!" : `${teamName(room.current_team)}'s turn`}
          </div>

          {/* Question card */}
          {currentQuestion ? (
            <div className="trivia-q-card" style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 20px 14px", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  {currentQuestion.book_reference && (
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                      {currentQuestion.book_reference}
                    </div>
                  )}
                  <div style={{
                    display: "inline-block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10,
                    color: currentQuestion.difficulty === "easy" ? "#10b981" : currentQuestion.difficulty === "medium" ? "#f59e0b" : "#ef4444",
                  }}>
                    {currentQuestion.difficulty}
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.5 }}>
                    {currentQuestion.question}
                  </p>
                </div>
                {showTimer && (
                  <TimerRing key={timerKey} seconds={room.time_limit_seconds} total={room.time_limit_seconds} onExpire={handleTimeExpire} />
                )}
              </div>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentQuestion.options.map((opt, idx) => (
                  <OptionButton
                    key={idx}
                    label={opt}
                    index={idx}
                    onClick={() => handleAnswer(idx)}
                    state={getOptionState(idx)}
                    disabled={!isMyTurn || room.pending_next || localSelectedIndex !== null || submitting}
                  />
                ))}
              </div>

              {/* Result banner */}
              {room.pending_next && (
                <div style={{
                  marginTop: 12, padding: "10px 16px", borderRadius: 10, textAlign: "center",
                  fontFamily: "Russo One, sans-serif", fontSize: 16, fontWeight: 900,
                  background: answerWasCorrect ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.10)",
                  border: `1px solid ${answerWasCorrect ? "#10b981" : "#ef4444"}66`,
                  color: answerWasCorrect ? "#065f46" : "#991b1b",
                  animation: "fade-in 0.3s ease-out",
                }}>
                  {room.last_answer_index === -1 ? "⏰ Time's up!" : answerWasCorrect ? "✓ Correct!" : "✗ Wrong!"}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
              Loading question…
            </div>
          )}

          {/* Next Question — host only */}
          {canAdvance && (
            <button
              onClick={handleNext}
              style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: "var(--teal)", color: "#fff", fontFamily: "Russo One, sans-serif", fontSize: 16, fontWeight: 900, cursor: "pointer", boxShadow: "var(--shadow)" }}
            >
              Next Question →
            </button>
          )}

          {/* Non-host waiting message */}
          {!myPlayer.is_host && room.pending_next && (
            <div style={{ textAlign: "center", padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13 }}>
              Waiting for host to advance…
            </div>
          )}
        </div>

        {/* Team B (right on desktop) */}
        <TeamPanel
          team="B"
          players={teamB}
          isActive={room.current_team === "B"}
          score={room.team_b_score}
        />
      </div>
    </div>
  );
}

// ── END VIEW ──────────────────────────────────────────────────────────────

function EndView({ room, players, myPlayer, onPlayAgain }: {
  room: TriviaRoom; players: TriviaPlayer[]; myPlayer: TriviaPlayer; onPlayAgain: () => void;
}) {
  const aWins = room.team_a_score > room.team_b_score;
  const tie = room.team_a_score === room.team_b_score;
  const winnerTeam: TeamId = aWins ? "A" : "B";
  const iWon = !tie && myPlayer.team === winnerTeam;

  return (
    <div style={{ minHeight: "100vh", background: "var(--trivia-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "Chakra Petch, sans-serif" }}>
      {!tie && <Confetti />}

      <div style={{ textAlign: "center", maxWidth: 420, width: "100%", position: "relative" }}>
        <div style={{ fontSize: 72, marginBottom: 12 }}>{tie ? "🤝" : "🏆"}</div>

        <h2 style={{
          fontFamily: "Russo One, sans-serif",
          fontSize: "clamp(28px, 7vw, 42px)",
          fontWeight: 900,
          marginBottom: 8,
          color: tie ? "var(--text-primary)" : teamHex(winnerTeam),
        }}>
          {tie ? "It's a Tie!" : `${teamName(winnerTeam)} Wins!`}
        </h2>

        {!tie && (
          <p style={{ color: "var(--text-muted)", marginBottom: 20, fontSize: 14 }}>
            {iWon ? "🎉 Congratulations! Your team won!" : "Better luck next time!"}
          </p>
        )}

        {/* Scores */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          {(["A", "B"] as TeamId[]).map((t) => {
            const score = t === "A" ? room.team_a_score : room.team_b_score;
            const hex = teamHex(t);
            const winner = !tie && winnerTeam === t;
            return (
              <div key={t} style={{
                padding: "20px 16px", borderRadius: 16,
                border: `2px solid ${winner ? hex : "var(--border)"}`,
                background: winner ? `${hex}12` : "var(--card-bg)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}>
                {winner && <div style={{ fontSize: 18 }}>👑</div>}
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: hex, fontFamily: "Russo One, sans-serif" }}>
                  {teamName(t)}
                </div>
                <div style={{ fontFamily: "Russo One, sans-serif", fontSize: 44, fontWeight: 900, color: hex }}>
                  {score}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>points</div>
              </div>
            );
          })}
        </div>

        {/* Players */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Players</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
            {players.map((p) => <PlayerChip key={p.id} player={p} />)}
          </div>
        </div>

        <button
          onClick={onPlayAgain}
          style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "var(--teal)", color: "#fff", fontFamily: "Russo One, sans-serif", fontSize: 18, fontWeight: 900, cursor: "pointer" }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────

type View = "home" | "lobby" | "game" | "end";

interface TriviaPageProps {
  user: User | null;
  navigate: (page: string, params?: Record<string, unknown>) => void;
  prefillCode?: string;
}

export default function TriviaPage({ user, navigate, prefillCode }: TriviaPageProps) {
  const [view, setView] = useState<View>("home");
  const [myPlayer, setMyPlayer] = useState<TriviaPlayer | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const { room, players, currentQuestion, loading, refresh } = useRoom(roomId);
  const { startGame } = useGame();

  useEffect(() => {
    if (!room) return;
    if (room.status === "playing" && view === "lobby") {
      if (!currentQuestion) refresh();
      setView("game");
    }
    // Room closed mid-lobby (someone exited) → go home
    if (room.status === "finished" && view === "lobby") {
      setRoomId(null);
      setMyPlayer(null);
      setView("home");
    }
    if (room.status === "finished" && view === "game") setView("end");
  }, [room?.status]);

  function handleRoomJoined(room: TriviaRoom, player: TriviaPlayer) {
    setRoomId(room.id);
    setMyPlayer(player);
    setView("lobby");
  }

  async function handleStart() {
    if (!roomId || !myPlayer) return;
    const ok = await startGame(roomId, myPlayer.id);
    if (ok) {
      await refresh();
      setView("game");
    }
  }

  async function handleExit() {
    // Close the room for everyone before leaving
    if (roomId) {
      const { supabase } = await import("../../lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      const authH = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
      await fetch("/api/trivia/close-room", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authH },
        body: JSON.stringify({ room_id: roomId }),
      });
    }
    setRoomId(null);
    setMyPlayer(null);
    setView("home");
  }

  // Inject fonts + styles
  useEffect(() => {
    if (!document.getElementById("trivia-fonts")) {
      const link = document.createElement("link");
      link.id = "trivia-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Russo+One&family=Chakra+Petch:wght@400;600;700&display=swap";
      document.head.appendChild(link);
    }
    if (!document.getElementById("trivia-styles")) {
      const style = document.createElement("style");
      style.id = "trivia-styles";
      style.textContent = `
        @keyframes fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes trivia-pulse-glow { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        @media (min-width: 768px) {
          .trivia-game-grid { grid-template-columns: 200px 1fr 200px !important; }
        }
        .trivia-custom-time::-webkit-inner-spin-button,
        .trivia-custom-time::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .trivia-custom-time { -moz-appearance: textfield; }

        /* ── Background theme ── */
        :root { --trivia-bg: var(--bg); }
        [data-theme="light"] { --trivia-bg: linear-gradient(155deg, #f3eeff 0%, #fdf4ff 38%, #fff0f7 65%, #ede9fe 100%); }
        [data-theme="dark"]  { --trivia-bg: var(--bg); }

        /* ── Option button hover ── */
        .trivia-opt-btn { transition: transform 0.15s ease, box-shadow 0.15s ease !important; }
        .trivia-opt-btn:not([disabled]):hover { transform: translateX(4px) !important; }

        /* ── Turn banner glow ── */
        .trivia-turn-active {
          animation: trivia-pulse-glow 2s ease-in-out infinite;
        }

        /* ── Score bar gradient ── */
        .trivia-score-bar {
          background: linear-gradient(to right, rgba(124,58,237,0.05) 0%, transparent 40%, transparent 60%, rgba(217,119,6,0.05) 100%) !important;
        }

        /* ── Question card accent ── */
        .trivia-q-card {
          border-top: 3px solid var(--teal) !important;
          border-radius: 16px !important;
        }
        [data-theme="light"] .trivia-q-card {
          box-shadow: 0 4px 24px rgba(124,58,237,0.10), 0 1px 4px rgba(0,0,0,0.06) !important;
        }

        /* ── Team panel glow ── */
        .trivia-team-active {
          box-shadow: 0 0 32px var(--trivia-team-color, rgba(124,58,237,0.18)) !important;
        }
      `;
      document.head.appendChild(style);
      return () => { style.remove(); };
    }
  }, []);

  if (view === "home") return <HomeView user={user} onRoomJoined={handleRoomJoined} prefillCode={prefillCode} />;

  if (loading || !room || !myPlayer) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--trivia-bg)" }}>
        <div style={{ color: "var(--teal)", fontFamily: "Russo One, sans-serif", fontSize: 18 }}>Loading…</div>
      </div>
    );
  }

  if (view === "lobby") {
    return <LobbyView room={room} players={players} myPlayer={myPlayer} onStart={handleStart} onRefresh={refresh} onExit={handleExit} />;
  }

  if (view === "game") {
    return (
      <GameView
        room={room}
        players={players}
        myPlayer={myPlayer}
        currentQuestion={currentQuestion}
        onGameEnd={() => setView("end")}
        onRefresh={refresh}
        onExit={handleExit}
      />
    );
  }

  return <EndView room={room} players={players} myPlayer={myPlayer} onPlayAgain={handleExit} />;
}
