// @ts-nocheck
import { useState } from "react";
import { useTranslation } from "react-i18next";
import RightPanel from "../components/RightPanel";
import { useReadingLeaderboard, useQuizLeaderboard } from "../hooks/useLeaderboard";
import { useTimedLeaderboard } from "../hooks/useQuizTimed";

function SkeletonList() {
  return (
    <div className="lb-list">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="lb-skeleton-row">
          <div className="lb-skel lb-skel--rank" />
          <div className="lb-skel lb-skel--circle" />
          <div style={{ flex: 1 }}>
            <div className="lb-skel lb-skel--name" />
            <div className="lb-skel lb-skel--sub" />
          </div>
          <div className="lb-skel lb-skel--stat" />
        </div>
      ))}
    </div>
  );
}
import "../styles/leaderboard.css";

const MEDALS = ["🥇", "🥈", "🥉"];

function isPremiumUser(row) {
  return row.subscription_status === "active" || row.subscription_status === "trialing" || row.subscription_status === "gifted";
}

function Avatar({ row }) {
  if (row.avatar_url) {
    return <img className="lb-avatar" src={row.avatar_url} alt="" width={40} height={40} />;
  }
  const initials = (row.display_name || "?")[0].toUpperCase();
  return <div className="lb-avatar lb-avatar--fallback">{initials}</div>;
}

function PremiumBadge() {
  return <span className="lb-premium-badge" title="Premium member"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4 5.6 21.2 8 14 2 9.2h7.6z"/></svg></span>;
}

function ReadingBoard({ data, userId, onProfile }) {
  const { t } = useTranslation();
  return (
    <div className="lb-list">
      {data.map((row, i) => (
        <div
          key={row.user_id}
          className={`lb-row${i === 0 ? " lb-row--first" : ""}${row.user_id === userId ? " lb-row--me" : ""}`}
          onClick={() => onProfile(row.user_id)}
        >
          <span className="lb-rank">{MEDALS[i] ?? `#${i + 1}`}</span>
          <Avatar row={row} />
          <div className="lb-info">
            <span className="lb-name">
              {row.display_name || t("leaderboard.anonymous")}
              {isPremiumUser(row) && <PremiumBadge />}
            </span>
            <span className="lb-sub">{row.pct}% {t("leaderboard.complete")}</span>
          </div>
          <span className="lb-stat">{Number(row.chapters_read).toLocaleString()} <span className="lb-stat-label">{t("leaderboard.chapters")}</span></span>
        </div>
      ))}
    </div>
  );
}

function QuizBoard({ data, userId, onProfile }) {
  const { t } = useTranslation();
  return (
    <div className="lb-list">
      {data.map((row, i) => (
        <div
          key={row.user_id}
          className={`lb-row${i === 0 ? " lb-row--first" : ""}${row.user_id === userId ? " lb-row--me" : ""}`}
          onClick={() => onProfile(row.user_id)}
        >
          <span className="lb-rank">{MEDALS[i] ?? `#${i + 1}`}</span>
          <Avatar row={row} />
          <div className="lb-info">
            <span className="lb-name">
              {row.display_name || t("leaderboard.anonymous")}
              {isPremiumUser(row) && <PremiumBadge />}
            </span>
            <span className="lb-sub">{t("leaderboard.levelsComplete", { count: Number(row.levels_completed) })}</span>
          </div>
          <span className="lb-stat">{Number(row.levels_completed)} / 12</span>
        </div>
      ))}
    </div>
  );
}

function TimedLeaderboardList({ level, currentUserId }) {
  const { t } = useTranslation();
  const { data: entries = [], isLoading } = useTimedLeaderboard(level);

  if (isLoading) return <SkeletonList />;
  if (!entries.length) return (
    <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: "32px 0" }}>
      {t("leaderboard.noScores", "No scores yet for this level.")}
    </p>
  );

  return (
    <ol className="lb-list">
      {entries.map((entry) => (
        <li
          key={entry.userId}
          className={`lb-row${entry.userId === currentUserId ? " lb-row--me" : ""}`}
        >
          <span className="lb-rank">#{entry.rank}</span>
          <span className="lb-name">{entry.displayName}</span>
          <span className="lb-score">{entry.score} {t("leaderboard.pts", "pts")}</span>
          <span className="lb-date">
            {new Date(entry.achievedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function LeaderboardPage({ user, onBack, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("reading");
  const [timedLevel, setTimedLevel] = useState(1);

  const { data: readingData = [], isLoading: readingLoading } = useReadingLeaderboard();
  const { data: quizData = [], isLoading: quizLoading } = useQuizLeaderboard();

  const isLoading = tab === "reading" ? readingLoading : tab === "quiz" ? quizLoading : false;

  function goProfile(userId) {
    if (userId === user.id) navigate("profile");
    else navigate("publicProfile", { userId });
  }

  return (
    <div className="lb-page">
      <header className="lb-header">
        <h1 className="lb-title"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{verticalAlign:"middle",marginRight:6}}><path d="M5 3h14l-1.5 5H18a5 5 0 0 1-4 4.9V17h3a1 1 0 1 1 0 2H7a1 1 0 1 1 0-2h3v-4.1A5 5 0 0 1 6 8h-.5L4 3h1zm7 10a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3z"/></svg>{t("leaderboard.title")}</h1>
        <p className="lb-sub">{t("leaderboard.subtitle")}</p>
      </header>

      <div className="lb-tabs">
        <button className={`lb-tab${tab === "reading" ? " lb-tab--active" : ""}`} onClick={() => setTab("reading")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",marginRight:4}}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>{t("leaderboard.tabReading")}
        </button>
        <button className={`lb-tab${tab === "quiz" ? " lb-tab--active" : ""}`} onClick={() => setTab("quiz")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",marginRight:4}}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>{t("leaderboard.tabQuiz")}
        </button>
        <button className={`lb-tab${tab === "timed" ? " lb-tab--active" : ""}`} onClick={() => setTab("timed")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",marginRight:4}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{t("leaderboard.tabTimed")}
        </button>
      </div>

      <div className="lb-content">
        {isLoading ? (
          <SkeletonList />
        ) : tab === "reading" ? (
          readingData.length === 0
            ? <p className="lb-empty">{t("leaderboard.empty")}</p>
            : <ReadingBoard data={readingData} userId={user.id} onProfile={goProfile} />
        ) : tab === "quiz" ? (
          quizData.length === 0
            ? <p className="lb-empty">{t("leaderboard.empty")}</p>
            : <QuizBoard data={quizData} userId={user.id} onProfile={goProfile} />
        ) : null}
        {tab === "timed" && (
          <div className="lb-timed">
            <div className="lb-timed-filter">
              <label htmlFor="timed-level-select">{t("leaderboard.levelLabel")}</label>
              <select
                id="timed-level-select"
                value={timedLevel}
                onChange={(e) => setTimedLevel(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{t("leaderboard.levelLabel")} {i + 1}</option>
                ))}
              </select>
            </div>
            <TimedLeaderboardList level={timedLevel} currentUserId={user?.id} />
          </div>
        )}
      </div>
    </div>
  );
}
