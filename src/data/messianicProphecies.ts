/**
 * Messianic prophecies from the Hebrew Scriptures fulfilled in the Christian
 * Greek Scriptures. Sourced from the standard JW catalog in *Insight on the
 * Scriptures*, vol. 2 ("Jesus Christ" article), and *Reasoning From the
 * Scriptures* under "Jesus Christ → Prophecies fulfilled."
 *
 * 30 pairs across 6 narrative arcs:
 *   lineage       — promised seed, tribe, line of descent
 *   birth         — birth circumstances and early life
 *   ministry      — preaching, miracles, identity
 *   rejection     — betrayal, trial, suffering
 *   death-burial  — manner of death and burial
 *   resurrection  — raised, ascended, exalted
 *
 * Each pair lists the Hebrew-Scripture prophecy and one or more Christian-
 * Greek-Scripture passages where it was fulfilled. `summary` is editorial
 * (our voice). For the actual NWT wording, the UI links each ref out to
 * the canonical wol.jw.org chapter URL.
 */

export type ProphecyCategory =
  | "lineage"
  | "birth"
  | "ministry"
  | "rejection"
  | "death-burial"
  | "resurrection";

export interface ScriptureRef {
  /** Display, e.g. "Genesis 3:15" or "Matthew 1:22, 23" */
  ref: string;
  /** Lowercase JW.org book slug, e.g. "genesis", "1-samuel", "matthew" */
  bookSlug: string;
  /** Chapter — used to build the wol.jw.org URL */
  chapter: number;
}

export interface MessianicProphecyPair {
  id: string;
  category: ProphecyCategory;
  /** One-sentence editorial framing, our voice. */
  summary: string;
  prophecy: ScriptureRef;
  fulfillments: ScriptureRef[];
}

export const PROPHECY_CATEGORIES: Array<{ key: ProphecyCategory; label: string; description: string }> = [
  { key: "lineage",       label: "Promised line",      description: "From the seed of the woman to the throne of David — Jehovah's chosen line, traced over thousands of years." },
  { key: "birth",         label: "Birth and arrival",  description: "Where, when, and how the Messiah would enter the human family." },
  { key: "ministry",      label: "Ministry and identity", description: "How the Messiah would preach, heal, and reveal himself as King." },
  { key: "rejection",     label: "Rejected and tried", description: "Foretold betrayal, false witnesses, silence before accusers." },
  { key: "death-burial",  label: "Death and burial",   description: "The exact circumstances of his execution and tomb." },
  { key: "resurrection",  label: "Raised and exalted", description: "Resurrection, ascent to heaven, seated at Jehovah's right hand." },
];

