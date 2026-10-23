// src/data/noteTemplates.js
//
// English source data lives here; every user-visible string also has a stable
// i18n key (noteTemplates.*). Translate at render/insert time via
// getTemplateName / getTemplatePreviewLines / getTemplateContent.

type TFn = (key: string, fallback: string) => string;

export interface NoteTemplatePreviewLine {
  key: string;
  text: string;
}

export interface NoteTemplateDef {
  key: string;
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  previewLines: NoteTemplatePreviewLine[];
  /** English content (fallback). Use getTemplateContent(t) to get localized content. */
  content: string;
}

export const NOTE_TEMPLATES: NoteTemplateDef[] = [
  {
    key: "blank",
    name: "Blank",
    nameKey: "noteTemplates.blankName",
    description: "Start with an empty note",
    descriptionKey: "noteTemplates.blankDesc",
    previewLines: [],
    content: "",
  },
  {
    key: "verse_by_verse",
    name: "Verse-by-Verse",
    nameKey: "noteTemplates.verseByVerseName",
    description: "Structured reflection per verse",
    descriptionKey: "noteTemplates.verseByVerseDesc",
    previewLines: [
      { key: "noteTemplates.verseRefHeading", text: "## [Book Chapter:Verse]" },
      { key: "noteTemplates.verseLabel", text: "**Verse:**" },
      { key: "noteTemplates.reflectionLabel", text: "**Reflection:**" },
    ],
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
    nameKey: "noteTemplates.inductiveName",
    description: "Observe · Interpret · Apply",
    descriptionKey: "noteTemplates.inductiveDesc",
    previewLines: [
      { key: "noteTemplates.observePreview", text: "📖 Observe" },
      { key: "noteTemplates.interpretPreview", text: "🔍 Interpret" },
      { key: "noteTemplates.applyPreview", text: "✏️ Apply" },
    ],
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
    nameKey: "noteTemplates.soapName",
    description: "Scripture · Observation · Application · Prayer",
    descriptionKey: "noteTemplates.soapDesc",
    previewLines: [
      { key: "noteTemplates.scripture", text: "Scripture" },
      { key: "noteTemplates.observation", text: "Observation" },
      { key: "noteTemplates.application", text: "Application" },
      { key: "noteTemplates.prayer", text: "Prayer" },
    ],
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

export function getTemplateName(tpl: NoteTemplateDef, t: TFn): string {
  return t(tpl.nameKey, tpl.name);
}

export function getTemplateDescription(tpl: NoteTemplateDef, t: TFn): string {
  return t(tpl.descriptionKey, tpl.description);
}

export function getTemplatePreviewLines(tpl: NoteTemplateDef, t: TFn): string[] {
  return tpl.previewLines.map((l) => t(l.key, l.text));
}

/** Localized template body, built at insertion time. */
export function getTemplateContent(key: string, t: TFn): string {
  const title = t("noteTemplates.titlePlaceholder", "[Title]");
  switch (key) {
    case "verse_by_verse": {
      const block = `${t("noteTemplates.verseRefHeading", "## [Book Chapter:Verse]")}

${t("noteTemplates.verseLabel", "**Verse:**")}

${t("noteTemplates.reflectionLabel", "**Reflection:**")}`;
      return `${block}

---

${block}`;
    }
    case "inductive":
      return `# ${title}

## ${t("noteTemplates.observePreview", "📖 Observe")}
*${t("noteTemplates.observePrompt", "What does the text say? (Facts, repeated words, key figures, context)")}*



## ${t("noteTemplates.interpretPreview", "🔍 Interpret")}
*${t("noteTemplates.interpretPrompt", "What does the text mean? (Main point, why written, cross-references)")}*



## ${t("noteTemplates.applyPreview", "✏️ Apply")}
*${t("noteTemplates.applyPrompt", "How does this apply to my life? (Specific action or attitude change)")}*`;
    case "soap":
      return `# ${title}

## ${t("noteTemplates.scripture", "Scripture")}
*${t("noteTemplates.scripturePrompt", "Write out the verse(s) in full")}*



## ${t("noteTemplates.observation", "Observation")}
*${t("noteTemplates.observationPrompt", "What stands out? Who, what, when, where, why?")}*



## ${t("noteTemplates.application", "Application")}
*${t("noteTemplates.applicationPrompt", "How does this speak to my current situation?")}*



## ${t("noteTemplates.prayer", "Prayer")}
*${t("noteTemplates.prayerPrompt", "Personal prayer based on this passage")}*`;
    default:
      return NOTE_TEMPLATES.find((tpl) => tpl.key === key)?.content ?? "";
  }
}
