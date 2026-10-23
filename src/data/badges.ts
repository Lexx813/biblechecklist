// src/data/badges.js
// label/description stay in English as data; render via
// t(badge.labelKey, badge.label) / t(badge.descKey, badge.description).
export const BADGES = [
  { key: "full_bible_read", labelKey: "badges.fullBibleRead", descKey: "badges.fullBibleReadDesc", label: "Read the Whole Bible", emoji: "📖", description: "Read all 1,189 chapters of the Bible" },
  { key: "streak_30", labelKey: "badges.streak30", descKey: "badges.streak30Desc",       label: "30-Day Streak",       emoji: "🔥", description: "Maintained a reading streak for 30 consecutive days" },
  { key: "streak_100", labelKey: "badges.streak100", descKey: "badges.streak100Desc",      label: "100-Day Streak",      emoji: "⚡", description: "Maintained a reading streak for 100 consecutive days" },
  { key: "streak_365", labelKey: "badges.streak365", descKey: "badges.streak365Desc",      label: "Year-Long Streak",    emoji: "🌟", description: "Maintained a reading streak for 365 consecutive days" },
  { key: "quiz_all_levels", labelKey: "badges.quizAllLevels", descKey: "badges.quizAllLevelsDesc", label: "Quiz Champion",       emoji: "🏆", description: "Completed all 12 quiz levels" },
  { key: "first_note", labelKey: "badges.firstNote", descKey: "badges.firstNoteDesc",      label: "First Note",          emoji: "📝", description: "Saved your first study note" },
  { key: "first_group", labelKey: "badges.firstGroup", descKey: "badges.firstGroupDesc",     label: "Group Member",        emoji: "👥", description: "Joined your first study group" },
  { key: "plan_complete", labelKey: "badges.planComplete", descKey: "badges.planCompleteDesc",   label: "Plan Finisher",       emoji: "✅", description: "Completed a reading plan" },
  { key: "full_nt_read", labelKey: "badges.fullNtRead", descKey: "badges.fullNtReadDesc",    label: "Greek Scriptures Complete",   emoji: "📘", description: "Read all chapters of the Christian Greek Scriptures" },
  { key: "full_ot_read", labelKey: "badges.fullOtRead", descKey: "badges.fullOtReadDesc",    label: "Hebrew Scriptures Complete",  emoji: "📜", description: "Read all chapters of the Hebrew Scriptures" },
];
