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

export type Locale = "en" | "es";

export type HighlightCategory =
  | "promise"
  | "command"
  | "warning"
  | "quality"
  | "reference";

export interface HighlightExercisePayload {
  kind: "highlight";
  passageCitation: string;
  passageSource: string;
  tokens: string[];
  guide: Array<{ category: HighlightCategory; hint: string }>;
}

export interface QuestionLadderPayload {
  kind: "ladder";
  verseCitation: string;
  verseText: string;
  rungs: Array<{ key: "who" | "what" | "when_where" | "why" | "how"; prompt: string; hint: string }>;
}

export interface CrossReferenceQuizPayload {
  kind: "crossref";
  intro: string;
  questions: Array<{
    id: string;
    scenario: string;
    options: Array<{ id: string; label: string }>;
    correctOptionId: string;
    explanation: string;
  }>;
}

export interface SoapNotePayload {
  kind: "soap";
  verseCitation: string;
  verseText: string;
  prompts: { S: string; O: string; A: string; P: string };
}

export interface MeditatePayload {
  kind: "meditate";
  introVerse?: { citation: string; text: string };
  prompts: string[];
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
  title: string;
  payload: ExercisePayload;
}

export interface Lesson {
  id: string;
  unitId: string;
  number: number;
  title: string;
  oneLine: string;
  readingMinutes: number;
  body: Array<
    | { kind: "p"; text: string }
    | { kind: "h3"; text: string }
    | { kind: "blockquote"; text: string; cite?: string }
    | { kind: "list"; items: string[] }
  >;
  exercise: Exercise;
}

