/**
 * Per-book hand-written supplements: a "Why this book matters today"
 * paragraph and 3 FAQs. Surfaced on `/books/[book]` to (a) replace the
 * templated paragraph + identical "How to Study X" block that Google's
 * Helpful Content System demotes as programmatic, and (b) emit per-book
 * FAQPage JSON-LD targeting AI Overviews for "who wrote {book}", "when
 * was {book} written", "what is the main theme of {book}" queries.
 *
 * Drafted 2026-05-28. JW-aligned, NWT terminology throughout. Subject to
 * editorial review before deploy — flag inaccuracies to support@jwstudy.org.
 */

export interface BookExtras {
  whyItMattersToday: string;
  faqs: { question: string; answer: string }[];
}

export const BOOK_EXTRAS: Record<string, BookExtras> = {
  Genesis: {
    whyItMattersToday:
      "Genesis is the foundation for every Bible teaching that follows it. The account of creation establishes Jehovah's sovereignty over the earth, his original purpose for humanity, and the basis for the resurrection hope. The first prophecy at Genesis 3:15 — pointing to the promised Seed who would crush the serpent — frames every subsequent book up through Revelation. For Jehovah's Witnesses today, Genesis answers the most pressing questions a Bible student or interested neighbor will raise: Where did we come from? Why is there suffering? What was Jehovah's original purpose? The answers are unchanged.",
    faqs: [
      { question: "Who wrote the book of Genesis?", answer: "Moses wrote Genesis around 1513 BCE, drawing on family histories preserved from Adam through Joseph. Genesis 5:1 refers to 'the book of Adam's history,' and Moses likely compiled these earlier accounts under inspiration." },
      { question: "When was the book of Genesis written?", answer: "Genesis was compiled by Moses approximately 1513 BCE during the 40 years Israel spent in the wilderness after leaving Egypt. The events it records span from the creation of the universe through the death of Joseph around 1657 BCE." },
      { question: "What is the main theme of Genesis?", answer: "Genesis establishes Jehovah as Creator and reveals his purpose to bless all nations through the promised Seed — fulfilled in Jesus Christ. It records the origin of sin, the first prophecy of redemption (Genesis 3:15), and Jehovah's covenant with Abraham." },
    ],
  },
  Exodus: {
    whyItMattersToday:
      "Exodus contains the first explicit revelation of Jehovah's personal name and the meaning behind it (Exodus 3:14; 6:3). Without this book, Jehovah's Witnesses lose their most direct biblical mandate for using the divine name in ministry. The Passover account points forward to Jesus Christ as 'our Passover lamb' (1 Corinthians 5:7), and the Ten Commandments still reveal the standards of righteousness Jehovah holds dear. The construction of the Tabernacle teaches that organized, reverent worship matters to Jehovah — a principle that shapes the way Witnesses approach Kingdom Hall meetings today.",
    faqs: [
      { question: "Who wrote the book of Exodus?", answer: "Moses wrote Exodus around 1512 BCE, recording events he personally witnessed — Israel's deliverance from Egypt, the giving of the Law at Sinai, and the construction of the Tabernacle." },
      { question: "When was the book of Exodus written?", answer: "Exodus was written around 1512 BCE in the wilderness. The events it covers span 145 years, from Joseph's death (1657 BCE) through the construction of the Tabernacle in 1512 BCE." },
      { question: "What is the main theme of Exodus?", answer: "Exodus reveals Jehovah as the Deliverer who keeps his covenant promises. Its central themes are the revelation of Jehovah's name, his power over false gods, the giving of the Law, and the institution of proper worship through the Tabernacle." },
    ],
  },
  Leviticus: {
    whyItMattersToday:
      "Leviticus is the book Jehovah's Witnesses point to when explaining the scriptural basis for abstaining from blood. Leviticus 17:11–14 establishes the sanctity of blood — a principle reaffirmed at Acts 15:28–29 and applied today to blood transfusion. Beyond that single issue, Leviticus reveals Jehovah's standard of holiness: 'You should be holy because I, Jehovah your God, am holy' (Leviticus 19:2). The sacrificial system foreshadows Jesus Christ's superior sacrifice as our High Priest. Reading Leviticus deepens appreciation for how completely Christ's ransom fulfilled what the Mosaic system pointed toward.",
    faqs: [
      { question: "Who wrote the book of Leviticus?", answer: "Moses wrote Leviticus around 1512 BCE at the base of Mount Sinai, recording the instructions Jehovah gave him for Israel's priesthood, sacrifices, and laws of holiness." },
      { question: "When was the book of Leviticus written?", answer: "Leviticus was written approximately 1512 BCE during Israel's encampment at Mount Sinai, covering about one month of legislation given through Moses." },
      { question: "What is the main theme of Leviticus?", answer: "Leviticus reveals Jehovah's call to holiness and establishes the priesthood and sacrificial system that foreshadowed Christ's ransom sacrifice. The book centers on what it means for an imperfect people to approach a perfect God." },
    ],
  },
  Numbers: {
    whyItMattersToday:
      "Numbers is a warning book. The 40-year wilderness wandering shows what happens when Jehovah's people complain, doubt, and listen to bad reports instead of trusting his promises (1 Corinthians 10:11). Korah's rebellion teaches respect for theocratic arrangements. The bronze serpent account (Numbers 21:4–9) was directly applied by Jesus to himself at John 3:14–15 — a powerful Christological key for personal study. For witnesses today facing trials or pressure to murmur against the congregation, Numbers offers both warning and the comfort that Jehovah remained faithful to a difficult generation.",
    faqs: [
      { question: "Who wrote the book of Numbers?", answer: "Moses wrote Numbers, completing it around 1473 BCE on the plains of Moab just before Israel entered the Promised Land." },
      { question: "When was the book of Numbers written?", answer: "Numbers was written between approximately 1512 BCE and 1473 BCE, covering Israel's 40-year wilderness journey from Sinai to the Jordan." },
      { question: "What is the main theme of Numbers?", answer: "Numbers records Israel's wilderness wanderings as a sustained lesson in the consequences of distrust and rebellion against Jehovah, while showing his faithful guidance even toward a difficult generation." },
    ],
  },
  Deuteronomy: {
    whyItMattersToday:
      "Deuteronomy contains the Shema — 'Jehovah our God is one Jehovah' (Deuteronomy 6:4) — which Jesus identified as the greatest commandment. Moses' farewell warnings about prosperity making Israel forget Jehovah (Deuteronomy 8:10–14) speak directly to materially comfortable Witnesses today. The book also predicts a 'prophet like Moses' (Deuteronomy 18:15–18), a key Messianic prophecy fulfilled in Jesus Christ and referenced in early Christian preaching (Acts 3:22). For personal study, Deuteronomy is one of the richest books for understanding what wholehearted devotion to Jehovah looks like in practical, daily life.",
    faqs: [
      { question: "Who wrote the book of Deuteronomy?", answer: "Moses wrote Deuteronomy around 1473 BCE on the plains of Moab. Joshua likely added the closing account of Moses' death in chapter 34." },
      { question: "When was the book of Deuteronomy written?", answer: "Deuteronomy was written approximately 1473 BCE in the final months before Israel crossed the Jordan into Canaan, covering about two months of farewell discourses by Moses." },
      { question: "What is the main theme of Deuteronomy?", answer: "Deuteronomy is Moses' impassioned call for Israel to love Jehovah with the whole heart and to remain loyal to the covenant. It restates the Law and warns of the consequences of forgetting Jehovah after entering the Promised Land." },
    ],
  },
  Joshua: {
    whyItMattersToday:
      "Joshua proves that 'not a word failed out of all the good things that Jehovah had spoken' (Joshua 21:45). Every promise made to Abraham about the land was kept. For Witnesses encouraging themselves about Kingdom promises that still wait fulfillment, Joshua is essential reading: what Jehovah has promised, he performs. The book also contains one of the strongest personal-choice scriptures in the Hebrew Scriptures — 'As for me and my household, we will serve Jehovah' (Joshua 24:15) — frequently used in family worship and in field ministry to challenge sincere people to take a personal stand.",
    faqs: [
      { question: "Who wrote the book of Joshua?", answer: "Joshua himself wrote most of the book, completing it around 1450 BCE. The account of Joshua's own death and subsequent events was added by Eleazar or Phinehas." },
      { question: "When was the book of Joshua written?", answer: "Joshua was written approximately 1450 BCE, covering about 20 years from Israel's crossing of the Jordan in 1473 BCE through Joshua's death." },
      { question: "What is the main theme of Joshua?", answer: "Joshua records the conquest and division of Canaan, demonstrating that Jehovah faithfully fulfills every promise. The central call of the book is to choose Jehovah wholeheartedly, as Joshua himself did." },
    ],
  },
  Judges: {
    whyItMattersToday:
      "Judges shows what happens when people drift from Jehovah: spiritual decline, social chaos, and the summary statement 'each one was doing what was right in his own eyes' (Judges 21:25) — a striking description of the modern world. The book is also a sustained demonstration of Jehovah's mercy, repeatedly raising up deliverers when Israel cried out in repentance. For Witnesses today, Judges is a sober reminder that drift is gradual but devastating, while also being a steady source of encouragement: Jehovah responds to genuine cries for help even from those who have failed before.",
    faqs: [
      { question: "Who wrote the book of Judges?", answer: "Samuel is traditionally identified as the writer of Judges, compiling it around 1100 BCE based on existing records of the period." },
      { question: "When was the book of Judges written?", answer: "Judges was written approximately 1100 BCE, recording roughly 330 years of Israel's history between Joshua's death and the beginning of the monarchy under Saul." },
      { question: "What is the main theme of Judges?", answer: "Judges traces a recurring cycle of unfaithfulness, oppression, repentance, and deliverance. The book demonstrates both the disastrous consequences of abandoning Jehovah and the depth of his mercy toward those who return to him." },
    ],
  },
  Ruth: {
    whyItMattersToday:
      "Ruth shows that Jehovah's mercy reaches beyond Israel to anyone who takes refuge under his wings (Ruth 2:12). A Moabite widow becomes the great-grandmother of King David — and an ancestor of Jesus Christ himself (Matthew 1:5). For Witnesses today doing field ministry, Ruth is a powerful reminder that Jehovah has 'sheep' in unexpected places and that loyal love (hesed) toward Jehovah and his people draws notice. The book's depiction of Boaz as kinsman-redeemer foreshadows Christ's redemptive role and gives the personal study reader a tender picture of how Jehovah arranges the lives of his loyal ones.",
    faqs: [
      { question: "Who wrote the book of Ruth?", answer: "Samuel is generally identified as the writer of Ruth, completing it around 1090 BCE — placing David in his proper genealogical context just as the monarchy was being established." },
      { question: "When was the book of Ruth written?", answer: "Ruth was written approximately 1090 BCE, though the events it records — set during the time of the Judges — took place about 1100 BCE during the early days of Boaz and Ruth in Bethlehem." },
      { question: "What is the main theme of Ruth?", answer: "Ruth celebrates loyal love (hesed) and shows that Jehovah rewards those who take refuge under his wings. The book also establishes the line of David and ultimately points to Jesus Christ, the great Kinsman-Redeemer." },
    ],
  },
  "1 Samuel": {
    whyItMattersToday:
      "First Samuel introduces the principle that 'Jehovah sees into the heart' (1 Samuel 16:7) — a foundational truth for how Witnesses understand worship and accountability today. The contrast between Saul (outward conformity, hidden disobedience) and David (genuine inner devotion despite flaws) gives every reader a model for honest self-examination. David's defeat of Goliath remains one of the most cited accounts in JW literature for facing seemingly impossible opposition with trust in Jehovah. For young people facing peer pressure and adults navigating spiritually difficult environments, 1 Samuel is a steady source of conviction and courage.",
    faqs: [
      { question: "Who wrote the book of 1 Samuel?", answer: "Samuel wrote the early portions; the prophets Nathan and Gad completed the book after Samuel's death, finishing it around 1078 BCE." },
      { question: "When was the book of 1 Samuel written?", answer: "First Samuel was completed approximately 1078 BCE, recording about 102 years of Israel's history from Samuel's birth around 1180 BCE through the death of Saul." },
      { question: "What is the main theme of 1 Samuel?", answer: "First Samuel covers the transition from the period of the Judges to the monarchy, showing that Jehovah evaluates the inner person rather than outward appearance. It contrasts Saul's failure with David's heart of devotion." },
    ],
  },
  "2 Samuel": {
    whyItMattersToday:
      "Second Samuel contains the Davidic covenant — Jehovah's promise of an everlasting kingdom through David's line (2 Samuel 7:12–16), fulfilled in Jesus Christ. For Witnesses today, this covenant is foundational to understanding the Kingdom they preach about. The book also handles David's sin with Bath-sheba honestly, modeling repentance for any Witness who has failed badly: David did not minimize, deflect, or hide. He confessed and accepted Jehovah's discipline. That pattern of genuine repentance remains the model for serious sin recovery in the congregation today.",
    faqs: [
      { question: "Who wrote the book of 2 Samuel?", answer: "The prophets Nathan and Gad wrote 2 Samuel, completing it around 1040 BCE — toward the end of David's 40-year reign." },
      { question: "When was the book of 2 Samuel written?", answer: "Second Samuel was completed approximately 1040 BCE, covering the 40 years of David's reign over Judah and then all Israel, from 1077 BCE to 1037 BCE." },
      { question: "What is the main theme of 2 Samuel?", answer: "Second Samuel records David's reign and the establishment of the Davidic covenant — Jehovah's promise of an everlasting Kingdom through David's line, fulfilled in Jesus Christ. It also models genuine repentance after serious sin." },
    ],
  },
  "1 Kings": {
    whyItMattersToday:
      "First Kings includes Elijah's confrontation with the prophets of Baal on Mount Carmel — one of the most cited accounts in JW literature on the courage required to stand for true worship in a hostile environment (1 Kings 18:21). The 'soft, low voice' that spoke to Elijah after Jezebel's threat (1 Kings 19:11–13) gives discouraged servants of Jehovah today a tender model of how he sustains his people. The book also documents the danger of spiritual compromise: even Solomon's wisdom did not protect him once foreign wives drew his heart toward pagan worship.",
    faqs: [
      { question: "Who wrote the book of 1 Kings?", answer: "Jeremiah is generally identified as the writer of 1 Kings, completing it around 580 BCE while Judah was in Babylonian exile. He drew on royal annals and prophetic records." },
      { question: "When was the book of 1 Kings written?", answer: "First Kings was completed approximately 580 BCE in Egypt or Babylon, covering 129 years of Israel's history from David's death in 1037 BCE through King Jehoshaphat's death around 911 BCE." },
      { question: "What is the main theme of 1 Kings?", answer: "First Kings covers Solomon's glorious reign, the building of Jehovah's Temple, the division of the kingdom, and the prophetic ministry of Elijah — demonstrating both the blessings of faithfulness and the spiritual ruin of compromise." },
    ],
  },
  "2 Kings": {
    whyItMattersToday:
      "Second Kings records the destruction of both kingdoms and gives Jehovah's explicit explanation: 'They feared other gods and followed in the practices of the nations' (2 Kings 17:7–8). For Witnesses today, this is the clearest scriptural warning against syncretism — mixing true worship with the customs of the world. Hezekiah's prayer when Assyria threatened Jerusalem (2 Kings 19:14–19) remains one of the most studied prayers in Scripture, modeling how to bring crushing problems before Jehovah. The book closes on a note of hope: even in exile, the line of David was preserved.",
    faqs: [
      { question: "Who wrote the book of 2 Kings?", answer: "Jeremiah is generally identified as the writer of 2 Kings, completing it around 580 BCE during the Babylonian exile." },
      { question: "When was the book of 2 Kings written?", answer: "Second Kings was completed approximately 580 BCE, covering about 340 years of Israel and Judah's history from around 920 BCE through the destruction of Jerusalem in 607 BCE." },
      { question: "What is the main theme of 2 Kings?", answer: "Second Kings records the progressive spiritual decline and fall of both Israel (to Assyria) and Judah (to Babylon), explaining that exile was the direct consequence of persistent unfaithfulness to Jehovah's covenant." },
    ],
  },
  "1 Chronicles": {
    whyItMattersToday:
      "First Chronicles retells David's reign from a priestly perspective, emphasizing pure, organized worship. The detailed genealogies of chapters 1–9 establish that Jehovah keeps records — a sobering reminder that none of his servants are anonymous. David's preparations for the Temple show that Witnesses today should also invest in arrangements they themselves may not see completed, trusting Jehovah's timing. The book ends with David's prayer celebrating Jehovah's sovereignty (1 Chronicles 29:11), one of the richest doxologies in Scripture, regularly drawn on in personal prayer and at meetings.",
    faqs: [
      { question: "Who wrote the book of 1 Chronicles?", answer: "Ezra the priest wrote 1 Chronicles, completing it around 460 BCE after the return from Babylonian exile." },
      { question: "When was the book of 1 Chronicles written?", answer: "First Chronicles was written approximately 460 BCE in Jerusalem, after the first wave of returnees had rebuilt the Temple. It retells Israel's history from Adam through David's death." },
      { question: "What is the main theme of 1 Chronicles?", answer: "First Chronicles emphasizes David's preparations for the Temple and pure, organized worship of Jehovah. It encourages the returned exiles to rebuild not just the structure but the spiritual life it represented." },
    ],
  },
  "2 Chronicles": {
    whyItMattersToday:
      "Second Chronicles contains 2 Chronicles 7:14 — Jehovah's promise that when his people humble themselves and pray, he will 'forgive their sin and heal their land.' This conditional pattern still applies to any congregation, family, or individual struggling spiritually. The book also records Jehoshaphat's outnumbered army at Jahaziel's prophetic word: 'The battle is not yours, but God's' (2 Chronicles 20:15) — a foundational text for trusting Jehovah in apparent no-win situations. The closing decree of Cyrus shows Jehovah moves world rulers' hearts to accomplish his purpose.",
    faqs: [
      { question: "Who wrote the book of 2 Chronicles?", answer: "Ezra the priest wrote 2 Chronicles, completing it around 460 BCE as a companion to 1 Chronicles." },
      { question: "When was the book of 2 Chronicles written?", answer: "Second Chronicles was completed approximately 460 BCE, covering 426 years of Judean history from Solomon's reign beginning in 1037 BCE through the decree of Cyrus permitting the return from exile." },
      { question: "What is the main theme of 2 Chronicles?", answer: "Second Chronicles highlights Judah's kings, emphasizing periods of spiritual revival under faithful rulers and the consequences of unfaithfulness. It closes with the hopeful decree of Cyrus permitting the rebuilding of Jehovah's house." },
    ],
  },
  Ezra: {
    whyItMattersToday:
      "Ezra is essential for understanding how restoration works. After the Babylonian exile, a faithful remnant returned, rebuilt the Temple despite opposition, and reformed worship under Ezra's leadership. The book gives one of the strongest models of personal Bible study in all of Scripture: 'Ezra had prepared his heart to consult the Law of Jehovah and to practice it, and to teach it' (Ezra 7:10). That three-step pattern — study, practice, teach — remains the gold standard for Witnesses today preparing themselves for the ministry and for spiritual responsibility in the congregation.",
    faqs: [
      { question: "Who wrote the book of Ezra?", answer: "Ezra the priest wrote the book bearing his name, completing it around 460 BCE in Jerusalem." },
      { question: "When was the book of Ezra written?", answer: "Ezra was written approximately 460 BCE, covering about 70 years of the post-exile period from Cyrus' decree in 537 BCE through Ezra's reforms." },
      { question: "What is the main theme of Ezra?", answer: "Ezra records the return of Jewish exiles, the rebuilding of Jehovah's Temple, and spiritual restoration through the public reading and application of Jehovah's Law." },
    ],
  },
  Nehemiah: {
    whyItMattersToday:
      "Nehemiah models faithful, practical leadership combined with prayer. The walls of Jerusalem were rebuilt in 52 days despite fierce opposition because Nehemiah prayed and worked. His response to threats — 'Continue building, with one hand holding a weapon' (Nehemiah 4:17) — is regularly applied today to balancing spiritual vigilance with active service. The public reading of the Law in chapter 8 and the people's tearful response model how Jehovah's word, when properly fed to his people, produces deep emotional and behavioral change. For elders and ministerial servants, Nehemiah is a sustained portrait of effective theocratic oversight.",
    faqs: [
      { question: "Who wrote the book of Nehemiah?", answer: "Nehemiah himself wrote the book bearing his name, completing it shortly after 443 BCE in Jerusalem." },
      { question: "When was the book of Nehemiah written?", answer: "Nehemiah was completed approximately 443 BCE, covering about 30 years of the post-exile period including the rebuilding of Jerusalem's walls in 52 days." },
      { question: "What is the main theme of Nehemiah?", answer: "Nehemiah records the rebuilding of Jerusalem's walls in the face of fierce opposition and the spiritual renewal that followed through the public reading of Jehovah's Law." },
    ],
  },
  Esther: {
    whyItMattersToday:
      "Esther never mentions Jehovah's name explicitly, yet his guiding hand is visible throughout — a profound illustration that Jehovah's care for his people operates even when unseen. Mordecai's question to Esther — 'Who knows whether it is for a time like this that you have come to your royal position?' (Esther 4:14) — remains foundational for understanding that Jehovah positions his servants strategically. For Witnesses today facing prohibition, family pressure, or workplace decisions that test their integrity, Esther teaches that courageous, prayerful action at the right moment changes outcomes that seem fixed.",
    faqs: [
      { question: "Who wrote the book of Esther?", answer: "Mordecai is generally identified as the writer of Esther, completing it around 475 BCE in Susa, the Persian capital." },
      { question: "When was the book of Esther written?", answer: "Esther was written approximately 475 BCE in Persia, recording events that took place between 493 and 475 BCE during the reign of Ahasuerus (Xerxes I)." },
      { question: "What is the main theme of Esther?", answer: "Esther shows Jehovah's hidden providence in preserving his people from Haman's genocidal plot, working through Queen Esther's courage and Mordecai's loyalty to deliver the Jews." },
    ],
  },
  Job: {
    whyItMattersToday:
      "Job exposes the real issue behind suffering — Satan's challenge to Jehovah's sovereignty and to the integrity of his servants (Job 1:9–11; 2:4–5). This is the framework Witnesses use to make sense of why a loving God permits suffering. Job's faithful integrity under unimaginable loss vindicated Jehovah's name and answered Satan's accusation. The book also contains a powerful early statement of the resurrection hope (Job 14:13–15). For anyone enduring extreme trial today — illness, persecution, bereavement — Job is foundational. The issue is bigger than your circumstances; faithful integrity matters cosmically.",
    faqs: [
      { question: "Who wrote the book of Job?", answer: "Moses is generally identified as the writer of Job, recording the account around 1473 BCE based on events that took place earlier in the patriarchal period." },
      { question: "When was the book of Job written?", answer: "Job was written approximately 1473 BCE by Moses, though the events it records likely took place around 1613 BCE — making Job a contemporary of the patriarchs." },
      { question: "What is the main theme of Job?", answer: "Job addresses the real issue behind human suffering — Satan's challenge to Jehovah's sovereignty and to the integrity of his servants. Job's faithful endurance under trial vindicated Jehovah's name." },
    ],
  },
  Psalms: {
    whyItMattersToday:
      "Psalms is the prayer book of Jehovah's people and the songbook of the Kingdom. It is also the most explicit declaration of the divine name in all of Scripture: Psalm 83:18 states that Jehovah alone is 'the Most High over all the earth' — a key proof-text for the Kingdom-preaching work today. The Psalms model honest prayer across the full range of human experience: praise, lament, confession, thanksgiving, doubt, confidence. For any Witness whose prayer life feels formulaic, Psalms breaks open the possibility of speaking to Jehovah authentically about anything.",
    faqs: [
      { question: "Who wrote the book of Psalms?", answer: "Multiple writers across nearly a millennium contributed to Psalms — David (73 psalms), Asaph, the Sons of Korah, Solomon, Moses, Heman, Ethan, and others, with Ezra likely compiling the final collection around 460 BCE." },
      { question: "When was the book of Psalms written?", answer: "Psalms was composed over approximately 1,000 years, from Moses' Psalm 90 around 1473 BCE through psalms written after the return from exile, with Ezra completing the collection around 460 BCE." },
      { question: "What is the main theme of Psalms?", answer: "Psalms is the inspired prayer and praise book of Jehovah's people, covering worship, lament, thanksgiving, and trust. Its central message is that Jehovah is worthy of all praise and is the refuge of all who call on his name." },
    ],
  },
  Proverbs: {
    whyItMattersToday:
      "Proverbs is the practical wisdom book Witnesses turn to for daily life. The opening statement that 'the fear of Jehovah is the beginning of wisdom' (Proverbs 1:7) sets the entire framework: real wisdom requires the right relationship with Jehovah. The book's counsel on speech, work, marriage, parenting, money, friendships, and self-discipline is regularly cited in Watchtower studies and applied in family worship. For young Witnesses making their first major decisions and for adults navigating long-term relationships, Proverbs is the most practical book in Scripture — short, memorable, and immediately applicable.",
    faqs: [
      { question: "Who wrote the book of Proverbs?", answer: "Solomon wrote most of Proverbs, contributing roughly 3,000 proverbs. Agur (chapter 30) and King Lemuel (chapter 31) wrote portions, and Hezekiah's men later compiled additional Solomonic proverbs (chapters 25–29)." },
      { question: "When was the book of Proverbs written?", answer: "The bulk of Proverbs was composed by Solomon around 1000 BCE. Hezekiah's men compiled additional Solomonic material around 717 BCE, completing the book." },
      { question: "What is the main theme of Proverbs?", answer: "Proverbs teaches practical wisdom rooted in the fear of Jehovah. Its message is that true wisdom is inseparable from a right relationship with Jehovah and shapes every area of daily life." },
    ],
  },
  Ecclesiastes: {
    whyItMattersToday:
      "Ecclesiastes is the book Jehovah's Witnesses return to whenever life under the current system feels meaningless. Solomon's investigation of pleasure, wealth, achievement, and wisdom — and his verdict that all are 'futility' apart from Jehovah — speaks directly to anyone tempted by materialism. The book also contains one of the clearest scriptural statements on the condition of the dead: 'The dead know nothing at all' (Ecclesiastes 9:5) — foundational for understanding why Witnesses reject the immortal-soul doctrine. The closing conclusion — 'fear the true God and keep his commandments, for this is the whole obligation of man' — remains the bottom line.",
    faqs: [
      { question: "Who wrote the book of Ecclesiastes?", answer: "Solomon (called Qohelet, 'the congregator') wrote Ecclesiastes around 1000 BCE, near the end of his reign, reflecting on his life's pursuits and their ultimate meaning." },
      { question: "When was the book of Ecclesiastes written?", answer: "Ecclesiastes was written approximately 1000 BCE by Solomon in Jerusalem, drawing on his years of unparalleled wealth, wisdom, and indulgence." },
      { question: "What is the main theme of Ecclesiastes?", answer: "Ecclesiastes shows that life apart from Jehovah is empty and concludes that the whole purpose of humanity is to fear the true God and keep his commandments. It also clarifies what happens at death." },
    ],
  },
  "Song of Solomon": {
    whyItMattersToday:
      "The Song of Solomon celebrates loyal love between a husband and wife, treating romantic devotion and faithfulness as gifts from Jehovah. In a world that has degraded the meaning of love and marriage, the Song reminds Witnesses that exclusive, committed romantic love within marriage reflects Jehovah's own loyal love (hesed). The Shulammite's resistance to Solomon's overtures despite his wealth and royal status is a model of fidelity for any married Witness facing similar pressures today. For couples in field service or facing trials together, the book affirms that love rooted in Jehovah is unbreakable.",
    faqs: [
      { question: "Who wrote the Song of Solomon?", answer: "Solomon wrote the Song of Solomon — also called the Song of Songs — around 1020 BCE early in his reign, before his many foreign marriages drew his heart from Jehovah." },
      { question: "When was the Song of Solomon written?", answer: "The Song was written approximately 1020 BCE in Israel during Solomon's early reign, celebrating the loyal love of a shepherd girl and her beloved." },
      { question: "What is the main theme of the Song of Solomon?", answer: "The Song celebrates loyal love (hesed) between a husband and wife, affirming romantic devotion and exclusive commitment within marriage as gifts from Jehovah." },
    ],
  },
  Isaiah: {
    whyItMattersToday:
      "Isaiah contains some of the most precise Messianic prophecies in all of Scripture — including the Suffering Servant of Isaiah 53 and the Wonderful Counselor of Isaiah 9:6–7 — fulfilled in detail by Jesus Christ. For Witnesses preaching the Kingdom message, Isaiah is one of the richest sources of evidence for Jesus' identity. The book also contains Isaiah 40:31's promise of renewed strength for those waiting on Jehovah, regularly cited at conventions and Memorial talks. Isaiah's vision of the coming new earth (Isaiah 65:17–25) sustains the Kingdom hope of every Witness today.",
    faqs: [
      { question: "Who wrote the book of Isaiah?", answer: "Isaiah the prophet wrote the entire book bearing his name, completing it around 732 BCE in Jerusalem. He ministered during the reigns of Uzziah, Jotham, Ahaz, and Hezekiah." },
      { question: "When was the book of Isaiah written?", answer: "Isaiah was written between approximately 778 BCE and 732 BCE during Isaiah's ministry in Jerusalem, spanning the reigns of four kings of Judah." },
      { question: "What is the main theme of Isaiah?", answer: "Isaiah contains Jehovah's judgments on unfaithful Judah and the surrounding nations, alongside some of the clearest Messianic prophecies in Scripture and visions of Jehovah's coming Kingdom under Christ." },
    ],
  },
  Jeremiah: {
    whyItMattersToday:
      "Jeremiah modeled faithful endurance under intense persecution and personal isolation. He preached for over 40 years to a people who refused to listen, was imprisoned, thrown into a cistern, and watched Jerusalem's destruction — yet never abandoned his commission. For Witnesses facing rejection in field ministry, family opposition, or government ban, Jeremiah is essential reading. The book also contains the promise of a new covenant 'written on the heart' (Jeremiah 31:31–34), fulfilled through Jesus Christ. Jeremiah's letter to the exiles in chapter 29 — telling them to seek the peace of Babylon while remaining no part of it — defines how Witnesses live in the world today.",
    faqs: [
      { question: "Who wrote the book of Jeremiah?", answer: "Jeremiah the prophet wrote the book bearing his name, with his secretary Baruch recording much of it under Jeremiah's dictation. The book was completed around 580 BCE in Egypt." },
      { question: "When was the book of Jeremiah written?", answer: "Jeremiah was written between approximately 647 BCE and 580 BCE during Jeremiah's 67-year prophetic ministry from Josiah's reign through the early years of the Babylonian exile." },
      { question: "What is the main theme of Jeremiah?", answer: "Jeremiah faithfully delivered Jehovah's warnings of judgment to an unrepentant Judah and announced the new covenant Jehovah would make — written on the heart and mediated through Christ." },
    ],
  },
  Lamentations: {
    whyItMattersToday:
      "Lamentations gives Jehovah's people permission to grieve honestly while still holding onto hope. Jeremiah's anguish over Jerusalem's destruction is unfiltered, yet anchored in the truth that 'Jehovah's loyal love never ends; his mercies never come to an end. They are new each morning' (Lamentations 3:22–23). For Witnesses dealing with bereavement, congregational sadness, or grief over what is happening in the world, this book validates lament without collapsing into despair. The discipline of mourning what is wrong while still trusting Jehovah's character is exactly what spiritual maturity looks like.",
    faqs: [
      { question: "Who wrote the book of Lamentations?", answer: "Jeremiah the prophet wrote Lamentations around 607 BCE shortly after the destruction of Jerusalem, lamenting the city's fall in five poetic dirges." },
      { question: "When was the book of Lamentations written?", answer: "Lamentations was written approximately 607 BCE in the immediate aftermath of Jerusalem's destruction by the Babylonians, likely while Jeremiah remained in the ruined city or shortly after." },
      { question: "What is the main theme of Lamentations?", answer: "Lamentations expresses profound grief over the destruction of Jerusalem while affirming that Jehovah's loyal love never ends. The book models honest mourning anchored in unbroken trust." },
    ],
  },
  Ezekiel: {
    whyItMattersToday:
      "Ezekiel saw Jehovah's chariot-throne in spectacular vision (Ezekiel 1) and called the exiles to recognize that Jehovah remained present and sovereign even far from the destroyed Temple. The valley of dry bones (Ezekiel 37) is one of the most powerful Old Testament foreshadowings of the resurrection hope that defines JW preaching. The role of Ezekiel as a 'watchman' (Ezekiel 3:17–21; 33:1–9) is regularly applied to the responsibility of Witnesses today to warn others about Jehovah's coming judgment. Ezekiel's vision of the future Temple (chapters 40–48) sustains the hope of pure, organized worship being restored.",
    faqs: [
      { question: "Who wrote the book of Ezekiel?", answer: "Ezekiel the priest and prophet wrote the book bearing his name, completing it around 591 BCE in Babylon during his ministry to the Jewish exiles." },
      { question: "When was the book of Ezekiel written?", answer: "Ezekiel was written between approximately 613 BCE and 591 BCE in Babylon during Ezekiel's 22-year prophetic ministry to the Jewish exiles." },
      { question: "What is the main theme of Ezekiel?", answer: "Ezekiel proclaims that 'they will have to know that I am Jehovah' through both judgment and restoration. The book includes spectacular visions of Jehovah's glory, the dry-bones resurrection prophecy, and the future Temple." },
    ],
  },
  Daniel: {
    whyItMattersToday:
      "Daniel is the prophetic skeleton of Jehovah's Witness understanding of history. Daniel 2:44 — 'the God of heaven will set up a kingdom that will never be destroyed' — is the foundational scripture for the Kingdom-preaching work. The four kingdoms of chapter 2 and chapter 7, the Gentile Times calculation, and the prophecy of the seventy weeks (Daniel 9) are all centrally important. Beyond prophecy, Daniel's personal integrity under Babylonian pressure — including the three Hebrews' 'even if not' faith (Daniel 3:17–18) — gives every Witness facing modern pressure a model of uncompromising loyalty.",
    faqs: [
      { question: "Who wrote the book of Daniel?", answer: "Daniel the prophet wrote the book bearing his name, completing it around 536 BCE in Babylon after the fall of the Babylonian Empire to the Medes and Persians." },
      { question: "When was the book of Daniel written?", answer: "Daniel was written between approximately 618 BCE and 536 BCE during Daniel's life in Babylon, covering events from the early exile through the reign of Cyrus." },
      { question: "What is the main theme of Daniel?", answer: "Daniel shows that Jehovah is sovereign over all human governments and history. The book contains the foundational prophecy of Jehovah's coming Kingdom (Daniel 2:44) and remarkable accounts of integrity under hostile rule." },
    ],
  },
  Hosea: {
    whyItMattersToday:
      "Hosea exposes spiritual unfaithfulness for what it is — adultery against Jehovah. Jehovah commanded Hosea to marry an unfaithful wife as a living parable of Israel's spiritual prostitution. For Witnesses today, this book is a warning against drifting into worldly attachments, divided loyalties, or letting other priorities crowd out Jehovah's claim on the heart. Yet Hosea is equally a book about restoration: Jehovah's loyal love pursues, disciplines, and welcomes back even those who have strayed badly. Anyone considering returning to the congregation after a period of unfaithfulness can find Hosea profoundly reassuring.",
    faqs: [
      { question: "Who wrote the book of Hosea?", answer: "Hosea the prophet wrote the book bearing his name, completing it around 745 BCE in the northern kingdom of Israel after a ministry of about 60 years." },
      { question: "When was the book of Hosea written?", answer: "Hosea was written between approximately 804 BCE and 745 BCE during Hosea's prophetic ministry to the northern kingdom of Israel." },
      { question: "What is the main theme of Hosea?", answer: "Hosea reveals Jehovah's loyal love that pursues, disciplines, and restores his unfaithful people. The prophet's own marriage to an unfaithful wife dramatized Israel's spiritual adultery and Jehovah's mercy." },
    ],
  },
  Joel: {
    whyItMattersToday:
      "Joel's prophecy that Jehovah would 'pour out my spirit on every sort of flesh' (Joel 2:28–29) was directly applied by Peter at Pentecost 33 CE (Acts 2:14–21) as fulfilled in the anointing of the Christian congregation. For Witnesses today understanding the role of the anointed remnant, Joel is foundational. The book also describes 'the day of Jehovah' — a major prophetic theme that ties directly to the Witness understanding of Armageddon and final judgment. Joel's call to 'rend your hearts and not your garments' (Joel 2:13) remains the standard for what genuine repentance looks like.",
    faqs: [
      { question: "Who wrote the book of Joel?", answer: "Joel the prophet, son of Pethuel, wrote the book bearing his name, completing it around 820 BCE during the early reign of King Joash of Judah." },
      { question: "When was the book of Joel written?", answer: "Joel was written approximately 820 BCE in the southern kingdom of Judah, possibly in response to a devastating locust plague used as a symbol of coming judgment." },
      { question: "What is the main theme of Joel?", answer: "Joel calls for genuine repentance in light of the coming 'day of Jehovah,' and promises the outpouring of Jehovah's spirit on his servants — fulfilled at Pentecost 33 CE." },
    ],
  },
  Amos: {
    whyItMattersToday:
      "Amos exposes hollow religious observance and social injustice. He preached against Israel's prosperous, religiously active society and called for justice 'to flow like waters' (Amos 5:24). For Witnesses today, Amos is a warning against letting form replace substance — going through the motions of meeting attendance, field service, and donations while ignoring the practical concerns of fellow believers. The book also affirms that Jehovah reveals his 'confidential matter to his servants the prophets' (Amos 3:7) — foundational for understanding why Witnesses trust the prophetic timetable Jehovah has progressively made clear.",
    faqs: [
      { question: "Who wrote the book of Amos?", answer: "Amos, a shepherd and fig-tender from Tekoa in Judah, wrote the book bearing his name, completing it around 804 BCE after his brief ministry to the northern kingdom." },
      { question: "When was the book of Amos written?", answer: "Amos was written approximately 804 BCE during a period of prosperity under King Jeroboam II of Israel, two years before a great earthquake recorded by Amos and other historians." },
      { question: "What is the main theme of Amos?", answer: "Amos condemns Israel's hollow worship and social injustice, calling for genuine justice and righteousness as the only worship Jehovah accepts. He also announces Jehovah's coming judgment on the nations." },
    ],
  },
  Obadiah: {
    whyItMattersToday:
      "Obadiah, the shortest book in the Hebrew Scriptures, pronounces judgment on Edom for gloating over Judah's misfortune. The principle stands today: how Jehovah's people are treated by outsiders matters to him. For Witnesses experiencing persecution, mockery, or family opposition, Obadiah is a reminder that Jehovah keeps records and will eventually call every gloating opponent to account. The book closes with the promise that 'the kingship will belong to Jehovah' (Obadiah 21) — a hope that anchors every Witness through current trials.",
    faqs: [
      { question: "Who wrote the book of Obadiah?", answer: "Obadiah the prophet wrote the book bearing his name, completing it around 607 BCE shortly after Jerusalem's destruction by the Babylonians." },
      { question: "When was the book of Obadiah written?", answer: "Obadiah was written approximately 607 BCE in Judah, responding to Edom's gloating over Jerusalem's destruction at the hands of the Babylonians." },
      { question: "What is the main theme of Obadiah?", answer: "Obadiah pronounces Jehovah's judgment on Edom for gloating over Judah's destruction and promises that Jehovah will ultimately restore his people and establish his kingship." },
    ],
  },
  Jonah: {
    whyItMattersToday:
      "Jonah teaches that Jehovah's mercy extends far beyond Israel — and far beyond what his prophet thought reasonable. The repentance of Nineveh (Jonah 3:5–10) demonstrates that no group is too wicked to respond when Jehovah's word is preached. For Witnesses in field ministry today, especially in difficult territories, Jonah is essential reading: do not write off any group. Jesus himself pointed to Jonah's three days in the fish as a sign of his own death and resurrection (Matthew 12:39–40), giving the book Christological weight that elevates an otherwise short prophetic narrative.",
    faqs: [
      { question: "Who wrote the book of Jonah?", answer: "Jonah the prophet wrote the book bearing his name, completing it around 844 BCE — recording his own experiences as a reluctant missionary to Nineveh." },
      { question: "When was the book of Jonah written?", answer: "Jonah was written approximately 844 BCE in the northern kingdom of Israel, recording events from Jonah's brief but spectacular ministry to the Assyrian capital." },
      { question: "What is the main theme of Jonah?", answer: "Jonah shows that Jehovah's mercy extends to all nations who repent, including Israel's worst enemies. The book also serves as a prophetic sign of Christ's death and resurrection." },
    ],
  },
  Micah: {
    whyItMattersToday:
      "Micah 5:2 — the prophecy that the Messiah would come from Bethlehem Ephrathah — was directly quoted by the chief priests to Herod after Jesus' birth (Matthew 2:5–6). For Witnesses preaching Jesus' Messianic identity, Micah is essential evidence. The book's summary of Jehovah's requirements — 'to exercise justice, to love loyalty, and to be modest in walking with your God' (Micah 6:8) — remains one of the most cited scriptures for personal Christian conduct. Micah also closes with one of the strongest statements of Jehovah's loyal love and forgiveness (Micah 7:18–19).",
    faqs: [
      { question: "Who wrote the book of Micah?", answer: "Micah the prophet, from Moresheth in Judah, wrote the book bearing his name, completing it around 717 BCE after a ministry of about 50 years." },
      { question: "When was the book of Micah written?", answer: "Micah was written between approximately 777 BCE and 717 BCE during the reigns of Jotham, Ahaz, and Hezekiah of Judah." },
      { question: "What is the main theme of Micah?", answer: "Micah announces Jehovah's judgment on Israel and Judah for injustice and false worship, while prophesying the coming Messiah from Bethlehem and the restoration of pure worship." },
    ],
  },
  Nahum: {
    whyItMattersToday:
      "Nahum announced the doom of Nineveh — the same city that repented in Jonah's day, now returned to its violent ways. The book demonstrates that repentance must be sustained, not just momentary. For Witnesses today reflecting on personal spirituality, Nahum is a warning: returning to old patterns after genuine reform brings worse consequences than the original drift. The book also gives a powerful description of Jehovah's character: 'Jehovah is slow to anger and great in power, and Jehovah will by no means hold back from punishing' (Nahum 1:3). Patience and justice are both real, both reliable.",
    faqs: [
      { question: "Who wrote the book of Nahum?", answer: "Nahum the prophet, from Elkosh, wrote the book bearing his name, completing it around 632 BCE before the fall of Nineveh in 632 BCE." },
      { question: "When was the book of Nahum written?", answer: "Nahum was written approximately 632 BCE in Judah, prophesying against Nineveh shortly before its destruction by the Medes and Babylonians." },
      { question: "What is the main theme of Nahum?", answer: "Nahum announces Jehovah's coming judgment on Nineveh for its violence and idolatry, demonstrating that Jehovah is patient but ultimately will not let unrepentant wickedness stand." },
    ],
  },
  Habakkuk: {
    whyItMattersToday:
      "Habakkuk wrestled honestly with the question of why Jehovah permits evil — and how he could use a more wicked nation (Babylon) to punish a less wicked one (Judah). Jehovah's answer — 'the righteous one will live by his faithfulness' (Habakkuk 2:4) — is quoted three times in the Christian Greek Scriptures (Romans 1:17; Galatians 3:11; Hebrews 10:38) and forms the basis of the Christian doctrine of faith. For Witnesses today struggling with hard questions about world events or personal trials, Habakkuk models faithful complaint that ends in renewed trust (Habakkuk 3:17–18).",
    faqs: [
      { question: "Who wrote the book of Habakkuk?", answer: "Habakkuk the prophet wrote the book bearing his name, completing it around 628 BCE in Judah shortly before the first Babylonian invasion." },
      { question: "When was the book of Habakkuk written?", answer: "Habakkuk was written approximately 628 BCE in Judah, during the reigns of either Josiah or Jehoiakim, shortly before the Babylonian invasion that began in 620 BCE." },
      { question: "What is the main theme of Habakkuk?", answer: "Habakkuk wrestles with the problem of evil and the use of wicked nations as instruments of judgment, concluding that 'the righteous one will live by his faithfulness.'" },
    ],
  },
  Zephaniah: {
    whyItMattersToday:
      "Zephaniah's 'great day of Jehovah' (Zephaniah 1:14–18) is one of the most vivid descriptions in Scripture of Jehovah's coming judgment — language echoed in the Christian Greek Scriptures' descriptions of Armageddon. For Witnesses today, the book reinforces the urgency of the preaching work. Yet Zephaniah also closes with one of the tenderest pictures of Jehovah's love: 'He will exult over you with rejoicing. He will be silent in his love. He will be joyful over you with happy songs' (Zephaniah 3:17). The same Jehovah who judges is the Jehovah who delights in those who seek him.",
    faqs: [
      { question: "Who wrote the book of Zephaniah?", answer: "Zephaniah, a great-great-grandson of King Hezekiah, wrote the book bearing his name, completing it around 648 BCE during the reign of Josiah." },
      { question: "When was the book of Zephaniah written?", answer: "Zephaniah was written approximately 648 BCE in Judah during the reign of King Josiah, likely before Josiah's major reforms began." },
      { question: "What is the main theme of Zephaniah?", answer: "Zephaniah announces the coming 'day of Jehovah' — judgment on Judah and the nations — alongside Jehovah's tender love for the meek who seek him." },
    ],
  },
  Haggai: {
    whyItMattersToday:
      "Haggai called the returned exiles to prioritize rebuilding Jehovah's house over their personal homes. His pointed question — 'Is it the time for you yourselves to dwell in your paneled houses, while this house lies waste?' (Haggai 1:4) — applies today to any Witness whose material priorities have crowded out spiritual ones. The book is short, sharp, and immediately practical. For Witnesses tempted to delay spiritual investment 'until things settle down,' Haggai is a wake-up call. The work of Jehovah always comes first.",
    faqs: [
      { question: "Who wrote the book of Haggai?", answer: "Haggai the prophet wrote the book bearing his name, completing it in 520 BCE during the reign of Darius the Persian." },
      { question: "When was the book of Haggai written?", answer: "Haggai was written in 520 BCE in Jerusalem, recording four prophetic messages delivered over a single four-month period to motivate the rebuilding of Jehovah's Temple." },
      { question: "What is the main theme of Haggai?", answer: "Haggai called the returned exiles to set aside personal pursuits and prioritize the rebuilding of Jehovah's Temple — applying directly to anyone today whose priorities have drifted from spiritual interests." },
    ],
  },
  Zechariah: {
    whyItMattersToday:
      "Zechariah contains some of the most specific Messianic prophecies in the Hebrew Scriptures — the King coming on a donkey (Zechariah 9:9, fulfilled at Matthew 21:5), the thirty pieces of silver (Zechariah 11:12–13, fulfilled at Matthew 27:9–10), the pierced one (Zechariah 12:10, fulfilled at John 19:37), and the struck shepherd (Zechariah 13:7, fulfilled at Matthew 26:31). For Witnesses preaching the Kingdom message, Zechariah is essential evidence for Jesus' identity. The book also looks forward to Jehovah's name being made one over all the earth (Zechariah 14:9) — the Kingdom hope in summary form.",
    faqs: [
      { question: "Who wrote the book of Zechariah?", answer: "Zechariah the prophet, contemporary of Haggai, wrote the book bearing his name, completing it around 518 BCE in Jerusalem." },
      { question: "When was the book of Zechariah written?", answer: "Zechariah was written between approximately 520 BCE and 518 BCE in Jerusalem during the post-exile period under the reign of Darius the Persian." },
      { question: "What is the main theme of Zechariah?", answer: "Zechariah encourages the returned exiles in rebuilding the Temple and contains some of the most specific Messianic prophecies in Scripture, all fulfilled in Jesus Christ." },
    ],
  },
  Malachi: {
    whyItMattersToday:
      "Malachi is the final book of the Hebrew Scriptures and addresses the lukewarm religion of the post-exile community: ritual without devotion, tithes withheld, marriage covenants broken. For Witnesses today, Malachi is a mirror check on whether worship has become formal rather than wholehearted. The book also predicts the messenger who would prepare the way for Jehovah (Malachi 3:1; 4:5–6) — fulfilled by John the Baptizer. The closing promise of the 'great and awe-inspiring day of Jehovah' (Malachi 4:5) connects the Hebrew Scriptures to the Christian Greek Scriptures that follow.",
    faqs: [
      { question: "Who wrote the book of Malachi?", answer: "Malachi the prophet wrote the book bearing his name, completing it around 443 BCE in Jerusalem during the post-exile period." },
      { question: "When was the book of Malachi written?", answer: "Malachi was written approximately 443 BCE in Jerusalem, likely contemporary with Nehemiah's second governorship and addressing similar spiritual problems." },
      { question: "What is the main theme of Malachi?", answer: "Malachi addresses the lukewarm religion of the post-exile community, calling for sincere worship and predicting the messenger who would prepare the way for Jehovah — fulfilled by John the Baptizer." },
    ],
  },

  // ── Christian Greek Scriptures ─────────────────────────────────────────────

  Matthew: {
    whyItMattersToday:
      "Matthew is the bridge book between the Hebrew and Christian Greek Scriptures, written primarily for a Jewish audience and repeatedly demonstrating how Jesus fulfilled Hebrew Scripture prophecy. The Sermon on the Mount (chapters 5–7) contains the most concentrated body of Jesus' practical teaching anywhere in Scripture — applied daily by Witnesses in personal conduct, family life, and ministry. Matthew 24's sign of the conclusion of the system of things is foundational for the JW understanding that we are living in the last days. The Great Commission at Matthew 28:19–20 is the direct biblical mandate for the worldwide preaching work.",
    faqs: [
      { question: "Who wrote the book of Matthew?", answer: "Matthew (also called Levi), one of the twelve apostles and a former tax collector, wrote the Gospel bearing his name, completing it around 41 CE in Palestine." },
      { question: "When was the book of Matthew written?", answer: "Matthew was written approximately 41 CE in Palestine, making it the earliest of the four Gospels, written primarily for a Jewish audience." },
      { question: "What is the main theme of Matthew?", answer: "Matthew presents Jesus as the long-awaited Messianic King who fulfills Hebrew Scripture prophecy. The Gospel concludes with the Great Commission to preach the Kingdom good news to all nations." },
    ],
  },
  Mark: {
    whyItMattersToday:
      "Mark is the shortest and fastest-paced Gospel — written for a primarily Roman audience, focused on action rather than discourse. For Witnesses today doing field ministry, Mark is the easiest Gospel to share with someone who has limited time: it is direct, vivid, and centered on what Jesus did. The book's emphasis on Jesus as the Son of God who came 'to give his life as a ransom in exchange for many' (Mark 10:45) gives the ransom doctrine — central to JW understanding of salvation — one of its clearest scriptural statements.",
    faqs: [
      { question: "Who wrote the book of Mark?", answer: "John Mark, a close companion of Peter and Paul, wrote the Gospel bearing his name, completing it between 60 and 65 CE in Rome — recording the eyewitness accounts Peter shared with him." },
      { question: "When was the book of Mark written?", answer: "Mark was written between approximately 60 and 65 CE in Rome, primarily for a Roman audience during a period of growing persecution of Christians." },
      { question: "What is the main theme of Mark?", answer: "Mark presents Jesus as the Son of God who came to serve and give his life as a ransom in exchange for many. The Gospel emphasizes action and authority over extended discourse." },
    ],
  },
  Luke: {
    whyItMattersToday:
      "Luke is the most detailed Gospel and the one most concerned with the historicity of the events recorded — opening with an explicit statement that the author 'traced all things from the start with accuracy' (Luke 1:3). For Witnesses defending the historicity of Jesus' life, Luke is the most useful starting point. The book also emphasizes Jesus' compassion for the poor, women, and outsiders — including parables found only in Luke like the Good Samaritan and the Prodigal Son. For Witnesses doing pastoral work or shepherding visits, Luke models Christlike compassion in concrete detail.",
    faqs: [
      { question: "Who wrote the book of Luke?", answer: "Luke the physician, a companion of Paul, wrote the Gospel bearing his name, completing it around 56–58 CE in Caesarea while Paul was imprisoned there." },
      { question: "When was the book of Luke written?", answer: "Luke was written approximately 56–58 CE in Caesarea, drawing on eyewitness interviews and earlier written records to produce the most detailed of the four Gospels." },
      { question: "What is the main theme of Luke?", answer: "Luke presents Jesus as the Son of Man, emphasizing his compassion for the poor, women, and outsiders. The Gospel is the most historically detailed account of Jesus' life and ministry." },
    ],
  },
  John: {
    whyItMattersToday:
      "John is the deepest Gospel theologically and the most directly relevant to JW distinctive teachings. John 1:1's identification of the Word as 'a god' (NWT) — not God Almighty — is foundational for understanding that Jesus is distinct from Jehovah. John 14:28 ('the Father is greater than I am'), John 17:3 (Jehovah as 'the only true God'), and the entire Last Discourse (chapters 13–17) are essential for JW Christology. John is also the Gospel most concerned with belief in Jesus as the path to everlasting life — making it perhaps the most useful Gospel for inviting people to take a personal stand.",
    faqs: [
      { question: "Who wrote the book of John?", answer: "John the apostle, son of Zebedee and the disciple Jesus loved, wrote the Gospel bearing his name, completing it around 98 CE in Ephesus." },
      { question: "When was the book of John written?", answer: "John was written approximately 98 CE in Ephesus, making it the latest of the four Gospels — written long after the other three to address questions about Jesus' identity that had developed in the church." },
      { question: "What is the main theme of John?", answer: "John presents Jesus as the Word who was 'a god' with Jehovah from the beginning and the only-begotten Son sent to save the world. The Gospel emphasizes belief in Jesus as the path to everlasting life." },
    ],
  },
  Acts: {
    whyItMattersToday:
      "Acts is the inspired record of how the first Christian congregation was organized and how the preaching work spread. For Witnesses today, Acts is the operational template for the modern congregation: appointed overseers (Acts 14:23; 20:28), shared ministry by all believers (Acts 8:4), public meetings and house-to-house witness (Acts 5:42; 20:20). The book also documents the courage required to preach when authorities forbid it — exactly the situation Witnesses face under ban in many countries today. The whole book is a sustained argument that nothing stops the Kingdom message from advancing.",
    faqs: [
      { question: "Who wrote the book of Acts?", answer: "Luke the physician wrote Acts as a sequel to his Gospel, completing it around 61 CE in Rome during Paul's first imprisonment there." },
      { question: "When was the book of Acts written?", answer: "Acts was written approximately 61 CE in Rome, covering about 28 years of early Christian history from Jesus' ascension in 33 CE through Paul's first Roman imprisonment." },
      { question: "What is the main theme of Acts?", answer: "Acts records the unstoppable spread of the Kingdom message from Jerusalem to the most distant parts of the earth, the organization of the early congregation, and the courageous preaching of the apostles." },
    ],
  },
  Romans: {
    whyItMattersToday:
      "Romans is Paul's most systematic doctrinal treatment of salvation through faith in Christ. It establishes that all have sinned (Romans 3:23), that we are declared righteous on the basis of Christ's ransom received through faith (Romans 3:24–25), and that nothing can separate Jehovah's loved ones from his love (Romans 8:38–39). For Witnesses today, Romans is essential for understanding the doctrine of declared righteousness and for responding to common misconceptions about works versus faith. Romans 13:1 on submission to 'superior authorities' shapes how Witnesses approach civil obedience.",
    faqs: [
      { question: "Who wrote the book of Romans?", answer: "Paul the apostle wrote Romans, dictating it to Tertius around 56 CE in Corinth before his final trip to Jerusalem." },
      { question: "When was the book of Romans written?", answer: "Romans was written approximately 56 CE in Corinth during Paul's three-month stay there at the end of his third missionary journey." },
      { question: "What is the main theme of Romans?", answer: "Romans is Paul's most systematic exposition of salvation through faith in Christ's ransom — covering universal sin, declared righteousness, freedom from sin, and the unbreakable love of Jehovah for his people." },
    ],
  },
  "1 Corinthians": {
    whyItMattersToday:
      "First Corinthians addresses problems in a congregation troubled by division, immorality, idol-food, marriage questions, and confusion about spiritual gifts and the resurrection. The principles Paul applies are directly relevant today: maintaining unity, exercising discipline, settling disputes within the congregation rather than in courts (1 Corinthians 6:1–7), and the centrality of love (chapter 13). The detailed argument for the resurrection in chapter 15 — 'if Christ has not been raised up, our preaching is certainly in vain' — is foundational for the JW understanding of the hope held out to anointed ones and to the great crowd.",
    faqs: [
      { question: "Who wrote the book of 1 Corinthians?", answer: "Paul the apostle wrote 1 Corinthians around 55 CE in Ephesus during his third missionary journey." },
      { question: "When was the book of 1 Corinthians written?", answer: "First Corinthians was written approximately 55 CE in Ephesus, in response to reports of divisions and immorality in the Corinthian congregation and to written questions they had sent Paul." },
      { question: "What is the main theme of 1 Corinthians?", answer: "First Corinthians addresses congregational divisions, immorality, marriage, idol-food, the Lord's Evening Meal, spiritual gifts, the centrality of love, and the certainty of the resurrection." },
    ],
  },
  "2 Corinthians": {
    whyItMattersToday:
      "Second Corinthians is Paul's most personal letter — a sustained defense of his ministry against opponents who attacked his credentials. For Witnesses today facing similar attacks on theocratic appointments or on the legitimacy of the congregation, Paul models how to respond: with humility, scripture, and personal example rather than self-promotion. The book also contains the most extensive scriptural treatment of generous giving (chapters 8–9) — 'God loves a cheerful giver' (2 Corinthians 9:7) — and the famous reminder that 'we are walking by faith, not by sight' (2 Corinthians 5:7).",
    faqs: [
      { question: "Who wrote the book of 2 Corinthians?", answer: "Paul the apostle wrote 2 Corinthians around 55 CE in Macedonia, shortly after the first letter." },
      { question: "When was the book of 2 Corinthians written?", answer: "Second Corinthians was written approximately 55 CE in Macedonia during Paul's third missionary journey, after he had received Titus' report on the Corinthians' response to the first letter." },
      { question: "What is the main theme of 2 Corinthians?", answer: "Second Corinthians is Paul's defense of his apostolic ministry, his discussion of Christian giving, and his call for the Corinthians to walk by faith and not by sight." },
    ],
  },
  Galatians: {
    whyItMattersToday:
      "Galatians is Paul's strongest defense of justification by faith rather than by Mosaic Law observance. The argument is essential for Witnesses today who must explain why Christians are not under the Law of Moses (including the Sabbath, dietary laws, and circumcision). The 'fruitage of the spirit' list at Galatians 5:22–23 is one of the most cited scriptures in JW publications for personal Christian conduct. Paul's confrontation of Peter at Antioch (Galatians 2:11–14) models how even faithful servants can sometimes need correction — and how to give it scripturally and respectfully.",
    faqs: [
      { question: "Who wrote the book of Galatians?", answer: "Paul the apostle wrote Galatians around 50–52 CE in Syrian Antioch, responding to false teachers who were demanding Mosaic Law observance from Gentile believers." },
      { question: "When was the book of Galatians written?", answer: "Galatians was written approximately 50–52 CE in Syrian Antioch, possibly before the Jerusalem council described in Acts 15, addressing congregations Paul had founded on his first missionary journey." },
      { question: "What is the main theme of Galatians?", answer: "Galatians defends justification by faith in Christ apart from Mosaic Law observance, contrasts the works of the flesh with the fruitage of the spirit, and calls Christians to freedom in Christ." },
    ],
  },
  Ephesians: {
    whyItMattersToday:
      "Ephesians is Paul's grandest exposition of Christ's role as head of the congregation. Its description of the unified body of believers built on apostles and prophets with Christ as cornerstone (Ephesians 2:19–22) shapes how Witnesses understand the congregation today. Chapter 5's instructions on marriage — including the husband's loving headship and the wife's respectful submission — remain the foundation for JW marriage counsel. The 'spiritual armor' of chapter 6 is regularly cited in field service and family worship as the inventory of protection Jehovah provides against spiritual attack.",
    faqs: [
      { question: "Who wrote the book of Ephesians?", answer: "Paul the apostle wrote Ephesians around 60–61 CE during his first imprisonment in Rome." },
      { question: "When was the book of Ephesians written?", answer: "Ephesians was written approximately 60–61 CE in Rome during Paul's first imprisonment, as a circular letter possibly intended for multiple congregations in Asia Minor including Ephesus." },
      { question: "What is the main theme of Ephesians?", answer: "Ephesians describes the unified Christian congregation under Christ the head, the riches of the salvation available through him, and the practical conduct that flows from that calling." },
    ],
  },
  Philippians: {
    whyItMattersToday:
      "Philippians is the most joyful of Paul's letters — written from prison and yet repeatedly calling readers to 'rejoice in the Lord' (Philippians 3:1; 4:4). For Witnesses facing trials, opposition, or congregational difficulties, Philippians models how joy in Jehovah remains accessible regardless of circumstances. The Christological hymn of Philippians 2:5–11 — Christ humbling himself, dying obediently, and being exalted by God — is one of the clearest scriptural arguments that Jesus is not equal to Jehovah but subject to him. Philippians 4:6–7 on the peace of God guarding the heart is one of the most cited scriptures for managing anxiety.",
    faqs: [
      { question: "Who wrote the book of Philippians?", answer: "Paul the apostle wrote Philippians around 60–61 CE during his first imprisonment in Rome, sent to the congregation he had founded at Philippi during his second missionary journey." },
      { question: "When was the book of Philippians written?", answer: "Philippians was written approximately 60–61 CE in Rome during Paul's first imprisonment, thanking the Philippian congregation for their financial support." },
      { question: "What is the main theme of Philippians?", answer: "Philippians calls Christians to rejoice in the Lord under all circumstances, follow Christ's example of humble obedience, and find peace through prayer and right thinking." },
    ],
  },
  Colossians: {
    whyItMattersToday:
      "Colossians is Paul's most concentrated argument for the supremacy of Christ — written to a congregation facing a syncretism of Jewish legalism, Greek philosophy, and angel worship. Colossians 1:15–20 — describing Christ as 'the image of the invisible God, the firstborn of all creation' through whom all other things were created — is essential to JW Christology. For Witnesses today encountering religious confusion that mixes Christianity with other traditions, Colossians is the foundational response: all the fullness dwells in Christ, and nothing needs to be added.",
    faqs: [
      { question: "Who wrote the book of Colossians?", answer: "Paul the apostle wrote Colossians around 60–61 CE during his first imprisonment in Rome." },
      { question: "When was the book of Colossians written?", answer: "Colossians was written approximately 60–61 CE in Rome during Paul's first imprisonment, sent to a congregation Paul had not personally founded but was deeply concerned for." },
      { question: "What is the main theme of Colossians?", answer: "Colossians establishes the supremacy of Christ over all things and warns against mixing Christian faith with Jewish legalism, Greek philosophy, or angel worship." },
    ],
  },
  "1 Thessalonians": {
    whyItMattersToday:
      "First Thessalonians contains essential teaching on the presence of Christ and the resurrection of the dead, including the foundational scripture for the resurrection sequence: 'The Lord himself will descend from heaven with a commanding call, with an archangel's voice and with God's trumpet' (1 Thessalonians 4:16). For Witnesses today, this passage links Christ to Michael the archangel and grounds the resurrection hope. The book also contains practical counsel on Christian conduct, brotherly love, and steady industry that remains directly applicable in any congregation.",
    faqs: [
      { question: "Who wrote the book of 1 Thessalonians?", answer: "Paul the apostle wrote 1 Thessalonians around 50 CE in Corinth during his second missionary journey." },
      { question: "When was the book of 1 Thessalonians written?", answer: "First Thessalonians was written approximately 50 CE in Corinth, making it one of Paul's earliest letters — sent to a congregation he had founded only months earlier." },
      { question: "What is the main theme of 1 Thessalonians?", answer: "First Thessalonians encourages a young congregation through persecution, teaches about the presence of Christ and the resurrection hope, and calls believers to brotherly love and steady industry." },
    ],
  },
  "2 Thessalonians": {
    whyItMattersToday:
      "Second Thessalonians corrects misunderstandings about the day of Jehovah that had unsettled the Thessalonian congregation. The 'man of lawlessness' prophecy (2 Thessalonians 2:3–12) is foundational for JW understanding of apostasy and the rise of false religion. The letter's call for the disorderly to work quietly and eat their own bread (2 Thessalonians 3:10–12) directly addresses Christians who use eschatological excitement as a reason to stop working — a relevant warning for any Witness tempted to neglect practical responsibilities while waiting for Jehovah's day.",
    faqs: [
      { question: "Who wrote the book of 2 Thessalonians?", answer: "Paul the apostle wrote 2 Thessalonians around 51 CE in Corinth, shortly after the first letter." },
      { question: "When was the book of 2 Thessalonians written?", answer: "Second Thessalonians was written approximately 51 CE in Corinth during Paul's second missionary journey, correcting misunderstandings the first letter had unintentionally caused." },
      { question: "What is the main theme of 2 Thessalonians?", answer: "Second Thessalonians corrects misunderstandings about the day of Jehovah, prophesies the 'man of lawlessness,' and calls Christians to steady, productive work while awaiting Christ's presence." },
    ],
  },
  "1 Timothy": {
    whyItMattersToday:
      "First Timothy is the most detailed scriptural treatment of congregation organization and qualifications for overseers and ministerial servants (chapters 3 and 5). For Witnesses today, especially those involved in congregation appointments, the qualifications listed by Paul are the operational standard. The letter also contains essential teaching on prayer for those in authority (1 Timothy 2:1–4), the role of women in the congregation, the danger of love of money (1 Timothy 6:9–10), and the importance of sound teaching. It is the operations manual for the modern congregation.",
    faqs: [
      { question: "Who wrote the book of 1 Timothy?", answer: "Paul the apostle wrote 1 Timothy around 61–64 CE in Macedonia, after his release from his first Roman imprisonment, addressing his protégé Timothy at Ephesus." },
      { question: "When was the book of 1 Timothy written?", answer: "First Timothy was written approximately 61–64 CE in Macedonia, between Paul's first and second Roman imprisonments, instructing Timothy on how to manage the Ephesian congregation." },
      { question: "What is the main theme of 1 Timothy?", answer: "First Timothy establishes the qualifications for overseers and ministerial servants, gives counsel on prayer and congregation conduct, and warns against false teaching and love of money." },
    ],
  },
  "2 Timothy": {
    whyItMattersToday:
      "Second Timothy is Paul's final letter, written from death row in Rome. Its tone is urgent and personal: pass on what you have learned, endure hardship, and trust that 'all Scripture is inspired of God and beneficial' (2 Timothy 3:16–17) — the foundational scripture for the JW understanding of the Bible's inspiration. The prophecy of the 'last days' as 'critical times hard to deal with' (2 Timothy 3:1–5) is one of the most cited descriptions of the present world. For Witnesses serving long and facing fatigue, Paul's final words — 'I have fought the fine fight' — offer the closing model of faithful endurance.",
    faqs: [
      { question: "Who wrote the book of 2 Timothy?", answer: "Paul the apostle wrote 2 Timothy around 65 CE during his second imprisonment in Rome — his final letter before execution." },
      { question: "When was the book of 2 Timothy written?", answer: "Second Timothy was written approximately 65 CE in Rome during Paul's second imprisonment, shortly before his execution under Nero." },
      { question: "What is the main theme of 2 Timothy?", answer: "Second Timothy is Paul's final charge to his protégé to endure hardship, hold to sound teaching, and trust the inspiration of Scripture. It prophesies the difficult conditions of the last days." },
    ],
  },
  Titus: {
    whyItMattersToday:
      "Titus parallels 1 Timothy in giving qualifications for overseers (Titus 1:5–9) and counsel for congregational organization. The letter is short but practically dense: how older men, older women, younger women, younger men, and slaves should conduct themselves. For Witnesses today applying scriptural counsel to relationships across generations in the congregation, Titus is a concentrated reference. The summary of the Christian's hope at Titus 2:11–14 — 'the happy hope and glorious manifestation of the great God and of our Savior, Christ Jesus' — anchors the daily Christian life in eschatological hope.",
    faqs: [
      { question: "Who wrote the book of Titus?", answer: "Paul the apostle wrote Titus around 61–64 CE in Macedonia, between his Roman imprisonments, addressing Titus on the island of Crete." },
      { question: "When was the book of Titus written?", answer: "Titus was written approximately 61–64 CE in Macedonia, contemporary with 1 Timothy, giving Titus instructions for organizing congregations on Crete." },
      { question: "What is the main theme of Titus?", answer: "Titus establishes qualifications for overseers, instructs different age groups in proper Christian conduct, and anchors daily life in the hope of Christ's manifestation." },
    ],
  },
  Philemon: {
    whyItMattersToday:
      "Philemon is Paul's tender request that a slave-owner welcome back a runaway slave who had become a Christian — not just as a slave but as a beloved brother. The letter applies the gospel to a deeply personal social problem without overturning the existing social structure. For Witnesses today, Philemon models how scriptural principles work themselves out through changed hearts and relationships rather than through revolution. The brevity and warmth of the letter also make it a model of Christian correspondence: specific, gracious, scripturally grounded, and aimed at reconciliation.",
    faqs: [
      { question: "Who wrote the book of Philemon?", answer: "Paul the apostle wrote Philemon around 60–61 CE during his first imprisonment in Rome." },
      { question: "When was the book of Philemon written?", answer: "Philemon was written approximately 60–61 CE in Rome during Paul's first imprisonment, sent alongside Colossians to a fellow Christian in Colossae." },
      { question: "What is the main theme of Philemon?", answer: "Philemon is Paul's personal appeal to a slave-owner to receive back his runaway slave — now a Christian — as a beloved brother, applying the gospel to a deeply personal situation." },
    ],
  },
  Hebrews: {
    whyItMattersToday:
      "Hebrews demonstrates Jesus' superiority over every aspect of the Mosaic system — angels, Moses, the Aaronic priesthood, the sacrificial system, and the Mosaic Law itself. For Witnesses today explaining why Christians are not under the Law of Moses, Hebrews is the most comprehensive single source. The 'faith hall of fame' in Hebrews 11 lists the faithful from Abel through the prophets and concludes that they 'all died in faith without having received the promises' — a sustained encouragement for any Witness whose hopes are still future. Hebrews 13:7, 17 on respect for those taking the lead remains foundational for congregational unity.",
    faqs: [
      { question: "Who wrote the book of Hebrews?", answer: "Paul the apostle wrote Hebrews around 61 CE during his first imprisonment in Rome, addressing Jewish Christians who were considering returning to Judaism under persecution." },
      { question: "When was the book of Hebrews written?", answer: "Hebrews was written approximately 61 CE in Rome, before the destruction of Jerusalem's Temple in 70 CE — which would have ended the question by ending the sacrificial system." },
      { question: "What is the main theme of Hebrews?", answer: "Hebrews demonstrates the superiority of Christ over angels, Moses, the Aaronic priesthood, and the sacrificial system — urging Christians to hold firm in faith rather than returning to the Mosaic Law." },
    ],
  },
  James: {
    whyItMattersToday:
      "James is the most practical letter in the Christian Greek Scriptures — the New Testament equivalent of Proverbs. Its insistence that 'faith without works is dead' (James 2:26) is not a contradiction of Paul but a complement: genuine faith always produces visible action. For Witnesses today, James addresses speech, anger, partiality, prayer, patience under trial, and the distinction between worldly and godly wisdom. The book is short, blunt, and immediately convicting. Anyone in the congregation tempted to take spiritual standing for granted should read James as a personal mirror.",
    faqs: [
      { question: "Who wrote the book of James?", answer: "James, the half-brother of Jesus and prominent overseer in the Jerusalem congregation, wrote the letter bearing his name, completing it around 62 CE in Jerusalem." },
      { question: "When was the book of James written?", answer: "James was written approximately 62 CE in Jerusalem, making it likely the earliest of the general letters — addressed to 'the twelve tribes that are scattered abroad,' i.e. Jewish Christians throughout the Roman world." },
      { question: "What is the main theme of James?", answer: "James insists that genuine faith always produces visible works, and addresses speech, partiality, patience under trial, prayer, and the distinction between worldly and godly wisdom." },
    ],
  },
  "1 Peter": {
    whyItMattersToday:
      "First Peter is written to Christians scattered by persecution — exactly the situation Witnesses face in many countries today. Peter's counsel that 'the fiery trial' should not surprise believers (1 Peter 4:12–13), and his reminder that 'humble yourselves under the mighty hand of God, so that he may exalt you in due time' (1 Peter 5:6) anchor faithful endurance. The chapter 3 counsel on submissive wives and considerate husbands continues to shape JW marriage teaching. Peter's call to 'live the rest of your time in the flesh, not for human desires but for God's will' (1 Peter 4:2) is the working summary of every dedicated Christian's life.",
    faqs: [
      { question: "Who wrote the book of 1 Peter?", answer: "Peter the apostle wrote 1 Peter around 62–64 CE from 'Babylon' — likely Babylon on the Euphrates where a large Jewish community lived." },
      { question: "When was the book of 1 Peter written?", answer: "First Peter was written approximately 62–64 CE from Babylon, addressing Christians scattered throughout Asia Minor who were facing increasing persecution." },
      { question: "What is the main theme of 1 Peter?", answer: "First Peter encourages Christians enduring persecution to maintain hope, holiness, and submission to authority, knowing that suffering for righteousness is the path to glory with Christ." },
    ],
  },
  "2 Peter": {
    whyItMattersToday:
      "Second Peter warns against false teachers who would arise within the Christian congregation itself — a prophecy fulfilled throughout the centuries since the apostles' death and increasingly relevant in the modern apostate religious landscape. Peter's promise of 'new heavens and a new earth that we are awaiting according to his promise' (2 Peter 3:13) is foundational to the JW understanding of the future Kingdom. The famous statement that with Jehovah 'one day is as a thousand years and a thousand years as one day' (2 Peter 3:8) shapes the JW handling of prophetic time.",
    faqs: [
      { question: "Who wrote the book of 2 Peter?", answer: "Peter the apostle wrote 2 Peter around 64 CE shortly before his martyrdom, addressing the same general audience as 1 Peter." },
      { question: "When was the book of 2 Peter written?", answer: "Second Peter was written approximately 64 CE, likely from Rome or Babylon, shortly before Peter's death — making it his final letter and farewell warning to the congregations." },
      { question: "What is the main theme of 2 Peter?", answer: "Second Peter warns against false teachers within the congregation, urges spiritual growth, and looks forward to the new heavens and new earth promised at Christ's presence." },
    ],
  },
  "1 John": {
    whyItMattersToday:
      "First John is the warmest of the apostolic letters — written by 'the apostle of love' to assure believers of their relationship with Jehovah and to expose early gnostic-style false teachings about Christ. The book repeatedly affirms tests of genuine faith: walking in the light, loving fellow believers, obeying Jehovah's commandments. The famous statement that 'God is love' (1 John 4:8, 16) is foundational to the JW understanding of Jehovah's character. For Witnesses today wondering whether they are truly in good standing with Jehovah, 1 John provides assurance tied to observable Christian conduct.",
    faqs: [
      { question: "Who wrote the book of 1 John?", answer: "John the apostle, the last surviving apostle, wrote 1 John around 98 CE in Ephesus near the end of his life." },
      { question: "When was the book of 1 John written?", answer: "First John was written approximately 98 CE in Ephesus, addressing congregations in Asia Minor that were being troubled by early gnostic-style false teachings about Christ." },
      { question: "What is the main theme of 1 John?", answer: "First John affirms genuine Christian fellowship through walking in the light, loving fellow believers, and confessing Jesus as the Christ come in the flesh. It famously declares that 'God is love.'" },
    ],
  },
  "2 John": {
    whyItMattersToday:
      "Second John addresses a 'chosen lady' — likely a congregation personified — warning against welcoming false teachers into the home or even greeting them, lest the host become a partaker in their wicked works (2 John 10–11). For Witnesses today, this scripture grounds the policy of not engaging in spiritual discussion with disfellowshipped or apostate persons. The letter also reaffirms the centrality of love and obedience to Jehovah's commandments. Short and sharp, 2 John is a working manual for protecting the congregation from spiritual contamination.",
    faqs: [
      { question: "Who wrote the book of 2 John?", answer: "John the apostle wrote 2 John around 98 CE in Ephesus, contemporary with 1 John and 3 John." },
      { question: "When was the book of 2 John written?", answer: "Second John was written approximately 98 CE in Ephesus, addressed to a 'chosen lady and her children' — likely a congregation personified or a Christian woman of standing and her household." },
      { question: "What is the main theme of 2 John?", answer: "Second John warns against welcoming false teachers — those who deny Christ — into the home or congregation, and reaffirms the central commandments of love and obedience." },
    ],
  },
  "3 John": {
    whyItMattersToday:
      "Third John commends Gaius for showing hospitality to traveling brothers and rebukes Diotrephes for refusing them and trying to dominate the congregation. For Witnesses today, especially those involved in circuit work or hosting visiting brothers, 3 John is the operational scriptural model. The contrast between Gaius (faithful host) and Diotrephes (proud and divisive overseer) sets out the two ways that an overseer can shape the congregation — service or self-promotion. Short and pointed, it remains one of the most personal and practical apostolic letters.",
    faqs: [
      { question: "Who wrote the book of 3 John?", answer: "John the apostle wrote 3 John around 98 CE in Ephesus, contemporary with 1 John and 2 John." },
      { question: "When was the book of 3 John written?", answer: "Third John was written approximately 98 CE in Ephesus, addressed personally to Gaius — likely a respected member of a congregation John was overseeing from a distance." },
      { question: "What is the main theme of 3 John?", answer: "Third John commends hospitality toward traveling Christians (Gaius) and rebukes domineering, divisive overseers (Diotrephes), offering a working model of theocratic versus self-promoting leadership." },
    ],
  },
  Jude: {
    whyItMattersToday:
      "Jude warns Christians to 'put up a hard fight for the faith that was once for all time delivered to the holy ones' (Jude 3) against ungodly persons who had crept into the congregation. The book references Michael the archangel disputing with the Devil over Moses' body (Jude 9) — a key text for JW understanding of Michael's role and identity. For Witnesses today encountering apostate teaching or moral compromise within or near the congregation, Jude is the apostolic call to active spiritual defense. The closing doxology (Jude 24–25) is one of the most beautiful in Scripture.",
    faqs: [
      { question: "Who wrote the book of Jude?", answer: "Jude, the half-brother of Jesus and brother of James, wrote the letter bearing his name, completing it around 65 CE." },
      { question: "When was the book of Jude written?", answer: "Jude was written approximately 65 CE, likely from Palestine, addressing a general Christian audience facing the rise of false teachers and immoral persons within the congregation." },
      { question: "What is the main theme of Jude?", answer: "Jude calls Christians to put up a hard fight for the faith against ungodly persons who had crept into the congregation, and references key Hebrew Scripture examples of judgment and protection." },
    ],
  },
  Revelation: {
    whyItMattersToday:
      "Revelation is the climactic book of the Bible and the most thoroughly used in the JW understanding of the last days, Jehovah's Kingdom, and Armageddon. The visions of the seven seals, seven trumpets, seven plague-bowls, the war against Babylon the Great (false religion), and the millennial reign of Christ are central to JW prophetic interpretation. The new Jerusalem coming down out of heaven and the river of water of life (chapters 21–22) are the visual culmination of every Kingdom promise from Genesis 3:15 onward. For Witnesses today, Revelation is the inspired narrative arc of how Jehovah's name is finally vindicated and his purpose fully accomplished.",
    faqs: [
      { question: "Who wrote the book of Revelation?", answer: "John the apostle wrote Revelation around 96 CE while exiled on the island of Patmos under the emperor Domitian." },
      { question: "When was the book of Revelation written?", answer: "Revelation was written approximately 96 CE on the island of Patmos during John's exile under the persecution of the emperor Domitian — addressed initially to seven congregations in Asia Minor." },
      { question: "What is the main theme of Revelation?", answer: "Revelation reveals Jesus Christ as the conquering King who, with his anointed brothers, brings Jehovah's Kingdom to victory over Satan, false religion, and human governments — climaxing in the new heavens and new earth where Jehovah dwells with his people." },
    ],
  },
};
