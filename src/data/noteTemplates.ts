// src/data/noteTemplates.js

export const NOTE_TEMPLATES = [
  {
    key: "blank",
    name: "Blank",
    description: "Start with an empty note",
    previewLines: [],
    isPremium: false,
    content: "",
  },
  {
    key: "verse_by_verse",
    name: "Verse-by-Verse",
    description: "Structured reflection per verse",
    previewLines: ["## [Book Chapter:Verse]", "**Verse:**", "**Reflection:**"],
    isPremium: false,
    content: `## [Book Chapter:Verse]

**Verse:**

**Reflection:**

---

## [Book Chapter:Verse]

**Verse:**

**Reflection:**`,
  },
  {
    key: "inductive",
    name: "Inductive Study",
    description: "Observe · Interpret · Apply",
    previewLines: ["📖 Observe", "🔍 Interpret", "✏️ Apply"],
    isPremium: true,
    content: `# [Title]

## 📖 Observe
*What does the text say? (Facts, repeated words, key figures, context)*



## 🔍 Interpret
*What does the text mean? (Main point, why written, cross-references)*



## ✏️ Apply
*How does this apply to my life? (Specific action or attitude change)*`,
  },
  {
    key: "soap",
    name: "SOAP",
    description: "Scripture · Observation · Application · Prayer",
    previewLines: ["Scripture", "Observation", "Application", "Prayer"],
    isPremium: true,
    content: `# [Title]

## Scripture
*Write out the verse(s) in full*



## Observation
*What stands out? Who, what, when, where, why?*



## Application
*How does this speak to my current situation?*



## Prayer
*Personal prayer based on this passage*`,
  },
];