export interface Unit {
  id: string;
  number: number;
  title: string;
  oneLine: string;
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
// English course content
// ─────────────────────────────────────────────────────────────────

const units: Unit[] = [
  {
    id: "unit-1",
    number: 1,
    title: "Your Study Toolkit",
    oneLine:
      "Before you learn to study deeply, you need to know what's in your hand and why it's there.",
    lessons: [
      {
        id: "lesson-1",
        unitId: "unit-1",
        number: 1,
        title: "Why Personal Study Matters",
        oneLine: "The Bereans didn't just listen. They examined. So should we.",
        readingMinutes: 4,
        body: [
          {
            kind: "p",
            text:
              "When Paul preached in Beroea, the people there did something the apostle singled out for praise. They received the word eagerly — but they didn't stop there. They checked.",
          },
          {
            kind: "blockquote",
            text:
              "Now the latter were more noble-minded than those in Thessalonica, for they accepted the word with the greatest eagerness of mind, carefully examining the Scriptures daily to see whether these things were so.",
            cite: "Acts 17:11",
          },
          {
            kind: "p",
            text:
              "That's the pattern for personal study. Eager reception and careful examination, every day. It's not enough to agree with what you hear at the meetings. The Bereans — and Paul himself, who wrote more of the Christian Greek Scriptures than anyone — wanted us digging in ourselves.",
          },
          { kind: "h3", text: "Three marks of study that shapes a life" },
          {
            kind: "list",
            items: [
              "Regular. Rhythm beats intensity. Fifteen minutes daily outlasts a three-hour binge on Saturday.",
              "Active. Pencil in hand. Question in mind. If you can't recall what you read an hour later, you weren't really studying.",
              "Prayerful. Jehovah gives wisdom generously to those who ask (Jas. 1:5). Holy spirit isn't automatic — ask.",
            ],
          },
          {
            kind: "p",
            text:
              "This course is built around those three marks. You'll do short exercises with real scriptures, not just read about them. That's the Berean pattern in miniature.",
          },
        ],
        exercise: {
          id: "ex-1-meditate",
          title: "Meditate: what moved you this week?",
          payload: {
            kind: "meditate",
            prompts: [
              "What have you read in your Bible or the publications this past week?",
              "Where did you catch a glimpse of Jehovah's qualities in the passage?",
              "What is this passage asking you to change, start, or stop?",
              "Write a one-sentence prayer turning the answer above into a conversation with Jehovah.",
            ],
          },
        },
      },
      {
        id: "lesson-2",
        unitId: "unit-1",
        number: 2,
        title: "JW Library vs. Watchtower ONLINE LIBRARY",
        oneLine:
          "Two brilliant tools. Different jobs. Knowing which to reach for is half the battle.",
        readingMinutes: 4,
        body: [
          {
            kind: "p",
            text:
              "We're spoiled. Bible students before us pieced their study time together from paperback Bibles, mimeographed outlines, and trips to the Kingdom Hall library. Today, two apps do most of that work — and knowing which to reach for saves real time.",
          },
          { kind: "h3", text: "JW Library: the faithful field companion" },
          {
            kind: "p",
            text:
              "JW Library is the New World Translation, the meeting media, the songbook, and the daily text in your pocket. It's portable, it works offline, and it's tuned for reading and meetings — not deep research.",
          },
          { kind: "h3", text: "Watchtower ONLINE LIBRARY (WOL): the research desk" },
          {
            kind: "p",
            text:
              "WOL is the full shelf. Every publication, indexed and cross-linked. It's where you go when a question opens up and you need to follow the thread — past Watchtower articles, Insight entries, Reasoning chapters, Yearbooks.",
          },
          {
            kind: "blockquote",
            text:
              "Rule of thumb: JW Library for reading and meetings. WOL for researching and answering questions.",
          },
        ],
        exercise: {
          id: "ex-2-crossref",
          title: "Cross-reference: pick the right tool",
          payload: {
            kind: "crossref",
            intro:
              "Each scenario shows up in real life. Which resource fits best?",
            questions: [
              {
                id: "q1",
                scenario:
                  "You're on the bus and want to read the daily text and quickly review today's Bible chapter.",
                options: [
                  { id: "a", label: "JW Library" },
                  { id: "b", label: "Watchtower ONLINE LIBRARY (WOL)" },
                ],
                correctOptionId: "a",
                explanation:
                  "JW Library is built for offline, one-hand reading. The daily text lives on the home screen and the Bible is a tap away.",
              },
              {
                id: "q2",
                scenario:
                  "You want to find every Watchtower article that discusses King Hezekiah's reforms over the last twenty years.",
                options: [
                  { id: "a", label: "JW Library" },
                  { id: "b", label: "Watchtower ONLINE LIBRARY (WOL)" },
                ],
                correctOptionId: "b",
                explanation:
                  "WOL is the research library. Use its search with quotation marks around \"Hezekiah\" to get a ranked list across all publications.",
              },
              {
                id: "q3",
                scenario:
                  "You're prepping a talk and want the Reference Bible's cross-references next to the verse you're working on.",
                options: [
                  { id: "a", label: "JW Library (Study edition)" },
                  { id: "b", label: "Watchtower ONLINE LIBRARY (WOL)" },
                ],
                correctOptionId: "a",
                explanation:
                  "The NWT Study Edition in JW Library exposes study notes and cross-references right beside the verse. WOL has them too, but JW Library's Bible view is faster for a single passage.",
              },
              {
                id: "q4",
                scenario:
                  "You want to review last week's meeting video when you're offline at a family member's home with no Wi-Fi.",
                options: [
                  { id: "a", label: "JW Library" },
                  { id: "b", label: "Watchtower ONLINE LIBRARY (WOL)" },
                ],
                correctOptionId: "a",
                explanation:
                  "JW Library keeps meeting media available offline once you've downloaded it. WOL needs a connection.",
              },
              {
                id: "q5",
                scenario:
                  "You want to read the complete Insight on the Scriptures entry on \"Faith\" with all its sub-sections and cross-links.",
                options: [
                  { id: "a", label: "JW Library" },
                  { id: "b", label: "Watchtower ONLINE LIBRARY (WOL)" },
                ],
                correctOptionId: "b",
                explanation:
                  "Insight is available in both, but WOL's cross-link experience is faster for the long encyclopedia-style entries where you'll jump between sub-entries.",
              },
            ],
          },
        },
      },
      {
        id: "lesson-3",
        unitId: "unit-1",
        number: 3,
        title: "Insight, Reasoning & the Publications",
        oneLine:
          "The faithful and discreet slave has given us a full shelf. Each book does one job exceptionally well.",
        readingMinutes: 5,
        body: [
          {
            kind: "p",
            text:
              "New Bible students sometimes assume all the publications say roughly the same thing. They don't. Each one is written for a different job. Here are the five you'll reach for most.",
          },
          { kind: "h3", text: "Insight on the Scriptures" },
          {
            kind: "p",
            text:
              "The encyclopedia. Two volumes covering people, places, objects, concepts — alphabetically, with cross-references. When a name, a word, or a custom in the Scriptures stops you, Insight is the first stop.",
          },
          { kind: "h3", text: "Reasoning From the Scriptures" },
          {
            kind: "p",
            text:
              "The field service companion. Organized by topic — \"Blood,\" \"Cross,\" \"God,\" \"Suffering\" — with direct answers and sample conversation lines. Built for objections and discussions.",
          },
          { kind: "h3", text: "The Watchtower (Public + Study Edition)" },
          {
            kind: "p",
            text:
              "Current spiritual food. The Study Edition is meeting material; the Public Edition is written for the broader audience. When a question is about our current understanding, the most recent Watchtower is almost always where to check.",
          },
          { kind: "h3", text: "Awake!" },
          {
            kind: "p",
            text:
              "Biblical principles applied to everyday life — family, work, health, anxiety, teens. The voice is warm and practical. Excellent for householders not yet ready for deep doctrinal discussion.",
          },
          { kind: "h3", text: "Pure Worship of Jehovah" },
          {
            kind: "p",
            text:
              "One of a family of prophetic books (with Jeremiah, Isaiah's Prophecy, and Revelation's Grand Climax) that walks verse-by-verse through Ezekiel. Reach for these when studying a prophetic book.",
          },
        ],
        exercise: {
          id: "ex-3-crossref",
          title: "Cross-reference: which publication fits this question?",
          payload: {
            kind: "crossref",
            intro:
              "A friend or householder asks you one of these. Which publication is the best starting point?",
            questions: [
              {
                id: "q1",
                scenario:
                  "\"Why does a loving God allow suffering in the world?\"",
                options: [
                  { id: "a", label: "Insight on the Scriptures" },
                  { id: "b", label: "Reasoning From the Scriptures" },
                  { id: "c", label: "Awake!" },
                  { id: "d", label: "Pure Worship of Jehovah" },
                ],
                correctOptionId: "b",
                explanation:
                  "Reasoning has a full chapter on \"Suffering\" with scriptures, logical reasoning, and sample conversational responses — built exactly for this question.",
              },
              {
                id: "q2",
                scenario:
                  "\"What did the divine name Jehovah mean in ancient Hebrew, and how was it pronounced?\"",
                options: [
                  { id: "a", label: "Insight on the Scriptures" },
                  { id: "b", label: "Reasoning From the Scriptures" },
                  { id: "c", label: "Awake!" },
                  { id: "d", label: "The Watchtower" },
                ],
                correctOptionId: "a",
                explanation:
                  "Insight is the encyclopedia — its \"Jehovah\" entry covers etymology, pronunciation history, and every scriptural occurrence with depth.",
              },
              {
                id: "q3",
                scenario:
                  "\"I keep lying awake at night with anxiety. What does the Bible say I should do?\"",
                options: [
                  { id: "a", label: "Insight on the Scriptures" },
                  { id: "b", label: "Reasoning From the Scriptures" },
                  { id: "c", label: "Awake!" },
                  { id: "d", label: "Pure Worship of Jehovah" },
                ],
                correctOptionId: "c",
                explanation:
                  "Awake! specializes in practical life topics like anxiety, with biblical principles presented warmly. A recent Watchtower study article would also be excellent.",
              },
              {
                id: "q4",
                scenario:
                  "\"What is the 'great crowd' spoken of in Revelation 7, and how do we know it's a different group from the 144,000?\"",
                options: [
                  { id: "a", label: "Awake!" },
                  { id: "b", label: "Reasoning From the Scriptures" },
                  { id: "c", label: "Pure Worship / prophetic commentary" },
                  { id: "d", label: "Insight on the Scriptures" },
                ],
                correctOptionId: "d",
                explanation:
                  "Start with Insight's entry on \"Great Crowd\" for the full scriptural exposition. The prophetic commentaries on Revelation go deeper, and Reasoning gives a shorter conversational version.",
              },
              {
                id: "q5",
                scenario:
                  "\"I want to understand the Bible's current direction on blood fractions for medical use.\"",
                options: [
                  { id: "a", label: "Insight on the Scriptures" },
                  { id: "b", label: "The Watchtower (most recent article)" },
                  { id: "c", label: "Reasoning From the Scriptures" },
                  { id: "d", label: "Awake!" },
                ],
                correctOptionId: "b",
                explanation:
                  "On questions where our understanding has been refined over time, the most recent Watchtower article carries the current spiritual food. Always check for the latest.",
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
    title: "The Art of Studying",
    oneLine: "Now you've got the tools. Here's how to actually use them.",
    lessons: [
      {
        id: "lesson-4",
        unitId: "unit-2",
        number: 4,
        title: "The S.O.A.P. Method",
        oneLine:
          "Four letters. One of the most reliable scaffolds for a deep personal study session.",
        readingMinutes: 4,
        body: [
          {
            kind: "p",
            text:
              "S.O.A.P. is an acronym — Scripture, Observation, Application, Prayer — and it's one of the simplest, most durable frameworks for turning Bible reading into Bible study. It works for a single verse or a whole chapter.",
          },
          { kind: "h3", text: "S — Scripture" },
          {
            kind: "p",
            text:
              "Write the verse out. By hand if you can. Copying forces you to slow down and notice things a speed-reader misses: the conjunctions, the imperatives, the conditions.",
          },
          { kind: "h3", text: "O — Observation" },
          {
            kind: "p",
            text:
              "What does the passage actually say? Who is speaking? To whom? When? What words repeat? This is not yet about you — it's about what's there on the page.",
          },
          { kind: "h3", text: "A — Application" },
          {
            kind: "p",
            text:
              "Now turn toward yourself. What does this verse ask of me today? Where am I living against it? What would obedience look like this week?",
          },
          { kind: "h3", text: "P — Prayer" },
          {
            kind: "p",
            text:
              "Pray the verse back to Jehovah. Thank him for what it reveals about him. Ask for the specific help the application requires.",
          },
        ],
        exercise: {
          id: "ex-4-soap",
          title: "S.O.A.P. on Proverbs 3:5-6",
          payload: {
            kind: "soap",
            verseCitation: "Proverbs 3:5-6",
            verseText:
              "Trust in Jehovah with all your heart, and do not rely on your own understanding. In all your ways take notice of him, and he will make your paths straight.",
            prompts: {
              S: "Copy Proverbs 3:5-6 out in your own handwriting — or type it slowly below.",
              O: "What does this passage command? What does it promise? What's the condition?",
              A: "Where in your life are you currently 'relying on your own understanding'? What would trusting Jehovah look like there this week?",
              P: "Turn your answer into a short prayer. Start with 'Jehovah,' and keep it honest.",
            },
          },
        },
      },
      {
        id: "lesson-5",
        unitId: "unit-2",
        number: 5,
        title: "Asking Questions That Open Verses",
        oneLine: "Good questions are the keys that open closed verses.",
        readingMinutes: 3,
        body: [
          {
            kind: "p",
            text:
              "A verse can look flat on a quick read. The same verse, put under the right questions, splits open. Here are five questions that almost always uncover something new.",
          },
          {
            kind: "list",
            items: [
              "Who — who's speaking, and who are they speaking to?",
              "What — what is actually happening in the verse? What word gets repeated or emphasized?",
              "When / Where — what's the historical or geographical context?",
              "Why — why would Jehovah want this recorded? Why does it matter?",
              "How — how does it apply to me, today, in my actual circumstances?",
            ],
          },
          {
            kind: "p",
            text:
              "Run any verse through all five questions and you've done more thinking than most people do in a whole chapter of reading.",
          },
        ],
        exercise: {
          id: "ex-5-ladder",
          title: "Apply the five questions to 1 Peter 5:7",
          payload: {
            kind: "ladder",
            verseCitation: "1 Peter 5:7",
            verseText:
              "Throw all your anxiety on him, because he cares for you.",
            rungs: [
              {
                key: "who",
                prompt: "Who is speaking, and to whom is he writing?",
                hint: "Peter, a fellow elder, writes to Christians scattered through Asia Minor.",
              },
              {
                key: "what",
                prompt: "What is the command, and what word gets emphasized?",
                hint: "'Throw' — it's decisive, not passive. 'All' is the emphatic word.",
              },
              {
                key: "when_where",
                prompt: "What's the historical context?",
                hint: "Written around 62–64 CE, to brothers and sisters facing growing Roman hostility.",
              },
              {
                key: "why",
                prompt: "Why would Jehovah want this recorded?",
                hint: "Because anxiety isolates, and this verse is the corrective — we have a Father who cares.",
              },
              {
                key: "how",
                prompt: "How does this apply to you this week?",
                hint: "Name one specific anxiety you'll 'throw' on Jehovah in prayer today.",
              },
            ],
          },
        },
      },
      {
        id: "lesson-6",
        unitId: "unit-2",
        number: 6,
        title: "Highlighting & Note-Taking That Works",
        oneLine:
          "Marks on the page are memory aids. A good system turns a paragraph into a map.",
        readingMinutes: 4,
        body: [
          {
            kind: "p",
            text:
              "Highlighting without a system is just decoration. Here's a simple five-color setup that's survived decades of Bible students — and works just as well in JW Library as it does in a paper Bible.",
          },
          {
            kind: "list",
            items: [
              "Green — a promise from Jehovah.",
              "Blue — a command or instruction.",
              "Red — a warning or consequence.",
              "Gold — a quality of Jehovah or Jesus.",
              "Purple — a cross-reference worth following.",
            ],
          },
          {
            kind: "p",
            text:
              "The next time you sit with a Watchtower paragraph, slow down and mark it up. A single marked-up paragraph you remember is worth more than ten skimmed chapters you don't.",
          },
        ],
        exercise: {
          id: "ex-6-highlight",
          title: "Mark up a Watchtower-style paragraph",
          payload: {
            kind: "highlight",
            passageCitation: "Adapted from The Watchtower study edition",
            passageSource: "Sample paragraph for practice",
            tokens: [
              "Jehovah",
              "is",
              "a",
              "loving",
              "Father",
              "who",
              "promises",
              "to",
              "sustain",
              "us.",
              "He",
              "commands",
              "us",
              "to",
              "pray",
              "without",
              "ceasing",
              "and",
              "warns",
              "that",
              "drifting",
              "leads",
              "to",
              "shipwreck",
              "of",
              "faith.",
              "Compare",
              "Hebrews",
              "2:1.",
            ],
            guide: [
              { category: "quality", hint: "\"loving Father\" — a quality of Jehovah" },
              { category: "promise", hint: "\"promises to sustain us\" — a promise" },
              { category: "command", hint: "\"commands us to pray without ceasing\" — a command" },
              { category: "warning", hint: "\"drifting leads to shipwreck of faith\" — a warning" },
              { category: "reference", hint: "\"Compare Hebrews 2:1\" — a cross-reference" },
            ],
          },
        },
      },
    ],
  },
  {
    id: "unit-3",
    number: 3,
    title: "Going Deeper",
    oneLine: "From technique into formation — study as a life habit.",
    lessons: [
      {
        id: "lesson-7",
        unitId: "unit-3",
        number: 7,
        title: "Cross-Referencing Like a Berean",
        oneLine:
          "Scripture is its own best commentary. Learning to chain passages is learning to think like a Berean.",
        readingMinutes: 4,
        body: [
          {
            kind: "p",
            text:
              "Jehovah wrote his Word in a way that talks to itself. A verse in Genesis connects to one in Revelation. A phrase in Psalms lights up a story in Kings. Cross-referencing is the skill of following those connections — and the NWT Reference Edition is designed for it.",
          },
          { kind: "h3", text: "Three places to find cross-references" },
          {
            kind: "list",
            items: [
              "Marginal references in the NWT Reference Bible — right-column, for every significant verse.",
              "WOL's cited-by feature — shows every publication that cites the verse you're on.",
              "Insight on the Scriptures — topic entries link to all major passages on the topic.",
            ],
          },
          {
            kind: "p",
            text:
              "Build a chain. Start with a verse. Follow one reference. Then follow one from there. After three or four hops, you'll see a pattern you never would have seen in the starting verse alone.",
          },
        ],
        exercise: {
          id: "ex-7-ladder",
          title: "Build a chain from John 17:3",
          payload: {
            kind: "ladder",
            verseCitation: "John 17:3",
            verseText:
              "This means everlasting life, their coming to know you, the only true God, and the one whom you sent, Jesus Christ.",
            rungs: [
              {
                key: "who",
                prompt:
                  "Who is speaking here? Find a cross-reference to another prayer of Jesus and note the verse.",
                hint: "Matthew 26:39 is one of the most intense — compare his posture toward the Father.",
              },
              {
                key: "what",
                prompt:
                  "What does 'coming to know' imply? Find a verse that describes knowing God as ongoing, not a one-time event.",
                hint: "2 Peter 3:18 — 'keep on growing in the undeserved kindness and knowledge of our Lord.'",
              },
              {
                key: "when_where",
                prompt:
                  "The verse distinguishes 'the only true God' from Jesus. Find another verse that makes the same distinction.",
                hint: "1 Corinthians 8:6 — 'there is actually to us one God, the Father... and there is one Lord, Jesus Christ.'",
              },
              {
                key: "why",
                prompt:
                  "Why does Jesus frame 'everlasting life' as a relationship rather than a reward? Find a verse that shows Jehovah's heart toward us.",
                hint: "James 4:8 — 'draw close to God, and he will draw close to you.'",
              },
              {
                key: "how",
                prompt:
                  "What one thing will you do this week to 'keep on coming to know' Jehovah?",
                hint: "Be concrete — a specific time, a specific chapter, a specific prayer.",
              },
            ],
          },
        },
      },
      {
        id: "lesson-8",
        unitId: "unit-3",
        number: 8,
        title: "Meditation — Letting the Word Sink In",
        oneLine:
          "Reading is the meal. Meditation is the digestion. Most of the nutrition happens here.",
        readingMinutes: 4,
        body: [
          {
            kind: "blockquote",
            text:
              "His delight is in the law of Jehovah, and he reads His law in an undertone day and night.",
            cite: "Psalm 1:2",
          },
          {
            kind: "p",
            text:
              "The Hebrew word translated 'reads in an undertone' carries the image of a cow chewing cud — slow, repeated, patient. Meditation is that slow chewing. You won't get the nutrients from a verse you swallow whole.",
          },
          { kind: "h3", text: "How meditation differs from reading" },
          {
            kind: "p",
            text:
              "Reading asks, \"What does it say?\" Meditation asks, \"What does it mean, and what does it do to me?\" One fills the mind. The other shapes the person.",
          },
          { kind: "h3", text: "A simple three-minute rhythm" },
          {
            kind: "list",
            items: [
              "Pick one verse. Just one. Don't rush to the next.",
              "Read it three times, slowly. Pause after each read.",
              "Sit with it. Let a question rise. Let a feeling rise. Let Jehovah speak.",
            ],
          },
        ],
        exercise: {
          id: "ex-8-meditate",
          title: "Guided 3-minute meditation",
          payload: {
            kind: "meditate",
            introVerse: {
              citation: "Psalm 23:1",
              text: "Jehovah is my Shepherd. I will lack nothing.",
            },
            prompts: [
              "Read the verse three times slowly. Let the second reading be slower than the first.",
              "What image does the word 'Shepherd' raise for you? What does it tell you about how Jehovah relates to you?",
              "Where in your life are you currently afraid you will lack something? Hold that with the verse.",
              "Write one sentence to Jehovah about what you just saw.",
            ],
            timerSeconds: 180,
          },
        },
      },
      {
        id: "lesson-9",
        unitId: "unit-3",
        number: 9,
        title: "Building Your Study Routine",
        oneLine:
          "The best study method is the one you'll still be doing a year from now.",
        readingMinutes: 4,
        body: [
          {
            kind: "p",
            text:
              "We've covered the tools and the techniques. Now for the hardest part: keeping it going. Habits, not heroics, build a Bible student.",
          },
          { kind: "h3", text: "A sample week" },
          {
            kind: "list",
            items: [
              "Daily (15 min): Bible reading + daily text. Same time, same place.",
              "Mid-week (45 min): Meeting prep — read the Watchtower study article, highlight, mark up.",
              "Weekend (60 min): One S.O.A.P. study on a chapter of your choice.",
              "Monthly: Pick one Insight entry to read all the way through.",
            ],
          },
          {
            kind: "p",
            text:
              "This isn't a prescription. It's a frame. Shrink it or expand it to fit your life — but write down what you commit to, and then keep showing up.",
          },
          {
            kind: "p",
            text:
              "All glory to Jehovah. He has given us his Word, his spirit, and his organization. The rest is just showing up.",
          },
        ],
        exercise: {
          id: "ex-9-commitment",
          title: "Your commitment",
          payload: {
            kind: "meditate",
            prompts: [
              "What time of day will you study? (Be specific — e.g. '7:00 AM, before breakfast.')",
              "Which days of the week? (Start smaller than you think — three days you actually do beats seven you don't.)",
              "Where will you study? (Same spot every time, if possible.)",
              "Which Bible book will you start with? (If unsure — Mark is short. James is practical. Psalms is rich.)",
              "Write one sentence of commitment to Jehovah. You're not promising perfection — you're promising to show up.",
            ],
          },
        },
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// i18n surface (EN shipped; ES structure ready for drop-in)
// ─────────────────────────────────────────────────────────────────

export interface CourseStrings {
  courseTitle: string;
  courseKicker: string;
  courseIntro: string;
  unitLabel: string;
  lessonLabel: string;
  minRead: string;
  exerciseHeading: string;
  continue: string;
  backToCourse: string;
  complete: string;
  completed: string;
  markComplete: string;
  overallProgress: string;
  closingBenediction: string;
  closingCta: string;
  categories: Record<HighlightCategory, string>;
}

const strings: Record<Locale, CourseStrings> = {
  en: {
    courseTitle: "Learn to Study",
    courseKicker: "A nine-lesson course for Bible students",
    courseIntro:
      "You will not just read about studying. You will do it — with real verses, real publications, real exercises — the way the Bereans did.",
    unitLabel: "Unit",
    lessonLabel: "Lesson",
    minRead: "min read",
    exerciseHeading: "Exercise",
    continue: "Continue",
    backToCourse: "Back to course",
    complete: "Complete",
    completed: "Completed",
    markComplete: "Mark lesson complete",
    overallProgress: "Overall progress",
    closingBenediction: "All glory to Jehovah.",
    closingCta: "Start your first study session",
    categories: {
      promise: "Promise",
      command: "Command",
      warning: "Warning",
      quality: "Jehovah's quality",
      reference: "Cross-reference",
    },
  },
  es: {
    courseTitle: "Aprende a estudiar",
    courseKicker: "Un curso de nueve lecciones para estudiantes de la Biblia",
    courseIntro:
      "No solo leerás sobre el estudio. Lo harás — con versículos reales, publicaciones reales y ejercicios reales — como lo hicieron los bereanos.",
    unitLabel: "Unidad",
    lessonLabel: "Lección",
    minRead: "min de lectura",
    exerciseHeading: "Ejercicio",
    continue: "Continuar",
    backToCourse: "Volver al curso",
    complete: "Completar",
    completed: "Completado",
    markComplete: "Marcar como completada",
    overallProgress: "Progreso general",
    closingBenediction: "Toda la gloria a Jehová.",
    closingCta: "Comienza tu primera sesión de estudio",
    categories: {
      promise: "Promesa",
      command: "Mandato",
      warning: "Advertencia",
      quality: "Cualidad de Jehová",
      reference: "Referencia cruzada",
    },
  },
};

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

export function getUnits(_locale: Locale = "en"): Unit[] {
  // Future: swap localized units when ES/JA/KO content is written.
  return units;
}

export function getStrings(locale: Locale = "en"): CourseStrings {
  return strings[locale] ?? strings.en;
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
