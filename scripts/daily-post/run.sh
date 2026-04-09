#!/usr/bin/env bash
# JW Study — Daily Auto-Post Agent
# Runs via Windows Task Scheduler daily. Uses Claude Code (Max subscription).
# Setup: see README in this folder.

set -euo pipefail

cd "$(dirname "$0")/../.."

# ── Date math ────────────────────────────────────────────────────────────────
TODAY=$(date +%Y-%m-%d)
DAY_OF_YEAR=$(date +%j | sed 's/^0*//')   # strip leading zeros: 001 → 1
CONTENT_TYPE=$(( DAY_OF_YEAR % 3 ))        # 0=insight  1=book  2=forum
BOOK_INDEX=$(( DAY_OF_YEAR % 66 ))         # 0-65 → cycles through 66 books

BOOKS=(
  "Genesis" "Exodus" "Leviticus" "Numbers" "Deuteronomy"
  "Joshua" "Judges" "Ruth" "1 Samuel" "2 Samuel"
  "1 Kings" "2 Kings" "1 Chronicles" "2 Chronicles" "Ezra"
  "Nehemiah" "Esther" "Job" "Psalms" "Proverbs"
  "Ecclesiastes" "Song of Solomon" "Isaiah" "Jeremiah" "Lamentations"
  "Ezekiel" "Daniel" "Hosea" "Joel" "Amos"
  "Obadiah" "Jonah" "Micah" "Nahum" "Habakkuk"
  "Zephaniah" "Haggai" "Zechariah" "Malachi"
  "Matthew" "Mark" "Luke" "John" "Acts"
  "Romans" "1 Corinthians" "2 Corinthians" "Galatians" "Ephesians"
  "Philippians" "Colossians" "1 Thessalonians" "2 Thessalonians"
  "1 Timothy" "2 Timothy" "Titus" "Philemon" "Hebrews"
  "James" "1 Peter" "2 Peter" "1 John" "2 John" "3 John"
  "Jude" "Revelation"
)
BOOK="${BOOKS[$BOOK_INDEX]}"

# ── Build type-specific instructions ─────────────────────────────────────────
if [ "$CONTENT_TYPE" -eq 0 ]; then
  TYPE_INSTRUCTIONS="
CONTENT TYPE: Daily Bible Insight (BLOG POST)
- Pick one meaningful verse from anywhere in the Bible relevant to today's date or a theme
  Jehovah's Witnesses would find upbuilding (e.g. trust in Jehovah, endurance, Kingdom hope,
  field service, personal study, family worship, resurrection hope, the new world).
- Write a rich blog post: ~400-500 words total
- Structure:
    Title: compelling title referencing the verse/theme (no clickbait)
    Excerpt: 1-2 sentence summary (max 200 chars)
    Content (Markdown):
      ## [Verse reference] — [short phrase]
      Full verse text (NWT wording)

      3-4 paragraphs of commentary and practical application

      ## Reflection Questions
      - 2-3 questions for personal study or family worship

      ## Prayer Point
      One sentence suggestion for prayer to Jehovah
- Slug: lowercase-hyphenated from title, prefix with date: ${TODAY}-[slug]
- published: true
- author_id: 7e698046-4dcb-4421-b697-a0230294b618
- lang: en
- Insert into: blog_posts table"

elif [ "$CONTENT_TYPE" -eq 1 ]; then
  TYPE_INSTRUCTIONS="
CONTENT TYPE: Book Spotlight (BLOG POST)
- Today's book: ${BOOK} (book ${BOOK_INDEX} of 66)
- Write a rich blog post: ~400-500 words total
- Structure:
    Title: \"Spotlight: [Book Name] — [one compelling theme from that book]\"
    Excerpt: 1-2 sentence hook about why this book matters (max 200 chars)
    Content (Markdown):
      ## About ${BOOK}
      Brief overview: author, time period, key themes (2-3 sentences)

      ## Key Themes
      2-3 themes with scripture references (NWT wording for verses)

      ## A Verse Worth Meditating On
      One key verse quoted in full, then 2 paragraphs of reflection

      ## How to Study ${BOOK}
      2-3 practical tips for reading this book (e.g. outline approach,
      cross-references with other books, theocratic context)

      ## For Your Reading Log
      Encourage readers to track their progress on JW Study
