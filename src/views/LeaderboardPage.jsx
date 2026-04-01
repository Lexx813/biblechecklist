import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import { useReadingLeaderboard, useQuizLeaderboard } from "../hooks/useLeaderboard";

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
  return <span className="lb-premium-badge" title="Premium member">✦</span>;
}

function ReadingBoard({ data, userId, onProfile }) {
  const { t } = useTranslation();
  return (
    <div className="lb-list">
      {data.map((row, i) => (
        <div
          key={row.user_id}
          className={`lb-row${row.user_id === userId ? " lb-row--me" : ""}`}
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
          className={`lb-row${row.user_id === userId ? " lb-row--me" : ""}`}
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

export default function LeaderboardPage({ user, onBack, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("reading");

  const { data: readingData = [], isLoading: readingLoading } = useReadingLeaderboard();
  const { data: quizData = [], isLoading: quizLoading } = useQuizLeaderboard();

  const isLoading = tab === "reading" ? readingLoading : quizLoading;

  function goProfile(userId) {
    if (userId === user.id) navigate("profile");
    else navigate("publicProfile", { userId });
  }

  return (
    <div className="lb-page">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout}  onUpgrade={onUpgrade}/>

      <header className="lb-header">
        <button className="back-btn" onClick={onBack}>{t("common.back")}</button>
        <h1 className="lb-title">🏆 {t("leaderboard.title")}</h1>
        <p className="lb-sub">{t("leaderboard.subtitle")}</p>
      </header>

      <div className="lb-tabs">
        <button className={`lb-tab${tab === "reading" ? " lb-tab--active" : ""}`} onClick={() => setTab("reading")}>
          📖 {t("leaderboard.tabReading")}
        </button>
        <button className={`lb-tab${tab === "quiz" ? " lb-tab--active" : ""}`} onClick={() => setTab("quiz")}>
          🧠 {t("leaderboard.tabQuiz")}
        </button>
      </div>

      <div className="lb-content">
        {isLoading ? (
          <SkeletonList />
        ) : tab === "reading" ? (
          readingData.length === 0
            ? <p className="lb-empty">{t("leaderboard.empty")}</p>
            : <ReadingBoard data={readingData} userId={user.id} onProfile={goProfile} />
        ) : (
          quizData.length === 0
            ? <p className="lb-empty">{t("leaderboard.empty")}</p>
            : <QuizBoard data={quizData} userId={user.id} onProfile={goProfile} />
        )}
      </div>
    </div>
  );
}
