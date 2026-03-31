import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageNav from "../../components/PageNav";
import { familyQuizApi } from "../../api/familyQuiz";
import "../../styles/family-quiz.css";

// ── LEVELS ────────────────────────────────────────────────────────────────────

const LEVEL_LABELS = {
  1:  "Level 1 — Bible Basics",
  2:  "Level 2 — Creation & Early History",
  3:  "Level 3 — Patriarchs & Promises",
  4:  "Level 4 — Family & Nation",
  5:  "Level 5 — Exodus & Law",
  6:  "Level 6 — Judges & Kings",
  7:  "Level 7 — Psalms & Proverbs",
  8:  "Level 8 — Prophets",
  9:  "Level 9 — Gospels",
  10: "Level 10 — Acts & Letters",
  11: "Level 11 — Revelation",
  12: "Level 12 — The Final Test",
};

const ALL_LEVELS = Object.keys(LEVEL_LABELS).map(Number);

// ── SHARE LINK ────────────────────────────────────────────────────────────────

function shareLink(challengeId) {
  return `${window.location.origin}/family-quiz/${challengeId}`;
}

async function copyLink(challengeId) {
  await navigator.clipboard.writeText(shareLink(challengeId));
}

// ── LOBBY ─────────────────────────────────────────────────────────────────────

