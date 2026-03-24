// Brief info for each of the 66 Bible books (indexed 0–65)
// Fields: author, date, theme, keyVerses, summary
export const BOOK_INFO = [
  // ── Old Testament ──────────────────────────────────────────────────────────
  {
    author: "Moses",
    date: "c. 1440 BC",
    theme: "Origins & Creation",
    keyVerses: ["Gen 1:1", "Gen 12:1–3", "Gen 50:20"],
    summary: "Genesis records the creation of the universe, the fall of humanity, the flood, and the calling of Abraham — establishing the foundation of God's redemptive plan."
  },
  {
    author: "Moses",
    date: "c. 1440 BC",
    theme: "Redemption & Deliverance",
    keyVerses: ["Ex 3:14", "Ex 12:13", "Ex 20:2–3"],
    summary: "Exodus tells the dramatic story of Israel's deliverance from Egypt through Moses, the giving of the Ten Commandments, and the construction of the Tabernacle."
  },
  {
    author: "Moses",
    date: "c. 1440 BC",
    theme: "Holiness & Worship",
    keyVerses: ["Lev 19:2", "Lev 17:11"],
    summary: "Leviticus provides detailed instructions for Israel's worship, sacrifices, and priestly duties — centered on the call to be holy because God is holy."
  },
  {
    author: "Moses",
    date: "c. 1440 BC",
    theme: "Faithfulness in the Wilderness",
    keyVerses: ["Num 6:24–26", "Num 14:18"],
    summary: "Numbers chronicles Israel's 40-year wilderness journey, their repeated failures, and God's faithful provision and discipline as He guides them toward Canaan."
  },
  {
    author: "Moses",
    date: "c. 1406 BC",
    theme: "Covenant Renewal",
    keyVerses: ["Deut 6:4–5", "Deut 28:1–2", "Deut 30:19"],
    summary: "Deuteronomy is Moses' farewell address to Israel before entering Canaan, recalling their history and renewing the covenant with a call to love and obey God."
  },
  {
    author: "Joshua (and others)",
    date: "c. 1380 BC",
    theme: "Conquest & Faithfulness",
    keyVerses: ["Josh 1:9", "Josh 24:15"],
    summary: "Joshua records Israel's conquest and settlement of Canaan under Joshua's leadership, showing God's faithfulness in fulfilling His promises to Abraham."
  },
  {
    author: "Samuel (possibly)",
    date: "c. 1050 BC",
    theme: "Cycles of Sin & Deliverance",
    keyVerses: ["Judg 2:16", "Judg 21:25"],
    summary: "Judges documents a recurring pattern in Israel: they abandon God, face oppression, cry out, and God raises up a deliverer (judge). It reveals humanity's need for a righteous king."
  },
  {
    author: "Unknown",
    date: "c. 1050 BC",
    theme: "Loyalty & Redemption",
    keyVerses: ["Ruth 1:16", "Ruth 2:12", "Ruth 4:14"],
    summary: "Ruth is a beautiful story of loyal love (hesed) set during the time of the judges. Ruth's faithfulness to Naomi becomes a picture of God's redeeming grace."
  },
  {
    author: "Samuel / Nathan / Gad",
    date: "c. 1000 BC",
    theme: "The Monarchy Established",
    keyVerses: ["1 Sam 16:7", "1 Sam 17:47"],
    summary: "First Samuel covers the transition from judges to kings: the ministry of Samuel, the failed reign of Saul, and the rise of David as God's chosen king."
  },
  {
    author: "Nathan / Gad",
    date: "c. 960 BC",
    theme: "The Davidic Covenant",
    keyVerses: ["2 Sam 7:12–13", "2 Sam 22:2–3"],
    summary: "Second Samuel recounts David's reign in full — his triumphs, his sin with Bathsheba, and the consequences that follow — while showing God's covenant faithfulness."
  },
  {
    author: "Jeremiah (possibly)",
    date: "c. 550 BC",
    theme: "Kingdom United & Divided",
    keyVerses: ["1 Ki 8:23", "1 Ki 18:21"],
    summary: "First Kings covers Solomon's glorious reign, the building of the Temple, and the tragic division of the kingdom, setting the stage for Israel's long decline."
  },
  {
    author: "Jeremiah (possibly)",
    date: "c. 550 BC",
    theme: "The Fall of Both Kingdoms",
    keyVerses: ["2 Ki 17:7–8", "2 Ki 22:13"],
    summary: "Second Kings records the progressive decline and fall of both Israel (to Assyria) and Judah (to Babylon), showing the consequences of persistent unfaithfulness."
  },
  {
    author: "Ezra",
    date: "c. 430 BC",
    theme: "David's Preparations",
    keyVerses: ["1 Chr 16:23–24", "1 Chr 29:11"],
    summary: "First Chronicles retells Israel's history from a priestly perspective, focusing on David's preparations for the Temple and his efforts to establish proper worship."
  },
  {
    author: "Ezra",
    date: "c. 430 BC",
    theme: "Temple, Revival & Reform",
    keyVerses: ["2 Chr 7:14", "2 Chr 20:15"],
    summary: "Second Chronicles highlights the reigns of the kings of Judah, emphasizing times of revival and reform, and concludes with the decree of Cyrus allowing return from exile."
  },
  {
    author: "Ezra",
    date: "c. 450 BC",
    theme: "Return & Restoration",
    keyVerses: ["Ezra 7:10", "Ezra 3:11"],
    summary: "Ezra records the return of Jewish exiles to Jerusalem under Zerubbabel and later Ezra himself, the rebuilding of the Temple, and spiritual reforms."
  },
  {
    author: "Nehemiah",
    date: "c. 430 BC",
    theme: "Rebuilding & Renewal",
    keyVerses: ["Neh 8:10", "Neh 1:5–6"],
    summary: "Nehemiah tells the story of rebuilding Jerusalem's walls in 52 days despite fierce opposition, followed by spiritual renewal through public reading of the Law."
  },
  {
    author: "Unknown",
    date: "c. 480 BC",
    theme: "Providence & Courage",
    keyVerses: ["Esth 4:14", "Esth 8:11"],
    summary: "Esther shows God's hidden providence as Queen Esther risked her life to save the Jewish people from Haman's plot — though God's name is never mentioned."
  },
  {
    author: "Unknown (perhaps Moses)",
    date: "c. 1500 BC (setting)",
    theme: "Suffering & God's Sovereignty",
    keyVerses: ["Job 1:21", "Job 19:25", "Job 38:4"],
    summary: "Job grapples with undeserved suffering through poetic dialogues, ultimately revealing that God's wisdom transcends human understanding and that He is sovereign in all things."
  },
  {
    author: "David, Asaph, Sons of Korah, and others",
    date: "c. 1000–430 BC",
    theme: "Worship, Prayer & Lament",
    keyVerses: ["Ps 23:1", "Ps 46:1", "Ps 119:105"],
    summary: "The Psalms are 150 songs and prayers covering the full range of human experience — praise, lament, thanksgiving, and trust — guiding God's people in heartfelt worship."
  },
  {
    author: "Solomon and others",
    date: "c. 950 BC",
    theme: "Practical Wisdom",
    keyVerses: ["Prov 1:7", "Prov 3:5–6", "Prov 31:30"],
    summary: "Proverbs is a collection of wise sayings for living well, emphasizing that true wisdom begins with fearing God and shapes every area of daily life."
  },
  {
    author: "Solomon (Qohelet)",
    date: "c. 935 BC",
    theme: "Life's Meaning",
    keyVerses: ["Eccl 1:2", "Eccl 3:1", "Eccl 12:13"],
    summary: "Ecclesiastes explores the emptiness of life 'under the sun' apart from God, concluding that fearing God and keeping His commandments is the whole purpose of humanity."
  },
  {
    author: "Solomon",
    date: "c. 965 BC",
    theme: "Love & Devotion",
    keyVerses: ["Song 2:4", "Song 8:6–7"],
    summary: "The Song of Solomon celebrates the beauty of romantic love between a bride and groom, often read as a metaphor for the love between God and His people."
  },
  {
    author: "Isaiah",
    date: "c. 740–700 BC",
    theme: "Salvation & the Coming Messiah",
    keyVerses: ["Isa 9:6", "Isa 40:31", "Isa 53:5"],
    summary: "Isaiah contains some of the most majestic prophecies in Scripture — judgment on Judah and the nations, comfort for exiles, and vivid descriptions of the Suffering Servant who brings salvation."
  },
  {
    author: "Jeremiah",
    date: "c. 626–586 BC",
    theme: "New Covenant",
    keyVerses: ["Jer 17:9", "Jer 29:11", "Jer 31:31–33"],
    summary: "Called the 'weeping prophet,' Jeremiah preached God's judgment to a stubborn Judah, while also announcing the glorious promise of a new covenant written on the heart."
  },
  {
    author: "Jeremiah",
    date: "c. 586 BC",
    theme: "Grief & Hope",
    keyVerses: ["Lam 3:22–23", "Lam 3:40"],
    summary: "Lamentations is a collection of five poetic laments over the destruction of Jerusalem, expressing profound grief while holding on to the truth of God's faithfulness."
  },
  {
    author: "Ezekiel",
    date: "c. 593–571 BC",
    theme: "God's Glory & Restoration",
    keyVerses: ["Ezek 18:23", "Ezek 36:26", "Ezek 37:1–4"],
    summary: "Ezekiel, a priest-prophet among the exiles in Babylon, received spectacular visions of God's glory, pronounced judgment on Jerusalem, and proclaimed future restoration."
  },
  {
    author: "Daniel",
    date: "c. 605–535 BC",
    theme: "God's Sovereignty over History",
    keyVerses: ["Dan 2:44", "Dan 3:17–18", "Dan 6:26"],
    summary: "Daniel blends narrative and apocalyptic visions to show that God is sovereign over empires and history, encouraging faithfulness under pressure through remarkable stories and prophecies."
  },
  {
    author: "Hosea",
    date: "c. 755–715 BC",
    theme: "God's Unfailing Love",
    keyVerses: ["Hos 2:19–20", "Hos 6:6", "Hos 14:4"],
    summary: "God commanded Hosea to marry an unfaithful wife as a living parable of Israel's spiritual adultery — and God's relentless love that pursues and restores."
  },
  {
    author: "Joel",
    date: "c. 835 BC (or 400s BC)",
    theme: "The Day of the Lord",
    keyVerses: ["Joel 2:13", "Joel 2:28–29"],
    summary: "Joel uses a devastating locust plague as a call to repentance, warning of the coming Day of the Lord and promising the outpouring of the Holy Spirit on all people."
  },
  {
    author: "Amos",
    date: "c. 760 BC",
    theme: "Justice & Righteousness",
    keyVerses: ["Amos 3:7", "Amos 5:24"],
    summary: "Amos, a shepherd turned prophet, declared God's judgment on Israel's social injustice, empty religion, and oppression of the poor, calling for justice to 'roll on like a river.'"
  },
  {
    author: "Obadiah",
    date: "c. 586 BC",
    theme: "Judgment on Pride",
    keyVerses: ["Obad 1:15", "Obad 1:3–4"],
    summary: "The shortest book of the Old Testament pronounces judgment on Edom for rejoicing over Jerusalem's fall, affirming that pride comes before destruction."
  },
  {
    author: "Jonah",
    date: "c. 793–753 BC",
    theme: "God's Mercy to All Nations",
    keyVerses: ["Jonah 1:17", "Jonah 4:2", "Jonah 3:10"],
    summary: "Jonah's story of fleeing God's call, being swallowed by a great fish, and ultimately going to Nineveh reveals God's compassion extending beyond Israel to all nations."
  },
  {
    author: "Micah",
    date: "c. 737–696 BC",
    theme: "Justice, Mercy & the Messiah",
    keyVerses: ["Mic 5:2", "Mic 6:8"],
    summary: "Micah alternates between judgment and hope, condemning corruption and injustice while prophesying the Messiah's birth in Bethlehem and calling for justice, mercy, and humility."
  },
  {
    author: "Nahum",
    date: "c. 663–612 BC",
    theme: "God's Judgment on Wickedness",
    keyVerses: ["Nah 1:3", "Nah 1:7"],
    summary: "Nahum declares the fall of Nineveh — the mighty Assyrian capital — as a demonstration that God is slow to anger but will not leave the guilty unpunished."
  },
  {
    author: "Habakkuk",
    date: "c. 609–605 BC",
    theme: "Faith in God's Sovereignty",
    keyVerses: ["Hab 2:4", "Hab 3:17–18"],
    summary: "Habakkuk wrestles honestly with God about evil and injustice, and receives the answer that 'the righteous shall live by faith' — even when circumstances make no sense."
  },
  {
    author: "Zephaniah",
    date: "c. 640–621 BC",
    theme: "Judgment & Joyful Restoration",
    keyVerses: ["Zeph 1:14", "Zeph 3:17"],
    summary: "Zephaniah warns of the coming Day of the Lord's judgment on Judah and the nations, but concludes with a joyful promise that God will rejoice over His restored people with singing."
  },
  {
    author: "Haggai",
    date: "c. 520 BC",
    theme: "Prioritizing God's House",
    keyVerses: ["Hag 1:5–7", "Hag 2:9"],
    summary: "Haggai delivered four short messages urging the returned exiles to stop neglecting the Temple and rebuild it, promising that God's glory in the new Temple would surpass the old."
  },
  {
    author: "Zechariah",
    date: "c. 520–480 BC",
    theme: "Messianic Hope & Restoration",
    keyVerses: ["Zech 4:6", "Zech 9:9", "Zech 12:10"],
    summary: "Zechariah encouraged the rebuilding of the Temple through eight night visions and rich Messianic prophecies about a humble King entering Jerusalem on a donkey."
  },
  {
    author: "Malachi",
    date: "c. 430 BC",
    theme: "Covenant Faithfulness",
    keyVerses: ["Mal 3:1", "Mal 3:10", "Mal 4:2"],
    summary: "Malachi, the last voice of the Old Testament, rebukes priests and people for spiritual apathy and covenant unfaithfulness, closing with a promise of the coming messenger."
  },

  // ── New Testament ──────────────────────────────────────────────────────────
  {
    author: "Matthew (apostle)",
    date: "c. AD 50–60",
    theme: "Jesus the King & Messiah",
    keyVerses: ["Matt 1:23", "Matt 5:17", "Matt 28:19–20"],
    summary: "Matthew presents Jesus as the fulfillment of Old Testament prophecy and the long-awaited King of Israel, structured around five major discourses including the Sermon on the Mount."
  },
  {
    author: "John Mark",
    date: "c. AD 55–65",
    theme: "Jesus the Servant",
    keyVerses: ["Mark 1:1", "Mark 8:29", "Mark 10:45"],
    summary: "The shortest gospel moves at a rapid pace, emphasizing Jesus' powerful actions and miracles. Mark presents Jesus as the Suffering Servant who came to serve and give His life."
  },
  {
    author: "Luke (physician)",
    date: "c. AD 60–62",
    theme: "Jesus the Savior of All",
    keyVerses: ["Luke 1:3–4", "Luke 4:18", "Luke 19:10"],
    summary: "Luke's careful, orderly account emphasizes Jesus' compassion for the poor, outcasts, women, and Gentiles — showing that salvation in Christ is available to all people."
  },
  {
    author: "John (apostle)",
    date: "c. AD 85–95",
    theme: "Jesus the Son of God",
    keyVerses: ["John 1:1", "John 3:16", "John 14:6", "John 20:31"],
    summary: "John's deeply theological gospel uses seven signs and seven 'I AM' statements to reveal Jesus as the eternal Son of God, written so readers would believe and have life in His name."
  },
  {
    author: "Luke (physician)",
    date: "c. AD 62",
    theme: "The Holy Spirit & Church Growth",
    keyVerses: ["Acts 1:8", "Acts 2:42", "Acts 17:11"],
    summary: "Acts traces the spread of the gospel from Jerusalem to Rome through the power of the Holy Spirit, following the apostles Peter and Paul as the church expands to all nations."
  },
  {
    author: "Paul",
    date: "c. AD 57",
    theme: "Salvation by Faith",
    keyVerses: ["Rom 1:16–17", "Rom 3:23–24", "Rom 8:28", "Rom 12:1–2"],
    summary: "Romans is Paul's most systematic presentation of the gospel — the condemnation of all humanity in sin, the righteousness of God through faith in Christ, and new life in the Spirit."
  },
  {
    author: "Paul",
    date: "c. AD 55",
    theme: "Christian Life & Unity",
    keyVerses: ["1 Cor 1:18", "1 Cor 13:13", "1 Cor 15:3–4"],
    summary: "Paul addresses serious problems in the Corinthian church — divisions, immorality, lawsuits, spiritual gifts, and doubts about resurrection — calling them to unity and love."
  },
  {
    author: "Paul",
    date: "c. AD 55–56",
    theme: "Comfort & God's Strength",
    keyVerses: ["2 Cor 4:17", "2 Cor 5:17", "2 Cor 12:9"],
    summary: "Paul's most personal letter defends his apostleship and ministry amid intense suffering, teaching that God's power is made perfect in weakness."
  },
  {
    author: "Paul",
    date: "c. AD 49",
    theme: "Freedom in Christ",
    keyVerses: ["Gal 2:20", "Gal 3:28", "Gal 5:1"],
    summary: "Paul passionately defends the gospel of grace against those adding circumcision as a requirement for salvation, declaring that we are justified by faith alone, not law-keeping."
  },
  {
    author: "Paul",
    date: "c. AD 60–62",
    theme: "The Church & Unity in Christ",
    keyVerses: ["Eph 2:8–9", "Eph 4:4–6", "Eph 6:10–12"],
    summary: "Ephesians soars with rich teaching on the believer's identity in Christ, the unity of the church as Christ's body, and the call to walk in love while standing firm in spiritual warfare."
  },
  {
    author: "Paul",
    date: "c. AD 61",
    theme: "Joy & Contentment in Christ",
    keyVerses: ["Phil 1:21", "Phil 4:7", "Phil 4:13"],
    summary: "Written from prison, Philippians radiates joy in every chapter. Paul urges the church to have the same humble mind as Christ and to find contentment in all circumstances."
  },
  {
    author: "Paul",
    date: "c. AD 60–62",
    theme: "The Supremacy of Christ",
    keyVerses: ["Col 1:15–17", "Col 2:9–10", "Col 3:17"],
    summary: "Colossians counters early heresy by exalting Christ as the image of God and the head of creation and the church — complete in Him, believers need nothing else."
  },
  {
    author: "Paul",
    date: "c. AD 50–51",
    theme: "The Second Coming",
    keyVerses: ["1 Thess 4:16–17", "1 Thess 5:16–18"],
    summary: "Paul's earliest letter encourages young believers facing persecution, instructs them on holy living, and gives hope about the resurrection and Christ's return."
  },
  {
    author: "Paul",
    date: "c. AD 51–52",
    theme: "The Day of the Lord",
    keyVerses: ["2 Thess 1:7", "2 Thess 3:3"],
    summary: "Paul corrects misunderstandings about the Day of the Lord (which had not yet come), encouraging endurance under persecution and faithful, diligent living."
  },
  {
    author: "Paul",
    date: "c. AD 62–64",
    theme: "Church Leadership",
    keyVerses: ["1 Tim 2:5", "1 Tim 4:12", "1 Tim 6:6"],
    summary: "Paul writes his young protégé Timothy with instructions for church order, leadership qualifications, and sound doctrine against false teaching in Ephesus."
  },
  {
    author: "Paul",
    date: "c. AD 66–67",
    theme: "Endurance & Scripture",
    keyVerses: ["2 Tim 1:7", "2 Tim 2:22", "2 Tim 3:16–17"],
    summary: "Paul's final letter, written near death, urges Timothy to remain faithful, preach the Word boldly, and endure suffering — passing on the faith to the next generation."
  },
  {
    author: "Paul",
    date: "c. AD 63–65",
    theme: "Sound Doctrine & Godliness",
    keyVerses: ["Tit 2:11–12", "Tit 3:5"],
    summary: "Paul instructs Titus in organizing the churches of Crete by appointing qualified leaders and teaching sound doctrine that produces godly living."
  },
  {
    author: "Paul",
    date: "c. AD 60–62",
    theme: "Forgiveness & Reconciliation",
    keyVerses: ["Philem 1:15–16", "Philem 1:8–9"],
    summary: "This brief personal letter appeals to Philemon to receive back his runaway slave Onesimus — now a fellow believer — as a brother in Christ, not as a slave."
  },
  {
    author: "Unknown (possibly Paul, Apollos, or Barnabas)",
    date: "c. AD 60–70",
    theme: "Christ Our Great High Priest",
    keyVerses: ["Heb 4:12", "Heb 11:1", "Heb 12:1–2"],
    summary: "Hebrews presents Jesus as superior to angels, Moses, and the Levitical priesthood. It calls Jewish Christians not to drift from faith, supported by a magnificent 'hall of faith.'"
  },
  {
    author: "James (brother of Jesus)",
    date: "c. AD 44–49",
    theme: "Faith Proven by Works",
    keyVerses: ["Jas 1:22", "Jas 2:17", "Jas 5:16"],
    summary: "James is a practical wisdom letter insisting that genuine saving faith will naturally produce good works, taming the tongue, caring for the poor, and persevering through trials."
  },
  {
    author: "Peter (apostle)",
    date: "c. AD 62–64",
    theme: "Hope in Suffering",
    keyVerses: ["1 Pet 1:3", "1 Pet 2:9", "1 Pet 5:7"],
    summary: "Peter writes to scattered, persecuted believers, reminding them of their living hope through Christ's resurrection and calling them to holy conduct among the Gentiles."
  },
  {
    author: "Peter (apostle)",
    date: "c. AD 65–67",
    theme: "Growing in Grace & Truth",
    keyVerses: ["2 Pet 1:3–4", "2 Pet 3:9", "2 Pet 3:18"],
    summary: "Peter warns against false teachers who distort the truth, urges spiritual growth in knowledge of Christ, and assures believers that the Lord will return as promised."
  },
  {
    author: "John (apostle)",
    date: "c. AD 85–95",
    theme: "Love, Light & Fellowship",
    keyVerses: ["1 John 1:9", "1 John 4:8", "1 John 5:13"],
    summary: "John writes to combat early Gnosticism by affirming the physical reality of Jesus and testing true faith by obedience, love for one another, and confession that Jesus is Lord."
  },
  {
    author: "John (apostle)",
    date: "c. AD 85–95",
    theme: "Walking in Truth & Love",
    keyVerses: ["2 John 1:6", "2 John 1:9"],
    summary: "The shortest book in the New Testament warns a local church not to offer hospitality to false teachers who deny the Incarnation, while urging continued love and obedience."
  },
  {
    author: "John (apostle)",
    date: "c. AD 85–95",
    theme: "Hospitality & Truth",
    keyVerses: ["3 John 1:4", "3 John 1:11"],
    summary: "John commends Gaius for welcoming traveling missionaries, rebukes the domineering Diotrephes who refuses them, and upholds Demetrius as a model of faithfulness."
  },
  {
    author: "Jude (brother of James)",
    date: "c. AD 65",
    theme: "Contending for the Faith",
    keyVerses: ["Jude 1:3", "Jude 1:20–21"],
    summary: "Jude urgently calls believers to defend the faith against false teachers who have secretly infiltrated the church, promising judgment on the ungodly and mercy for the faithful."
  },
  {
    author: "John (apostle)",
    date: "c. AD 95",
    theme: "Victory, Worship & New Creation",
    keyVerses: ["Rev 1:8", "Rev 5:12", "Rev 21:4", "Rev 22:20"],
    summary: "Revelation is a prophetic vision of Christ's ultimate victory over evil, the judgment of the nations, and the creation of a new heaven and new earth where God dwells with His people forever."
  },
];