export const MESSIANIC_PROPHECIES: MessianicProphecyPair[] = [
  // ── Promised line ──────────────────────────────────────────────────────
  {
    id: "seed-of-the-woman",
    category: "lineage",
    summary: "The first prophecy in the Bible — the promised Seed who would crush the serpent.",
    prophecy:    { ref: "Genesis 3:15",        bookSlug: "genesis",     chapter: 3 },
    fulfillments: [
      { ref: "Galatians 3:16",                 bookSlug: "galatians",   chapter: 3 },
      { ref: "Hebrews 2:14",                   bookSlug: "hebrews",     chapter: 2 },
      { ref: "Revelation 12:9, 17",            bookSlug: "revelation",  chapter: 12 },
    ],
  },
  {
    id: "descendant-of-abraham",
    category: "lineage",
    summary: "All nations would be blessed through Abraham's descendant.",
    prophecy:    { ref: "Genesis 22:18",       bookSlug: "genesis",     chapter: 22 },
    fulfillments: [
      { ref: "Matthew 1:1",                    bookSlug: "matthew",     chapter: 1 },
      { ref: "Galatians 3:16",                 bookSlug: "galatians",   chapter: 3 },
      { ref: "Acts 3:25",                      bookSlug: "acts",        chapter: 3 },
    ],
  },
  {
    id: "tribe-of-judah",
    category: "lineage",
    summary: "Jacob foretold the ruling staff would not depart from Judah.",
    prophecy:    { ref: "Genesis 49:10",       bookSlug: "genesis",     chapter: 49 },
    fulfillments: [
      { ref: "Hebrews 7:14",                   bookSlug: "hebrews",     chapter: 7 },
      { ref: "Revelation 5:5",                 bookSlug: "revelation",  chapter: 5 },
    ],
  },
  {
    id: "line-of-david",
    category: "lineage",
    summary: "Jehovah promised David an everlasting kingdom through his offspring.",
    prophecy:    { ref: "2 Samuel 7:12, 13; Isaiah 9:6, 7", bookSlug: "2-samuel", chapter: 7 },
    fulfillments: [
      { ref: "Matthew 1:1, 6, 16",             bookSlug: "matthew",     chapter: 1 },
      { ref: "Luke 1:32, 33",                  bookSlug: "luke",        chapter: 1 },
      { ref: "Acts 13:22, 23",                 bookSlug: "acts",        chapter: 13 },
    ],
  },
  {
    id: "seventy-weeks",
    category: "lineage",
    summary: "Daniel's prophecy of the 70 weeks pinpointed when the Messiah would appear — fulfilled in 29 C.E.",
    prophecy:    { ref: "Daniel 9:24-27",      bookSlug: "daniel",      chapter: 9 },
    fulfillments: [
      { ref: "Luke 3:21, 22",                  bookSlug: "luke",        chapter: 3 },
      { ref: "John 1:32-34",                   bookSlug: "john",        chapter: 1 },
    ],
  },
  {
    id: "through-isaac",
    category: "lineage",
    summary: "Through Isaac — not Ishmael — the promised Seed would come.",
    prophecy:    { ref: "Genesis 17:19, 21",   bookSlug: "genesis",     chapter: 17 },
    fulfillments: [
      { ref: "Matthew 1:2",                    bookSlug: "matthew",     chapter: 1 },
      { ref: "Hebrews 11:17-19",               bookSlug: "hebrews",     chapter: 11 },
    ],
  },
  {
    id: "through-jacob",
    category: "lineage",
    summary: "Through Jacob — not Esau — the line would continue.",
    prophecy:    { ref: "Genesis 28:13, 14",   bookSlug: "genesis",     chapter: 28 },
    fulfillments: [
      { ref: "Luke 3:34",                      bookSlug: "luke",        chapter: 3 },
    ],
  },
  {
    id: "everlasting-throne",
    category: "lineage",
    summary: "David's throne would last forever — fulfilled in the resurrected Jesus, who reigns as Messianic King without end.",
    prophecy:    { ref: "Psalm 89:3, 4, 35-37", bookSlug: "psalms",     chapter: 89 },
    fulfillments: [
      { ref: "Luke 1:32, 33",                  bookSlug: "luke",        chapter: 1 },
      { ref: "Acts 2:30",                      bookSlug: "acts",        chapter: 2 },
    ],
  },
  {
    id: "firstborn-heir",
    category: "lineage",
    summary: "The Messiah would be Jehovah's firstborn — appointed heir over the kings of the earth.",
    prophecy:    { ref: "Psalm 89:27",         bookSlug: "psalms",      chapter: 89 },
    fulfillments: [
      { ref: "Colossians 1:15",                bookSlug: "colossians",  chapter: 1 },
      { ref: "Hebrews 1:6",                    bookSlug: "hebrews",     chapter: 1 },
    ],
  },

  // ── Birth and arrival ──────────────────────────────────────────────────
  {
    id: "born-of-virgin",
    category: "birth",
    summary: "Isaiah foretold that a young woman who had not had relations with a man would give birth to a son named Immanuel.",
    prophecy:    { ref: "Isaiah 7:14",         bookSlug: "isaiah",      chapter: 7 },
    fulfillments: [
      { ref: "Matthew 1:22, 23",               bookSlug: "matthew",     chapter: 1 },
      { ref: "Luke 1:26-35",                   bookSlug: "luke",        chapter: 1 },
    ],
  },
  {
    id: "born-in-bethlehem",
    category: "birth",
    summary: "Micah named the small town of Bethlehem Ephrathah as the Messiah's birthplace seven centuries before it happened.",
    prophecy:    { ref: "Micah 5:2",           bookSlug: "micah",       chapter: 5 },
    fulfillments: [
      { ref: "Matthew 2:1-6",                  bookSlug: "matthew",     chapter: 2 },
      { ref: "Luke 2:4-7",                     bookSlug: "luke",        chapter: 2 },
    ],
  },
  {
    id: "star-of-the-east",
    category: "birth",
    summary: "Balaam saw a star coming out of Jacob — astrologers from the east saw it and went to Jerusalem.",
    prophecy:    { ref: "Numbers 24:17",       bookSlug: "numbers",     chapter: 24 },
    fulfillments: [
      { ref: "Matthew 2:1, 2, 9, 10",          bookSlug: "matthew",     chapter: 2 },
    ],
  },
  {
    id: "children-killed",
    category: "birth",
    summary: "Jeremiah foretold a weeping in Ramah — fulfilled when Herod ordered the boys of Bethlehem killed.",
    prophecy:    { ref: "Jeremiah 31:15",      bookSlug: "jeremiah",    chapter: 31 },
    fulfillments: [
      { ref: "Matthew 2:16-18",                bookSlug: "matthew",     chapter: 2 },
    ],
  },
  {
    id: "out-of-egypt",
    category: "birth",
    summary: "Hosea: \"Out of Egypt I called my son.\" Jesus' family fled to Egypt and returned after Herod died.",
    prophecy:    { ref: "Hosea 11:1",          bookSlug: "hosea",       chapter: 11 },
    fulfillments: [
      { ref: "Matthew 2:14, 15",               bookSlug: "matthew",     chapter: 2 },
    ],
  },
  {
    id: "forerunner",
    category: "birth",
    summary: "A messenger would prepare the way — fulfilled in John the Baptizer.",
    prophecy:    { ref: "Isaiah 40:3; Malachi 3:1", bookSlug: "isaiah", chapter: 40 },
    fulfillments: [
      { ref: "Matthew 3:1-3",                  bookSlug: "matthew",     chapter: 3 },
      { ref: "Luke 1:76",                      bookSlug: "luke",        chapter: 1 },
      { ref: "John 1:23",                      bookSlug: "john",        chapter: 1 },
    ],
  },
  {
    id: "branch-from-jesse",
    category: "birth",
    summary: "A shoot would sprout from the stump of Jesse — David's father — and a branch from his roots would bear fruit.",
    prophecy:    { ref: "Isaiah 11:1; Jeremiah 23:5", bookSlug: "isaiah", chapter: 11 },
    fulfillments: [
      { ref: "Acts 13:23",                     bookSlug: "acts",        chapter: 13 },
      { ref: "Romans 15:12",                   bookSlug: "romans",      chapter: 15 },
    ],
  },
  {
    id: "gifts-from-afar",
    category: "birth",
    summary: "Kings would bring gifts to him — fulfilled when astrologers from the east brought gold, frankincense, and myrrh.",
    prophecy:    { ref: "Psalm 72:10, 15; Isaiah 60:6", bookSlug: "psalms", chapter: 72 },
    fulfillments: [
      { ref: "Matthew 2:1, 11",                bookSlug: "matthew",     chapter: 2 },
    ],
  },
  {
    id: "lower-than-angels",
    category: "birth",
    summary: "Made a little lower than the angels — God's Son took on a fleshly body to bear the sins of mankind.",
    prophecy:    { ref: "Psalm 8:5",           bookSlug: "psalms",      chapter: 8 },
    fulfillments: [
      { ref: "Hebrews 2:7-9",                  bookSlug: "hebrews",     chapter: 2 },
    ],
  },

  // ── Ministry and identity ──────────────────────────────────────────────
  {
    id: "anointed-with-spirit",
    category: "ministry",
    summary: "Anointed with holy spirit to declare good news to the meek — Jesus read this passage at the Nazareth synagogue and applied it to himself.",
    prophecy:    { ref: "Isaiah 61:1, 2",      bookSlug: "isaiah",      chapter: 61 },
    fulfillments: [
      { ref: "Luke 4:17-21",                   bookSlug: "luke",        chapter: 4 },
      { ref: "Acts 10:38",                     bookSlug: "acts",        chapter: 10 },
    ],
  },
  {
    id: "light-of-galilee",
    category: "ministry",
    summary: "Galilee of the nations — once a place of darkness — would see a great light.",
    prophecy:    { ref: "Isaiah 9:1, 2",       bookSlug: "isaiah",      chapter: 9 },
    fulfillments: [
      { ref: "Matthew 4:13-16",                bookSlug: "matthew",     chapter: 4 },
    ],
  },
  {
    id: "prophet-like-moses",
    category: "ministry",
    summary: "Moses said Jehovah would raise up a prophet like him from among the brothers — Peter applied this to Jesus.",
    prophecy:    { ref: "Deuteronomy 18:18, 19", bookSlug: "deuteronomy", chapter: 18 },
    fulfillments: [
      { ref: "Acts 3:20-23",                   bookSlug: "acts",        chapter: 3 },
    ],
  },
  {
    id: "spoke-in-illustrations",
    category: "ministry",
    summary: "The psalmist said the messianic king would open his mouth in illustrations.",
    prophecy:    { ref: "Psalm 78:2",          bookSlug: "psalms",      chapter: 78 },
    fulfillments: [
      { ref: "Matthew 13:34, 35",              bookSlug: "matthew",     chapter: 13 },
    ],
  },
  {
    id: "healed-many",
    category: "ministry",
    summary: "Eyes of the blind opened, ears of the deaf unstopped, the lame leaping — fulfilled in Jesus' miracles.",
    prophecy:    { ref: "Isaiah 35:5, 6; 53:4", bookSlug: "isaiah",     chapter: 35 },
    fulfillments: [
      { ref: "Matthew 8:16, 17",               bookSlug: "matthew",     chapter: 8 },
      { ref: "Luke 7:22",                      bookSlug: "luke",        chapter: 7 },
    ],
  },
  {
    id: "entered-on-donkey",
    category: "ministry",
    summary: "Zechariah: \"Look! Your king is coming to you... humble, and riding on a donkey.\"",
    prophecy:    { ref: "Zechariah 9:9",       bookSlug: "zechariah",   chapter: 9 },
    fulfillments: [
      { ref: "Matthew 21:1-9",                 bookSlug: "matthew",     chapter: 21 },
      { ref: "John 12:14, 15",                 bookSlug: "john",        chapter: 12 },
    ],
  },
  {
    id: "spirit-rests-upon-him",
    category: "ministry",
    summary: "Jehovah's spirit would rest on him — fulfilled at his baptism when the holy spirit came down in the form of a dove.",
    prophecy:    { ref: "Isaiah 11:2; 42:1",   bookSlug: "isaiah",      chapter: 11 },
    fulfillments: [
      { ref: "Matthew 3:16, 17",               bookSlug: "matthew",     chapter: 3 },
      { ref: "Acts 10:38",                     bookSlug: "acts",        chapter: 10 },
    ],
  },
  {
    id: "compassionate-not-crushing",
    category: "ministry",
    summary: "He would not break a bruised reed or extinguish a smoldering wick — gentle with the broken, faithful in justice.",
    prophecy:    { ref: "Isaiah 42:1-3",       bookSlug: "isaiah",      chapter: 42 },
    fulfillments: [
      { ref: "Matthew 12:18-21",               bookSlug: "matthew",     chapter: 12 },
    ],
  },
  {
    id: "zeal-for-jehovahs-house",
    category: "ministry",
    summary: "Zeal for Jehovah's house would consume him — fulfilled when Jesus drove out the merchants from the temple.",
    prophecy:    { ref: "Psalm 69:9; Malachi 3:1-3", bookSlug: "psalms", chapter: 69 },
    fulfillments: [
      { ref: "John 2:13-17",                   bookSlug: "john",        chapter: 2 },
      { ref: "Matthew 21:12, 13",              bookSlug: "matthew",     chapter: 21 },
    ],
  },
  {
    id: "light-to-the-nations",
    category: "ministry",
    summary: "A light to the nations — Jehovah's salvation would extend beyond Israel to all peoples.",
    prophecy:    { ref: "Isaiah 42:6; 49:6",   bookSlug: "isaiah",      chapter: 42 },
    fulfillments: [
      { ref: "Luke 2:32",                      bookSlug: "luke",        chapter: 2 },
      { ref: "Acts 13:47",                     bookSlug: "acts",        chapter: 13 },
    ],
  },
  {
    id: "tested-cornerstone",
    category: "ministry",
    summary: "A tested cornerstone laid in Zion — Jesus is the foundation of God's congregation.",
    prophecy:    { ref: "Isaiah 28:16",        bookSlug: "isaiah",      chapter: 28 },
    fulfillments: [
      { ref: "1 Peter 2:6, 7",                 bookSlug: "1-peter",     chapter: 2 },
      { ref: "Ephesians 2:20",                 bookSlug: "ephesians",   chapter: 2 },
    ],
  },

  // ── Rejected and tried ────────────────────────────────────────────────
  {
    id: "rejected-by-own",
    category: "rejection",
    summary: "Despised, rejected — the stone the builders rejected became the chief cornerstone.",
    prophecy:    { ref: "Isaiah 53:3; Psalm 118:22", bookSlug: "isaiah", chapter: 53 },
    fulfillments: [
      { ref: "John 1:11",                      bookSlug: "john",        chapter: 1 },
      { ref: "1 Peter 2:7",                    bookSlug: "1-peter",     chapter: 2 },
      { ref: "Matthew 21:42",                  bookSlug: "matthew",     chapter: 21 },
    ],
  },
  {
    id: "betrayed-by-friend",
    category: "rejection",
    summary: "A friend who shared his bread would lift his heel against him — Judas Iscariot.",
    prophecy:    { ref: "Psalm 41:9",          bookSlug: "psalms",      chapter: 41 },
    fulfillments: [
      { ref: "John 13:18, 26-30",              bookSlug: "john",        chapter: 13 },
      { ref: "Matthew 26:47-50",               bookSlug: "matthew",     chapter: 26 },
    ],
  },
  {
    id: "thirty-pieces-of-silver",
    category: "rejection",
    summary: "Sold for 30 silver pieces, later thrown to the potter — exactly what Judas did.",
    prophecy:    { ref: "Zechariah 11:12, 13", bookSlug: "zechariah",   chapter: 11 },
    fulfillments: [
      { ref: "Matthew 26:14-16",               bookSlug: "matthew",     chapter: 26 },
      { ref: "Matthew 27:3-10",                bookSlug: "matthew",     chapter: 27 },
    ],
  },
  {
    id: "false-witnesses",
    category: "rejection",
    summary: "Lying witnesses would rise up against him at his trial.",
    prophecy:    { ref: "Psalm 35:11",         bookSlug: "psalms",      chapter: 35 },
    fulfillments: [
      { ref: "Mark 14:55-59",                  bookSlug: "mark",        chapter: 14 },
    ],
  },
  {
    id: "silent-before-accusers",
    category: "rejection",
    summary: "\"As a sheep before its shearers is silent, so he would not open his mouth.\"",
    prophecy:    { ref: "Isaiah 53:7",         bookSlug: "isaiah",      chapter: 53 },
    fulfillments: [
      { ref: "Matthew 27:12-14",               bookSlug: "matthew",     chapter: 27 },
      { ref: "Mark 15:4, 5",                   bookSlug: "mark",        chapter: 15 },
    ],
  },
  {
    id: "spit-on-struck",
    category: "rejection",
    summary: "His back to those striking him, his cheeks to those plucking his beard, his face not hidden from spit.",
    prophecy:    { ref: "Isaiah 50:6",         bookSlug: "isaiah",      chapter: 50 },
    fulfillments: [
      { ref: "Matthew 26:67",                  bookSlug: "matthew",     chapter: 26 },
      { ref: "Matthew 27:30",                  bookSlug: "matthew",     chapter: 27 },
    ],
  },

  // ── Death and burial ──────────────────────────────────────────────────
  {
    id: "hands-feet-pierced",
    category: "death-burial",
    summary: "\"They have pierced my hands and my feet\" — written by David ~1,000 years before crucifixion was a Roman practice.",
    prophecy:    { ref: "Psalm 22:16",         bookSlug: "psalms",      chapter: 22 },
    fulfillments: [
      { ref: "Matthew 27:35",                  bookSlug: "matthew",     chapter: 27 },
      { ref: "John 20:25-27",                  bookSlug: "john",        chapter: 20 },
    ],
  },
  {
    id: "numbered-with-transgressors",
    category: "death-burial",
    summary: "He was counted with the transgressors — Jesus was executed between two robbers.",
    prophecy:    { ref: "Isaiah 53:12",        bookSlug: "isaiah",      chapter: 53 },
    fulfillments: [
      { ref: "Mark 15:27, 28",                 bookSlug: "mark",        chapter: 15 },
      { ref: "Luke 22:37",                     bookSlug: "luke",        chapter: 22 },
    ],
  },
  {
    id: "garments-divided",
    category: "death-burial",
    summary: "His outer garments divided, lots cast for his inner garment — exactly what the Roman soldiers did.",
    prophecy:    { ref: "Psalm 22:18",         bookSlug: "psalms",      chapter: 22 },
    fulfillments: [
      { ref: "Matthew 27:35",                  bookSlug: "matthew",     chapter: 27 },
      { ref: "John 19:23, 24",                 bookSlug: "john",        chapter: 19 },
    ],
  },
  {
    id: "given-vinegar",
    category: "death-burial",
    summary: "\"For my thirst they tried to make me drink vinegar.\"",
    prophecy:    { ref: "Psalm 69:21",         bookSlug: "psalms",      chapter: 69 },
    fulfillments: [
      { ref: "Matthew 27:34, 48",              bookSlug: "matthew",     chapter: 27 },
      { ref: "John 19:28-30",                  bookSlug: "john",        chapter: 19 },
    ],
  },
  {
    id: "no-bones-broken",
    category: "death-burial",
    summary: "Like the Passover lamb — not one of his bones would be broken. The soldiers broke the legs of the two beside him, but found him already dead.",
    prophecy:    { ref: "Psalm 34:20; Exodus 12:46", bookSlug: "psalms", chapter: 34 },
    fulfillments: [
      { ref: "John 19:33-36",                  bookSlug: "john",        chapter: 19 },
    ],
  },
  {
    id: "buried-with-rich",
    category: "death-burial",
    summary: "His grave with the wicked, but with the rich in his death — buried in Joseph of Arimathea's new tomb.",
    prophecy:    { ref: "Isaiah 53:9",         bookSlug: "isaiah",      chapter: 53 },
    fulfillments: [
      { ref: "Matthew 27:57-60",               bookSlug: "matthew",     chapter: 27 },
    ],
  },

  // ── Raised and exalted ────────────────────────────────────────────────
  {
    id: "resurrected",
    category: "resurrection",
    summary: "Jehovah would not abandon his loyal one to the Grave or let him see corruption — Peter applied this to Jesus' resurrection.",
    prophecy:    { ref: "Psalm 16:10; Isaiah 53:10, 11", bookSlug: "psalms", chapter: 16 },
    fulfillments: [
      { ref: "Acts 2:25-31",                   bookSlug: "acts",        chapter: 2 },
      { ref: "Acts 13:34-37",                  bookSlug: "acts",        chapter: 13 },
    ],
  },
  {
    id: "ascended",
    category: "resurrection",
    summary: "He ascended on high after his resurrection.",
    prophecy:    { ref: "Psalm 68:18",         bookSlug: "psalms",      chapter: 68 },
    fulfillments: [
      { ref: "Acts 1:9-11",                    bookSlug: "acts",        chapter: 1 },
      { ref: "Ephesians 4:8-10",               bookSlug: "ephesians",   chapter: 4 },
    ],
  },
  {
    id: "right-hand-of-god",
    category: "resurrection",
    summary: "\"Sit at my right hand until I place your enemies as a stool for your feet.\" Jesus is now reigning as Messianic King.",
    prophecy:    { ref: "Psalm 110:1",         bookSlug: "psalms",      chapter: 110 },
    fulfillments: [
      { ref: "Acts 2:34-36",                   bookSlug: "acts",        chapter: 2 },
      { ref: "Hebrews 1:3, 13",                bookSlug: "hebrews",     chapter: 1 },
    ],
  },
];

