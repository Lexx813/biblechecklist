import { useState } from "react";
import { useTranslation } from "react-i18next";
import CustomSelect from "../../../components/CustomSelect";
import ConfirmModal from "../../../components/ConfirmModal";
import { useAdminQuizStats } from "../../../hooks/useAdmin";
import { useAllQuizQuestions, useCreateQuizQuestion, useUpdateQuizQuestion, useDeleteQuizQuestion } from "../../../hooks/useQuiz";
import { AdminSkeleton } from "./UsersTab";

const LEVELS = Array.from({ length: 12 }, (_, i) => i + 1);
const OPTION_LABELS = ["A", "B", "C", "D"];

function emptyForm(level: number) {
  return { level, question: "", options: ["", "", "", ""], correct_index: 0 };
}

// ── Quiz Stats Tab ────────────────────────────────────────────────────────────
export function QuizStatsTab() {
  const { t } = useTranslation();
  const { data: rawData = [], isLoading } = useAdminQuizStats();

  const stats = Array.from({ length: 12 }, (_, i) => {
    const level = i + 1;
    const rows = rawData.filter(r => r.level === level);
    const unlocked = rows.filter(r => r.unlocked).length;
    const earned = rows.filter(r => r.badge_earned).length;
    const scores = rows.filter(r => r.best_score > 0).map(r => r.best_score);
    const attempts = rows.reduce((sum, r) => sum + (r.attempts || 0), 0);
    return {
      level,
      unlocked,
      earned,
      passRate: unlocked ? Math.round(earned / unlocked * 100) : 0,
      avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      attempts,
    };
  });

  if (isLoading) return <AdminSkeleton />;

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>{t("adminQuizStats.level")}</th>
            <th>{t("adminQuizStats.unlocked")}</th>
            <th>{t("adminQuizStats.passed")}</th>
            <th>{t("adminQuizStats.passRate")}</th>
            <th>{t("adminQuizStats.avgScore")}</th>
            <th>{t("adminQuizStats.attempts")}</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(s => (
            <tr key={s.level}>
              <td><strong>{t("adminQuiz.level")} {s.level}</strong></td>
              <td>{s.unlocked}</td>
              <td>{s.earned}</td>
              <td>
                <span style={{
                  fontWeight: 700,
                  color: s.passRate >= 70 ? "var(--success, #22c55e)" : s.passRate >= 40 ? "var(--warning, #f59e0b)" : "var(--danger, #ef4444)"
                }}>
                  {s.passRate}%
                </span>
              </td>
              <td>{s.avgScore > 0 ? `${s.avgScore}%` : "—"}</td>
              <td>{s.attempts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Quiz Editor Tab ────────────────────────────────────────────────────────────
export function QuizTab() {
  const { t } = useTranslation();
  const { data: allQuestions = [], isLoading } = useAllQuizQuestions();
  const createQuestion  = useCreateQuizQuestion();
  const updateQuestion  = useUpdateQuizQuestion();
  const deleteQuestion  = useDeleteQuizQuestion();

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [showForm, setShowForm]           = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [form, setForm]                   = useState(emptyForm(1));
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [qPage, setQPage] = useState(0);

  const QUIZ_PAGE_SIZE = 5;
  const levelQuestions = allQuestions.filter(q => q.level === selectedLevel);
  const totalQPages = Math.ceil(levelQuestions.length / QUIZ_PAGE_SIZE);
  const pageQuestions = levelQuestions.slice(qPage * QUIZ_PAGE_SIZE, (qPage + 1) * QUIZ_PAGE_SIZE);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm(selectedLevel));
    setShowForm(true);
  }

  function openEditForm(q: typeof allQuestions[0]) {
    setEditingId(q.id);
    setForm({
      level: q.level,
      question: q.question,
      options: Array.isArray(q.options) ? [...q.options] : ["", "", "", ""],
      correct_index: q.correct_index ?? 0,
    });
    setShowForm(true);
  }

  function handleSave() {
    const payload = {
      level: form.level,
      question: form.question.trim(),
      options: form.options.map(o => o.trim()),
      correctIndex: form.correct_index,
    };
    if (!payload.question || payload.options.some(o => !o)) return;

    if (editingId) {
      updateQuestion.mutate({ id: editingId, ...payload }, { onSuccess: () => { setShowForm(false); setEditingId(null); } });
    } else {
      createQuestion.mutate(payload, { onSuccess: () => { setShowForm(false); } });
    }
  }

  if (isLoading) return <AdminSkeleton />;

  return (
    <div>
      <div className="admin-quiz-controls">
        <CustomSelect
          value={selectedLevel}
          onChange={val => { setSelectedLevel(Number(val)); setShowForm(false); setQPage(0); }}
          options={LEVELS.map(l => ({ value: l, label: `${t("adminQuiz.level")} ${l}` }))}
        />
        <button className="admin-add-btn" onClick={openAddForm}>
          {t("adminQuiz.addQuestion")}
        </button>
      </div>

      {showForm && (
        <div className="admin-question-form">
          <h3>{editingId ? t("adminQuiz.editQuestion") : t("adminQuiz.addQuestion")}</h3>

          <div>
            <label htmlFor="admin-level" className="admin-form-label">{t("adminQuiz.level")}</label>
            <CustomSelect
              value={form.level}
              onChange={val => setForm(f => ({ ...f, level: Number(val) }))}
              options={LEVELS.map(l => ({ value: l, label: String(l) }))}
            />
          </div>

          <div>
            <label htmlFor="admin-question" className="admin-form-label">{t("adminQuiz.questionText")}</label>
            <textarea
              id="admin-question"
              name="question"
              className="admin-textarea"
              rows={2}
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              placeholder={t("adminQuiz.questionText")}
            />
          </div>

          <div>
            <label className="admin-form-label">Options</label>
            <div className="admin-options-grid">
              {form.options.map((opt, i) => (
                <div key={i} className="admin-option-row">
                  <label htmlFor={`admin-option-${i}`} className="admin-form-label">{t(`adminQuiz.option${OPTION_LABELS[i]}`)}</label>
                  <input
                    id={`admin-option-${i}`}
                    name={`option_${i}`}
                    className="admin-input"
                    value={opt}
                    onChange={e => {
                      const opts = [...form.options];
                      opts[i] = e.target.value;
                      setForm(f => ({ ...f, options: opts }));
                    }}
                    placeholder={`Option ${OPTION_LABELS[i]}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="admin-correct" className="admin-form-label">{t("adminQuiz.correctAnswer")}</label>
            <CustomSelect
              value={form.correct_index}
              onChange={val => setForm(f => ({ ...f, correct_index: Number(val) }))}
              options={OPTION_LABELS.map((label, i) => ({ value: i, label: `${label}: ${form.options[i] || `Option ${label}`}` }))}
            />
          </div>

          <div className="admin-form-row">
            <button
              className="admin-submit-btn"
              onClick={handleSave}
              disabled={createQuestion.isPending || updateQuestion.isPending}
            >
              {t("adminQuiz.saveQuestion")}
            </button>
            <button className="admin-action-btn" onClick={() => { setShowForm(false); setEditingId(null); }}>
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {levelQuestions.length === 0 && !showForm ? (
        <div className="admin-loading">{t("adminQuiz.noQuestions")}</div>
      ) : (
        <div className="admin-question-list">
          {pageQuestions.map(q => (
            <div key={q.id} className="admin-question-card">
              <div className="admin-question-text">{q.question}</div>
              <div className="admin-question-options">
                {(Array.isArray(q.options) ? q.options : []).map((opt, i) => (
                  <div key={i} className={`admin-question-option${i === q.correct_index ? " admin-question-option--correct" : ""}`}>
                    {OPTION_LABELS[i]}. {opt}{i === q.correct_index ? " ✓" : ""}
                  </div>
                ))}
              </div>
              <div className="admin-question-actions">
                <button className="admin-action-btn" onClick={() => openEditForm(q)}>{t("common.edit")}</button>
                <button
                  className="admin-action-btn admin-action-btn--danger"
                  onClick={() => setConfirmDeleteId(q.id)}
                  disabled={deleteQuestion.isPending}
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalQPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" onClick={() => setQPage(p => p - 1)} disabled={qPage === 0}>← Prev</button>
          <span className="admin-page-info">{qPage + 1} / {totalQPages}</span>
          <button className="admin-page-btn" onClick={() => setQPage(p => p + 1)} disabled={qPage >= totalQPages - 1}>Next →</button>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmModal
          message={t("adminQuiz.deleteConfirm")}
          onConfirm={() => { deleteQuestion.mutate(confirmDeleteId); setConfirmDeleteId(null); }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
