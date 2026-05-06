import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SoapNotePayload, ExerciseResult } from "../../content";

interface Props {
  lessonId: string;
  exerciseId: string;
  payload: SoapNotePayload;
  onComplete: (result: ExerciseResult) => void;
}

type SoapKey = "S" | "O" | "A" | "P";

export default function SoapNote({ lessonId, exerciseId, payload, onComplete }: Props) {
  const { t } = useTranslation();
  const soapMeta: Record<SoapKey, { label: string; heading: string; tint: string }> = {
    S: {
      label: "S",
      heading: t("learn.exercises.soapNote.headings.scripture"),
      tint: "border-emerald-200 bg-emerald-50/50",
    },
    O: {
      label: "O",
      heading: t("learn.exercises.soapNote.headings.observation"),
      tint: "border-sky-200 bg-sky-50/50",
    },
    A: {
      label: "A",
      heading: t("learn.exercises.soapNote.headings.application"),
      tint: "border-amber-200 bg-amber-50/50",
    },
    P: {
      label: "P",
      heading: t("learn.exercises.soapNote.headings.prayer"),
      tint: "border-violet-200 bg-violet-50/50",
    },
  };
  const [notes, setNotes] = useState<Record<SoapKey, string>>({ S: "", O: "", A: "", P: "" });
  const [saved, setSaved] = useState(false);

  const filled = (["S", "O", "A", "P"] as SoapKey[]).filter(
    (k) => notes[k].trim().length > 0,
  ).length;
  const canSave = filled >= 3;

  function handleSave() {
    // [SUPABASE HOOK] upsert study_notes row AND study_course_progress row (lesson_id, exercise_id, response_data=notes)
    setSaved(true);
    onComplete({
      lessonId,
      exerciseId,
      completedAt: new Date().toISOString(),
      score: filled,
      responseData: notes,
    });
  }

  return (
    <div className="rounded-md border border-violet-100 bg-white p-5 sm:p-7 shadow-sm dark:border-white/10 dark:bg-[#1a1033]">
      <div className="mb-6 rounded-md bg-violet-50 p-4 dark:bg-white/5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
          {payload.verseCitation}
        </p>
        <p className="text-lg leading-relaxed text-violet-900 dark:text-white">
          {t(payload.verseTextKey)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(["S", "O", "A", "P"] as SoapKey[]).map((k) => {
          const m = soapMeta[k];
          return (
            <div key={k} className={`rounded-md border p-4 ${m.tint} dark:border-white/10 dark:bg-white/[0.04]`}>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-violet-600 shadow-sm dark:bg-white/10 dark:text-violet-300">
                  {m.label}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{m.heading}</p>
                  <p className="text-xs text-slate-600 dark:text-white/65">{t(payload.promptKeys[k])}</p>
                </div>
              </div>
              <textarea
                value={notes[k]}
                onChange={(e) => setNotes((prev) => ({ ...prev, [k]: e.target.value }))}
                rows={4}
                placeholder={t("learn.exercises.soapNote.placeholder")}
                className="w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500 dark:text-white/55">{t("learn.exercises.soapNote.sectionsFilled", { filled })}</p>
        <button
          type="button"
          disabled={!canSave}
          onClick={handleSave}
          className="jw-focus-ring inline-flex cursor-pointer items-center justify-center rounded-md bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saved ? t("learn.exercises.soapNote.saved") : t("learn.exercises.soapNote.saveButton")}
        </button>
      </div>

      {saved && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100">
          {t("learn.exercises.soapNote.savedMessage")}
        </p>
      )}
    </div>
  );
}