function Lobby({ user, onPlay }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: myChallenges = [], isLoading: myLoading } = useQuery({
    queryKey: ["myChallenges", user.id],
    queryFn: () => familyQuizApi.getMyChallenges(user.id),
    staleTime: 60_000,
  });

  const { data: attempted = [], isLoading: attLoading } = useQuery({
    queryKey: ["myAttempted", user.id],
    queryFn: () => familyQuizApi.getMyAttemptedChallenges(user.id),
    staleTime: 60_000,
  });

  return (
    <div className="fq-lobby">
      <div className="fq-lobby-header">
        <div className="fq-lobby-icon">🏆</div>
        <h1 className="fq-lobby-title">Family Bible Challenge</h1>
        <p className="fq-lobby-sub">
          Create a quiz, share the link, and challenge your family to beat your score!
        </p>
        <button className="fq-create-btn" onClick={() => setShowCreate(true)}>
          + Create Challenge
        </button>
      </div>

      {showCreate && (
        <CreateForm
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            queryClient.invalidateQueries({ queryKey: ["myChallenges", user.id] });
            setShowCreate(false);
            onPlay(id, true); // true = just created, prompt to play first
          }}
        />
      )}

      <div className="fq-section">
        <h2 className="fq-section-title">My Challenges</h2>
        {myLoading ? (
          <div className="fq-empty">Loading…</div>
        ) : myChallenges.length === 0 ? (
          <div className="fq-empty">You haven't created any challenges yet.</div>
        ) : (
          <ul className="fq-card-list">
            {myChallenges.map(c => (
              <ChallengeCard key={c.id} challenge={c} onOpen={() => onPlay(c.id, false)} isOwn />
            ))}
          </ul>
        )}
      </div>

      {attempted.length > 0 && (
        <div className="fq-section">
          <h2 className="fq-section-title">Challenges I've Taken</h2>
          {attLoading ? (
            <div className="fq-empty">Loading…</div>
          ) : (
            <ul className="fq-card-list">
              {attempted.map(c => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  onOpen={() => onPlay(c.id, false)}
                  myScore={c.myScore}
                  myTotal={c.myTotal}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── CHALLENGE CARD ────────────────────────────────────────────────────────────

function ChallengeCard({ challenge, onOpen, isOwn, myScore, myTotal }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e) {
    e.stopPropagation();
    await copyLink(challenge.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const qs = challenge.question_ids?.length ?? 0;
  const date = new Date(challenge.created_at).toLocaleDateString();

  return (
    <li className="fq-card" onClick={onOpen} role="button" tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onOpen()}>
      <div className="fq-card-info">
        <div className="fq-card-title">{challenge.title}</div>
        <div className="fq-card-meta">
          {qs} question{qs !== 1 ? "s" : ""} · {date}
          {isOwn && <span className="fq-badge fq-badge--mine">Mine</span>}
          {myScore != null && (
            <span className="fq-badge fq-badge--score">
              {myScore}/{myTotal}
            </span>
          )}
        </div>
      </div>
      <button className="fq-copy-btn" onClick={handleCopy} aria-label="Copy share link">
        {copied ? "✓ Copied" : "Share"}
      </button>
    </li>
  );
}

// ── CREATE FORM ───────────────────────────────────────────────────────────────

const COUNT_OPTIONS = [5, 10, 15, 20];

function CreateForm({ user, onClose, onCreated }) {
  const [title, setTitle] = useState("Family Bible Challenge");
  const [count, setCount] = useState(10);
  const [levelMode, setLevelMode] = useState("all"); // "all" | "pick"
  const [pickedLevels, setPickedLevels] = useState([]);
  const [error, setError] = useState(null);

  const create = useMutation({
    mutationFn: async () => {
      const levels = levelMode === "pick" ? pickedLevels : [];
      const questions = await familyQuizApi.pickQuestions(count, levels);
      if (questions.length < count) throw new Error(
        `Not enough questions for the selected level${pickedLevels.length !== 1 ? "s" : ""}. Try adding more levels.`
      );
      const ids = questions.map(q => q.id);
      return familyQuizApi.createChallenge(user.id, title.trim() || "Family Bible Challenge", ids);
    },
    onSuccess: (id) => onCreated(id),
    onError: (e) => setError(e.message),
  });

  function toggleLevel(lvl) {
    setPickedLevels(prev =>
      prev.includes(lvl) ? prev.filter(l => l !== lvl) : [...prev, lvl]
    );
  }

  return (
    <div className="fq-create-overlay" onClick={onClose}>
      <div className="fq-create-panel" onClick={e => e.stopPropagation()}>
        <button className="fq-create-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="fq-create-title">New Challenge</h2>

        <label className="fq-label">Challenge name</label>
        <input
          className="fq-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={80}
          placeholder="e.g. Sunday Family Quiz"
        />

        <label className="fq-label">Number of questions</label>
        <div className="fq-count-row">
          {COUNT_OPTIONS.map(n => (
            <button
              key={n}
              type="button"
              className={`fq-count-btn${count === n ? " fq-count-btn--active" : ""}`}
              onClick={() => setCount(n)}
            >
              {n}
            </button>
          ))}
        </div>

        <label className="fq-label">Question source</label>
        <div className="fq-mode-row">
          <button
            type="button"
            className={`fq-mode-btn${levelMode === "all" ? " fq-mode-btn--active" : ""}`}
            onClick={() => setLevelMode("all")}
          >
            All 240 Questions
          </button>
          <button
            type="button"
            className={`fq-mode-btn${levelMode === "pick" ? " fq-mode-btn--active" : ""}`}
            onClick={() => setLevelMode("pick")}
          >
            Pick Levels
          </button>
        </div>

        {levelMode === "pick" && (
          <div className="fq-level-grid">
            {ALL_LEVELS.map(lvl => (
              <button
                key={lvl}
                type="button"
                className={`fq-level-chip${pickedLevels.includes(lvl) ? " fq-level-chip--on" : ""}`}
                onClick={() => toggleLevel(lvl)}
              >
                {LEVEL_LABELS[lvl]}
              </button>
            ))}
          </div>
        )}

        {error && <div className="fq-form-error">{error}</div>}

        <button
          className="fq-submit-btn"
          onClick={() => create.mutate()}
          disabled={create.isPending || (levelMode === "pick" && pickedLevels.length === 0)}
        >
          {create.isPending ? "Creating…" : "Create Challenge"}
        </button>
      </div>
    </div>
  );
}

// ── CHALLENGE VIEW (play + results) ──────────────────────────────────────────

function ChallengeView({ user, challengeId, justCreated, onBack }) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState("landing");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // array of chosen indices
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: challenge, isLoading: cLoading, error: cError } = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () => familyQuizApi.getChallenge(challengeId),
    staleTime: 5 * 60_000,
  });


  const { data: myAttempt } = useQuery({
    queryKey: ["myAttempt", challengeId, user.id],
    queryFn: () => familyQuizApi.getMyAttempt(challengeId, user.id),
    enabled: !!challenge,
    staleTime: 60_000,
  });

  const { data: attempts = [], isLoading: attLoading } = useQuery({
    queryKey: ["attempts", challengeId],
    queryFn: () => familyQuizApi.getAttempts(challengeId),
    enabled: phase === "results",
    staleTime: 30_000,
  });

  const submit = useMutation({
    mutationFn: ({ answers, score, total }) =>
      familyQuizApi.submitAttempt(challengeId, user.id, answers, score, total),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myAttempt", challengeId, user.id] });
      queryClient.invalidateQueries({ queryKey: ["attempts", challengeId] });
      queryClient.invalidateQueries({ queryKey: ["myAttempted", user.id] });
      setPhase("results");
    },
  });

  async function handleCopy() {
    await copyLink(challengeId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function startQuiz() {
    setQIndex(0);
    setAnswers([]);
    setSelected(null);
    setRevealed(false);
    setPhase("quiz");
  }

  function handleSelect(idx) {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
  }

  function handleNext() {
    const q = challenge.questions[qIndex];
    const newAnswers = [...answers, selected];

    if (qIndex + 1 >= challenge.questions.length) {
      // Last question — submit
      const score = newAnswers.filter((a, i) => a === challenge.questions[i].correct_index).length;
      submit.mutate({ answers: newAnswers, score, total: challenge.questions.length });
    } else {
      setAnswers(newAnswers);
      setQIndex(qIndex + 1);
      setSelected(null);
      setRevealed(false);
    }
  }

  // ── render states ──────────────────────────────────────────────────────────

  if (cLoading || !challenge) {
    if (cError) {
      return (
        <div className="fq-center">
          <div className="fq-error-icon">⚠</div>
          <p>Challenge not found or no longer available.</p>
          <button className="fq-back-link" onClick={onBack}>← Back</button>
        </div>
      );
    }
    return (
      <div className="fq-center">
        <div className="fq-spinner" />
        <p>Loading challenge…</p>
      </div>
    );
  }

  // ── landing (pre-game info) ────────────────────────────────────────────────

  if (phase === "landing") {
    const alreadyDone = !!myAttempt;
    return (
      <div className="fq-landing">
        <div className="fq-landing-hero">
          <div className="fq-landing-icon">🏆</div>
          <h1 className="fq-landing-title">{challenge.title}</h1>
          <p className="fq-landing-meta">
            Created by <strong>{challenge.profiles?.display_name ?? "someone"}</strong>
            {" · "}{challenge.questions.length} questions
          </p>
        </div>

        {alreadyDone && (
          <div className="fq-already-done">
            You scored <strong>{myAttempt.score}/{myAttempt.total}</strong> on this challenge.
          </div>
        )}

        <div className="fq-landing-actions">
          {alreadyDone ? (
            <button className="fq-primary-btn" onClick={() => setPhase("results")}>
              View Leaderboard
            </button>
          ) : (
            <button className="fq-primary-btn" onClick={startQuiz}>
              Start Quiz
            </button>
          )}
          <button className="fq-share-btn" onClick={handleCopy}>
            {copied ? "✓ Link Copied!" : "Share Challenge"}
          </button>
        </div>

        {justCreated && (
          <div className="fq-created-hint">
            Share this challenge link with family and friends so they can compete for the top score!
          </div>
        )}
      </div>
    );
  }

  // ── quiz ──────────────────────────────────────────────────────────────────

  if (phase === "quiz") {
    const q = challenge.questions[qIndex];
    const total = challenge.questions.length;
    const progress = ((qIndex) / total) * 100;

    return (
      <div className="fq-quiz">
        <div className="fq-quiz-header">
          <button className="fq-back-link" onClick={onBack}>✕</button>
          <div className="fq-quiz-progress-wrap">
            <div className="fq-quiz-progress-bar">
              <div className="fq-quiz-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="fq-quiz-counter">{qIndex + 1} / {total}</span>
          </div>
        </div>

        <div className="fq-question-card">
          <div className="fq-question-level">Level {q.level}</div>
          <p className="fq-question-text">{q.question}</p>
        </div>

        <div className="fq-options">
          {q.options.map((opt, idx) => {
            let cls = "fq-option";
            if (revealed) {
              if (idx === q.correct_index) cls += " fq-option--correct";
              else if (idx === selected) cls += " fq-option--wrong";
            } else if (idx === selected) {
              cls += " fq-option--selected";
            }
            return (
              <button key={idx} className={cls} onClick={() => handleSelect(idx)} disabled={revealed}>
                <span className="fq-option-letter">{String.fromCharCode(65 + idx)}</span>
                <span className="fq-option-text">{opt}</span>
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className={`fq-feedback ${selected === q.correct_index ? "fq-feedback--is-correct" : "fq-feedback--is-wrong"}`}>
            <div className="fq-feedback-msg">
              {selected === q.correct_index ? (
                <span className="fq-feedback--correct">Correct!</span>
              ) : (
                <span className="fq-feedback--wrong">
                  Answer: <strong>{q.options[q.correct_index]}</strong>
                </span>
              )}
            </div>
            <button
              className="fq-next-btn"
              onClick={handleNext}
              disabled={submit.isPending}
            >
              {qIndex + 1 >= total
                ? (submit.isPending ? "Saving…" : "Finish")
                : "Next →"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── results ───────────────────────────────────────────────────────────────

  if (phase === "results") {
    const myResult = myAttempt ?? attempts.find(a => a.user_id === user.id);
    const myPct = myResult ? Math.round((myResult.score / myResult.total) * 100) : null;

    return (
      <div className="fq-results">
        <div className="fq-results-header">
          <div className="fq-results-trophy">🏆</div>
          <h1 className="fq-results-title">{challenge.title}</h1>
          {myResult && (
            <div className="fq-my-score">
              <span className="fq-my-score-num">{myResult.score}/{myResult.total}</span>
              <span className="fq-my-score-pct">{myPct}%</span>
            </div>
          )}
        </div>

        <div className="fq-share-row">
          <button className="fq-share-btn" onClick={handleCopy}>
            {copied ? "✓ Link Copied!" : "Invite others"}
          </button>
        </div>

        <div className="fq-leaderboard">
          <h2 className="fq-lb-title">Leaderboard</h2>
          {attLoading ? (
            <div className="fq-empty">Loading results…</div>
          ) : attempts.length === 0 ? (
            <div className="fq-empty">No attempts yet.</div>
          ) : (
            <ol className="fq-lb-list">
              {attempts.map((a, i) => {
                const pct = Math.round((a.score / a.total) * 100);
                const isMe = a.user_id === user.id;
                return (
                  <li key={a.id} className={`fq-lb-row${isMe ? " fq-lb-row--me" : ""}`}>
                    <span className="fq-lb-rank">{i + 1}</span>
                    <span className="fq-lb-name">
                      {a.profiles?.display_name ?? "Anonymous"}
                      {isMe && <span className="fq-lb-you"> (you)</span>}
                    </span>
                    <span className="fq-lb-score">{a.score}/{a.total}</span>
                    <div className="fq-lb-bar-wrap">
                      <div className="fq-lb-bar" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="fq-lb-pct">{pct}%</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <button className="fq-back-link" onClick={onBack}>← Back to challenges</button>
      </div>
    );
  }

  return null;
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function FamilyQuizPage({ user, navigate, initialChallengeId, ...navProps }) {
  const [openChallenge, setOpenChallenge] = useState(
    initialChallengeId ? { id: initialChallengeId, justCreated: false } : null
  );

  const handlePlay = useCallback((id, justCreated = false) => {
    setOpenChallenge({ id, justCreated });
  }, []);

  const handleBack = useCallback(() => {
    setOpenChallenge(null);
  }, []);

  return (
    <>
      <PageNav navigate={navigate} {...navProps} />
      <div className="fq-page">
        {openChallenge ? (
          <ChallengeView
            user={user}
            challengeId={openChallenge.id}
            justCreated={openChallenge.justCreated}
            onBack={handleBack}
          />
        ) : (
          <Lobby user={user} onPlay={handlePlay} />
        )}
      </div>
    </>
  );
}
