// Future Supabase schema (per-user course progress):
//
//   create table study_course_progress (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid references auth.users not null,
//     lesson_id text not null,
//     exercise_id text,
//     completed_at timestamptz default now(),
//     score int,
//     response_data jsonb,
//     unique(user_id, lesson_id, exercise_id)
//   );

export type HighlightCategory =
  | "promise"
  | "command"
  | "warning"
  | "quality"
  | "reference";

// All user-facing text in this file is referenced by i18n key.
// Bible-reference strings (e.g. "Acts 17:11", "Hebrews 4:12") are kept as
// plain strings; book-name localization will be handled in a separate pass.

export interface HighlightExercisePayload {
  kind: "highlight";
  passageCitation: string; // TODO i18n: Bible reference, leave as-is for now
  passageSourceKey: string;
  tokenKeys: string[];
  guide: Array<{ category: HighlightCategory; hintKey: string }>;
}

export interface QuestionLadderPayload {
  kind: "ladder";
  verseCitation: string; // TODO i18n: Bible reference
  verseTextKey: string;
  rungs: Array<{
    key: "who" | "what" | "when_where" | "why" | "how";
    promptKey: string;
    hintKey: string;
  }>;
}

export interface CrossReferenceQuizPayload {
  kind: "crossref";
  introKey: string;
  questions: Array<{
    id: string;
    scenarioKey: string;
    options: Array<{ id: string; labelKey: string }>;
    correctOptionId: string;
    explanationKey: string;
  }>;
}

export interface SoapNotePayload {
  kind: "soap";
  verseCitation: string; // TODO i18n: Bible reference
  verseTextKey: string;
  promptKeys: { S: string; O: string; A: string; P: string };
}

export interface MeditatePayload {
  kind: "meditate";
  introVerse?: { citation: string; textKey: string };
  promptKeys: string[];
  timerSeconds?: number;
}

export type ExercisePayload =
  | HighlightExercisePayload
  | QuestionLadderPayload
  | CrossReferenceQuizPayload
  | SoapNotePayload
  | MeditatePayload;

export interface Exercise {
  id: string;
  titleKey: string;
  payload: ExercisePayload;
}

export type LessonBodyBlock =
  | { kind: "p"; textKey: string }
  | { kind: "h3"; textKey: string }
  | { kind: "blockquote"; textKey: string; cite?: string }
  | { kind: "list"; itemKeys: string[] };

export interface Lesson {
  id: string;
  unitId: string;
  number: number;
  titleKey: string;
  oneLineKey: string;
  readingMinutes: number;
  body: LessonBodyBlock[];
  exercise: Exercise;
}

export interface Unit {
  id: string;
  number: number;
  titleKey: string;
  oneLineKey: string;
  lessons: Lesson[];
}

export interface ExerciseResult {
  lessonId: string;
  exerciseId: string;
  completedAt: string;
  score?: number;
  responseData?: unknown;
}

// ─────────────────────────────────────────────────────────────────
// Course content (key-based — values live in src/locales/*/translation.json)
// ─────────────────────────────────────────────────────────────────

