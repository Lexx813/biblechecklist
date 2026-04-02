# Study Notes — Method Templates

**Date:** 2026-04-02  
**Status:** Approved  
**Premium gate:** Inductive and SOAP templates are premium-only. Blank and Verse-by-Verse are free.

---

## Overview

When creating a new study note, users can choose a template that pre-fills the note editor with a structured format. This removes blank-page paralysis and guides users into proven Bible study methods. Templates are static markdown strings — no DB changes required.

---

## Templates

### Free Templates

**Blank** (current default behavior)
```
(empty)
```

**Verse-by-Verse**
```
## [Book Chapter:Verse]

**Verse:**

**Reflection:**

---

## [Book Chapter:Verse]

**Verse:**

**Reflection:**
```

### Premium Templates (✦)

**Inductive Study — Observe / Interpret / Apply**
```
# [Title]

## 📖 Observe
*What does the text say? (Facts, repeated words, key figures, context)*



## 🔍 Interpret
*What does the text mean? (Main point, why written, cross-references)*



## ✏️ Apply
*How does this apply to my life? (Specific action or attitude change)*
```

**SOAP — Scripture / Observation / Application / Prayer**
```
# [Title]

## Scripture
*Write out the verse(s) in full*



## Observation
*What stands out? Who, what, when, where, why?*



## Application
*How does this speak to my current situation?*



## Prayer
*Personal prayer based on this passage*
```

---

## UI

### Template Picker

**Trigger:** When user taps "New Note" (existing button in `StudyNotesPage.jsx`)

**Flow:**
1. Instead of immediately opening the note editor, show a template picker modal/bottom sheet
2. 4 template cards in a 2×2 grid (or vertical list on mobile)
3. Each card: template name + short preview of structure (greyed out text lines)
4. Premium templates show a ✦ lock icon for free users — tapping shows upgrade CTA
5. "Blank" is the default selection (pre-selected)
6. "Continue →" button opens the note editor with template content pre-filled

**Template card design:**
- Name label (e.g., "Inductive Study")
- 3–4 lines of faint placeholder text showing the section headers
- Small ✦ badge in top-right corner for premium templates
- Selected state: purple border highlight

**Skipping:** A "Skip — start blank" text link below the grid for users who don't want a template.

### Note Editor Pre-fill

The selected template string is set as the initial `content` value when the note editor opens. The user can edit, delete, or reformat freely — the template is just a starting point.

If user selects "Blank" or clicks "Skip", behavior is identical to current: editor opens with empty content.

---

## No DB Changes

Template content is a pre-populated string inserted into the existing `notes.content` field (markdown text). No new columns or tables needed.

**Optional future enhancement:** Store `template_key text` on the notes record to track which template was used (for analytics). Not in scope for this sprint.

---

## i18n

Template section headers (Observe, Interpret, Apply, Scripture, etc.) should be in the user's language. The template strings are defined with translation keys for the headers, falling back to English. Template preview cards in the picker use translated header names.

---

## Non-Goals
- No custom user-created templates in this sprint
- No template switching after a note is started (template is set at creation only)
- No AI-generated template content (Phase 4)
