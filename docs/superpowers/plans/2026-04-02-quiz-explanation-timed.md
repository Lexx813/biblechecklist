# Quiz Enhancements — Explanation Mode + Timed Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two premium quiz enhancements: an explanation panel that slides up after each answer reveal, and a Timed Mode with a 60s countdown, score multipliers, and a separate leaderboard tab.

**Architecture:** DB migration adds `explanation text` to `quiz_questions` and `quiz_question_translations`, and creates a new `quiz_timed_scores` table. The existing `QuizLevel` component in `QuizPage.jsx` gains an explanation panel (shown after `isAnswered`) and a timer + multiplier state when Timed Mode is active. Timed scores are saved via a new `useTimedQuiz` hook and surfaced in a new "Timed" leaderboard tab.

**Tech Stack:** Next.js 15, React 19, Supabase (Postgres RLS), TanStack Query v5, vanilla CSS

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/add_quiz_enhancements.sql` | Create | explanation columns + quiz_timed_scores table |
| `src/api/quiz.js` | Modify | add explanation to getQuestionsForLevel query |
| `src/api/quizTimed.js` | Create | saveTimedScore, getTimedLeaderboard |
| `src/hooks/useQuizTimed.js` | Create | useSaveTimedScore, useTimedLeaderboard |
| `src/views/quiz/QuizPage.jsx` | Modify | ExplanationPanel component, Timed Mode timer/multiplier/toggle |
| `src/views/leaderboard/LeaderboardPage.jsx` | Modify | add "Timed" tab with level filter |
| `src/styles/quiz.css` | Modify | explanation panel styles, timed mode ring/badge styles |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/add_quiz_enhancements.sql`

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/add_quiz_enhancements.sql

-- 1. Add explanation column to quiz questions (source language = English)
alter table quiz_questions add column if not exists explanation text;

-- 2. Add explanation to translations table
alter table quiz_question_translations add column if not exists explanation text;

-- 3. Timed mode scores
create table if not exists quiz_timed_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  level int not null check (level between 1 and 12),
  score int not null,
  achieved_at timestamptz default now()
);

alter table quiz_timed_scores enable row level security;

-- All authenticated users can read (for leaderboard)
create policy "Authenticated read timed scores"
  on quiz_timed_scores for select
  using (auth.role() = 'authenticated');

-- Users can only insert their own scores
create policy "Users insert own timed scores"
  on quiz_timed_scores for insert
  with check (auth.uid() = user_id);

create index if not exists idx_quiz_timed_scores_level_score
  on quiz_timed_scores(level, score desc);

create index if not exists idx_quiz_timed_scores_user
  on quiz_timed_scores(user_id);
```

- [ ] **Step 2: Apply migration**

Run in Supabase SQL editor or via `supabase db push`.

- [ ] **Step 3: Verify**

```sql
-- Check columns exist
select column_name from information_schema.columns
where table_name = 'quiz_questions' and column_name = 'explanation';

select column_name from information_schema.columns
where table_name = 'quiz_question_translations' and column_name = 'explanation';

-- Check table exists
select table_name from information_schema.tables
where table_name = 'quiz_timed_scores';
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/add_quiz_enhancements.sql
git commit -m "feat: add quiz explanation columns and timed scores table"
```

---

## Task 2: Update Quiz API to Include Explanation

**Files:**
- Modify: `src/api/quiz.js`

- [ ] **Step 1: Find getQuestionsForLevel**

In `src/api/quiz.js`, find the function `getQuestionsForLevel`. It currently selects:
```js
.select("id, question, options, correct_index, quiz_question_translations(...)")
```

- [ ] **Step 2: Add explanation to select**

Update the select to include explanation for both the base question and translations:

```js
getQuestionsForLevel: async (level, language = "en") => {
  const { data, error } = await supabase
    .from("quiz_questions")
    .select(`
      id,
      question,
      options,
      correct_index,
      explanation,
      quiz_question_translations (
        language,
        question,
        options,
        explanation
      )
    `)
    .eq("level", level)
    .order("sort_order");

  if (error) throw error;

  // Map to final shape: prefer translation for user's language, fall back to English
  return (data ?? []).map((q) => {
    const tx = q.quiz_question_translations?.find((t) => t.language === language);
    return {
      id: q.id,
      question: tx?.question ?? q.question,
      options: tx?.options ?? q.options,
      correct_index: q.correct_index,
      explanation: tx?.explanation ?? q.explanation ?? null,
    };
  });
},
```

- [ ] **Step 3: Build to verify**

```bash
npm run build
# Expected: no type/import errors
```

- [ ] **Step 4: Commit**

```bash
git add src/api/quiz.js
git commit -m "feat: include explanation in quiz questions query"
```

---

## Task 3: Timed Score API + Hook

**Files:**
- Create: `src/api/quizTimed.js`
- Create: `src/hooks/useQuizTimed.js`

- [ ] **Step 1: Write timed API**

```js
// src/api/quizTimed.js
import { supabase } from "../lib/supabase";

