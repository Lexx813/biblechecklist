// @ts-nocheck
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

// ── Book index constants ──────────────────────────────────────────────────────

const ALL    = Array.from({ length: 66 }, (_, i) => i);
const OT     = Array.from({ length: 39 }, (_, i) => i);
const NT     = Array.from({ length: 27 }, (_, i) => i + 39);
// Wisdom literature: Job, Psalms, Proverbs, Ecclesiastes, Song of Solomon
const WISDOM = [17, 18, 19, 20, 21];
// Minor Prophets: Hosea through Malachi
const MINOR_PROPHETS = Array.from({ length: 12 }, (_, i) => i + 27);
// Paul's letters: Romans through Philemon
const PAULS_LETTERS  = Array.from({ length: 13 }, (_, i) => i + 44);
// Acts + all NT letters + Revelation
const ACTS_AND_LETTERS = Array.from({ length: 23 }, (_, i) => i + 43);
// Gospels
const GOSPELS = [39, 40, 41, 42];

function chaptersFor(indices) {
  return indices.reduce((s, i) => s + BOOKS[i].chapters, 0);
}

// ── Preset templates ──────────────────────────────────────────────────────────

export const PLAN_TEMPLATES = [
  // ── Existing 6 ─────────────────────────────────────────────────────────────
  {
    key: "nwt-1-year",
    name: "NWT in 1 Year",
    description: "Read the entire New World Translation — all 66 books — in 365 days.",
    icon: "📖",
    totalDays: 365,
    difficulty: "Dedicated",
    bookIndices: ALL,
    totalChapters: chaptersFor(ALL),
    category: "full-bible",
  },
  {
    key: "nt-90-days",
    name: "New Testament in 90 Days",
    description: "Read all 27 books of the Christian Greek Scriptures in just 90 days.",
    icon: "📘",
    totalDays: 90,
    difficulty: "Moderate",
    bookIndices: NT,
    totalChapters: chaptersFor(NT),
    category: "nt",
  },
  {
    key: "ot-1-year",
    name: "Hebrew Scriptures in 1 Year",
    description: "Journey through all 39 books of the Hebrew Scriptures over the course of a year.",
    icon: "📜",
    totalDays: 365,
    difficulty: "Moderate",
    bookIndices: OT,
    totalChapters: chaptersFor(OT),
    category: "ot",
  },
  {
    key: "gospels-30",
    name: "Gospels in 30 Days",
    description: "Read Matthew, Mark, Luke, and John in a focused 30-day sprint.",
    icon: "🕊️",
    totalDays: 30,
    difficulty: "Easy",
    bookIndices: GOSPELS,
    totalChapters: chaptersFor(GOSPELS),
    category: "nt",
  },
  {
    key: "psalms-proverbs-60",
    name: "Psalms & Proverbs in 60 Days",
    description: "Soak in the wisdom and poetry of Psalms and Proverbs over two months.",
    icon: "🎵",
    totalDays: 60,
    difficulty: "Easy",
    bookIndices: [18, 19],
    totalChapters: chaptersFor([18, 19]),
    category: "thematic",
  },
  {
    key: "major-prophets-90",
    name: "Major Prophets in 90 Days",
    description: "Read Isaiah, Jeremiah, Lamentations, Ezekiel, and Daniel in 90 days.",
    icon: "🔥",
    totalDays: 90,
    difficulty: "Moderate",
    bookIndices: [22, 23, 24, 25, 26],
    totalChapters: chaptersFor([22, 23, 24, 25, 26]),
    category: "thematic",
  },

  // ── New premium templates ───────────────────────────────────────────────────
  {
    key: "nwt-90-days",
    name: "Intensive: Bible in 90 Days",
    description: "Cover all 66 books in just 90 days — the ultimate reading challenge for dedicated readers.",
    icon: "⚡",
    totalDays: 90,
    difficulty: "Dedicated",
    bookIndices: ALL,
    totalChapters: chaptersFor(ALL),
    category: "full-bible",
    isPremiumHighlight: true,
  },
  {
    key: "wisdom-lit-90",
    name: "Wisdom Literature in 90 Days",
    description: "Immerse yourself in Job, Psalms, Proverbs, Ecclesiastes, and Song of Solomon — the poetry and wisdom of the Bible.",
    icon: "🦉",
    totalDays: 90,
    difficulty: "Easy",
    bookIndices: WISDOM,
    totalChapters: chaptersFor(WISDOM),
    category: "thematic",
    isPremiumHighlight: true,
  },
  {
    key: "pauls-letters-30",
    name: "Paul's Letters in 30 Days",
    description: "Dive deep into all 13 letters of the apostle Paul — from Romans to Philemon — in one focused month.",
    icon: "✉️",
    totalDays: 30,
    difficulty: "Moderate",
    bookIndices: PAULS_LETTERS,
    totalChapters: chaptersFor(PAULS_LETTERS),
    category: "nt",
    isPremiumHighlight: true,
  },
  {
    key: "minor-prophets-30",
    name: "Minor Prophets in 30 Days",
    description: "Explore all 12 Minor Prophets — from Hosea to Malachi — in a powerful 30-day journey.",
    icon: "🌿",
    totalDays: 30,
    difficulty: "Easy",
    bookIndices: MINOR_PROPHETS,
    totalChapters: chaptersFor(MINOR_PROPHETS),
    category: "ot",
    isPremiumHighlight: true,
  },
  {
    key: "acts-letters-60",
    name: "Acts & the Letters in 60 Days",
    description: "Follow the early Christian congregation through Acts, then study every letter through Revelation in 60 days.",
    icon: "⛵",
    totalDays: 60,
    difficulty: "Moderate",
    bookIndices: ACTS_AND_LETTERS,
    totalChapters: chaptersFor(ACTS_AND_LETTERS),
    category: "nt",
    isPremiumHighlight: true,
  },
];

export const PLAN_CATEGORIES = [
  { key: "all",        label: "All Plans" },
  { key: "full-bible", label: "Full Bible" },
  { key: "nt",         label: "New Testament" },
  { key: "ot",         label: "Old Testament" },
  { key: "thematic",   label: "Thematic" },
];

export function getTemplate(key) {
  return PLAN_TEMPLATES.find(t => t.key === key) ?? null;
}

// For custom plans: returns the template object from plan.custom_config if key === 'custom'
export function getTemplateOrCustom(plan) {
  if (plan.template_key === "custom" && plan.custom_config) {
    return {
      key: "custom",
      icon: plan.custom_config.icon ?? "🗂️",
      name: plan.custom_config.name ?? "Custom Plan",
      description: plan.custom_config.description ?? "",
      totalDays: plan.custom_config.totalDays,
      totalChapters: plan.custom_config.totalChapters,
      bookIndices: plan.custom_config.bookIndices,
      difficulty: plan.custom_config.difficulty ?? "Custom",
      category: "custom",
    };
  }
  return getTemplate(plan.template_key);
}

export const DIFFICULTY_COLOR = {
  Easy: "var(--teal)",
  Moderate: "#f59e0b",
  Dedicated: "#8b5cf6",
  Custom: "#6b7280",
};
