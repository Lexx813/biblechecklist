import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import PageNav from "../../components/PageNav";
import ConfirmModal from "../../components/ConfirmModal";
import AICompanion from "../../components/AICompanion";
import { useFullProfile } from "../../hooks/useAdmin";
import { useSubscription } from "../../hooks/useSubscription";
import {
  useMyPlans,
  usePlanCompletions,
  useEnrollPlan,
  useUnenrollPlan,
  useMarkDay,
  useUnmarkDay,
} from "../../hooks/useReadingPlans";
import {
  PLAN_TEMPLATES,
  getTemplate,
  generateSchedule,
  DIFFICULTY_COLOR,
} from "../../data/readingPlanTemplates";
import "../../styles/reading-plans.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysSince(dateStr) {
  const start = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - start) / 86400000) + 1;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ── Plan template card (browse) ───────────────────────────────────────────────

function TemplateCard({ template, enrolled, onEnroll, enrolling }) {
  const { t } = useTranslation();
  return (
    <div className="rp-template-card">
      <div className="rp-template-icon">{template.icon}</div>
      <div className="rp-template-body">
        <div className="rp-template-header">
          <h3 className="rp-template-name">{template.name}</h3>
          <span
            className="rp-difficulty-badge"
            style={{ color: DIFFICULTY_COLOR[template.difficulty] }}
          >
            {template.difficulty}
          </span>
        </div>
        <p className="rp-template-desc">{template.description}</p>
        <div className="rp-template-meta">
          <span>📅 {template.totalDays} days</span>
          <span>📖 {template.totalChapters} chapters</span>
          <span>~{(template.totalChapters / template.totalDays).toFixed(1)} {t("readingPlans.chDay")}</span>
        </div>
      </div>
      <button
        className={`rp-enroll-btn${enrolled ? " rp-enroll-btn--enrolled" : ""}`}
        onClick={onEnroll}
        disabled={enrolled || enrolling}
      >
        {enrolled ? t("readingPlans.enrolled") : enrolling ? t("readingPlans.starting") : t("readingPlans.startPlan")}
      </button>
    </div>
  );
}

// ── Active plan card ──────────────────────────────────────────────────────────

function ActivePlanCard({ plan, onClick }) {
  const { t } = useTranslation();
  const template = getTemplate(plan.template_key);
  const { data: completions = [] } = usePlanCompletions(plan.id);
  if (!template) return null;

  const doneSet = new Set(completions.map(c => c.day_number));
  const completedCount = doneSet.size;
  const pct = Math.round((completedCount / template.totalDays) * 100);
  const currentDay = Math.min(daysSince(plan.start_date), template.totalDays);
  const todayDone = doneSet.has(currentDay);

  return (
    <div className="rp-active-card" onClick={onClick}>
      <div className="rp-active-card-top">
        <span className="rp-active-icon">{template.icon}</span>
        <div className="rp-active-info">
          <h3 className="rp-active-name">{template.name}</h3>
          <span className="rp-active-meta">Started {formatDate(plan.start_date)} · {t("readingPlans.day")} {currentDay} {t("readingPlans.of")} {template.totalDays}</span>
        </div>
        <span className="rp-active-pct">{pct}%</span>
      </div>
      <div className="rp-progress-bar">
        <div className="rp-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="rp-active-footer">
        <span className={`rp-today-badge${todayDone ? " rp-today-badge--done" : ""}`}>
          {todayDone ? t("readingPlans.todayComplete") : t("readingPlans.todayPending")}
        </span>
        <span className="rp-active-done-count">{completedCount}/{template.totalDays} days</span>
      </div>
    </div>
  );
}

// ── Plan detail view ──────────────────────────────────────────────────────────