export const quizTimedApi = {
  saveTimedScore: async (userId, level, score) => {
    const { error } = await supabase
      .from("quiz_timed_scores")
      .insert({ user_id: userId, level, score });
    if (error) throw error;
  },

  getTimedLeaderboard: async (level) => {
    // Get best score per user for a given level
    const { data, error } = await supabase
      .from("quiz_timed_scores")
      .select(`
        user_id,
        score,
        achieved_at,
        profiles (display_name, avatar_url)
      `)
      .eq("level", level)
      .order("score", { ascending: false })
      .limit(50);

    if (error) throw error;

    // Deduplicate: one entry per user (their best score, which is first due to ordering)
    const seen = new Set();
    return (data ?? [])
      .filter((row) => {
        if (seen.has(row.user_id)) return false;
        seen.add(row.user_id);
        return true;
      })
      .map((row, i) => ({
        rank: i + 1,
        userId: row.user_id,
        displayName: row.profiles?.display_name ?? "Anonymous",
        avatarUrl: row.profiles?.avatar_url ?? null,
        score: row.score,
        achievedAt: row.achieved_at,
      }));
  },

  getUserBestScore: async (userId, level) => {
    const { data, error } = await supabase
      .from("quiz_timed_scores")
      .select("score")
      .eq("user_id", userId)
      .eq("level", level)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.score ?? null;
  },
};
```

- [ ] **Step 2: Write timed hooks**

```js
// src/hooks/useQuizTimed.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quizTimedApi } from "../api/quizTimed";

