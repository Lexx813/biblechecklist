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
  /** Chapter, used to build the wol.jw.org URL */
  chapter: number;
  /** Optional NWT text of the verse(s), shown in the on-hover scripture
   *  tooltip. When omitted, the tooltip falls back to a jump link. */
  text?: string;
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
    prophecy: {
      ref: "Genesis 3:15", bookSlug: "genesis", chapter: 3,
      text: "And I will put enmity between you and the woman and between your offspring and her offspring. He will crush your head, and you will strike him in the heel.",
    },
    fulfillments: [
      {
        ref: "Galatians 3:16", bookSlug: "galatians", chapter: 3,
        text: "Now the promises were spoken to Abraham and to his offspring. It does not say, \"and to your descendants,\" in the sense of many. Rather, in the sense of one: \"and to your offspring,\" who is Christ.",
      },
      {
        ref: "Hebrews 2:14", bookSlug: "hebrews", chapter: 2,
        text: "Therefore, since the \"young children\" are sharers of blood and flesh, he also similarly shared in the same things, so that through his death he might bring to nothing the one having the means to cause death, that is, the Devil.",
      },
      {
        ref: "Revelation 12:9, 17", bookSlug: "revelation", chapter: 12,
        text: "So down the great dragon was hurled, the original serpent, the one called Devil and Satan, who is misleading the entire inhabited earth. (v. 17) And the dragon became enraged at the woman and went off to wage war with the remaining ones of her offspring, who observe the commandments of God and have the work of bearing witness concerning Jesus.",
      },
    ],
  },
  {
    id: "descendant-of-abraham",
    category: "lineage",
    summary: "All nations would be blessed through Abraham's descendant.",
    prophecy: {
      ref: "Genesis 22:18", bookSlug: "genesis", chapter: 22,
      text: "And by means of your offspring all nations of the earth will obtain a blessing for themselves because you have listened to my voice.",
    },
    fulfillments: [
      {
        ref: "Matthew 1:1", bookSlug: "matthew", chapter: 1,
        text: "The book of the history of Jesus Christ, son of David, son of Abraham.",
      },
      { ref: "Galatians 3:16", bookSlug: "galatians", chapter: 3 },
      {
        ref: "Acts 3:25", bookSlug: "acts", chapter: 3,
        text: "You are the sons of the prophets and of the covenant that God made with your forefathers, saying to Abraham: \"And in your offspring all the families of the earth will be blessed.\"",
      },
    ],
  },
  {
    id: "tribe-of-judah",
    category: "lineage",
    summary: "Jacob foretold the ruling staff would not depart from Judah.",
    prophecy: {
      ref: "Genesis 49:10", bookSlug: "genesis", chapter: 49,
      text: "The scepter will not depart from Judah, neither the commander's staff from between his feet, until Shiloh comes; and to him the obedience of the peoples will belong.",
    },
    fulfillments: [
      {
        ref: "Hebrews 7:14", bookSlug: "hebrews", chapter: 7,
        text: "For it is quite clear that our Lord has descended from Judah, a tribe about which Moses said nothing concerning priests.",
      },
      {
        ref: "Revelation 5:5", bookSlug: "revelation", chapter: 5,
        text: "But one of the elders said to me: \"Stop weeping. Look! The Lion that is of the tribe of Judah, the root of David, has conquered so as to open the scroll and its seven seals.\"",
      },
    ],
  },
  {
    id: "line-of-david",
    category: "lineage",
    summary: "Jehovah promised David an everlasting kingdom through his offspring.",
    prophecy: {
      ref: "2 Samuel 7:12, 13", bookSlug: "2-samuel", chapter: 7,
      text: "When your days come to an end and you must lie down with your forefathers, then I will raise up your offspring after you, and I will firmly establish his kingdom. (v. 13) He is the one who will build a house for my name, and I will firmly establish the throne of his kingdom forever.",
    },
    fulfillments: [
      { ref: "Matthew 1:1, 6, 16", bookSlug: "matthew", chapter: 1 },
      {
        ref: "Luke 1:32, 33", bookSlug: "luke", chapter: 1,
        text: "This one will be great and will be called Son of the Most High, and Jehovah God will give him the throne of David his father, (v. 33) and he will rule as King over the house of Jacob forever, and there will be no end to his Kingdom.",
      },
      {
        ref: "Acts 13:22, 23", bookSlug: "acts", chapter: 13,
        text: "After removing him, he raised up for them David as king, about whom he bore witness and said: \"I have found David the son of Jesse a man agreeable to my heart; he will do all the things I want.\" (v. 23) From the offspring of this man, according to his promise, God has brought to Israel a savior, Jesus.",
      },
    ],
  },
  {
    id: "seventy-weeks",
    category: "lineage",
    summary: "Daniel's prophecy of the 70 weeks pinpointed when the Messiah would appear — fulfilled in 29 C.E.",
    prophecy: {
      ref: "Daniel 9:24-27", bookSlug: "daniel", chapter: 9,
      text: "There are 70 weeks that have been determined for your people and your holy city. (v. 25) From the going forth of the word to restore and to rebuild Jerusalem until Messiah the Leader, there will be 7 weeks, also 62 weeks. (v. 26) After the 62 weeks, Messiah will be cut off, with nothing for himself.",
    },
    fulfillments: [
      {
        ref: "Luke 3:21, 22", bookSlug: "luke", chapter: 3,
        text: "When all the people were baptized, Jesus too was baptized. As he was praying, the heaven was opened up, (v. 22) and the holy spirit in bodily form like a dove came down upon him, and a voice came out of heaven: \"You are my Son, the beloved; I have approved you.\"",
      },
      {
        ref: "John 1:32-34", bookSlug: "john", chapter: 1,
        text: "John also bore witness, saying: \"I viewed the spirit coming down from heaven like a dove, and it remained upon him.\" (v. 34) And I have seen it, and I have given witness that this one is the Son of God.",
      },
    ],
  },
  {
    id: "through-isaac",
    category: "lineage",
    summary: "Through Isaac — not Ishmael — the promised Seed would come.",
    prophecy: {
      ref: "Genesis 17:19, 21", bookSlug: "genesis", chapter: 17,
      text: "But God said: \"Sarah your wife will bear you a son, and you must name him Isaac. I will establish my covenant with him as a lasting covenant for his offspring after him. (v. 21) However, my covenant I will establish with Isaac, whom Sarah will bear to you at this set time next year.\"",
    },
    fulfillments: [
      { ref: "Matthew 1:2",                    bookSlug: "matthew",     chapter: 1 },
      { ref: "Hebrews 11:17-19",               bookSlug: "hebrews",     chapter: 11 },
    ],
  },
  {
    id: "through-jacob",
    category: "lineage",
    summary: "Through Jacob — not Esau — the line would continue.",
    prophecy: {
      ref: "Genesis 28:13, 14", bookSlug: "genesis", chapter: 28,
      text: "And there was Jehovah stationed above it, and he said: \"I am Jehovah the God of Abraham your father and the God of Isaac. The land on which you are lying, to you I am going to give it and to your offspring. (v. 14) Your offspring will become like the dust particles of the earth, and you will spread to the west and to the east and to the north and to the south, and by means of you and by means of your offspring all the families of the ground will certainly bless themselves.\"",
    },
    fulfillments: [
      { ref: "Luke 3:34",                      bookSlug: "luke",        chapter: 3 },
    ],
  },
  {
    id: "everlasting-throne",
    category: "lineage",
    summary: "David's throne would last forever — fulfilled in the resurrected Jesus, who reigns as Messianic King without end.",
    prophecy: {
      ref: "Psalm 89:3, 4", bookSlug: "psalms", chapter: 89,
      text: "\"I have made a covenant with my chosen one; I have sworn to David my servant, (v. 4) 'I will firmly establish your offspring forever, and I will build up your throne for all generations.'\"",
    },
    fulfillments: [
      { ref: "Luke 1:32, 33",                  bookSlug: "luke",        chapter: 1 },
      { ref: "Acts 2:30",                      bookSlug: "acts",        chapter: 2 },
    ],
  },
  {
    id: "firstborn-heir",
    category: "lineage",
    summary: "The Messiah would be Jehovah's firstborn — appointed heir over the kings of the earth.",
    prophecy: {
      ref: "Psalm 89:27", bookSlug: "psalms", chapter: 89,
      text: "And I will place him as firstborn, the most high of the kings of the earth.",
    },
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
    prophecy: {
      ref: "Isaiah 7:14", bookSlug: "isaiah", chapter: 7,
      text: "Therefore, Jehovah himself will give you men a sign: Look! The young woman will become pregnant and will give birth to a son, and she will name him Immanuel.",
    },
    fulfillments: [
      {
        ref: "Matthew 1:22, 23", bookSlug: "matthew", chapter: 1,
        text: "All of this actually came about to fulfill what was spoken by Jehovah through his prophet, saying: (v. 23) \"Look! The virgin will be pregnant and will give birth to a son, and they will name him Immanuel,\" which means, when translated, \"With Us Is God.\"",
      },
      {
        ref: "Luke 1:26-35", bookSlug: "luke", chapter: 1,
        text: "In her sixth month, the angel Gabriel was sent from God to a city of Galilee named Nazareth, (v. 27) to a virgin promised in marriage to a man named Joseph of David's house. (v. 35) In answer the angel said to her: \"Holy spirit will come upon you, and power of the Most High will overshadow you. For that reason also, the one who is born will be called holy, God's Son.\"",
      },
    ],
  },
  {
    id: "born-in-bethlehem",
    category: "birth",
    summary: "Micah named the small town of Bethlehem Ephrathah as the Messiah's birthplace seven centuries before it happened.",
    prophecy: {
      ref: "Micah 5:2", bookSlug: "micah", chapter: 5,
      text: "And you, O Bethlehem Ephrathah, the one too little to be among the thousands of Judah, from you there will come out for me the one to become ruler in Israel, whose origin is from ancient times, from the days of long ago.",
    },
    fulfillments: [
      {
        ref: "Matthew 2:1-6", bookSlug: "matthew", chapter: 2,
        text: "After Jesus had been born in Bethlehem of Judea in the days of Herod the king, look! astrologers from the East came to Jerusalem, (v. 6) \"And you, O Bethlehem of the land of Judah, are by no means the most insignificant city among the governors of Judah, for out of you will come a governing one, who will shepherd my people, Israel.\"",
      },
      {
        ref: "Luke 2:4-7", bookSlug: "luke", chapter: 2,
        text: "Joseph too went up from Galilee, out of the city of Nazareth, into Judea, to David's city, which is called Bethlehem, because he was a member of the house and family of David. (v. 7) And she gave birth to her son, the firstborn, and she wrapped him in cloth bands and laid him in a manger, because there was no lodging room for them in the inn.",
      },
    ],
  },
  {
    id: "star-of-the-east",
    category: "birth",
    summary: "Balaam saw a star coming out of Jacob — astrologers from the east saw it and went to Jerusalem.",
    prophecy: {
      ref: "Numbers 24:17", bookSlug: "numbers", chapter: 24,
      text: "I see him, but not now; I behold him, but not near. A star will come out of Jacob, and a scepter will rise out of Israel. He will crush the forehead of Moab and the skulls of all the sons of tumult.",
    },
    fulfillments: [
      {
        ref: "Matthew 2:1, 2, 9, 10", bookSlug: "matthew", chapter: 2,
        text: "Look! astrologers from the East came to Jerusalem, (v. 2) saying: \"Where is the one born king of the Jews? For we saw his star when we were in the East, and we have come to do obeisance to him.\" (v. 9, 10) And the star they had seen when they were in the East went ahead of them until it came to a stop above the place where the young child was. On seeing the star, they rejoiced greatly.",
      },
    ],
  },
  {
    id: "children-killed",
    category: "birth",
    summary: "Jeremiah foretold a weeping in Ramah — fulfilled when Herod ordered the boys of Bethlehem killed.",
    prophecy: {
      ref: "Jeremiah 31:15", bookSlug: "jeremiah", chapter: 31,
      text: "This is what Jehovah says: \"In Ramah a voice was heard, lamentation and bitter weeping, Rachel weeping for her sons. She has refused to be comforted over her sons, because they are no more.\"",
    },
    fulfillments: [
      {
        ref: "Matthew 2:16-18", bookSlug: "matthew", chapter: 2,
        text: "Then Herod, seeing that he had been outwitted by the astrologers, became greatly enraged, and he sent out and had all the boys in Bethlehem and in all its districts killed, from two years of age and under. (v. 17, 18) Then was fulfilled what was spoken through Jeremiah the prophet, saying: \"A voice was heard in Ramah, weeping and much wailing. It was Rachel weeping for her children, and she refused to take comfort, because they are no more.\"",
      },
    ],
  },
  {
    id: "out-of-egypt",
    category: "birth",
    summary: "Hosea: \"Out of Egypt I called my son.\" Jesus' family fled to Egypt and returned after Herod died.",
    prophecy: {
      ref: "Hosea 11:1", bookSlug: "hosea", chapter: 11,
      text: "When Israel was a boy, I loved him, and out of Egypt I called my son.",
    },
    fulfillments: [
      {
        ref: "Matthew 2:14, 15", bookSlug: "matthew", chapter: 2,
        text: "So he got up, took the young child and his mother by night, and withdrew into Egypt; (v. 15) and he stayed there until Herod's death, to fulfill what had been spoken by Jehovah through his prophet, saying: \"Out of Egypt I called my son.\"",
      },
    ],
  },
  {
    id: "forerunner",
    category: "birth",
    summary: "A messenger would prepare the way — fulfilled in John the Baptizer.",
    prophecy: {
      ref: "Isaiah 40:3", bookSlug: "isaiah", chapter: 40,
      text: "Listen! Someone is calling out in the wilderness: \"Clear up the way of Jehovah! Make a straight highway for our God through the desert plain.\"",
    },
    fulfillments: [
      {
        ref: "Matthew 3:1-3", bookSlug: "matthew", chapter: 3,
        text: "In those days John the Baptist came preaching in the wilderness of Judea, (v. 2) saying: \"Repent, for the Kingdom of the heavens has drawn near.\" (v. 3) This is the one spoken about through Isaiah the prophet in these words: \"A voice of one calling out in the wilderness: 'Prepare the way of Jehovah! Make his roads straight.'\"",
      },
      {
        ref: "Luke 1:76", bookSlug: "luke", chapter: 1,
        text: "But as for you, young child, you will be called a prophet of the Most High, for you will go ahead of Jehovah to prepare his ways.",
      },
      {
        ref: "John 1:23", bookSlug: "john", chapter: 1,
        text: "He said: \"I am a voice of someone calling out in the wilderness, 'Make the way of Jehovah straight,' just as Isaiah the prophet said.\"",
      },
    ],
  },
  {
    id: "branch-from-jesse",
    category: "birth",
    summary: "A shoot would sprout from the stump of Jesse — David's father — and a branch from his roots would bear fruit.",
    prophecy: {
      ref: "Isaiah 11:1", bookSlug: "isaiah", chapter: 11,
      text: "A twig will grow out of the stump of Jesse; and a sprout from his roots will bear fruit.",
    },
    fulfillments: [
      { ref: "Acts 13:23",                     bookSlug: "acts",        chapter: 13 },
      { ref: "Romans 15:12",                   bookSlug: "romans",      chapter: 15 },
    ],
  },
  {
    id: "gifts-from-afar",
    category: "birth",
    summary: "Kings would bring gifts to him — fulfilled when astrologers from the east brought gold, frankincense, and myrrh.",
    prophecy: {
      ref: "Psalm 72:10, 15", bookSlug: "psalms", chapter: 72,
      text: "The kings of Tarshish and of the islands will pay tribute. The kings of Sheba and of Seba will offer gifts. (v. 15) Let him live, and let the gold of Sheba be given to him. Let prayer be said in his behalf constantly. Let him be praised all day long.",
    },
    fulfillments: [
      { ref: "Matthew 2:1, 11",                bookSlug: "matthew",     chapter: 2 },
    ],
  },
  {
    id: "lower-than-angels",
    category: "birth",
    summary: "Made a little lower than the angels — God's Son took on a fleshly body to bear the sins of mankind.",
    prophecy: {
      ref: "Psalm 8:5", bookSlug: "psalms", chapter: 8,
      text: "You also proceeded to make him a little less than godlike ones, and with glory and splendor you then crowned him.",
    },
    fulfillments: [
      { ref: "Hebrews 2:7-9",                  bookSlug: "hebrews",     chapter: 2 },
    ],
  },

  // ── Ministry and identity ──────────────────────────────────────────────
  {
    id: "anointed-with-spirit",
    category: "ministry",
    summary: "Anointed with holy spirit to declare good news to the meek — Jesus read this passage at the Nazareth synagogue and applied it to himself.",
    prophecy: {
      ref: "Isaiah 61:1, 2", bookSlug: "isaiah", chapter: 61,
      text: "The spirit of the Sovereign Lord Jehovah is upon me, because Jehovah has anointed me to declare good news to the meek. He has sent me to bind up the brokenhearted, to proclaim liberty to the captives. (v. 2) To proclaim the year of Jehovah's goodwill and the day of vengeance of our God.",
    },
    fulfillments: [
      {
        ref: "Luke 4:17-21", bookSlug: "luke", chapter: 4,
        text: "So the scroll of the prophet Isaiah was handed to him... \"Jehovah's spirit is upon me, because he anointed me to declare good news to the poor, he sent me forth to preach a release to the captives and a recovery of sight to the blind.\" (v. 21) Then he started to say to them: \"Today this scripture that you just heard is fulfilled.\"",
      },
      {
        ref: "Acts 10:38", bookSlug: "acts", chapter: 10,
        text: "Namely, Jesus who was from Nazareth, how God anointed him with holy spirit and with power, and he went through the land doing good and healing all those oppressed by the Devil, because God was with him.",
      },
    ],
  },
  {
    id: "light-of-galilee",
    category: "ministry",
    summary: "Galilee of the nations — once a place of darkness — would see a great light.",
    prophecy: {
      ref: "Isaiah 9:1, 2", bookSlug: "isaiah", chapter: 9,
      text: "He will glorify the way by the sea, in the region of the Jordan, Galilee of the nations. (v. 2) The people who were walking in the darkness have seen a great light. As for those dwelling in the land of deep shadow, light has shone on them.",
    },
    fulfillments: [
      { ref: "Matthew 4:13-16",                bookSlug: "matthew",     chapter: 4 },
    ],
  },
  {
    id: "prophet-like-moses",
    category: "ministry",
    summary: "Moses said Jehovah would raise up a prophet like him from among the brothers — Peter applied this to Jesus.",
    prophecy: {
      ref: "Deuteronomy 18:18, 19", bookSlug: "deuteronomy", chapter: 18,
      text: "I will raise up for them from the midst of their brothers a prophet like you, and I will put my words in his mouth, and he will speak to them everything I command him. (v. 19) I will require an account from the man who will not listen to my words that he will speak in my name.",
    },
    fulfillments: [
      { ref: "Acts 3:20-23",                   bookSlug: "acts",        chapter: 3 },
    ],
  },
  {
    id: "spoke-in-illustrations",
    category: "ministry",
    summary: "The psalmist said the messianic king would open his mouth in illustrations.",
    prophecy: {
      ref: "Psalm 78:2", bookSlug: "psalms", chapter: 78,
      text: "I will open my mouth in a proverb. I will speak in riddles from long ago.",
    },
    fulfillments: [
      {
        ref: "Matthew 13:34, 35", bookSlug: "matthew", chapter: 13,
        text: "All these things Jesus spoke to the crowds by illustrations. Indeed, without an illustration he would not speak to them, (v. 35) in order to fulfill what was spoken through the prophet who said: \"I will open my mouth with illustrations, I will publish things hidden since the founding.\"",
      },
    ],
  },
  {
    id: "healed-many",
    category: "ministry",
    summary: "Eyes of the blind opened, ears of the deaf unstopped, the lame leaping — fulfilled in Jesus' miracles.",
    prophecy: {
      ref: "Isaiah 35:5, 6", bookSlug: "isaiah", chapter: 35,
      text: "At that time the eyes of the blind will be opened, and the ears of the deaf will be unstopped. (v. 6) At that time the lame will leap like the deer, and the tongue of the speechless will shout for joy.",
    },
    fulfillments: [
      {
        ref: "Matthew 8:16, 17", bookSlug: "matthew", chapter: 8,
        text: "But after evening fell, people brought him many demon-possessed ones; and he expelled the spirits with a word, and he cured all who were faring badly. (v. 17) This was to fulfill what was spoken through Isaiah the prophet: \"He himself took our sicknesses and carried our diseases.\"",
      },
      {
        ref: "Luke 7:22", bookSlug: "luke", chapter: 7,
        text: "In reply he said to the two: \"Go and report to John what you saw and heard: The blind are now seeing, the lame are walking, the lepers are being cleansed, the deaf are hearing, the dead are being raised, and the poor are being told the good news.\"",
      },
    ],
  },
  {
    id: "entered-on-donkey",
    category: "ministry",
    summary: "Zechariah: \"Look! Your king is coming to you... humble, and riding on a donkey.\"",
    prophecy: {
      ref: "Zechariah 9:9", bookSlug: "zechariah", chapter: 9,
      text: "Be very joyful, O daughter of Zion. Shout in triumph, O daughter of Jerusalem. Look! Your king is coming to you. He is righteous, bringing salvation, humble, and riding on a donkey, on a colt, the foal of a donkey.",
    },
    fulfillments: [
      {
        ref: "Matthew 21:1-9", bookSlug: "matthew", chapter: 21,
        text: "Now when they got close to Jerusalem... Jesus dispatched two disciples, saying to them: \"You will find a donkey tied and a colt with her. Untie them and bring them to me.\" (v. 9) The crowds going ahead of him and those following him kept shouting: \"Save, we pray, the Son of David! Blessed is the one who comes in Jehovah's name! Save him, we pray, in the heights above!\"",
      },
      {
        ref: "John 12:14, 15", bookSlug: "john", chapter: 12,
        text: "When Jesus had found a young donkey, he sat on it, just as it is written: (v. 15) \"Have no fear, daughter of Zion. Look! Your king is coming, seated on a donkey's colt.\"",
      },
    ],
  },
  {
    id: "spirit-rests-upon-him",
    category: "ministry",
    summary: "Jehovah's spirit would rest on him — fulfilled at his baptism when the holy spirit came down in the form of a dove.",
    prophecy: {
      ref: "Isaiah 11:2; 42:1", bookSlug: "isaiah", chapter: 11,
      text: "And on him the spirit of Jehovah will settle, the spirit of wisdom and of understanding, the spirit of counsel and of mightiness, the spirit of knowledge and of the fear of Jehovah.",
    },
    fulfillments: [
      { ref: "Matthew 3:16, 17",               bookSlug: "matthew",     chapter: 3 },
      { ref: "Acts 10:38",                     bookSlug: "acts",        chapter: 10 },
    ],
  },
  {
    id: "compassionate-not-crushing",
    category: "ministry",
    summary: "He would not break a bruised reed or extinguish a smoldering wick — gentle with the broken, faithful in justice.",
    prophecy: {
      ref: "Isaiah 42:1-3", bookSlug: "isaiah", chapter: 42,
      text: "Look! My servant, whom I support! My chosen one, whom I have approved! I have put my spirit in him; he will bring justice to the nations. (v. 2) He will not cry out or raise his voice, and he will not let his voice be heard in the street. (v. 3) No crushed reed will he break; and no smoldering wick will he extinguish.",
    },
    fulfillments: [
      { ref: "Matthew 12:18-21",               bookSlug: "matthew",     chapter: 12 },
    ],
  },
  {
    id: "zeal-for-jehovahs-house",
    category: "ministry",
    summary: "Zeal for Jehovah's house would consume him — fulfilled when Jesus drove out the merchants from the temple.",
    prophecy: {
      ref: "Psalm 69:9", bookSlug: "psalms", chapter: 69,
      text: "For sheer zeal for your house has eaten me up, and the reproaches of those reproaching you have fallen upon me.",
    },
    fulfillments: [
      { ref: "John 2:13-17",                   bookSlug: "john",        chapter: 2 },
      { ref: "Matthew 21:12, 13",              bookSlug: "matthew",     chapter: 21 },
    ],
  },
  {
    id: "light-to-the-nations",
    category: "ministry",
    summary: "A light to the nations — Jehovah's salvation would extend beyond Israel to all peoples.",
    prophecy: {
      ref: "Isaiah 49:6", bookSlug: "isaiah", chapter: 49,
      text: "I will give you as a light to the nations, that my salvation may reach to the ends of the earth.",
    },
    fulfillments: [
      { ref: "Luke 2:32",                      bookSlug: "luke",        chapter: 2 },
      { ref: "Acts 13:47",                     bookSlug: "acts",        chapter: 13 },
    ],
  },
  {
    id: "tested-cornerstone",
    category: "ministry",
    summary: "A tested cornerstone laid in Zion — Jesus is the foundation of God's congregation.",
    prophecy: {
      ref: "Isaiah 28:16", bookSlug: "isaiah", chapter: 28,
      text: "This is what the Sovereign Lord Jehovah says: \"Here I am laying as a foundation in Zion a tested stone, the precious cornerstone of a sure foundation. No one exercising faith will panic.\"",
    },
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
    prophecy: {
      ref: "Isaiah 53:3", bookSlug: "isaiah", chapter: 53,
      text: "He was despised and was avoided by men, a man destined for pain and well-acquainted with sickness. It was as if his face was hidden from us. He was despised, and we held him as of no account.",
    },
    fulfillments: [
      {
        ref: "John 1:11", bookSlug: "john", chapter: 1,
        text: "He came to his own home, but his own people did not accept him.",
      },
      {
        ref: "1 Peter 2:7", bookSlug: "1-peter", chapter: 2,
        text: "It is to you, therefore, that he is precious, because you are believers; but to those not believing, \"the very stone that the builders rejected has become the chief cornerstone.\"",
      },
      {
        ref: "Matthew 21:42", bookSlug: "matthew", chapter: 21,
        text: "Jesus said to them: \"Did you never read in the Scriptures, 'The stone that the builders rejected has become the chief cornerstone. This has come from Jehovah, and it is wonderful in our eyes'?\"",
      },
    ],
  },
  {
    id: "betrayed-by-friend",
    category: "rejection",
    summary: "A friend who shared his bread would lift his heel against him — Judas Iscariot.",
    prophecy: {
      ref: "Psalm 41:9", bookSlug: "psalms", chapter: 41,
      text: "Even the man at peace with me, the one whom I trusted, who used to eat my bread, has lifted his heel against me.",
    },
    fulfillments: [
      {
        ref: "John 13:18, 26-30", bookSlug: "john", chapter: 13,
        text: "I am not talking about all of you; I know the ones I have chosen. But this is so that the scripture might be fulfilled: \"The one who used to feed on my bread has lifted his heel against me.\" (v. 26) Then Jesus answered: \"It is the one to whom I will give the piece of bread that I dip.\" So... he gave it to Judas.",
      },
      {
        ref: "Matthew 26:47-50", bookSlug: "matthew", chapter: 26,
        text: "While he was yet speaking, look! Judas, one of the Twelve, came and with him a large crowd with swords and clubs from the chief priests and the elders of the people. (v. 49) And going straight up to Jesus, he said: \"Greetings, Rabbi!\" and kissed him very tenderly.",
      },
    ],
  },
  {
    id: "thirty-pieces-of-silver",
    category: "rejection",
    summary: "Sold for 30 silver pieces, later thrown to the potter — exactly what Judas did.",
    prophecy: {
      ref: "Zechariah 11:12, 13", bookSlug: "zechariah", chapter: 11,
      text: "Then I said to them: \"If it seems good to you, give me my wages; but if not, withhold them.\" And they paid my wages, 30 pieces of silver. (v. 13) At that, Jehovah said to me: \"Throw it into the treasury, the magnificent value with which I have been valued by them.\"",
    },
    fulfillments: [
      {
        ref: "Matthew 26:14-16", bookSlug: "matthew", chapter: 26,
        text: "Then one of the Twelve, the one called Judas Iscariot, went to the chief priests (v. 15) and said: \"What will you give me to betray him to you?\" They stipulated to him 30 silver pieces. (v. 16) So from then on he kept seeking a good opportunity to betray him.",
      },
      {
        ref: "Matthew 27:3-10", bookSlug: "matthew", chapter: 27,
        text: "Then Judas... seeing that he had been condemned, felt remorse and returned the 30 silver pieces to the chief priests... (v. 7) After consulting together, they bought with the money the potter's field to bury strangers. (v. 9, 10) Then was fulfilled what was spoken through Jeremiah the prophet: \"And they took the 30 silver pieces... as Jehovah had commanded me.\"",
      },
    ],
  },
  {
    id: "false-witnesses",
    category: "rejection",
    summary: "Lying witnesses would rise up against him at his trial.",
    prophecy: {
      ref: "Psalm 35:11", bookSlug: "psalms", chapter: 35,
      text: "Malicious witnesses come forward; they question me about things I know nothing about.",
    },
    fulfillments: [
      {
        ref: "Mark 14:55-59", bookSlug: "mark", chapter: 14,
        text: "Now the chief priests and the entire Sanhedrin were looking for testimony against Jesus to put him to death, but they were not finding any. (v. 56) Many were giving false witness against him, but their testimonies were not in agreement. (v. 59) But not even on these grounds was their testimony in agreement.",
      },
    ],
  },
  {
    id: "silent-before-accusers",
    category: "rejection",
    summary: "\"As a sheep before its shearers is silent, so he would not open his mouth.\"",
    prophecy: {
      ref: "Isaiah 53:7", bookSlug: "isaiah", chapter: 53,
      text: "He was hard-pressed, and he was letting himself be afflicted; but he would not open his mouth. He was being brought just like a sheep to the slaughtering; like a ewe that is mute before its shearers, he would not open his mouth.",
    },
    fulfillments: [
      {
        ref: "Matthew 27:12-14", bookSlug: "matthew", chapter: 27,
        text: "But while he was being accused by the chief priests and older men, he gave no answer. (v. 13) Then Pilate said to him: \"Do you not hear how many things they are testifying against you?\" (v. 14) But he did not answer him, no, not a word, so that the governor was very surprised.",
      },
      {
        ref: "Mark 15:4, 5", bookSlug: "mark", chapter: 15,
        text: "Pilate began questioning him again: \"Have you no answer? See how many charges they are bringing against you.\" (v. 5) But Jesus no longer made any answer, so that Pilate was amazed.",
      },
    ],
  },
  {
    id: "spit-on-struck",
    category: "rejection",
    summary: "His back to those striking him, his cheeks to those plucking his beard, his face not hidden from spit.",
    prophecy: {
      ref: "Isaiah 50:6", bookSlug: "isaiah", chapter: 50,
      text: "I gave my back to those striking me, and my cheeks to those plucking off the hair. I did not hide my face from humiliating things and from spit.",
    },
    fulfillments: [
      {
        ref: "Matthew 26:67", bookSlug: "matthew", chapter: 26,
        text: "Then they spat into his face and hit him with their fists. Others slapped his face.",
      },
      {
        ref: "Matthew 27:30", bookSlug: "matthew", chapter: 27,
        text: "And they spat on him and took the reed and began hitting him on his head.",
      },
    ],
  },

  // ── Death and burial ──────────────────────────────────────────────────
  {
    id: "hands-feet-pierced",
    category: "death-burial",
    summary: "\"They have pierced my hands and my feet\" — written by David ~1,000 years before crucifixion was a Roman practice.",
    prophecy: {
      ref: "Psalm 22:16", bookSlug: "psalms", chapter: 22,
      text: "For dogs surround me; they close in on me like a pack of evildoers. Like a lion they are at my hands and my feet.",
    },
    fulfillments: [
      {
        ref: "Matthew 27:35", bookSlug: "matthew", chapter: 27,
        text: "When they had nailed him to the stake, they distributed his outer garments by casting lots.",
      },
      {
        ref: "John 20:25-27", bookSlug: "john", chapter: 20,
        text: "But he said to them: \"Unless I see in his hands the print of the nails and stick my finger into the print of the nails and stick my hand into his side, I will never believe.\" (v. 27) Next he said to Thomas: \"Put your finger here, and see my hands, and take your hand and stick it into my side, and stop doubting but believe.\"",
      },
    ],
  },
  {
    id: "numbered-with-transgressors",
    category: "death-burial",
    summary: "He was counted with the transgressors — Jesus was executed between two robbers.",
    prophecy: {
      ref: "Isaiah 53:12", bookSlug: "isaiah", chapter: 53,
      text: "For that reason I will assign him a portion among the many, and he will apportion the spoil with the mighty, because he poured out his life even to death and was counted among the transgressors; he carried the sin of many people, and he interceded for the transgressors.",
    },
    fulfillments: [
      {
        ref: "Mark 15:27, 28", bookSlug: "mark", chapter: 15,
        text: "Furthermore, they nailed two robbers on stakes alongside him, one on his right and one on his left. (v. 28) [Some manuscripts add: \"And the scripture was fulfilled that says, 'And he was counted with lawless ones.'\"]",
      },
      {
        ref: "Luke 22:37", bookSlug: "luke", chapter: 22,
        text: "For I tell you that this which is written must be fulfilled in me, namely, \"And he was counted with lawless ones.\" For that which concerns me is having an end.",
      },
    ],
  },
  {
    id: "garments-divided",
    category: "death-burial",
    summary: "His outer garments divided, lots cast for his inner garment — exactly what the Roman soldiers did.",
    prophecy: {
      ref: "Psalm 22:18", bookSlug: "psalms", chapter: 22,
      text: "They divide my garments among themselves, and they cast lots for my clothing.",
    },
    fulfillments: [
      { ref: "Matthew 27:35",                  bookSlug: "matthew",     chapter: 27 },
      {
        ref: "John 19:23, 24", bookSlug: "john", chapter: 19,
        text: "When the soldiers had nailed Jesus to the stake, they took his outer garments and divided them into four parts, one part for each soldier, and they took the inner garment also. But the inner garment was without a seam, being woven from top to bottom. (v. 24) So they said to one another: \"Let us not tear it, but let us decide by lot whose it will be.\" This was to fulfill the scripture: \"They divided my garments among themselves, and they cast lots for my clothing.\"",
      },
    ],
  },
  {
    id: "given-vinegar",
    category: "death-burial",
    summary: "\"For my thirst they tried to make me drink vinegar.\"",
    prophecy: {
      ref: "Psalm 69:21", bookSlug: "psalms", chapter: 69,
      text: "For my food they gave me poison, and for my thirst they tried to give me vinegar to drink.",
    },
    fulfillments: [
      {
        ref: "Matthew 27:34, 48", bookSlug: "matthew", chapter: 27,
        text: "They gave him wine mixed with gall to drink. But after tasting it, he refused to drink it. (v. 48) And immediately one of them ran and got a sponge, soaked it in sour wine, and put it on a reed and gave him a drink.",
      },
      {
        ref: "John 19:28-30", bookSlug: "john", chapter: 19,
        text: "After this, when Jesus knew that all things had now been accomplished, in order that the scripture might be fulfilled, he said: \"I am thirsty.\" (v. 29) A jar full of sour wine was sitting there, so they put a sponge full of the sour wine on a hyssop and brought it to his mouth. (v. 30) When he had received the sour wine, Jesus said: \"It has been accomplished!\" And bowing his head, he gave up his spirit.",
      },
    ],
  },
  {
    id: "no-bones-broken",
    category: "death-burial",
    summary: "Like the Passover lamb — not one of his bones would be broken. The soldiers broke the legs of the two beside him, but found him already dead.",
    prophecy: {
      ref: "Psalm 34:20", bookSlug: "psalms", chapter: 34,
      text: "He is guarding all his bones; not one of them has been broken.",
    },
    fulfillments: [
      {
        ref: "John 19:33-36", bookSlug: "john", chapter: 19,
        text: "But on coming to Jesus, they saw that he was already dead, so they did not break his legs. (v. 34) Yet one of the soldiers jabbed his side with a spear, and immediately blood and water came out. (v. 36) In fact, these things took place so that the scripture might be fulfilled: \"Not a bone of his will be crushed.\"",
      },
    ],
  },
  {
    id: "buried-with-rich",
    category: "death-burial",
    summary: "His grave with the wicked, but with the rich in his death — buried in Joseph of Arimathea's new tomb.",
    prophecy: {
      ref: "Isaiah 53:9", bookSlug: "isaiah", chapter: 53,
      text: "And he was given a burial place with the wicked, and with the rich in his death, although he had done no violence and there was no deception in his mouth.",
    },
    fulfillments: [
      {
        ref: "Matthew 27:57-60", bookSlug: "matthew", chapter: 27,
        text: "When it became evening, a rich man from Arimathea came named Joseph, who had also become a disciple of Jesus. (v. 58) This man went to Pilate and asked for the body of Jesus. Then Pilate commanded that it be given to him. (v. 60) And he laid it in his new memorial tomb, which he had quarried out in the rock-mass.",
      },
    ],
  },

  // ── Raised and exalted ────────────────────────────────────────────────
  {
    id: "resurrected",
    category: "resurrection",
    summary: "Jehovah would not abandon his loyal one to the Grave or let him see corruption — Peter applied this to Jesus' resurrection.",
    prophecy: {
      ref: "Psalm 16:10", bookSlug: "psalms", chapter: 16,
      text: "For you will not leave me in the Grave. You will not allow your loyal one to see the pit.",
    },
    fulfillments: [
      {
        ref: "Acts 2:25-31", bookSlug: "acts", chapter: 2,
        text: "For David says about him: \"I had Jehovah constantly before my eyes; for he is at my right hand that I may never be shaken.\" (v. 27) For you will not abandon me to the Grave, nor will you allow your loyal one to see corruption. (v. 31) He saw beforehand and spoke about the resurrection of the Christ.",
      },
      {
        ref: "Acts 13:34-37", bookSlug: "acts", chapter: 13,
        text: "And about the fact that he resurrected him from the dead, never again to return to corruption, he has stated this: \"I will give you the loyal-love promises to David that are faithful.\" (v. 37) But the one whom God raised up did not see corruption.",
      },
    ],
  },
  {
    id: "ascended",
    category: "resurrection",
    summary: "He ascended on high after his resurrection.",
    prophecy: {
      ref: "Psalm 68:18", bookSlug: "psalms", chapter: 68,
      text: "You ascended on high; you took away captives; you took gifts in the form of men, yes, even stubborn ones, to reside among them, O Jah God.",
    },
    fulfillments: [
      {
        ref: "Acts 1:9-11", bookSlug: "acts", chapter: 1,
        text: "After he had said these things, while they were looking on, he was lifted up and a cloud caught him up from their sight. (v. 11) They said: \"Men of Galilee, why do you stand looking into the sky? This Jesus who was taken up from you into the sky will come in the same manner as you have seen him going into the sky.\"",
      },
      {
        ref: "Ephesians 4:8-10", bookSlug: "ephesians", chapter: 4,
        text: "For it says: \"When he ascended on high he carried away captives; he gave gifts in men.\" (v. 10) The very one who descended is also the one who ascended far above all the heavens, that he might give fullness to all things.",
      },
    ],
  },
  {
    id: "right-hand-of-god",
    category: "resurrection",
    summary: "\"Sit at my right hand until I place your enemies as a stool for your feet.\" Jesus is now reigning as Messianic King.",
    prophecy: {
      ref: "Psalm 110:1", bookSlug: "psalms", chapter: 110,
      text: "Jehovah declared to my Lord: \"Sit at my right hand until I place your enemies as a stool for your feet.\"",
    },
    fulfillments: [
      {
        ref: "Acts 2:34-36", bookSlug: "acts", chapter: 2,
        text: "For David did not ascend to the heavens, but he himself says: \"Jehovah said to my Lord: 'Sit at my right hand (v. 35) until I make your enemies a stool for your feet.'\" (v. 36) Therefore, let all the house of Israel know for a certainty that God made him both Lord and Christ, this Jesus whom you executed on a stake.",
      },
      {
        ref: "Hebrews 1:3, 13", bookSlug: "hebrews", chapter: 1,
        text: "He is the reflection of God's glory and the exact representation of his very being... and after he had made a purification for our sins, he sat down at the right hand of the Majesty on high. (v. 13) But about which one of the angels has he ever said: \"Sit at my right hand until I make your enemies a stool for your feet\"?",
      },
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
