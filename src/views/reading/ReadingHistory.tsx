import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useReadingHistory } from "../../hooks/useReading";
import "../../styles/reading-history.css";

function formatDay(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatMonth(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function ReadingHistorySkeleton() {
  return (
    <div className="reading-history">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 13, width: '35%', marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 15, width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function dotLevel(chapters) {
  if (chapters >= 5) return "high";
  if (chapters >= 2) return "";
  return "low";
}

export default function ReadingHistory({ user, onBack, navigate, darkMode, setDarkMode, i18n, onLogout }) {
  const { t } = useTranslation();
  const { data: history = [], isLoading } = useReadingHistory(user?.id);

  const { groups, totalDays, totalChapters, longestDay, last7Chapters, activeThisWeek } = useMemo(() => {
    if (!history.length) return { groups: [], totalDays: 0, totalChapters: 0, longestDay: 0, last7Chapters: 0, activeThisWeek: 0 };

    const totalChapters = history.reduce((s, r) => s + r.chapters_read, 0);
    const longestDay = Math.max(...history.map(r => r.chapters_read));
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);
    const recentRows = history.filter(r => new Date(r.date + "T12:00:00") >= weekStart);
    const last7Chapters = recentRows.reduce((s, r) => s + r.chapters_read, 0);
    const activeThisWeek = recentRows.length;

    const monthMap = new Map();
    for (const row of history) {
      const monthKey = row.date.slice(0, 7);
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, []);
      monthMap.get(monthKey).push(row);
    }

    const groups = Array.from(monthMap.entries()).map(([monthKey, rows]) => ({
      label: formatMonth(monthKey + "-01"),
      monthTotal: rows.reduce((s, r) => s + r.chapters_read, 0),
      entries: rows,
    }));

    return { groups, totalDays: history.length, totalChapters, longestDay, last7Chapters, activeThisWeek };
  }, [history]);

  return (
    <div className="history-page">

      <div className="history-inner">
        <div className="history-header">
          <h1 className="history-title">{t("history.title")}</h1>
          {history.length > 0 && (
            <span className="history-subtitle">{t("history.readingDays", { count: totalDays })}</span>
          )}
        </div>

        {!isLoading && history.length > 0 && (
          <>
            <div className="history-rhythm">
              <div>
                <span className="history-rhythm-kicker">{t("history.rhythm", "Reading rhythm")}</span>
                <strong>{t("history.weekRhythm", "{{days}} days this week", { days: activeThisWeek })}</strong>
                <p>{t("history.weekChapters", "{{chapters}} chapters logged in the last 7 days", { chapters: last7Chapters })}</p>
              </div>
              <button className="history-continue-btn" onClick={() => navigate("main")}>
                {t("checklist.continueReading", "Continue reading")}
              </button>
            </div>
            <div className="history-summary">
              <div className="history-summary-chip">
                <span className="history-summary-value">{totalDays}</span>
                <span className="history-summary-label">{t("history.daysRead")}</span>
              </div>
              <div className="history-summary-chip">
                <span className="history-summary-value">{totalChapters}</span>
                <span className="history-summary-label">{t("history.chaptersLogged")}</span>
              </div>
              <div className="history-summary-chip">
                <span className="history-summary-value">{longestDay}</span>
                <span className="history-summary-label">{t("history.bestDay")}</span>
              </div>
              <div className="history-summary-chip">
                <span className="history-summary-value">
                  {history.length > 0 ? (totalChapters / totalDays).toFixed(1) : "-"}
                </span>
                <span className="history-summary-label">{t("history.avgPerDay")}</span>
              </div>
            </div>
          </>
        )}

        {isLoading ? (
          <ReadingHistorySkeleton />
        ) : history.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">📅</div>
            <div className="history-empty-text">{t("history.empty")}</div>
            <div className="history-empty-sub">{t("history.emptySub")}</div>
            <button className="history-continue-btn history-continue-btn--empty" onClick={() => navigate("main")}>
              {t("checklist.continueReading", "Continue reading")}
            </button>
          </div>
        ) : (
          <div className="history-timeline">
            {groups.map(group => (
              <div key={group.label} className="history-month-group">
                <div className="history-month-label">
                  {group.label}
                  <span className="history-month-total">
                    {t("history.monthTotal", { count: group.monthTotal })}
                  </span>
                </div>
                {group.entries.map(row => (
                  <div key={row.date} className="history-entry">
                    <div className={`history-entry-dot${dotLevel(row.chapters_read) ? ` history-entry-dot--${dotLevel(row.chapters_read)}` : ""}`} />
                    <span className="history-entry-date">{formatDay(row.date)}</span>
                    <span className="history-entry-desc">
                      {t("history.readChapters", { count: row.chapters_read })}
                    </span>
                    <span className="history-entry-badge">
                      {row.chapters_read >= 5 && <span className="history-entry-badge-mark" aria-hidden="true" />}
                      {t("history.chBadge", { count: row.chapters_read })}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