// ── jw.org deep-link helper ───────────────────────────────────────────
// Standard 66-book numbering used by jw.org's Finder service. The Finder
// URL accepts a BCV (Book·Chapter·Verse) code as 8 digits — BBCCCVVV — and
// opens the verse highlighted on wol.jw.org (and the JW Library app on
// mobile). Without a BCV code we fall back to the chapter URL.
const BOOK_NUM: Record<string, number> = {
  genesis: 1, exodus: 2, leviticus: 3, numbers: 4, deuteronomy: 5,
  joshua: 6, judges: 7, ruth: 8, "1-samuel": 9, "2-samuel": 10,
  "1-kings": 11, "2-kings": 12, "1-chronicles": 13, "2-chronicles": 14,
  ezra: 15, nehemiah: 16, esther: 17, job: 18, psalms: 19, proverbs: 20,
  ecclesiastes: 21, "song-of-solomon": 22, isaiah: 23, jeremiah: 24,
  lamentations: 25, ezekiel: 26, daniel: 27, hosea: 28, joel: 29, amos: 30,
  obadiah: 31, jonah: 32, micah: 33, nahum: 34, habakkuk: 35, zephaniah: 36,
  haggai: 37, zechariah: 38, malachi: 39,
  matthew: 40, mark: 41, luke: 42, john: 43, acts: 44, romans: 45,
  "1-corinthians": 46, "2-corinthians": 47, galatians: 48, ephesians: 49,
  philippians: 50, colossians: 51, "1-thessalonians": 52, "2-thessalonians": 53,
  "1-timothy": 54, "2-timothy": 55, titus: 56, philemon: 57, hebrews: 58,
  james: 59, "1-peter": 60, "2-peter": 61, "1-john": 62, "2-john": 63,
  "3-john": 64, jude: 65, revelation: 66,
};