function PlanDetail({ plan, onBack, isAdmin }) {
  const { t } = useTranslation();
  const template = getTemplate(plan.template_key);
  const { data: completions = [], isLoading } = usePlanCompletions(plan.id);
  const markDay = useMarkDay(plan.id);
  const unmarkDay = useUnmarkDay(plan.id);
  const unenroll = useUnenrollPlan();
  const [showAll, setShowAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const schedule = useMemo(() => generateSchedule(template.bookIndices, template.totalDays), [template]);
  const doneSet = useMemo(() => new Set(completions.map(c => c.day_number)), [completions]);

  if (!template) return null;

  const currentDay = Math.min(daysSince(plan.start_date), template.totalDays);
  const completedCount = doneSet.size;
  const pct = Math.round((completedCount / template.totalDays) * 100);

  const visibleDays = showAll ? schedule : schedule.slice(0, currentDay + 6);

  function toggleDay(dayNum) {
    if (doneSet.has(dayNum)) {
      unmarkDay.mutate(dayNum);
    } else {
      markDay.mutate(dayNum);
    }
  }

  function handleUnenroll() {
    unenroll.mutate(plan.id, { onSuccess: onBack });
  }

  return (
    <div className="rp-detail">
      <div className="rp-detail-header">
        <button className="rp-back-btn" onClick={onBack}>{t("common.back")}</button>
        <div className="rp-detail-title-row">
          <span className="rp-detail-icon">{template.icon}</span>
          <div>
            <h2 className="rp-detail-name">{template.name}</h2>
            <p className="rp-detail-meta">Started {formatDate(plan.start_date)} · {template.totalDays} days · {template.totalChapters} chapters</p>
          </div>
        </div>
      </div>

      {/* Progress overview */}
      <div className="rp-detail-progress">
        <div className="rp-progress-bar rp-progress-bar--lg">
          <div className="rp-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="rp-detail-stats">
          <div className="rp-stat">
            <span className="rp-stat-val">{pct}%</span>
            <span className="rp-stat-label">{t("readingPlans.complete")}</span>
          </div>
          <div className="rp-stat">
            <span className="rp-stat-val">{completedCount}</span>
            <span className="rp-stat-label">{t("readingPlans.daysDone")}</span>
          </div>
          <div className="rp-stat">
            <span className="rp-stat-val">{template.totalDays - completedCount}</span>
            <span className="rp-stat-label">{t("readingPlans.remaining")}</span>
          </div>
          <div className="rp-stat">
            <span className="rp-stat-val">{t("readingPlans.day")} {currentDay}</span>
            <span className="rp-stat-label">{t("readingPlans.today")}</span>
          </div>
        </div>
      </div>

      {/* Today's reading */}
      {schedule[currentDay - 1] && (
        <div className={`rp-today-card${doneSet.has(currentDay) ? " rp-today-card--done" : ""}`}>
          <div className="rp-today-label">{t("readingPlans.todaysReading")} {currentDay}</div>
          <div className="rp-today-readings">
            {schedule[currentDay - 1].readings.map((r, i) => (
              <span key={i} className="rp-reading-chip">{r.bookAbbr} {r.chapter}</span>
            ))}
          </div>
          <button
            className={`rp-mark-btn${doneSet.has(currentDay) ? " rp-mark-btn--done" : ""}`}
            onClick={() => toggleDay(currentDay)}
            disabled={isLoading || markDay.isPending || unmarkDay.isPending}
          >
            {doneSet.has(currentDay) ? t("readingPlans.markUnread") : t("readingPlans.markRead")}
          </button>
        </div>
      )}

      {/* AI companion for today's reading */}
      {isAdmin && schedule[currentDay - 1] && (
        <AICompanion
          reference={`Day ${currentDay} — ${template.name}`}
          passage={schedule[currentDay - 1].readings.map(r => `${r.bookName} ${r.chapter}`).join(", ")}
          className="rp-ai-companion"
        />
      )}

      {/* Day list */}
      <div className="rp-day-list">
        <h3 className="rp-day-list-title">{t("readingPlans.readingSchedule")}</h3>
        {isLoading ? (
          <p className="rp-empty">{t("common.loading")}</p>
        ) : (
          <>
            {visibleDays.map(({ day, readings }) => {
              const done = doneSet.has(day);
              const isToday = day === currentDay;
              const isFuture = day > currentDay;
              return (
                <div
                  key={day}
                  className={`rp-day-row${done ? " rp-day-row--done" : ""}${isToday ? " rp-day-row--today" : ""}${isFuture ? " rp-day-row--future" : ""}`}
                >
                  <button
                    className={`rp-day-check${done ? " rp-day-check--done" : ""}`}
                    onClick={() => toggleDay(day)}
                    title={done ? "Mark unread" : "Mark read"}
                  >
                    {done ? "✓" : ""}
                  </button>
                  <div className="rp-day-info">
                    <span className="rp-day-num">{t("readingPlans.day")} {day}{isToday ? ` · ${t("readingPlans.today")}` : ""}</span>
                    <div className="rp-day-readings">
                      {readings.map((r, i) => (
                        <span key={i} className="rp-reading-chip rp-reading-chip--sm">{r.bookAbbr} {r.chapter}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {!showAll && schedule.length > currentDay + 6 && (
              <button className="rp-show-all-btn" onClick={() => setShowAll(true)}>
                {t("readingPlans.showAll")} {schedule.length} {t("readingPlans.days")}
              </button>
            )}
          </>
        )}
      </div>

      <div className="rp-danger-zone">
        <button className="rp-unenroll-btn" onClick={() => setConfirmDelete(true)}>{t("readingPlans.removePlan")}</button>
      </div>

      {confirmDelete && (
        <ConfirmModal
          message={`${t("readingPlans.remove")} "${template.name}" ${t("readingPlans.removeConfirmSuffix")}`}
          onConfirm={handleUnenroll}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReadingPlansPage({ user, navigate, ...sharedNav }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("mine");
  const [detailPlan, setDetailPlan] = useState(null);
  const { data: myPlans = [], isLoading } = useMyPlans();
  const enrollPlan = useEnrollPlan();
  const { isPremium } = useSubscription(user?.id);

  const enrolledKeys = new Set(myPlans.map(p => p.template_key));

  function handleEnroll(templateKey) {
    enrollPlan.mutate(templateKey, {
      onSuccess: (plan) => { setDetailPlan(plan); setTab("mine"); },
    });
  }

  if (detailPlan) {
    return (
      <div className="rp-page">
        <PageNav {...sharedNav} user={user} navigate={navigate} />
        <PlanDetail plan={detailPlan} onBack={() => setDetailPlan(null)} isAdmin={isPremium} />
      </div>
    );
  }

  return (
    <div className="rp-page">
      <PageNav {...sharedNav} user={user} navigate={navigate} />

      <div className="rp-header">
        <button className="rp-nav-back" onClick={() => navigate("home")}>{t("common.back")}</button>
        <div>
          <h1 className="rp-title">{t("readingPlans.title")}</h1>
          <p className="rp-subtitle">{t("readingPlans.subtitle")}</p>
        </div>
      </div>

      <div className="rp-tabs">
        <button className={`rp-tab${tab === "mine" ? " rp-tab--active" : ""}`} onClick={() => setTab("mine")}>
          {t("readingPlans.myPlans")} {myPlans.length > 0 && <span className="rp-tab-count">{myPlans.length}</span>}
        </button>
        <button className={`rp-tab${tab === "browse" ? " rp-tab--active" : ""}`} onClick={() => setTab("browse")}>
          {t("readingPlans.browsePlans")}
        </button>
      </div>

      {tab === "mine" && (
        <div className="rp-content">
          {isLoading ? (
            <p className="rp-empty">{t("common.loading")}</p>
          ) : myPlans.length === 0 ? (
            <div className="rp-empty-state">
              <span className="rp-empty-icon">📅</span>
              <h3>{t("readingPlans.noActivePlans")}</h3>
              <p>{t("readingPlans.noActivePlansDesc")}</p>
              <button className="rp-primary-btn" onClick={() => setTab("browse")}>{t("readingPlans.browsePlansBtn")}</button>
            </div>
          ) : (
            <div className="rp-active-list">
              {myPlans.map(plan => (
                <ActivePlanCard key={plan.id} plan={plan} onClick={() => setDetailPlan(plan)} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "browse" && (
        <div className="rp-content">
          <div className="rp-template-list">
            {PLAN_TEMPLATES.map(t => (
              <TemplateCard
                key={t.key}
                template={t}
                enrolled={enrolledKeys.has(t.key)}
                onEnroll={() => handleEnroll(t.key)}
                enrolling={enrollPlan.isPending && enrollPlan.variables === t.key}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