- Slug: ${TODAY}-book-spotlight-$(echo "${BOOK}" | tr '[:upper:] ' '[:lower:]-')
- published: true
- author_id: 7e698046-4dcb-4421-b697-a0230294b618
- lang: en
- Insert into: blog_posts table"

else
  TYPE_INSTRUCTIONS="
CONTENT TYPE: Community Discussion Prompt (FORUM THREAD)
- Pick ONE of these forum categories based on the topic:
    Bible Study:        bd30577e-386f-4fe7-a714-dcf126ac8653
    Prayer/Reflection:  9f7d06fd-706c-4687-acf5-ced9f78aa7de
    Questions:          390981fb-154c-4b4c-8f10-f9e6f7ff3cc2
    General Discussion: f0849dfa-cf9c-4375-86ab-284820612b58
- Write a thread that sparks genuine community discussion. ~150-250 words.
- Ideas: share a scripture that helped you recently, ask for study tips,
  discuss a theme from the weekly CLAM or WT article, ask how others
  balance field service with daily reading, share encouragement.
- Title: engaging question or statement (not clickbait, warm and brotherly tone)
- Content (plain text, no markdown headers needed):
    Opening paragraph: context or personal reflection to set the scene
    The discussion question(s)
    Closing encouragement to share
- author_id: 7e698046-4dcb-4421-b697-a0230294b618
- lang: en
- Insert into: forum_threads table"
fi

# ── Full agent prompt ─────────────────────────────────────────────────────────
PROMPT="You are the JW Study content agent. Today is ${TODAY}.
Your job is to generate one piece of high-quality daily content and insert it
directly into the Supabase database using the mcp__claude_ai_Supabase__execute_sql tool.

IMPORTANT DOCTRINE GUIDELINES (strictly follow these — this is a Jehovah's Witnesses app):
- Always use Jehovah as God's personal name (not LORD, not God alone)
- Jesus is Jehovah's Son — do NOT imply or state they are equal or the same (no Trinity)
- Jesus died on a torture stake, NOT a cross — never use cross imagery or language
- Quote from the New World Translation (NWT) — use NWT wording for all scripture
- Focus on Kingdom hope: paradise earth, resurrection of the dead, new world
- Theocratic activities: meetings (CLAM/Watchtower study), field service, personal study,
  family worship, Bible reading, congregation life
- Warm, upbuilding, encouraging tone — like a fellow publisher writing to the congregation
- No holiday content (Christmas, Easter, birthdays, etc.)
- No interfaith or ecumenical framing
- No hellfire, immortal soul, or purgatory doctrine

DATABASE — Supabase project: yudyhigvqaodnoqwwtns
Use tool: mcp__claude_ai_Supabase__execute_sql

${TYPE_INSTRUCTIONS}

STEPS:
1. Generate the content following the structure above
2. Build the INSERT SQL statement with all required fields
3. Execute the INSERT using mcp__claude_ai_Supabase__execute_sql
4. Confirm success by printing: POSTED: [title]

For blog_posts use this SQL shape:
INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang)
VALUES ('[author_id]', '[title]', '[slug]', '[excerpt]', \$\$[content]\$\$, true, 'en');

For forum_threads use:
INSERT INTO forum_threads (category_id, author_id, title, content, lang)
VALUES ('[category_id]', '[author_id]', '[title]', \$\$[content]\$\$, 'en');

Use dollar-quoting (\$\$...\$\$) for the content field to safely handle apostrophes and quotes.
Generate and insert now."

# ── Run Claude agent ──────────────────────────────────────────────────────────
echo "[$TODAY] Running daily post agent (type=$CONTENT_TYPE, book=${BOOK})..."

echo "$PROMPT" | claude --print \
  --allowedTools "mcp__claude_ai_Supabase__execute_sql"

echo "[$TODAY] Done."
