import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useReadingHistory } from "../../hooks/useReading";
import AppLayout from "../../components/AppLayout";
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

export default function ReadingHistory({ user, onBack, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const { t } = useTranslation();
  const { data: history = [], isLoading } = useReadingHistory(user?.id);

  const { groups, totalDays, totalChapters, longestDay } = useMemo(() => {
    if (!history.length) return { groups: [], totalDays: 0, totalChapters: 0, longestDay: 0 };

    const totalChapters = history.reduce((s, r) => s + r.chapters_read, 0);
    const longestDay = Math.max(...history.map(r => r.chapters_read));

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

    return { groups, totalDays: history.length, totalChapters, longestDay };
  }, [history]);

  return (
    <AppLayout navigate={navigate} user={user} currentPage="readingTracker">
    <div className="history-page">

      <div className="history-inner">
        <div className="history-header">
          <h1 className="history-title">{t("history.title")}</h1>
          {history.length > 0 && (
            <span className="history-subtitle">{t("history.readingDays", { count: totalDays })}</span>
          )}
        </div>

        {!isLoading && history.length > 0 && (
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
                {history.length > 0 ? (totalChapters / totalDays).toFixed(1) : "—"}
              </span>
              <span className="history-summary-label">{t("history.avgPerDay")}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <ReadingHistorySkeleton />
        ) : history.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">📅</div>
            <div className="history-empty-text">{t("history.empty")}</div>
            <div className="history-empty-sub">{t("history.emptySub")}</div>
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
                      {row.chapters_read >= 5 ? "🔥 " : row.chapters_read >= 3 ? "⭐ " : ""}
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
    </AppLayout>
  );
}
