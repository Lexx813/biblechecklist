/**
 * Doctrinal FAQ — official Jehovah's Witnesses positions on common questions.
 *
 * Used by the AI Study Companion (lookup_doctrinal_faq tool) to ground answers
 * in Watch Tower teaching rather than training-data approximations or non-JW
 * commentary.
 *
 * EVERY url in this file has been verified to return HTTP 200 (2026-04-25).
 * If you add new entries, run `curl -sLo /dev/null -w "%{http_code}\n" <url>`
 * before committing. URL verification is non-negotiable — fabricated jw.org
 * links route users to a 404 and break trust.
 *
 * Tone: pastoral and scriptural, never argumentative. Mirror the language
 * used in the publications. Defer questions of theological authority to the
 * Governing Body / wol.jw.org.
 */

export interface DoctrinalFaqEntry {
  id: string;
  topics: string[];   // lowercase keyword tags for matching
  question: string;
  answer: string;     // 2–4 sentences, NWT references where natural
  source: string;     // human-readable source title (matches jw.org page title)
  url: string;        // canonical jw.org link (verified 200)
}

export const DOCTRINAL_FAQ: DoctrinalFaqEntry[] = [
  // ── Identity ─────────────────────────────────────────────────────────────
  {
    id: "name-jehovahs-witnesses",
    topics: ["jehovah's witnesses", "jw name", "name origin", "isaiah 43"],
    question: "Why are Jehovah's Witnesses called by that name?",
    answer:
      "The name was adopted in 1931 based on Isaiah 43:10-12, where Jehovah says: \"You are my witnesses.\" The name identifies who Witnesses serve (Jehovah, the only true God) and what they do (testify about him). Before 1931 the group was known as Bible Students.",
    source: "Why Use the Name Jehovah's Witnesses?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/name-jehovahs-witnesses/",
  },
  {
    id: "name-jehovah",
    topics: ["jehovah", "god's name", "tetragrammaton", "yhwh", "yahweh", "psalm 83:18"],
    question: "Is \"Jehovah\" really God's name?",
    answer:
      "Yes. God's personal name appears about 7,000 times in the Hebrew Scriptures as the Tetragrammaton (יהוה / YHWH). \"Jehovah\" is the most familiar English rendering. Psalm 83:18 says: \"May people know that you, whose name is Jehovah, you alone are the Most High over all the earth.\" Jesus made his Father's name known (John 17:6, 26).",
    source: "Does God Have a Name?",
    url: "https://www.jw.org/en/bible-teachings/questions/gods-name/",
  },

  // ── Bible translation ───────────────────────────────────────────────────
  {
    id: "nwt-translation",
    topics: ["new world translation", "nwt", "bible translation", "why nwt"],
    question: "Why do Jehovah's Witnesses use the New World Translation?",
    answer:
      "The NWT was prepared so the Bible could be read in modern, understandable language while restoring God's name (Jehovah) to its rightful place — both in the Hebrew Scriptures (about 7,000 times) and in the Christian Greek Scriptures where the inspired writers quoted Hebrew passages containing the Tetragrammaton. It is available in over 240 languages, free of charge.",
    source: "Do Jehovah's Witnesses Have Their Own Bible?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/jw-bible-nwt/",
  },

  // ── Blood ───────────────────────────────────────────────────────────────
  {
    id: "blood-transfusions",
    topics: ["blood transfusion", "blood", "no blood", "acts 15", "leviticus 17"],
    question: "Why don't Jehovah's Witnesses accept blood transfusions?",
    answer:
      "Blood is sacred to Jehovah and represents life (Leviticus 17:11). The command to \"abstain from blood\" was given to Noah (Genesis 9:4), repeated in the Mosaic Law, and reaffirmed for Christians at Acts 15:28-29: \"Keep abstaining from things sacrificed to idols, from blood, from what is strangled, and from sexual immorality.\" Jehovah's Witnesses respect this command and accept many medical alternatives — non-blood volume expanders, cell salvage, hemostatic agents, and bloodless surgery — which are widely available and often safer than transfusion.",
    source: "Why Don't Jehovah's Witnesses Accept Blood Transfusions?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/jehovahs-witnesses-why-no-blood-transfusions/",
  },

  // ── Holidays ────────────────────────────────────────────────────────────
  {
    id: "birthdays",
    topics: ["birthdays", "birthday", "celebrate birthday"],
    question: "Why don't Jehovah's Witnesses celebrate birthdays?",
    answer:
      "The Bible records only two birthday celebrations — both held by enemies of Jehovah and both ending with someone being murdered (Genesis 40:20-22; Matthew 14:6-10). Birthday celebrations originated in pagan worship, exalt the individual, and were not practiced by the early Christians. Witnesses prefer to honor loved ones throughout the year rather than on a single date tied to false-religious history.",
    source: "Why Don't Jehovah's Witnesses Celebrate Birthdays?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/birthdays/",
  },
  {
    id: "christmas",
    topics: ["christmas", "december 25", "santa", "christmas tree"],
    question: "Why don't Jehovah's Witnesses celebrate Christmas?",
    answer:
      "Jesus was not born on December 25 — shepherds were in the fields with their flocks (Luke 2:8), which would not have happened in the cold of late December near Bethlehem. December 25 was already a pagan festival (Saturnalia / the birthday of the unconquered sun) which professed Christians later co-opted. The Bible never commands Christians to celebrate Jesus' birth — only to commemorate his death (Luke 22:19-20).",
    source: "Why Don't Jehovah's Witnesses Celebrate Christmas?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/why-not-celebrate-christmas/",
  },
  {
    id: "easter",
    topics: ["easter", "lent", "good friday"],
    question: "Why don't Jehovah's Witnesses celebrate Easter?",
    answer:
      "Easter customs (eggs, the rabbit, sunrise services) trace back to ancient fertility worship of false gods, long before Christ. Christians are commanded to commemorate Jesus' death — not his resurrection — through the annual Memorial on Nisan 14 of the Jewish calendar (Luke 22:19-20; 1 Corinthians 11:23-26). Mixing pagan symbols with Christian worship violates Jehovah's command at 2 Corinthians 6:17 to \"quit touching the unclean thing.\"",
    source: "Why Don't Jehovah's Witnesses Celebrate Easter?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/why-not-celebrate-easter/",
  },
  {
    id: "halloween",
    topics: ["halloween", "trick or treat", "october 31"],
    question: "Why don't Jehovah's Witnesses celebrate Halloween?",
    answer:
      "Halloween's origin is the ancient Celtic festival of Samhain, when spirits of the dead were thought to walk the earth. Costumes, jack-o'-lanterns, and trick-or-treating all derive from spiritism and demonism. The Bible warns against any practice involving the demonic (Deuteronomy 18:10-12; Galatians 5:19-21). Witnesses keep clear of Halloween entirely.",
    source: "What Are the Origins of Halloween?",
    url: "https://www.jw.org/en/bible-teachings/questions/halloween-origin/",
  },

  // ── Trinity ────────────────────────────────────────────────────────────
  {
    id: "trinity",
    topics: ["trinity", "three in one", "godhead", "is jesus god"],
    question: "Do Jehovah's Witnesses believe in the Trinity?",
    answer:
      "No. The word \"Trinity\" is not in the Bible, and the doctrine that Father, Son, and Holy Spirit are coequal persons in one God is not biblical. Jesus said: \"The Father is greater than I am\" (John 14:28). Jesus prayed to the Father (Luke 22:42), did the Father's will (John 6:38), and was raised by the Father (Acts 2:32). The holy spirit is God's active force, not a person (Acts 2:1-4). Jesus is the firstborn of all creation (Colossians 1:15), the Son of God — not God Himself.",
    source: "Is the Trinity Doctrine in the Bible?",
    url: "https://www.jw.org/en/bible-teachings/questions/trinity/",
  },
  {
    id: "jesus-michael",
    topics: ["jesus michael", "michael archangel", "jesus before earth"],
    question: "Is Jesus Michael the Archangel?",
    answer:
      "Yes. Scripture identifies Michael (whose name means \"Who Is Like God?\") as the archangel who leads Jehovah's heavenly armies (Daniel 12:1; Jude 9). 1 Thessalonians 4:16 says the Lord (Jesus) descends \"with an archangel's voice.\" Revelation 12:7 shows Michael leading the war against Satan — a role Christ holds. Before coming to earth, the Son existed as Michael; he is the only archangel, the firstborn of all creation.",
    source: "Who Is the Archangel Michael?",
    url: "https://www.jw.org/en/bible-teachings/questions/archangel-michael/",
  },

  // ── Soul / death / hell ────────────────────────────────────────────────
  {
    id: "soul-immortal",
    topics: ["soul", "immortal soul", "what is the soul", "nephesh"],
    question: "Is the human soul immortal?",
    answer:
      "No. The soul is the person himself, not a separate immortal part inside him. Genesis 2:7 says: \"The man came to be a living soul\" — not that he received one. Ezekiel 18:4 states plainly: \"The soul who sins is the one who will die.\" The dead are unconscious (Ecclesiastes 9:5, 10) and await the resurrection (John 5:28-29; Acts 24:15). Belief in an immortal soul came from Greek philosophy, not the Bible.",
    source: "What Is the Soul?",
    url: "https://www.jw.org/en/bible-teachings/questions/what-is-a-soul/",
  },
  {
    id: "hellfire",
    topics: ["hell", "hellfire", "lake of fire", "eternal torment", "sheol", "hades"],
    question: "Is hell a place of eternal torment?",
    answer:
      "No. The Bible's \"hell\" (Hebrew sheol, Greek hades) is the common grave of mankind — a state of unconsciousness, not torment. Ecclesiastes 9:5 says: \"The dead know nothing at all.\" Jehovah is a God of love (1 John 4:8), and Jeremiah 19:5 says burning people in fire \"never came up into my heart.\" The wages of sin is death — not eternal torture (Romans 6:23). The dead await the resurrection; eternal torment in fire is unscriptural.",
    source: "Is Hell Real? What Is Hell According to the Bible?",
    url: "https://www.jw.org/en/bible-teachings/questions/is-hell-real/",
  },
  {
    id: "resurrection",
    topics: ["resurrection", "raised from dead", "second life"],
    question: "Will the dead be resurrected?",
    answer:
      "Yes. Jesus said: \"All those in the memorial tombs will hear his voice and come out\" (John 5:28-29). Acts 24:15 says: \"There is going to be a resurrection of both the righteous and the unrighteous.\" Most will be resurrected to life on a paradise earth (Psalm 37:29; Revelation 21:3-4). Faithful anointed Christians are resurrected to heavenly life as kings and priests (Revelation 20:6).",
    source: "What Is the Resurrection?",
    url: "https://www.jw.org/en/bible-teachings/questions/what-is-the-resurrection/",
  },

  // ── Kingdom / paradise / 144,000 ───────────────────────────────────────
  {
    id: "gods-kingdom",
    topics: ["kingdom", "god's kingdom", "matthew 6:10", "daniel 2:44"],
    question: "What is God's Kingdom?",
    answer:
      "It is a real heavenly government with Christ Jesus as King (Daniel 7:13-14; Revelation 11:15). Daniel 2:44 says: \"The God of heaven will set up a kingdom that will never be destroyed... It will crush and put an end to all these kingdoms, and it alone will stand forever.\" Jesus taught his followers to pray for it: \"Let your Kingdom come. Let your will take place... on earth\" (Matthew 6:9-10). It will replace all human governments and restore paradise to the earth.",
    source: "What Is the Kingdom of God?",
    url: "https://www.jw.org/en/bible-teachings/questions/what-is-gods-kingdom/",
  },
  {
    id: "paradise-earth",
    topics: ["paradise", "earth", "psalm 37", "revelation 21", "new earth"],
    question: "Will the earth be destroyed?",
    answer:
      "No. Ecclesiastes 1:4 says: \"The earth remains forever.\" Psalm 37:29 promises: \"The righteous will possess the earth, and they will live forever on it.\" Revelation 21:3-4 describes God dwelling with mankind, wiping every tear, and ending death itself — on this earth. The earth will be transformed into a paradise; only Satan's wicked system is destroyed at Armageddon.",
    source: "Will the Earth Be Destroyed?",
    url: "https://www.jw.org/en/bible-teachings/questions/earth-destroyed/",
  },
  {
    id: "144000",
    topics: ["144000", "144,000", "anointed", "heavenly hope", "revelation 7", "revelation 14"],
    question: "Who are the 144,000?",
    answer:
      "A literal number of anointed Christians taken from earth to rule with Christ in heaven as kings and priests (Revelation 7:4; 14:1-3; 20:6). They are described as \"redeemed from among mankind as firstfruits to God.\" The rest of the faithful — the \"great crowd\" of Revelation 7:9 — receive the earthly hope of everlasting life on a paradise earth. Two hopes, one God, one congregation.",
    source: "Search jw.org for \"144,000\"",
    url: "https://www.jw.org/en/search/?q=144%2C000",
  },
  {
    id: "great-crowd",
    topics: ["great crowd", "earthly hope", "other sheep", "john 10:16"],
    question: "Who are the \"great crowd\" and the \"other sheep\"?",
    answer:
      "The great crowd (Revelation 7:9) is the vast majority of faithful Christians today — those whose hope is everlasting life on a paradise earth, not in heaven. Jesus called them his \"other sheep\": \"I have other sheep, which are not of this fold; those too I must bring in... they will become one flock, one shepherd\" (John 10:16). Both anointed and great crowd serve Jehovah unitedly.",
    source: "Search jw.org for \"great crowd\"",
    url: "https://www.jw.org/en/search/?q=great+crowd",
  },

  // ── Last days / 1914 / Armageddon ──────────────────────────────────────
  {
    id: "last-days",
    topics: ["last days", "end times", "2 timothy 3", "matthew 24"],
    question: "Are we living in the last days?",
    answer:
      "Yes. The composite sign Jesus gave at Matthew 24, Mark 13, and Luke 21 — international warfare, food shortages, earthquakes, pestilences, increased lawlessness, and the global preaching of the good news of the Kingdom — is being fulfilled in our time. Paul described the same period at 2 Timothy 3:1-5: \"In the last days critical times hard to deal with will be here.\" The world's condition since 1914 matches scripture in unprecedented detail.",
    source: "What Is the Sign of \"the Last Days,\" or \"End Times\"?",
    url: "https://www.jw.org/en/bible-teachings/questions/last-days-sign-end-times-prophecies/",
  },
  {
    id: "1914",
    topics: ["1914", "christ's presence", "kingdom established", "daniel 4", "seven times"],
    question: "Why is 1914 significant?",
    answer:
      "1914 marks the establishment of God's Kingdom in heaven and the start of \"the last days.\" The prophecy of Daniel 4 — the seven times that pass over the great tree — applies first to King Nebuchadnezzar but has a larger fulfillment in the 2,520-year period (seven times of 360 days each, applied as \"a day for a year\") from the destruction of Jerusalem in 607 B.C.E. to 1914 C.E. (Ezekiel 4:6; Numbers 14:34). World War I and the global troubles since match Jesus' prophecy of his presence in Kingdom power (Matthew 24:3-8).",
    source: "What Does Bible Chronology Indicate About the Year 1914?",
    url: "https://www.jw.org/en/bible-teachings/questions/daniel-4-bible-chronology-1914/",
  },
  {
    id: "armageddon",
    topics: ["armageddon", "war of god", "revelation 16", "end of world"],
    question: "What is Armageddon?",
    answer:
      "Armageddon is \"the war of the great day of God the Almighty\" (Revelation 16:14, 16) — Jehovah's righteous war to remove all wickedness from the earth. It is not a military battle between nations but Jehovah's judgment carried out by Jesus Christ and his heavenly armies (Revelation 19:11-21). Faithful servants of Jehovah are protected through it (Zephaniah 2:3). After Armageddon, paradise begins.",
    source: "What Is the Battle of Armageddon?",
    url: "https://www.jw.org/en/bible-teachings/questions/battle-of-armageddon/",
  },

  // ── Neutrality ──────────────────────────────────────────────────────────
  {
    id: "neutrality-political",
    topics: ["voting", "politics", "neutrality", "no kingdom of this world"],
    question: "Why don't Jehovah's Witnesses vote or get involved in politics?",
    answer:
      "Jesus said: \"My Kingdom is no part of this world\" (John 18:36) and prayed his followers would be \"no part of the world\" (John 17:16). Witnesses respect government authority (Romans 13:1-7), pay taxes, and obey the law — but they don't take sides in elections, run for office, or wave political banners. Their loyalty is to God's Kingdom under Christ. They are politically neutral worldwide, even between warring nations of fellow Witnesses.",
    source: "Why Do Jehovah's Witnesses Maintain Political Neutrality?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/political-neutrality/",
  },
  {
    id: "military",
    topics: ["military", "war", "isaiah 2:4", "swords plowshares"],
    question: "Why don't Jehovah's Witnesses serve in the military?",
    answer:
      "Isaiah 2:4 prophesied that God's people would \"beat their swords into plowshares... nation will not lift up sword against nation, nor will they learn war anymore.\" Jesus said to love your enemies (Matthew 5:44) and that those who take the sword will perish by the sword (Matthew 26:52). Witnesses do not enlist, train for war, or take up arms — even at great personal cost. Many have suffered imprisonment or death for this stand throughout the 20th century.",
    source: "Why Don't Jehovah's Witnesses Go to War?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/why-dont-jw-go-to-war/",
  },
  {
    id: "flag-salute",
    topics: ["flag", "national anthem", "salute", "pledge of allegiance"],
    question: "Why don't Jehovah's Witnesses salute the flag or sing national anthems?",
    answer:
      "A salute to a flag or singing a nationalistic anthem is a religious act of devotion to a national symbol. Jehovah said: \"You must not bow down to them nor be enticed to serve them\" (Exodus 20:5). Witnesses respect national symbols and the authorities they represent (Romans 13:7) but do not give them a form of worship reserved for Jehovah alone. They stand respectfully but do not participate.",
    source: "Why Do Jehovah's Witnesses Respectfully Abstain From Participating in Nationalistic Ceremonies?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/why-abstain-nationalistic-ceremonies-flag/",
  },

  // ── Field ministry ─────────────────────────────────────────────────────
  {
    id: "door-to-door",
    topics: ["door to door", "field ministry", "preaching work", "matthew 24:14"],
    question: "Why do Jehovah's Witnesses go door to door?",
    answer:
      "Jesus commanded his followers: \"This good news of the Kingdom will be preached in all the inhabited earth for a witness to all the nations, and then the end will come\" (Matthew 24:14). The early Christians preached \"publicly and from house to house\" (Acts 20:20). Witnesses follow this pattern, sharing the Bible's message of God's Kingdom with whoever will listen — at no charge, in over 1,000 languages.",
    source: "Why Do Jehovah's Witnesses Go From Door to Door?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/door-to-door/",
  },
  {
    id: "kingdom-hall",
    topics: ["kingdom hall", "place of worship", "church"],
    question: "What is a Kingdom Hall?",
    answer:
      "A Kingdom Hall is the place where Jehovah's Witnesses meet for Bible-based worship. The name reflects what is taught there: God's Kingdom under Christ Jesus (Matthew 6:9-10). Anyone is welcome at any time. Meetings are free, no collections are taken, and operations are funded entirely by voluntary donations.",
    source: "Why Don't Jehovah's Witnesses Call Their Meeting Place a Church?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/jehovahs-witnesses-church-kingdom-hall/",
  },

  // ── Disfellowshipping / discipline ─────────────────────────────────────
  {
    id: "disfellowshipping",
    topics: ["disfellowshipping", "disfellowship", "shunning", "expelled", "1 corinthians 5"],
    question: "Why do Jehovah's Witnesses practice disfellowshipping?",
    answer:
      "When a baptized Witness commits a serious sin and refuses to repent, the congregation removes them — what Paul commanded at 1 Corinthians 5:11-13: \"Stop keeping company with anyone called a brother who is sexually immoral or a greedy person... not even eating with such a man... Remove the wicked person from among yourselves.\" The purpose is to keep the congregation clean, protect others, and motivate the wrongdoer to repent. A repentant person can always be reinstated.",
    source: "How Do Jehovah's Witnesses Treat Those Who Used to Belong to Their Religion?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/removed-from-the-congregation/",
  },

  // ── Memorial ───────────────────────────────────────────────────────────
  {
    id: "memorial",
    topics: ["memorial", "lord's evening meal", "communion", "passover", "luke 22"],
    question: "What is the Memorial of Christ's death?",
    answer:
      "The single observance Jesus commanded for his followers: \"Keep doing this in remembrance of me\" (Luke 22:19). Held annually on Nisan 14 of the Jewish calendar, the Memorial commemorates Jesus' sacrificial death with unleavened bread (representing his body) and red wine (representing his blood). Only the anointed partake; the rest attend as respectful observers. Worldwide attendance is in the millions each year.",
    source: "Why Do Jehovah's Witnesses Observe the Lord's Supper Differently From the Way Other Religions Do?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/lords-supper/",
  },

  // ── Cross / images ────────────────────────────────────────────────────
  {
    id: "cross",
    topics: ["cross", "torture stake", "crucified", "stauros"],
    question: "Did Jesus die on a cross?",
    answer:
      "No. The Greek word stauros referred to an upright stake, not a two-beam cross. Acts 5:30 says Jesus was hung \"on a tree\" (xylon — a single piece of wood). The cross as a religious symbol was adopted from pagan worship long before Christianity, and was not used by the early Christians. Witnesses respect the manner of Jesus' death but do not venerate the instrument used to kill him — Christians don't display murder weapons.",
    source: "Did Jesus Die on a Cross?",
    url: "https://www.jw.org/en/bible-teachings/questions/did-jesus-die-on-cross/",
  },
  {
    id: "images-icons",
    topics: ["images", "icons", "statues", "exodus 20", "idolatry"],
    question: "Why don't Jehovah's Witnesses use religious images?",
    answer:
      "The second commandment prohibits making and bowing to any \"carved image or any likeness\" of created things for worship (Exodus 20:4-5). 1 John 5:21 says: \"Little children, guard yourselves from idols.\" True worship is offered \"with spirit and truth\" (John 4:24), not through images, icons, or statues. Witnesses worship Jehovah directly, without intermediary objects.",
    source: "Should We Worship Images?",
    url: "https://www.jw.org/en/bible-teachings/questions/should-we-worship-images/",
  },

  // ── Mary / saints ─────────────────────────────────────────────────────
  {
    id: "mary",
    topics: ["mary", "virgin mary", "mother of god", "queen of heaven"],
    question: "What do Jehovah's Witnesses believe about Mary?",
    answer:
      "Mary was a faithful, humble Jewish woman who Jehovah chose to bear his Son (Luke 1:26-38). She is honored as a fine example of faith but is not worshipped, prayed to, or considered sinless. She had other children after Jesus (Matthew 13:55-56), and she herself acknowledged her need of a Savior: \"My spirit cannot keep from being overjoyed at God my Savior\" (Luke 1:47). She is dead and awaiting the resurrection like other faithful ones.",
    source: "The Virgin Mary—What Does the Bible Say About Her?",
    url: "https://www.jw.org/en/bible-teachings/questions/virgin-mary-immaculate-conception/",
  },

  // ── Donations / money ─────────────────────────────────────────────────
  {
    id: "no-collections",
    topics: ["donations", "collections", "money", "tithing"],
    question: "How are Jehovah's Witnesses funded?",
    answer:
      "Entirely by voluntary, anonymous donations. There are no collection plates, no tithing, no charges for publications, meetings, or Bible studies. Jesus said: \"You received free, give free\" (Matthew 10:8). All elders, missionaries, branch staff, and Governing Body members serve without salary. Donation boxes at Kingdom Halls are unobtrusive and entirely optional.",
    source: "How Is the Work of Jehovah's Witnesses Financed?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/donations-worldwide-work-finances-money/",
  },

  // ── Governing Body ────────────────────────────────────────────────────
  {
    id: "governing-body",
    topics: ["governing body", "faithful slave", "matthew 24:45", "leadership"],
    question: "What is the Governing Body?",
    answer:
      "A small group of anointed Christian men who serve as the modern-day \"faithful and discreet slave\" Jesus appointed at Matthew 24:45-47 to provide spiritual food at the proper time. They oversee the worldwide work, direct the publishing of Bible-based instruction, and care for Kingdom interests. They make no claim to inspiration; they study the Bible together, seek Jehovah's holy spirit, and adjust understanding as light increases (Proverbs 4:18).",
    source: "What Is the Governing Body of Jehovah's Witnesses?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/governing-body-jw-helpers/",
  },
  {
    id: "governing-body-members",
    topics: [
      "governing body members",
      "current governing body",
      "who is on the governing body",
      "kenneth cook",
      "gage fleegle",
      "samuel herd",
      "geoffrey jackson",
      "jody jedele",
      "stephen lett",
      "gerrit lösch",
      "gerrit losch",
      "jacob rumph",
      "mark sanderson",
      "david splane",
      "jeffrey winder",
    ],
    question: "Who are the current members of the Governing Body?",
    answer:
      "The Governing Body currently has 11 members who serve at world headquarters in Warwick, New York, U.S.A.: Kenneth Cook, Jr., Gage Fleegle, Samuel Herd, Geoffrey Jackson, Jody Jedele, Stephen Lett, Gerrit Lösch, Jacob Rumph, Mark Sanderson, David Splane, and Jeffrey Winder. They serve on six committees — Coordinators', Personnel, Publishing, Service, Teaching, and Writing — that oversee different facets of the worldwide work.",
    source: "What Is the Governing Body of Jehovah's Witnesses?",
    url: "https://www.jw.org/en/jehovahs-witnesses/faq/governing-body-jw-helpers/",
  },
];