export function useTimedLeaderboard(level) {
  return useQuery({
    queryKey: ["timedLeaderboard", level],
    queryFn: () => quizTimedApi.getTimedLeaderboard(level),
    enabled: !!level,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUserBestTimedScore(userId, level) {
  return useQuery({
    queryKey: ["timedBest", userId, level],
    queryFn: () => quizTimedApi.getUserBestScore(userId, level),
    enabled: !!userId && !!level,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveTimedScore(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ level, score }) => quizTimedApi.saveTimedScore(userId, level, score),
    onSuccess: (_, { level }) => {
      queryClient.invalidateQueries({ queryKey: ["timedLeaderboard", level] });
      queryClient.invalidateQueries({ queryKey: ["timedBest", userId, level] });
    },
  });
}
```

- [ ] **Step 3: Build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/api/quizTimed.js src/hooks/useQuizTimed.js
git commit -m "feat: add timed quiz score API and hooks"
```

---

## Task 4: Explanation Panel in QuizLevel

**Files:**
- Modify: `src/views/quiz/QuizPage.jsx`
- Modify: `src/styles/quiz.css`

- [ ] **Step 1: Add explanation panel styles to quiz.css**

Append to `src/styles/quiz.css`:

```css
/* ── Explanation panel ─────────────────────────────────────── */
.quiz-explanation {
  margin-top: 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--card-bg);
  overflow: hidden;
  animation: explanation-slide-up 0.25s ease both;
}

@keyframes explanation-slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .quiz-explanation { animation: none; }
}

.quiz-explanation-inner {
  padding: 14px 16px;
}

.quiz-explanation-ref {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 6px;
}

.quiz-explanation-text {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

/* Blurred state for free users */
.quiz-explanation--locked .quiz-explanation-text {
  filter: blur(4px);
  user-select: none;
}

.quiz-explanation-gate {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 0.8rem;
  color: var(--gold);
  cursor: pointer;
}
```

- [ ] **Step 2: Add Timed Mode styles to quiz.css**

Append:

```css
/* ── Timed Mode ────────────────────────────────────────────── */
.quiz-timed-toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 0 4px;
}

.quiz-timed-toggle-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.quiz-timed-toggle-label .gold-badge {
  font-size: 0.7rem;
  color: var(--gold);
  font-weight: 600;
}

/* Toggle switch */
.quiz-timed-toggle {
  position: relative;
  width: 40px;
  height: 22px;
  cursor: pointer;
}

.quiz-timed-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.quiz-timed-toggle-track {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  background: var(--border);
  transition: background 0.2s;
}

.quiz-timed-toggle input:checked + .quiz-timed-toggle-track {
  background: var(--accent);
}

.quiz-timed-toggle-thumb {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  top: 3px;
  left: 3px;
  transition: left 0.2s;
}

.quiz-timed-toggle input:checked ~ .quiz-timed-toggle-thumb {
  left: 21px;
}

/* Timer ring */
.quiz-timer-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.quiz-timer-ring {
  position: relative;
  width: 56px;
  height: 56px;
}

.quiz-timer-ring svg {
  transform: rotate(-90deg);
}

.quiz-timer-ring circle.track {
  stroke: var(--border);
  fill: none;
}

.quiz-timer-ring circle.fill {
  fill: none;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear, stroke 0.5s;
}

.quiz-timer-ring-number {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
}

.quiz-multiplier-badge {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--accent);
  min-width: 32px;
  text-align: center;
}

/* Timed results */
.quiz-timed-result {
  margin-top: 8px;
  padding: 10px 14px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 0.88rem;
}

.quiz-timed-new-best {
  color: var(--gold);
  font-weight: 700;
  margin-top: 4px;
}
```

- [ ] **Step 3: Add ExplanationPanel component to QuizPage.jsx**

In `QuizPage.jsx`, add this component near the top (after LEVELS definition, before QuizLevelCard):

```jsx
// ── ExplanationPanel ────────────────────────────────────────────────────────

function ExplanationPanel({ question, isPremium, onUpgrade }) {
  if (!question?.explanation) return null;

  return (
    <div className={`quiz-explanation${isPremium ? "" : " quiz-explanation--locked"}`}>
      <div className="quiz-explanation-inner">
        <div className="quiz-explanation-ref">💡 Explanation</div>
        <p className="quiz-explanation-text">{question.explanation}</p>
        {!isPremium && (
          <button
            className="quiz-explanation-gate"
            onClick={onUpgrade}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            ✦ See explanations — Go Premium
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add explanation to QuizLevel's answer-revealed section**

In `QuizLevel`, find this existing block:
```jsx
{isAnswered && (
  <div className="quiz-next-wrap">
    <button className="quiz-btn quiz-btn--primary" onClick={handleNext}>
      {isLastQuestion ? t("quiz.seeResults") : t("quiz.next")}
    </button>
  </div>
)}
```

Wrap it to also render the explanation panel above the Next button:
```jsx
{isAnswered && (
  <>
    <ExplanationPanel
      question={currentQuestion}
      isPremium={isPremium}
      onUpgrade={onUpgrade}
    />
    <div className="quiz-next-wrap">
      <button className="quiz-btn quiz-btn--primary" onClick={handleNext}>
        {isLastQuestion ? t("quiz.seeResults") : t("quiz.next")}
      </button>
    </div>
  </>
)}
```

- [ ] **Step 5: Manual verify**

```bash
npm run dev
# Answer a quiz question
# Verify: explanation panel slides up after answer reveal
# Verify: premium users see explanation text clearly
# Verify: free users see blurred text + "✦ See explanations" CTA
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/views/quiz/QuizPage.jsx src/styles/quiz.css
git commit -m "feat: add explanation panel to quiz after answer reveal"
```

---

## Task 5: Timed Mode — Timer + Multiplier + Score Saving

**Files:**
- Modify: `src/views/quiz/QuizPage.jsx`

- [ ] **Step 1: Add timed mode imports**

In `QuizPage.jsx`, add imports:
```js
import { useEffect, useRef } from "react";
import { useSaveTimedScore, useUserBestTimedScore } from "../../hooks/useQuizTimed";
```

- [ ] **Step 2: Add TimerRing component**

Add near ExplanationPanel in QuizPage.jsx:
```jsx
// ── TimerRing ───────────────────────────────────────────────────────────────

const TIMER_MAX = 60;
const CIRCUMFERENCE = 2 * Math.PI * 22; // r=22

function TimerRing({ timeLeft }) {
  const pct = timeLeft / TIMER_MAX;
  const offset = CIRCUMFERENCE * (1 - pct);
  const strokeColor = timeLeft > 30 ? "#10b981" : timeLeft > 10 ? "#f59e0b" : "#ef4444";

  return (
    <div className="quiz-timer-ring">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle className="track" cx="28" cy="28" r="22" strokeWidth="4" />
        <circle
          className="fill"
          cx="28" cy="28" r="22" strokeWidth="4"
          stroke={strokeColor}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="quiz-timer-ring-number">{timeLeft}</span>
    </div>
  );
}

function getMultiplier(timeLeft) {
  if (timeLeft > 50) return 3;
  if (timeLeft >= 30) return 2;
  return 1;
}
```

- [ ] **Step 3: Add timed mode state to QuizPage hub**

In the `QuizPage` (hub) component, add a `timedMode` toggle before the level grid:

```jsx
// In QuizPage (hub) component, add state:
const [timedMode, setTimedMode] = useState(false);

// In JSX, add after quiz-hub-header and before level grid:
<div className="quiz-timed-toggle-row">
  <span className="quiz-timed-toggle-label">
    Timed Mode
    <span className="gold-badge">✦ Premium</span>
  </span>
  <label className="quiz-timed-toggle">
    <input
      type="checkbox"
      checked={timedMode}
      onChange={(e) => {
        if (!isPremium) { onUpgrade?.(); return; }
        setTimedMode(e.target.checked);
      }}
      disabled={!isPremium}
    />
    <span className="quiz-timed-toggle-track" />
    <span className="quiz-timed-toggle-thumb" />
  </label>
</div>
```

Pass `timedMode` to `QuizLevel` when navigating:
```jsx
onClick={() => navigate("quizLevel", { level: levelData.level, timedMode })}
```

- [ ] **Step 4: Add timer logic to QuizLevel**

In `QuizLevel`, accept `timedMode` prop and add timer state:

```jsx
export function QuizLevel({ level, user, timedMode = false, onBack, onComplete, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  // ... existing state ...

  // Timed mode state
  const [timeLeft, setTimeLeft] = useState(TIMER_MAX);
  const [timedScores, setTimedScores] = useState([]); // score earned per question
  const timerRef = useRef(null);
  const saveTimedScore = useSaveTimedScore(user.id);
  const { data: prevBest } = useUserBestTimedScore(user.id, level);

  // Start/restart timer on new question
  useEffect(() => {
    if (!timedMode || isAnswered || showResults) return;
    setTimeLeft(TIMER_MAX);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          // Auto-advance as wrong answer
          const correct = false;
          setSelectedIndex(-1); // -1 = timed out
          setAnswers((prev) => [
            ...prev,
            { questionIndex: currentIndex, selectedIndex: -1, correct, timedOut: true },
          ]);
          setTimedScores((prev) => [...prev, 0]);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, timedMode]);

  // Stop timer when answered
  useEffect(() => {
    if (isAnswered && timerRef.current) {
      clearInterval(timerRef.current);
      if (timedMode) {
        const multiplier = getMultiplier(timeLeft);
        const questionScore = selectedIndex === currentQuestion?.correct_index
          ? 10 * multiplier
          : 0;
        setTimedScores((prev) => {
          if (prev.length === currentIndex) return [...prev, questionScore];
          return prev;
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnswered]);

  // Save timed score when results shown
  useEffect(() => {
    if (!showResults || submitted || !timedMode) return;
    setSubmitted(true);
    const finalScore = answers.filter((a) => a.correct).length;
    submitQuiz.mutate({ level, score: finalScore });

    const totalTimedScore = timedScores.reduce((s, n) => s + n, 0);
    saveTimedScore.mutate({ level, score: totalTimedScore });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResults]);
```

- [ ] **Step 5: Render timer ring in QuizLevel**

In the active quiz JSX (between progress bar and question card), add:
```jsx
{timedMode && !isAnswered && (
  <div className="quiz-timer-wrap">
    <TimerRing timeLeft={timeLeft} />
    <span className="quiz-multiplier-badge">{getMultiplier(timeLeft)}×</span>
  </div>
)}
```

In the results section, add timed score summary after the standard score:
```jsx
{timedMode && (
  <div className="quiz-timed-result">
    <div>Timed Score: <strong>{timedScores.reduce((s, n) => s + n, 0)}</strong> pts</div>
    {prevBest !== null && timedScores.reduce((s, n) => s + n, 0) > prevBest && (
      <div className="quiz-timed-new-best">🏆 New best!</div>
    )}
  </div>
)}
```

- [ ] **Step 6: Build and verify**

```bash
npm run build
npm run dev
# 1. Toggle Timed Mode ON in quiz hub
# 2. Start a level — verify 60s countdown ring appears
# 3. Answer quickly — verify 3× multiplier shown, then 2×, then 1×
# 4. Let timer expire — verify question auto-advances as wrong
# 5. Complete level — verify timed score shown in results
```

- [ ] **Step 7: Commit**

```bash
git add src/views/quiz/QuizPage.jsx
git commit -m "feat: add timed mode to quiz with timer ring, multiplier, and score saving"
```

---

## Task 6: Timed Leaderboard Tab

**Files:**
- Modify: `src/views/leaderboard/LeaderboardPage.jsx` (or wherever the existing leaderboard lives)

- [ ] **Step 1: Find leaderboard file**

```bash
find src -name "*.jsx" | xargs grep -l "leaderboard\|Leaderboard" | head -5
```

- [ ] **Step 2: Add "Timed" tab**

In the leaderboard page, find the existing tab bar and add a "Timed" tab:

```jsx
// Add to existing tabs state/array:
const [tab, setTab] = useState("standard"); // "standard" | "timed"
const [timedLevel, setTimedLevel] = useState(1);

// Tab bar JSX — add alongside existing tab buttons:
<button
  className={`lb-tab${tab === "timed" ? " lb-tab--active" : ""}`}
  onClick={() => setTab("timed")}
>
  Timed
</button>
```

- [ ] **Step 3: Add timed leaderboard content**

Add import at top of leaderboard file:
```js
import { useTimedLeaderboard } from "../../hooks/useQuizTimed";
```

In the leaderboard page render, add the timed tab content:
```jsx
{tab === "timed" && (
  <div className="lb-timed">
    <div className="lb-timed-filter">
      <label htmlFor="timed-level-select">Level</label>
      <select
        id="timed-level-select"
        value={timedLevel}
        onChange={(e) => setTimedLevel(Number(e.target.value))}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <option key={i + 1} value={i + 1}>Level {i + 1}</option>
        ))}
      </select>
    </div>
    <TimedLeaderboardList level={timedLevel} currentUserId={user?.id} />
  </div>
)}
```

Add `TimedLeaderboardList` component:
```jsx
function TimedLeaderboardList({ level, currentUserId }) {
  const { data: entries = [], isLoading } = useTimedLeaderboard(level);

  if (isLoading) return <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />;
  if (!entries.length) return <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: "32px 0" }}>No scores yet for this level.</p>;

  return (
    <ol className="lb-list">
      {entries.map((entry) => (
        <li
          key={entry.userId}
          className={`lb-row${entry.userId === currentUserId ? " lb-row--self" : ""}`}
        >
          <span className="lb-rank">#{entry.rank}</span>
          <span className="lb-name">{entry.displayName}</span>
          <span className="lb-score">{entry.score} pts</span>
          <span className="lb-date">
            {new Date(entry.achievedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 4: Build and verify**

```bash
npm run build
npm run dev
# Navigate to Leaderboard
# Verify "Timed" tab appears
# Verify level dropdown filters results
# After completing a timed quiz, verify score appears in leaderboard
```

- [ ] **Step 5: Commit**

```bash
git add src/views/leaderboard/LeaderboardPage.jsx
git commit -m "feat: add Timed leaderboard tab with level filter"
```

---

## Self-Review Checklist

- [ ] `explanation` column exists on both `quiz_questions` and `quiz_question_translations`
- [ ] `quiz_timed_scores` table exists with correct RLS (public read, own insert)
- [ ] `getQuestionsForLevel` returns `explanation` field (falls back to English if translation null)
- [ ] Explanation panel only shows when `question.explanation` is not null
- [ ] Free users see blurred explanation text + upgrade CTA (blur applied via CSS class)
- [ ] Timed mode toggle shows ✦ Premium badge; tapping while free opens upgrade modal
- [ ] Timer stops when question is answered (clearInterval)
- [ ] Timer expiry auto-advances as wrong answer
- [ ] Score multiplier: >50s → 3×, 30-50s → 2×, <30s → 1×, timeout → 0
- [ ] Timed score saved to `quiz_timed_scores` after level complete
- [ ] Explanations NOT shown during Timed Mode (spec requirement — add guard: `{isAnswered && !timedMode && <ExplanationPanel ... />}`)
- [ ] `isPremium` uses existing `useSubscription` hook (covers active/trialing/gifted) ✅