const CHAPTER_URL_BASE = "https://www.jw.org/en/library/bible/nwt/books";

/**
 * Pull the FIRST verse range in a ref string, scoped to the given chapter.
 * "Daniel 9:24-27"     → { start: 24, end: 27 }
 * "Matthew 1:22, 23"   → { start: 22, end: 23 }
 * "Genesis 3:15"       → { start: 15 }
 * "Isaiah 35:5, 6; 53:4" with chapter=35 → { start: 5, end: 6 }
 */
function parseFirstVerseRange(ref: string, chapter: number): { start: number; end?: number } | null {
  // Match "<chapter>:<v>(<sep><v2>)?" where sep is "-", ", ", or " "
  const re = new RegExp(`(?:^|[^\\d])${chapter}:(\\d+)(?:\\s*[-,]\\s*(\\d+))?`);
  const m = ref.match(re);
  if (!m) return null;
  const start = parseInt(m[1], 10);
  const end = m[2] ? parseInt(m[2], 10) : undefined;
  return end && end > start ? { start, end } : { start };
}

/**
 * Build a wol.jw.org URL for the given scripture ref. The `#v<book>:<chap>:<verse>`
 * fragment scrolls to and highlights the specific verse on Watchtower Online
 * Library. Falls back to the plain jw.org chapter URL when book/verse can't
 * be resolved from the ref string.
 */
export function wolUrlFor(ref: ScriptureRef): string {
  const bookNum = BOOK_NUM[ref.bookSlug];
  const range = parseFirstVerseRange(ref.ref, ref.chapter);
  if (!bookNum || !range) {
    return `${CHAPTER_URL_BASE}/${ref.bookSlug}/${ref.chapter}/`;
  }
  return `https://wol.jw.org/en/wol/b/r1/lp-e/nwtsty/${bookNum}/${ref.chapter}#v${bookNum}:${ref.chapter}:${range.start}`;
}
