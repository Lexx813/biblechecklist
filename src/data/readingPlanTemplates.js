import { BOOKS } from "./books";

// ── Schedule generator ────────────────────────────────────────────────────────
// Distributes chapters evenly across days. Returns array of:
//   { day: number, readings: [{ bookIndex, bookName, bookAbbr, chapter }] }

export function generateSchedule(bookIndices, totalDays) {
  const allChapters = [];
  for (const bi of bookIndices) {
    const book = BOOKS[bi];
    for (let ch = 1; ch <= book.chapters; ch++) {
      allChapters.push({ bookIndex: bi, bookName: book.name, bookAbbr: book.abbr, chapter: ch });
    }
  }

  const total = allChapters.length;
  const schedule = [];
  let idx = 0;

  for (let day = 1; day <= totalDays && idx < total; day++) {
    const remaining = totalDays - day + 1;
    const chaptersLeft = total - idx;
    const count = Math.round(chaptersLeft / remaining);
    const readings = [];
    for (let i = 0; i < count && idx < total; i++) {
      readings.push(allChapters[idx++]);
    }
    if (readings.length) schedule.push({ day, readings });
  }

  return schedule;
}

// ── Preset templates ──────────────────────────────────────────────────────────

const ALL = Array.from({ length: 66 }, (_, i) => i);
const OT  = Array.from({ length: 39 }, (_, i) => i);
const NT  = Array.from({ length: 27 }, (_, i) => i + 39);

export const PLAN_TEMPLATES = [
  {
    key: "nwt-1-year",
    name: "NWT in 1 Year",
    description: "Read the entire New World Translation — all 66 books — in 365 days.",
    icon: "📖",
    totalDays: 365,
    difficulty: "Dedicated",
    bookIndices: ALL,
    totalChapters: BOOKS.reduce((s, b) => s + b.chapters, 0),
  },
  {
    key: "nt-90-days",
    name: "New Testament in 90 Days",
    description: "Read all 27 books of the Christian Greek Scriptures in just 90 days.",
    icon: "📘",
    totalDays: 90,
    difficulty: "Moderate",
    bookIndices: NT,
    totalChapters: NT.reduce((s, i) => s + BOOKS[i].chapters, 0),
  },
  {
    key: "ot-1-year",
    name: "Hebrew Scriptures in 1 Year",
    description: "Journey through all 39 books of the Hebrew Scriptures over the course of a year.",
    icon: "📜",
    totalDays: 365,
    difficulty: "Moderate",
    bookIndices: OT,
    totalChapters: OT.reduce((s, i) => s + BOOKS[i].chapters, 0),
  },
  {
    key: "gospels-30",
    name: "Gospels in 30 Days",
    description: "Read Matthew, Mark, Luke, and John in a focused 30-day sprint.",
    icon: "🕊️",
    totalDays: 30,
    difficulty: "Easy",
    bookIndices: [39, 40, 41, 42],
    totalChapters: [39, 40, 41, 42].reduce((s, i) => s + BOOKS[i].chapters, 0),
  },
  {
    key: "psalms-proverbs-60",
    name: "Psalms & Proverbs in 60 Days",
    description: "Soak in the wisdom and poetry of Psalms and Proverbs over two months.",
    icon: "🎵",
    totalDays: 60,
    difficulty: "Easy",
    bookIndices: [18, 19],
    totalChapters: [18, 19].reduce((s, i) => s + BOOKS[i].chapters, 0),
  },
  {
    key: "major-prophets-90",
    name: "Major Prophets in 90 Days",
    description: "Read Isaiah, Jeremiah, Lamentations, Ezekiel, and Daniel in 90 days.",
    icon: "🔥",
    totalDays: 90,
    difficulty: "Moderate",
    bookIndices: [22, 23, 24, 25, 26],
    totalChapters: [22, 23, 24, 25, 26].reduce((s, i) => s + BOOKS[i].chapters, 0),
  },
];

export function getTemplate(key) {
  return PLAN_TEMPLATES.find(t => t.key === key) ?? null;
}

export const DIFFICULTY_COLOR = {
  Easy: "var(--teal)",
  Moderate: "#f59e0b",
  Dedicated: "#8b5cf6",
};