const units: Unit[] = [
  {
    id: "unit-1",
    number: 1,
    titleKey: "learn.units.unit1.title",
    oneLineKey: "learn.units.unit1.oneLine",
    lessons: [
      {
        id: "lesson-1",
        unitId: "unit-1",
        number: 1,
        titleKey: "learn.units.unit1.lesson1.title",
        oneLineKey: "learn.units.unit1.lesson1.oneLine",
        readingMinutes: 4,
        body: [
          { kind: "p", textKey: "learn.units.unit1.lesson1.body.p1" },
          {
            kind: "blockquote",
            textKey: "learn.units.unit1.lesson1.body.bq1",
            cite: "Acts 17:11",
          },
          { kind: "p", textKey: "learn.units.unit1.lesson1.body.p2" },
          { kind: "h3", textKey: "learn.units.unit1.lesson1.body.h3_1" },
          {
            kind: "list",
            itemKeys: [
              "learn.units.unit1.lesson1.body.list1.item1",
              "learn.units.unit1.lesson1.body.list1.item2",
              "learn.units.unit1.lesson1.body.list1.item3",
            ],
          },
          { kind: "p", textKey: "learn.units.unit1.lesson1.body.p3" },
        ],
        exercise: {
          id: "ex-1-meditate",
          titleKey: "learn.units.unit1.lesson1.ex.title",
          payload: {
            kind: "meditate",
            promptKeys: [
              "learn.units.unit1.lesson1.ex.prompt1",
              "learn.units.unit1.lesson1.ex.prompt2",
              "learn.units.unit1.lesson1.ex.prompt3",
              "learn.units.unit1.lesson1.ex.prompt4",
            ],
          },
        },
      },
      {
        id: "lesson-2",
        unitId: "unit-1",
        number: 2,
        titleKey: "learn.units.unit1.lesson2.title",
        oneLineKey: "learn.units.unit1.lesson2.oneLine",
        readingMinutes: 4,
        body: [
          { kind: "p", textKey: "learn.units.unit1.lesson2.body.p1" },
          { kind: "h3", textKey: "learn.units.unit1.lesson2.body.h3_1" },
          { kind: "p", textKey: "learn.units.unit1.lesson2.body.p2" },
          { kind: "h3", textKey: "learn.units.unit1.lesson2.body.h3_2" },
          { kind: "p", textKey: "learn.units.unit1.lesson2.body.p3" },
          { kind: "blockquote", textKey: "learn.units.unit1.lesson2.body.bq1" },
        ],
        exercise: {
          id: "ex-2-crossref",
          titleKey: "learn.units.unit1.lesson2.ex.title",
          payload: {
            kind: "crossref",
            introKey: "learn.units.unit1.lesson2.ex.intro",
            questions: [
              {
                id: "q1",
                scenarioKey: "learn.units.unit1.lesson2.ex.q1.scenario",
                options: [
                  { id: "a", labelKey: "learn.units.unit1.lesson2.ex.q1.optA" },
                  { id: "b", labelKey: "learn.units.unit1.lesson2.ex.q1.optB" },
                ],
                correctOptionId: "a",
                explanationKey: "learn.units.unit1.lesson2.ex.q1.explanation",
              },
              {
                id: "q2",
                scenarioKey: "learn.units.unit1.lesson2.ex.q2.scenario",
                options: [
                  { id: "a", labelKey: "learn.units.unit1.lesson2.ex.q2.optA" },
                  { id: "b", labelKey: "learn.units.unit1.lesson2.ex.q2.optB" },
                ],
                correctOptionId: "b",
                explanationKey: "learn.units.unit1.lesson2.ex.q2.explanation",
              },
              {
                id: "q3",
                scenarioKey: "learn.units.unit1.lesson2.ex.q3.scenario",
                options: [
                  { id: "a", labelKey: "learn.units.unit1.lesson2.ex.q3.optA" },
                  { id: "b", labelKey: "learn.units.unit1.lesson2.ex.q3.optB" },
                ],
                correctOptionId: "a",
                explanationKey: "learn.units.unit1.lesson2.ex.q3.explanation",
              },
              {
                id: "q4",
                scenarioKey: "learn.units.unit1.lesson2.ex.q4.scenario",
                options: [
                  { id: "a", labelKey: "learn.units.unit1.lesson2.ex.q4.optA" },
                  { id: "b", labelKey: "learn.units.unit1.lesson2.ex.q4.optB" },
                ],
                correctOptionId: "a",
                explanationKey: "learn.units.unit1.lesson2.ex.q4.explanation",
              },
              {
                id: "q5",
                scenarioKey: "learn.units.unit1.lesson2.ex.q5.scenario",
                options: [
                  { id: "a", labelKey: "learn.units.unit1.lesson2.ex.q5.optA" },
                  { id: "b", labelKey: "learn.units.unit1.lesson2.ex.q5.optB" },
                ],
                correctOptionId: "b",
                explanationKey: "learn.units.unit1.lesson2.ex.q5.explanation",
              },
            ],
          },
        },
      },
      {
        id: "lesson-3",
        unitId: "unit-1",
        number: 3,
        titleKey: "learn.units.unit1.lesson3.title",
        oneLineKey: "learn.units.unit1.lesson3.oneLine",
        readingMinutes: 5,
        body: [
          { kind: "p", textKey: "learn.units.unit1.lesson3.body.p1" },
          { kind: "h3", textKey: "learn.units.unit1.lesson3.body.h3_1" },
          { kind: "p", textKey: "learn.units.unit1.lesson3.body.p2" },
          { kind: "h3", textKey: "learn.units.unit1.lesson3.body.h3_2" },
          { kind: "p", textKey: "learn.units.unit1.lesson3.body.p3" },
          { kind: "h3", textKey: "learn.units.unit1.lesson3.body.h3_3" },
          { kind: "p", textKey: "learn.units.unit1.lesson3.body.p4" },
          { kind: "h3", textKey: "learn.units.unit1.lesson3.body.h3_4" },
          { kind: "p", textKey: "learn.units.unit1.lesson3.body.p5" },
          { kind: "h3", textKey: "learn.units.unit1.lesson3.body.h3_5" },
          { kind: "p", textKey: "learn.units.unit1.lesson3.body.p6" },
        ],
        exercise: {
          id: "ex-3-crossref",
          titleKey: "learn.units.unit1.lesson3.ex.title",
          payload: {
            kind: "crossref",
            introKey: "learn.units.unit1.lesson3.ex.intro",
            questions: [
              {
                id: "q1",
                scenarioKey: "learn.units.unit1.lesson3.ex.q1.scenario",
                options: [
                  { id: "a", labelKey: "learn.units.unit1.lesson3.ex.q1.optA" },
                  { id: "b", labelKey: "learn.units.unit1.lesson3.ex.q1.optB" },
                  { id: "c", labelKey: "learn.units.unit1.lesson3.ex.q1.optC" },
                  { id: "d", labelKey: "learn.units.unit1.lesson3.ex.q1.optD" },
                ],
                correctOptionId: "b",
                explanationKey: "learn.units.unit1.lesson3.ex.q1.explanation",
              },
              {
                id: "q2",
                scenarioKey: "learn.units.unit1.lesson3.ex.q2.scenario",
                options: [
                  { id: "a", labelKey: "learn.units.unit1.lesson3.ex.q2.optA" },
                  { id: "b", labelKey: "learn.units.unit1.lesson3.ex.q2.optB" },
                  { id: "c", labelKey: "learn.units.unit1.lesson3.ex.q2.optC" },
                  { id: "d", labelKey: "learn.units.unit1.lesson3.ex.q2.optD" },
                ],
                correctOptionId: "a",
                explanationKey: "learn.units.unit1.lesson3.ex.q2.explanation",
              },
              {
                id: "q3",
                scenarioKey: "learn.units.unit1.lesson3.ex.q3.scenario",
                options: [
                  { id: "a", labelKey: "learn.units.unit1.lesson3.ex.q3.optA" },
                  { id: "b", labelKey: "learn.units.unit1.lesson3.ex.q3.optB" },
                  { id: "c", labelKey: "learn.units.unit1.lesson3.ex.q3.optC" },
                  { id: "d", labelKey: "learn.units.unit1.lesson3.ex.q3.optD" },
                ],
                correctOptionId: "c",
                explanationKey: "learn.units.unit1.lesson3.ex.q3.explanation",
              },
              {
                id: "q4",
                scenarioKey: "learn.units.unit1.lesson3.ex.q4.scenario",
                options: [
                  { id: "a", labelKey: "learn.units.unit1.lesson3.ex.q4.optA" },
                  { id: "b", labelKey: "learn.units.unit1.lesson3.ex.q4.optB" },
                  { id: "c", labelKey: "learn.units.unit1.lesson3.ex.q4.optC" },
                  { id: "d", labelKey: "learn.units.unit1.lesson3.ex.q4.optD" },
                ],
                correctOptionId: "d",
                explanationKey: "learn.units.unit1.lesson3.ex.q4.explanation",
              },
              {
                id: "q5",
                scenarioKey: "learn.units.unit1.lesson3.ex.q5.scenario",
                options: [
                  { id: "a", labelKey: "learn.units.unit1.lesson3.ex.q5.optA" },
                  { id: "b", labelKey: "learn.units.unit1.lesson3.ex.q5.optB" },
                  { id: "c", labelKey: "learn.units.unit1.lesson3.ex.q5.optC" },
                  { id: "d", labelKey: "learn.units.unit1.lesson3.ex.q5.optD" },
                ],
                correctOptionId: "b",
                explanationKey: "learn.units.unit1.lesson3.ex.q5.explanation",
              },
            ],
          },
        },
      },
    ],
  },
  {
    id: "unit-2",
    number: 2,
    titleKey: "learn.units.unit2.title",
    oneLineKey: "learn.units.unit2.oneLine",
    lessons: [
      {
        id: "lesson-4",
        unitId: "unit-2",
        number: 4,
        titleKey: "learn.units.unit2.lesson4.title",
        oneLineKey: "learn.units.unit2.lesson4.oneLine",
        readingMinutes: 4,
        body: [
          { kind: "p", textKey: "learn.units.unit2.lesson4.body.p1" },
          { kind: "h3", textKey: "learn.units.unit2.lesson4.body.h3_1" },
          { kind: "p", textKey: "learn.units.unit2.lesson4.body.p2" },
          { kind: "h3", textKey: "learn.units.unit2.lesson4.body.h3_2" },
          { kind: "p", textKey: "learn.units.unit2.lesson4.body.p3" },
          { kind: "h3", textKey: "learn.units.unit2.lesson4.body.h3_3" },
          { kind: "p", textKey: "learn.units.unit2.lesson4.body.p4" },
          { kind: "h3", textKey: "learn.units.unit2.lesson4.body.h3_4" },
          { kind: "p", textKey: "learn.units.unit2.lesson4.body.p5" },
        ],
        exercise: {
          id: "ex-4-soap",
          titleKey: "learn.units.unit2.lesson4.ex.title",
          payload: {
            kind: "soap",
            verseCitation: "Proverbs 3:5-6",
            verseTextKey: "learn.units.unit2.lesson4.ex.verseText",
            promptKeys: {
              S: "learn.units.unit2.lesson4.ex.promptS",
              O: "learn.units.unit2.lesson4.ex.promptO",
              A: "learn.units.unit2.lesson4.ex.promptA",
              P: "learn.units.unit2.lesson4.ex.promptP",
            },
          },
        },
      },
      {
        id: "lesson-5",
        unitId: "unit-2",
        number: 5,
        titleKey: "learn.units.unit2.lesson5.title",
        oneLineKey: "learn.units.unit2.lesson5.oneLine",
        readingMinutes: 3,
        body: [
          { kind: "p", textKey: "learn.units.unit2.lesson5.body.p1" },
          {
            kind: "list",
            itemKeys: [
              "learn.units.unit2.lesson5.body.list1.item1",
              "learn.units.unit2.lesson5.body.list1.item2",
              "learn.units.unit2.lesson5.body.list1.item3",
              "learn.units.unit2.lesson5.body.list1.item4",
              "learn.units.unit2.lesson5.body.list1.item5",
            ],
          },
          { kind: "p", textKey: "learn.units.unit2.lesson5.body.p2" },
        ],
        exercise: {
          id: "ex-5-ladder",
          titleKey: "learn.units.unit2.lesson5.ex.title",
          payload: {
            kind: "ladder",
            verseCitation: "1 Peter 5:7",
            verseTextKey: "learn.units.unit2.lesson5.ex.verseText",
            rungs: [
              {
                key: "who",
                promptKey: "learn.units.unit2.lesson5.ex.who.prompt",
                hintKey: "learn.units.unit2.lesson5.ex.who.hint",
              },
              {
                key: "what",
                promptKey: "learn.units.unit2.lesson5.ex.what.prompt",
                hintKey: "learn.units.unit2.lesson5.ex.what.hint",
              },
              {
                key: "when_where",
                promptKey: "learn.units.unit2.lesson5.ex.whenWhere.prompt",
                hintKey: "learn.units.unit2.lesson5.ex.whenWhere.hint",
              },
              {
                key: "why",
                promptKey: "learn.units.unit2.lesson5.ex.why.prompt",
                hintKey: "learn.units.unit2.lesson5.ex.why.hint",
              },
              {
                key: "how",
                promptKey: "learn.units.unit2.lesson5.ex.how.prompt",
                hintKey: "learn.units.unit2.lesson5.ex.how.hint",
              },
            ],
          },
        },
      },
      {
        id: "lesson-6",
        unitId: "unit-2",
        number: 6,
        titleKey: "learn.units.unit2.lesson6.title",
        oneLineKey: "learn.units.unit2.lesson6.oneLine",
        readingMinutes: 4,
        body: [
          { kind: "p", textKey: "learn.units.unit2.lesson6.body.p1" },
          {
            kind: "list",
            itemKeys: [
              "learn.units.unit2.lesson6.body.list1.item1",
              "learn.units.unit2.lesson6.body.list1.item2",
              "learn.units.unit2.lesson6.body.list1.item3",
              "learn.units.unit2.lesson6.body.list1.item4",
              "learn.units.unit2.lesson6.body.list1.item5",
            ],
          },
          { kind: "p", textKey: "learn.units.unit2.lesson6.body.p2" },
        ],
        exercise: {
          id: "ex-6-highlight",
          titleKey: "learn.units.unit2.lesson6.ex.title",
          payload: {
            kind: "highlight",
            passageCitation: "Adapted from The Watchtower study edition",
            passageSourceKey: "learn.units.unit2.lesson6.ex.passageSource",
            tokenKeys: [
              "learn.units.unit2.lesson6.ex.token.t1",
              "learn.units.unit2.lesson6.ex.token.t2",
              "learn.units.unit2.lesson6.ex.token.t3",
              "learn.units.unit2.lesson6.ex.token.t4",
              "learn.units.unit2.lesson6.ex.token.t5",
              "learn.units.unit2.lesson6.ex.token.t6",
              "learn.units.unit2.lesson6.ex.token.t7",
              "learn.units.unit2.lesson6.ex.token.t8",
              "learn.units.unit2.lesson6.ex.token.t9",
              "learn.units.unit2.lesson6.ex.token.t10",
              "learn.units.unit2.lesson6.ex.token.t11",
              "learn.units.unit2.lesson6.ex.token.t12",
              "learn.units.unit2.lesson6.ex.token.t13",
              "learn.units.unit2.lesson6.ex.token.t14",
              "learn.units.unit2.lesson6.ex.token.t15",
              "learn.units.unit2.lesson6.ex.token.t16",
              "learn.units.unit2.lesson6.ex.token.t17",
              "learn.units.unit2.lesson6.ex.token.t18",
              "learn.units.unit2.lesson6.ex.token.t19",
              "learn.units.unit2.lesson6.ex.token.t20",
              "learn.units.unit2.lesson6.ex.token.t21",
              "learn.units.unit2.lesson6.ex.token.t22",
              "learn.units.unit2.lesson6.ex.token.t23",
              "learn.units.unit2.lesson6.ex.token.t24",
              "learn.units.unit2.lesson6.ex.token.t25",
              "learn.units.unit2.lesson6.ex.token.t26",
              "learn.units.unit2.lesson6.ex.token.t27",
              "learn.units.unit2.lesson6.ex.token.t28",
              "learn.units.unit2.lesson6.ex.token.t29",
            ],
            guide: [
              { category: "quality", hintKey: "learn.units.unit2.lesson6.ex.guide.quality" },
              { category: "promise", hintKey: "learn.units.unit2.lesson6.ex.guide.promise" },
              { category: "command", hintKey: "learn.units.unit2.lesson6.ex.guide.command" },
              { category: "warning", hintKey: "learn.units.unit2.lesson6.ex.guide.warning" },
              { category: "reference", hintKey: "learn.units.unit2.lesson6.ex.guide.reference" },
            ],
          },
        },
      },
    ],
  },
  {
    id: "unit-3",
    number: 3,
    titleKey: "learn.units.unit3.title",
    oneLineKey: "learn.units.unit3.oneLine",
    lessons: [
      {
        id: "lesson-7",
        unitId: "unit-3",
        number: 7,
        titleKey: "learn.units.unit3.lesson7.title",
        oneLineKey: "learn.units.unit3.lesson7.oneLine",
        readingMinutes: 4,
        body: [
          { kind: "p", textKey: "learn.units.unit3.lesson7.body.p1" },
          { kind: "h3", textKey: "learn.units.unit3.lesson7.body.h3_1" },
          {
            kind: "list",
            itemKeys: [
              "learn.units.unit3.lesson7.body.list1.item1",
              "learn.units.unit3.lesson7.body.list1.item2",
              "learn.units.unit3.lesson7.body.list1.item3",
            ],
          },
          { kind: "p", textKey: "learn.units.unit3.lesson7.body.p2" },
        ],
        exercise: {
          id: "ex-7-ladder",
          titleKey: "learn.units.unit3.lesson7.ex.title",
          payload: {
            kind: "ladder",
            verseCitation: "John 17:3",
            verseTextKey: "learn.units.unit3.lesson7.ex.verseText",
            rungs: [
              {
                key: "who",
                promptKey: "learn.units.unit3.lesson7.ex.who.prompt",
                hintKey: "learn.units.unit3.lesson7.ex.who.hint",
              },
              {
                key: "what",
                promptKey: "learn.units.unit3.lesson7.ex.what.prompt",
                hintKey: "learn.units.unit3.lesson7.ex.what.hint",
              },
              {
                key: "when_where",
                promptKey: "learn.units.unit3.lesson7.ex.whenWhere.prompt",
                hintKey: "learn.units.unit3.lesson7.ex.whenWhere.hint",
              },
              {
                key: "why",
                promptKey: "learn.units.unit3.lesson7.ex.why.prompt",
                hintKey: "learn.units.unit3.lesson7.ex.why.hint",
              },
              {
                key: "how",
                promptKey: "learn.units.unit3.lesson7.ex.how.prompt",
                hintKey: "learn.units.unit3.lesson7.ex.how.hint",
              },
            ],
          },
        },
      },
      {
        id: "lesson-8",
        unitId: "unit-3",
        number: 8,
        titleKey: "learn.units.unit3.lesson8.title",
        oneLineKey: "learn.units.unit3.lesson8.oneLine",
        readingMinutes: 4,
        body: [
          {
            kind: "blockquote",
            textKey: "learn.units.unit3.lesson8.body.bq1",
            cite: "Psalm 1:2",
          },
          { kind: "p", textKey: "learn.units.unit3.lesson8.body.p1" },
          { kind: "h3", textKey: "learn.units.unit3.lesson8.body.h3_1" },
          { kind: "p", textKey: "learn.units.unit3.lesson8.body.p2" },
          { kind: "h3", textKey: "learn.units.unit3.lesson8.body.h3_2" },
          {
            kind: "list",
            itemKeys: [
              "learn.units.unit3.lesson8.body.list1.item1",
              "learn.units.unit3.lesson8.body.list1.item2",
              "learn.units.unit3.lesson8.body.list1.item3",
            ],
          },
        ],
        exercise: {
          id: "ex-8-meditate",
          titleKey: "learn.units.unit3.lesson8.ex.title",
          payload: {
            kind: "meditate",
            introVerse: {
              citation: "Psalm 23:1",
              textKey: "learn.units.unit3.lesson8.ex.introVerse.text",
            },
            promptKeys: [
              "learn.units.unit3.lesson8.ex.prompt1",
              "learn.units.unit3.lesson8.ex.prompt2",
              "learn.units.unit3.lesson8.ex.prompt3",
              "learn.units.unit3.lesson8.ex.prompt4",
            ],
            timerSeconds: 180,
          },
        },
      },
      {
        id: "lesson-9",
        unitId: "unit-3",
        number: 9,
        titleKey: "learn.units.unit3.lesson9.title",
        oneLineKey: "learn.units.unit3.lesson9.oneLine",
        readingMinutes: 4,
        body: [
          { kind: "p", textKey: "learn.units.unit3.lesson9.body.p1" },
          { kind: "h3", textKey: "learn.units.unit3.lesson9.body.h3_1" },
          {
            kind: "list",
            itemKeys: [
              "learn.units.unit3.lesson9.body.list1.item1",
              "learn.units.unit3.lesson9.body.list1.item2",
              "learn.units.unit3.lesson9.body.list1.item3",
              "learn.units.unit3.lesson9.body.list1.item4",
            ],
          },
          { kind: "p", textKey: "learn.units.unit3.lesson9.body.p2" },
          { kind: "p", textKey: "learn.units.unit3.lesson9.body.p3" },
        ],
        exercise: {
          id: "ex-9-commitment",
          titleKey: "learn.units.unit3.lesson9.ex.title",
          payload: {
            kind: "meditate",
            promptKeys: [
              "learn.units.unit3.lesson9.ex.prompt1",
              "learn.units.unit3.lesson9.ex.prompt2",
              "learn.units.unit3.lesson9.ex.prompt3",
              "learn.units.unit3.lesson9.ex.prompt4",
              "learn.units.unit3.lesson9.ex.prompt5",
            ],
          },
        },
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// Visual config (not user-facing — colors only)
// ─────────────────────────────────────────────────────────────────

export const highlightCategoryColors: Record<
  HighlightCategory,
  { bg: string; ring: string; text: string; dot: string }
> = {
  promise: { bg: "bg-emerald-100", ring: "ring-emerald-400", text: "text-emerald-900", dot: "bg-emerald-500" },
  command: { bg: "bg-sky-100", ring: "ring-sky-400", text: "text-sky-900", dot: "bg-sky-500" },
  warning: { bg: "bg-rose-100", ring: "ring-rose-400", text: "text-rose-900", dot: "bg-rose-500" },
  quality: { bg: "bg-amber-100", ring: "ring-amber-400", text: "text-amber-900", dot: "bg-amber-500" },
  reference: { bg: "bg-violet-100", ring: "ring-violet-400", text: "text-violet-900", dot: "bg-violet-500" },
};

export function getUnits(): Unit[] {
  return units;
}

export function findLesson(lessonId: string): Lesson | null {
  for (const u of units) {
    const l = u.lessons.find((x) => x.id === lessonId);
    if (l) return l;
  }
  return null;
}

export function findUnit(unitId: string): Unit | null {
  return units.find((u) => u.id === unitId) ?? null;
}

export function totalLessonCount(): number {
  return units.reduce((acc, u) => acc + u.lessons.length, 0);
}
