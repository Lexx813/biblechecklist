-- ============================================================
-- JW Study — Bible Defense Content Seed
-- Author: Lexx Solutionz (alexx813@gmail.com)
-- Seeds: 18 blog drafts, 18 forum threads, 18 study notes
-- ============================================================

DO $outer$
DECLARE
  v_author uuid := '28abfaf7-ddc0-4f71-9b74-5e412e226607';
  v_cat    uuid;
BEGIN

  -- ── 1. Create Bible Defense forum category ──────────────────
  INSERT INTO forum_categories (name, sort_order)
  VALUES ('Bible Defense', 2)
  RETURNING id INTO v_cat;


  -- ════════════════════════════════════════════════════════════
  -- BLOG POSTS (18 drafts — published = false)
  -- ════════════════════════════════════════════════════════════

  -- 1. The 144,000
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'Who Are the 144,000? What the Bible Really Teaches',
    'who-are-the-144000-bible-study',
    'Revelation 7 describes two distinct groups — 144,000 and a great crowd. Does the Bible teach that everyone goes to heaven, or is there an earthly hope?',
    $c01$
## Two Groups, One Kingdom

Revelation chapter 7 introduces two distinct groups in God's purpose. The first group is precisely numbered: exactly 144,000 (Revelation 7:4). The second group is "a great crowd, which no man was able to number" (Revelation 7:9). The contrast is intentional.

## What Is the Role of the 144,000?

Revelation 5:9-10 answers clearly: "You made them to be a kingdom and priests to our God, and they are to rule as kings **over the earth**." Their role is to reign from heaven *over* a populated earth — not to be the only ones living.

This raises a logical question: kings need subjects. If every faithful person went to heaven, who would the 144,000 rule over?

## The Earth Was Made to Be Inhabited

The Bible is consistent on this point:

📌 **Psalm 37:29** — "The righteous will possess the earth, and they will live forever on it."
📌 **Isaiah 45:18** — God "did not create it simply for nothing, but formed it to be inhabited."
📌 **Matthew 5:5** — "Happy are the mild-tempered, since they will inherit the earth."
📌 **Matthew 6:10** — Jesus taught us to pray for God's will to be done "on earth as it is in heaven."

## Common Questions Answered

**"Doesn't Revelation 14 show the 144,000 on Mount Zion on earth?"**
The heavenly Mount Zion is well-established in scripture (Hebrews 12:22). This is their heavenly position, ruling over the earth below.

**"What about John 6:53-54 — eating Christ's flesh and drinking his blood?"**
Jesus spoke those words a full year before the Last Supper. John 6:40 in the same passage explains the meaning: "exercises faith in him" — it is about faith, not a ceremony with bread and wine.

## Conclusion

Two groups. Two destinations. One Kingdom. This is the consistent picture from Genesis 1:28 (fill the earth) through Revelation 21:3-4 (God dwells with mankind on earth). The 144,000 rule from heaven; the great crowd inherits a paradise earth.

*"Be noble-minded, examine the scriptures." — Acts 17:11*

[nwtprogress.com](https://nwtprogress.com)
    $c01$,
    false, 'en', '{}'::jsonb
  );

  -- 2. Christ's True Identity
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'Christ''s True Identity — What the Bible Really Reveals',
    'christs-true-identity-bible-study',
    'Is Jesus God Almighty, or is he something the Bible describes in specific terms? A careful look at Revelation, Colossians, and Daniel reveals the answer.',
    $c02$
## What Does Jesus Say About Himself?

Jesus does not leave his identity to guesswork. Three key passages establish the foundation:

📌 **Revelation 3:14** — Jesus calls himself "the beginning of the creation of God" — the first thing Jehovah ever created.
📌 **Colossians 1:15** — "the firstborn of all creation" — a being with a beginning, created before everything else.
📌 **John 1:14 / John 3:16** — "the only-begotten Son" — a son proceeds *from* a father; the two are distinct.

## The Morning Star Connection

Revelation 22:16 records Jesus saying: "I am the bright morning star." Job 38:7 uses the same imagery to describe angels at creation: "the morning stars joyfully cried out together." This connects Jesus to the angelic realm before his human birth.

## The Archangel Question

The word *archangel* literally means "chief angel" (Greek: *arkh* = first/chief + *angelos* = angel). The Bible names only one archangel: Michael (Jude 9).

Consider the evidence:

📌 **1 Thessalonians 4:16** — Jesus descends "with an archangel's voice"
📌 **Daniel 12:1** — Michael is "the great prince" who stands for God's people
📌 **Joshua 5:14** — "the prince of Jehovah's army" appears with a drawn sword — same role, same title
📌 **Revelation 12:7** — Michael leads the angels in battle; Revelation 19:14 shows Jesus leading the armies of heaven

## The Angel of Jehovah

Throughout the Hebrew scriptures, a special figure called "the angel of Jehovah" acts with divine authority, speaks as Jehovah, yet is distinct from Jehovah. Early Christian writers, including Justin Martyr, identified this figure as the pre-incarnate Christ. This is consistent with the Bible's picture: Jesus existed before his human birth as a spirit being, serving Jehovah as his chief representative.

## Conclusion

Jesus is not a second Almighty God. He is the only-begotten Son, the first of God's creation, the archangel Michael in his heavenly role — the highest created being, fully authorized by Jehovah, not equal to him.

*"The Father is greater than I am." — John 14:28*

[nwtprogress.com](https://nwtprogress.com)
    $c02$,
    false, 'en', '{}'::jsonb
  );

  -- 3. Stars = Angels
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'Stars = Angels: The Biblical Connection Hiding in Plain Sight',
    'stars-equal-angels-bible-symbolism',
    'When the Bible uses "stars" symbolically, it consistently refers to spirit beings — angels. Understanding this unlocks key passages in Job, Revelation, and Daniel.',
    $c03$
## A Consistent Biblical Symbol

The Bible uses stars as a symbol for angels across multiple books, and once you see it, the pattern is unmistakable.

## The Evidence

📌 **Job 38:7** — When God laid the foundations of the earth, "the morning stars joyfully cried out together, and all the sons of God began shouting in applause." Morning stars = sons of God = angels.

📌 **Revelation 1:20** — Jesus himself interprets the symbol: "The sacred secret of the seven stars that you saw in my right hand... the seven stars mean the angels of the seven congregations."

📌 **Revelation 12:4** — "Its tail drags a third of the stars of heaven, and it hurled them down to the earth." These are the angels who followed Satan in rebellion — not literal astronomical bodies.

📌 **Daniel 8:10** — The "little horn" "caused some of the army and some of the stars to fall to the earth." Same pattern: stars = heavenly beings.

📌 **Isaiah 14:12** — Babylon's king is compared to "the shining one, the son of the dawn" — a symbolic reference rooted in the same star/angel imagery.

## Why It Matters

Understanding this symbol clarifies:

- **Revelation 22:16** — Jesus calls himself "the bright morning star." This connects him to the angelic order (Job 38:7) and identifies him as the chief among them.
- **Revelation 12:4** — Satan did not pull down a third of the physical universe; he led away a third of the angelic host.
- **Jude 13** — False teachers are called "wandering stars" — using the symbol to describe those who left their proper position (like the angels in Jude 6).

## Conclusion

When the Bible says "stars" in a symbolic context, it means spirit beings — angels. This is not speculation; Jesus defines it in Revelation 1:20. Keeping this in mind transforms how we read prophetic passages throughout scripture.

*"Examine the scriptures daily." — Acts 17:11*

[nwtprogress.com](https://nwtprogress.com)
    $c03$,
    false, 'en', '{}'::jsonb
  );

  -- 4. Why the Trinity Is Not Biblical
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'Why the Trinity Is Not Biblical — A Scriptural and Historical Case',
    'why-the-trinity-is-not-biblical',
    'The word "Trinity" never appears in the Bible. Neither does the concept — until the Council of Nicaea in 325 CE. Here is what scripture and history actually show.',
    $c04$
## The Word "Trinity" Is Not in the Bible

This is not a fringe claim. The *Encyclopaedia Britannica* states plainly: "Neither the word Trinity nor the explicit doctrine appears in the New Testament." The *New Catholic Encyclopedia* goes further: "The Trinitarian dogma is in the last analysis a late 4th-century invention."

## What John 1:1 Actually Says

"In the beginning was the Word, and the Word was with God, and the Word was a god." (NWT)

The Greek grammar matters here. The second clause — "the Word was **with** God" — uses the definite article (*ho theos*), identifying this as the one true God. The third clause — "the Word was god/a god" — uses an anarthrous (article-less) *theos*, making it qualitative, not an identity claim.

- Scholar **William Barclay**: "John is not here identifying the Word with God."
- Scholar **Jason BeDuhn**: "The Word is not the one-and-only God, but is a god."

## John 10:30 — "I and the Father Are One"

The Greek word for "one" here is *hen* — neuter gender. It expresses unity, not identity. Jesus uses the exact same word in John 17:21-22 when praying that his disciples may be "one" (*hen*) just as he and the Father are one. This is unity of purpose, not a merger of persons.

## The Council of Nicaea — 325 CE

- Only ~220-318 bishops attended (out of thousands of congregations worldwide)
- Emperor **Constantine** — not yet baptized — called, funded, hosted, and presided over the council
- The key word ***homoousios*** (same substance) does not appear anywhere in scripture
- Only 2 bishops refused to sign; dissenters were immediately exiled
- Constantine was later baptized by an **Arian** bishop — the very position Nicaea condemned

Justin Martyr (110-165 CE), one of the earliest Christian writers, called Christ "another God **under** the Creator" — not a co-equal Trinity member.

## Conclusion

The Trinity is a post-biblical theological development imposed on scripture, not derived from it. Jesus' own words — "The Father is greater than I am" (John 14:28) — are incompatible with co-equality.

*"Do not go beyond the things that are written." — 1 Corinthians 4:6*

[nwtprogress.com](https://nwtprogress.com)
    $c04$,
    false, 'en', '{}'::jsonb
  );

  -- 5. Why Calling Jesus God Dishonors Jehovah
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'Why Calling Jesus God Dishonors Jehovah — What Scripture Says',
    'calling-jesus-god-dishonors-jehovah',
    'Jehovah declares "I am Jehovah, that is my name; I give my glory to no one else." Attributing Almighty God status to Jesus contradicts this divine declaration.',
    $c05$
## Jehovah Will Not Share His Glory

Isaiah 42:8 records one of the most direct statements in all of scripture: "I am Jehovah, that is my name; I give my glory to no one else, nor my praise to graven images."

If Jesus were Jehovah, there would be no "giving" of glory involved — it would already be his. But the consistent testimony of scripture is that the Father bestows authority, glory, and position *upon* Jesus.

## Jesus' Own Words

📌 **John 14:28** — "The Father is greater than I am." Jesus said this, not his opponents.
📌 **John 17:3** — "This means everlasting life, their taking in knowledge of you, the only true God, and of the one whom you sent, Jesus Christ." Two distinct beings: the only true God, and the one he sent.
📌 **Mark 13:32** — "Concerning that day or the hour nobody knows, neither the angels in heaven nor the Son, but only the Father." An omniscient God would not have gaps in knowledge.

## The Sending Relationship

Throughout John's Gospel, Jesus is consistently the *sent one* — the agent of the Father:
- John 3:16 — "God so loved the world that he **gave** his only-begotten Son"
- Acts 5:31 — "God **exalted** this one as Chief Agent and Savior"
- 1 Corinthians 11:3 — "The head of the Christ is God"
- 1 Corinthians 15:28 — "The Son himself will also subject himself to the One who subjected all things to him"

An equal does not get exalted by another equal. An agent is sent by his principal.

## Isaiah 9:6 — "Mighty God"

Some point to Isaiah 9:6, where the Messiah is called *El Gibbor* — "Mighty God." But this is distinct from *El Shaddai* — "God Almighty." Jehovah's own people are called *elohim* (divine beings) in Psalm 82:6. The title reflects Jesus' power and authority as God's chief representative, not that he is Jehovah.

## Conclusion

To call Jesus the Almighty God is to contradict Jesus himself, contradict the prophets, and violate Jehovah's explicit statement that he shares his glory with no one. Honoring Jesus means honoring him as what the Bible says he is: God's unique Son, the Messiah, the highest of all created beings — but not Jehovah himself.

[nwtprogress.com](https://nwtprogress.com)
    $c05$,
    false, 'en', '{}'::jsonb
  );

  -- 6. Hellfire
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'Hellfire — What the Bible Really Teaches About Death and Judgment',
    'hellfire-what-the-bible-really-teaches',
    'Is hell a place of conscious torment that never ends? Or does the Bible teach something else entirely about what happens when we die?',
    $c06$
## What the Bible Says About the Dead

The Bible's teaching on death is consistent across the Old and New Testaments:

📌 **Ecclesiastes 9:5** — "The living know that they will die, but the dead know nothing at all."
📌 **Psalm 146:4** — "His spirit goes out, he returns to the ground; on that very day his thoughts perish."
📌 **Ezekiel 18:4** — "The soul who sins will die." Not burn forever — die.

The dead are not conscious. They are not experiencing anything. Death is a state of non-existence, not a transfer to another location.

## What Is Gehenna?

Jesus referenced Gehenna (translated "hell" in many versions) in passages like Matthew 10:28. But what was Gehenna?

Gehenna was the Valley of Hinnom outside Jerusalem — a garbage dump where refuse and the bodies of executed criminals were burned. It was a symbol of complete destruction, not ongoing torment.

Jeremiah 7:31 records that Jehovah said burning people alive "had not come up into my heart" — a direct statement that eternal fire-torment is contrary to God's character.

## The Lake of Fire

Revelation 20:14 explains itself: "the lake of fire... means the second death." It is not a place of eternal torment. It is the symbol of permanent, irreversible destruction — the "second death" from which there is no resurrection.

## Mark 9:48 and "The Undying Worm"

Mark 9:48 quotes Isaiah 66:24. The original context in Isaiah describes **dead bodies** being consumed, not living people in torment. The worm does not die because there is always more to consume — but the bodies themselves are dead.

## What About 1 John 4:8?

"God is love." A God of love does not torture people without end for sins committed in a brief human lifetime. The doctrine of hellfire is incompatible with God's own self-description.

## Romans 6:23 — The Actual Penalty for Sin

"The wages sin pays is **death**." Not torment — death. This is God's own statement of what sin earns. The good news is that the gift of God is everlasting life through Christ — life, as the counterpart to the death sin earned.

## Conclusion

The Bible teaches that the dead are unconscious (Ecclesiastes 9:5), that sin's penalty is death (Romans 6:23), and that hell/Gehenna represents complete destruction (Revelation 20:14). The resurrection hope — not hellfire — is the Bible's answer to death.

[nwtprogress.com](https://nwtprogress.com)
    $c06$,
    false, 'en', '{}'::jsonb
  );

  -- 7. The Memorial
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'The Memorial — Who Should Partake of the Bread and Wine?',
    'the-memorial-who-should-partake',
    'Jesus instituted the Lord''s Evening Meal for a specific group. Understanding the new covenant and who is in it reveals who the bread and wine are for.',
    $c07$
## John 6 and the Last Supper — Two Different Occasions

A key to understanding the Memorial is recognizing that Jesus' words in John 6:50-54 ("eat my flesh, drink my blood") were spoken approximately **one year before** the Last Supper. They are about exercising faith in him, not a physical ceremony.

John 6:40 — in the same conversation — explains what "eating" means: "Everyone who recognizes the Son and exercises faith in him will have everlasting life." Eating and drinking here is about faith, not a ritual.

## Who Was Present at the Last Supper?

📌 **Luke 22:19-20** — "Keep doing this in remembrance of me" was said to the **11 faithful apostles** — not to all believers in general.
📌 **Luke 22:28-30** — Jesus makes a covenant specifically with those who have "stayed with me in my trials" and promises them thrones in his Kingdom.
📌 **1 Corinthians 11:25** — The cup represents the **new covenant** — a specific legal arrangement, not a universal invitation.

## The New Covenant — Who Is It For?

The new covenant is the arrangement through which the 144,000 are selected to rule with Christ. It is not the same as the earthly hope. Just as the Mosaic covenant was with Israel specifically, the new covenant is with the "Israel of God" — those called to heavenly life (Galatians 6:16; Romans 9:6).

## The High Priest Parallel

Under the Mosaic Law, only the **high priest** could enter the Most Holy on the Day of Atonement. The priests who assisted could not. This illustrates the distinction: those in the new covenant (the 144,000, the "royal priesthood") partake; those with the earthly hope attend as respectful observers.

## The Warnings of 1 Corinthians 11:27-29

Paul's warning that partaking "unworthily" brings judgment is a serious caution. Those who partake must genuinely be in the new covenant — they must have the heavenly calling confirmed by holy spirit (Romans 8:15-16). Partaking without this calling is partaking unworthily.

## Conclusion

The Memorial is one of the most sacred observances for Christians. Understanding who the bread and wine are for — those in the new covenant with heavenly hope — deepens appreciation for both groups: those who partake and those who attend with thankful hearts.

[nwtprogress.com](https://nwtprogress.com)
    $c07$,
    false, 'en', '{}'::jsonb
  );

  -- 8. The Heavenly Calling
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'The Heavenly Calling — What It Is and Who Receives It',
    'the-heavenly-calling-bible-study',
    'Romans 8:15-16 describes a spirit witness that certain individuals are called to heavenly life. What is this calling, and how is it different from the earthly hope?',
    $c08$
## Two Different Destinies

The Bible consistently describes two groups of faithful people with two different destinations: a smaller group with a heavenly calling, and a larger group with an earthly hope.

## The Spirit Witness

📌 **Romans 8:15-16** — "The spirit itself bears witness with our spirit that we are God's children." This is a direct, personal witness from holy spirit — not a church membership or personal decision. Those with the heavenly calling receive this internal confirmation.

📌 **Philippians 3:13-14** — Paul describes his own heavenly calling as a "prize" he is pressing on toward: "the prize of the upward call of God by means of Christ Jesus."

## "Called, Chosen, and Faithful"

Revelation 17:14 describes those who stand with the Lamb as "called and chosen and faithful." The calling comes from God; faithfulness is what maintains it.

## What the Anointed Receive

Those with the heavenly calling are "anointed" — set apart by holy spirit for a specific purpose:

- They will rule as kings and priests over the earth (Revelation 5:9-10)
- They are part of the new covenant (Luke 22:28-30)
- They partake of the bread and wine at the Memorial (1 Corinthians 11:25)
- They are the "little flock" Jesus referred to (Luke 12:32)

## The Earthly Hope Is Real and Beautiful

The heavenly calling does not diminish the earthly hope — it establishes it. Someone has to rule; someone has to be ruled. The great crowd (Revelation 7:9) survives Armageddon and lives in a paradise earth under the Kingdom. This is the fulfillment of God's original purpose (Genesis 1:28; Psalm 37:29).

## Conclusion

The heavenly calling is a specific, spirit-confirmed designation for a limited group. It is not something anyone can claim by personal decision. For the vast majority of faithful people, the hope is an equally beautiful one: everlasting life on a paradise earth under God's Kingdom.

[nwtprogress.com](https://nwtprogress.com)
    $c08$,
    false, 'en', '{}'::jsonb
  );

  -- 9. Miraculous Gifts Were Temporary
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'Were Miraculous Gifts of the Spirit Meant to Be Permanent?',
    'miraculous-gifts-were-temporary-bible-study',
    '1 Corinthians 13 says certain gifts would "be done away with." What purpose did they serve, and what does the Bible say replaced them?',
    $c09$
## The Purpose of Miraculous Gifts

The miraculous gifts of the spirit — tongues, prophecy, healing, interpretation — served a specific purpose in the first century: they authenticated the apostles' message when the Christian scriptures were not yet complete.

📌 **Hebrews 2:3-4** — "How shall we escape if we have neglected so great a salvation? It began to be spoken through the Lord and was verified for us by those who heard him, while God bore witness with them through signs and wonders and various powerful works and distributions of holy spirit according to his will."

The gifts were God's authentication mechanism — miraculous credentials for the early proclamation.

## 1 Corinthians 13:8 — When They Would End

"Love never fails. But if there are gifts of prophecy, they will be done away with; if there are tongues, they will cease; if there is knowledge, it will be done away with. For we have partial knowledge and we prophesy partially, but when the complete arrives, the partial will be done away with."

"When the complete arrives" — once the Christian Greek scriptures were fully written and assembled, the partial revelations through gifts were no longer needed. The complete word of God replaced the fragmentary gifts.

## John 3:8 — The Spirit Moves as It Chooses

Jesus compared the spirit to wind — it moves where it wishes. This is a caution against assuming we can dictate how, when, or through whom the spirit operates. The spirit is not manufactured by human religious ritual.

## What Replaced the Gifts?

The complete Bible — 66 books — replaced the need for ongoing miraculous revelation. 2 Timothy 3:16-17: "All scripture is inspired of God and beneficial for teaching, for reproving, for setting things straight, for disciplining in righteousness, so that the man of God may be fully competent, completely equipped for every good work."

Completely equipped — the word of God provides everything needed.

## Conclusion

Miraculous gifts were a first-century bridge while the canon was incomplete. Their cessation was predicted by scripture itself. Today, God's will is known through his complete word — the Bible.

[nwtprogress.com](https://nwtprogress.com)
    $c09$,
    false, 'en', '{}'::jsonb
  );

  -- 10. Christ Means Anointed
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'Christ Means Anointed — What This Title Reveals About Jesus',
    'christ-means-anointed-bible-study',
    '"Christ" is not a surname. It is a title meaning "Anointed One." Understanding what anointing means in the Bible transforms how we understand Jesus'' role and authority.',
    $c10$
## "Christ" = "Anointed One"

The Greek word *Christos* and the Hebrew *Mashiach* (Messiah) both mean "Anointed One." Anointing in the Bible was the act of pouring oil on someone to designate them for a sacred role — prophet, priest, or king.

📌 **Acts 10:38** — "God anointed him with holy spirit and power." Jesus was anointed by God — the anointing came *from* God, to Jesus. An equal does not anoint an equal in this way.

## Jesus Was Anointed After His Baptism

At Jesus' baptism, "the heavens were opened up, and he saw descending like a dove God's spirit coming upon him. Look! There was a voice from the heavens that said: 'This is my Son, the beloved, whom I have approved.'" (Matthew 3:16-17)

This was the moment of anointing — confirmation of his role as the Christ. Before this, his neighbors knew him as Jesus of Nazareth. From this point forward, he was Jesus the Christ — the Anointed One.

## Those Anointed With Him

Those with the heavenly calling share in Christ's anointing in a derivative sense:

📌 **1 John 2:22** — "Who is the liar but the one who denies that Jesus is the Christ?" Acknowledging Jesus as the Christ is foundational.
📌 **1 Corinthians 3:23** — "You belong to Christ; Christ belongs to God." The chain of authority is clear: anointed ones → Christ → God.
📌 **2 Corinthians 1:21** — "He who guarantees that you and we belong to Christ and who has anointed us is God."

## The Significance of the Title

Every time we use the name "Jesus Christ," we are affirming that Jesus is the Anointed One — the one appointed, authorized, and empowered by God for his role. This is not a philosophical title; it is a declaration of mission and appointment.

## Conclusion

"Christ" is a statement about relationship and authority. Jesus was anointed by God, appointed by God, and authorized by God. He is God's Anointed — not God himself.

[nwtprogress.com](https://nwtprogress.com)
    $c10$,
    false, 'en', '{}'::jsonb
  );

  -- 11. The "Only Savior" Argument Debunked
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'The "Only Savior" Argument — What Isaiah 43:11 Really Teaches',
    'only-savior-argument-isaiah-43-bible-study',
    'Isaiah 43:11 says "besides me there is no savior." Does this make Jesus equal to Jehovah? Or does the Bible use the word "savior" in a broader sense?',
    $c11$
## Isaiah 43:11 — The Source of Salvation

"I am Jehovah, and besides me there is no savior." This is one of the most direct declarations of Jehovah's supremacy in scripture. He is the ultimate source of salvation — no other being can provide it independently.

But does this mean no one else can be called a "savior" in scripture?

## The Bible Calls Others "Savior" Too

📌 **Judges 3:9** — "Jehovah raised up a savior for Israel — Othniel."
📌 **Judges 3:15** — "Jehovah raised up a savior for them — Ehud."
📌 **Nehemiah 9:27** — "You gave them saviors who saved them."
📌 **2 Kings 13:5** — "Jehovah gave Israel a savior, so that they escaped."

In each case, the savior is an agent *appointed by Jehovah* to carry out Jehovah's saving purpose. Jehovah is the source; the human or angelic agent is the instrument.

## Jesus Fits the Same Pattern

📌 **John 3:16** — "God so loved the world that he **gave** his only-begotten Son."
📌 **Acts 5:31** — "God **exalted** this one... as Chief Agent and Savior."
📌 **1 John 4:14** — "The Father has sent the Son as savior of the world."
📌 **Jude 25** — "To the only God our Savior through Jesus Christ our Lord."

Salvation comes from Jehovah, through Jesus. Jesus is the instrument of Jehovah's saving purpose — exactly the pattern of the judges and other human saviors in Israel's history, but on an infinitely greater scale.

## Isaiah 9:6 — "Mighty God"

The Messiah is called *El Gibbor* — "Mighty God" in Isaiah 9:6. But this is distinct from *El Shaddai* — "God Almighty." Psalm 82:6 calls human judges *elohim* (divine beings). The title reflects Jesus' power and delegated authority, not that he is Jehovah himself.

## Conclusion

Isaiah 43:11 is not proof of the Trinity. It establishes Jehovah as the sole *source* of salvation. Jesus is the greatest savior Jehovah ever appointed — through him, all of God's saving purpose is carried out. But the source remains Jehovah, and the agent remains the Son.

[nwtprogress.com](https://nwtprogress.com)
    $c11$,
    false, 'en', '{}'::jsonb
  );

  -- 12. Adonai vs Adoni
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'Adonai vs. Adoni — The Hebrew Distinction That Changes Everything',
    'adonai-vs-adoni-hebrew-distinction-psalm-110',
    'Hebrew has two different words for "lord" — one for God and one for humans. This distinction, lost in Greek translation, is crucial for understanding Psalm 110:1.',
    $c12$
## Two Words for "Lord" in Hebrew

English has one word: "lord." Greek has one word: *kyrios*. But Hebrew has two:

- **Adonai** (אֲדֹנָי) — used exclusively for God. Appears in the Hebrew scriptures hundreds of times as a title for Jehovah.
- **Adoni** (אֲדֹנִי) — used for human lords, masters, and honorable men. Never used for God in the Hebrew scriptures.

## Psalm 110:1 — The Critical Verse

"Jehovah said to my **adoni**: 'Sit at my right hand until I make your enemies a footstool for your feet.'"

The Messiah — David's lord — is called *adoni*, not *adonai*. In Hebrew, this is clear: the Messiah is David's human/exalted lord, but he is distinct from Jehovah (YHWH). The two figures are Jehovah and someone Jehovah addresses.

## The Greek Translation Lost This Distinction

When Psalm 110:1 was translated into Greek (the Septuagint), both YHWH and adoni became *kyrios*. The verse reads: "The Lord [Kyrios] said to my lord [Kyrios]."

Now the distinction is invisible. This is how Trinity arguments get built on Psalm 110:1 — the Hebrew distinction between God and the Messiah was erased in translation.

## How Jesus Used Psalm 110:1

In Matthew 22:41-45, Jesus quotes Psalm 110:1 to challenge the Pharisees: "How is it that David by inspiration calls him Lord [adoni], saying, 'Jehovah said to my Lord [adoni]'? If David calls him Lord, how is he his son?" Jesus used this verse to show his pre-existence and exalted nature — not to claim equality with Jehovah.

## Acts 2:34-36 — Peter's Pentecost Sermon

Peter quotes Psalm 110:1 and concludes: "**God made him both Lord and Christ** — this Jesus whom you killed." The makings matters. God made Jesus Lord. You cannot make someone something they already are. Jesus received his lordship from Jehovah.

## Conclusion

The Hebrew of Psalm 110:1 places a clear distinction between Jehovah and the Messiah. The Trinity argument built on this verse collapses when you read the Hebrew. Jehovah made Jesus Lord — Jesus did not always have this status independently.

[nwtprogress.com](https://nwtprogress.com)
    $c12$,
    false, 'en', '{}'::jsonb
  );

  -- 13. First and Last
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'First and Last — What This Title for Jesus Really Means',
    'first-and-last-what-it-really-means',
    'Revelation 1:17-18 records Jesus saying "I am the First and the Last." Many assume this proves he is Jehovah. But the context tells a completely different story.',
    $c13$
## Revelation 1:17-18 — The Full Context

"Do not be afraid. I am the First and the Last, and the living one, and I became dead, but look! I am living forever and ever, and I have the keys of death and of the Grave."

Two things stand out immediately:

1. "I **became** dead" — Jehovah cannot die. Death is impossible for the Almighty. This verse alone proves Jesus is not Jehovah.
2. "I have the **keys**" — keys are given; they represent delegated authority (compare Matthew 28:18: "All authority has been given to me").

## What "First and Last" Means for Jesus

The title describes a unique position in God's resurrection purpose:

### FIRST:
📌 **Acts 26:23** — Jesus was the "first to be resurrected from the dead" to eternal spirit life
📌 **Colossians 1:18** — "firstborn from the dead"
📌 **1 Corinthians 15:20** — "firstfruits of those who have fallen asleep"
📌 **1 Peter 3:18** — "made alive in the spirit"

Jesus was the first person ever to be resurrected by Jehovah to immortal spirit life. No one before him had ever received that.

### LAST:
📌 **Hebrews 7:27** — he offered himself "once for all time" — the last sacrifice ever needed
📌 **Hebrews 9:26** — "he has manifested himself once for all time at the conclusion of the systems of things to put sin away through the sacrifice of himself"
📌 **Hebrews 10:12** — "he offered one sacrifice for sins for all time"

He was also the last one Jehovah would directly resurrect. All future resurrections will come through him (John 5:21; John 6:40).

## Why This Does Not Make Jesus Equal to Jehovah

Jehovah is called "the First and the Last" in Isaiah 44:6 in reference to his eternal self-existence — he had no beginning and will have no end. Jesus had a beginning (Revelation 3:14; Colossians 1:15) and became dead. These are not the same title with the same meaning.

The title is used for Jesus in a different sense — describing his unique position as the first resurrected to immortal life and the last sacrifice — not claiming equality with Jehovah's eternal nature.

## Conclusion

"I became dead" settles the question. Jehovah is immortal and cannot die. Jesus died, was resurrected, and now holds delegated authority. He is First and Last in his role as the pioneer of resurrection and the final atoning sacrifice — not because he is the eternal Almighty God.

[nwtprogress.com](https://nwtprogress.com)
    $c13$,
    false, 'en', '{}'::jsonb
  );

  -- 14. Abaddon / Angel of the Abyss
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'Abaddon — The Angel of the Abyss Throughout the Bible',
    'abaddon-angel-of-the-abyss-bible-study',
    'Revelation 9:11 names the angel of the abyss "Abaddon" — the Destroyer. Tracing this figure through scripture reveals a consistent identity connecting to Christ.',
    $c14$
## Who Is Abaddon?

Revelation 9:11 introduces "the angel of the abyss" with a name: "In Hebrew *Abaddon*, but in Greek he has the name *Apollyon*" — both meaning "Destroyer."

Revelation 20:1-3 shows this same angel "coming down out of heaven with the key of the abyss... and he seized the dragon, the original serpent, who is the Devil and Satan, and bound him for 1,000 years."

Who holds the keys? Revelation 1:18 — Jesus: "I have the keys of death and of the Grave." The one with the keys is the one who binds Satan.

## The Destroying Angel Through Scripture

This is not a new figure in Revelation — the same being appears throughout the Hebrew scriptures:

📌 **Exodus 12:23** — "the destroyer" passed through Egypt on Passover night — acting on Jehovah's behalf
📌 **2 Samuel 24:16 / 1 Chronicles 21:16** — "the angel of Jehovah" with a drawn sword destroying in Israel
📌 **Joshua 5:14** — "the prince of Jehovah's army" appears with a drawn sword before the battle of Jericho
📌 **Daniel 12:1** — Michael, "the great prince who is standing in behalf of your people"

## The Joshua 5 Connection

When Joshua encountered the prince of Jehovah's army, he was told: "Remove your sandals from your feet, for the place where you are standing is holy." This is the same command Jehovah gave Moses at the burning bush (Exodus 3:5). The same reverence is due.

Daniel calls Michael a "great prince." Joshua's figure is the "prince of Jehovah's army." These are the same being, with the same role — Jehovah's chief military representative.

## Revelation 12 and 19 — The Final Battle

📌 **Revelation 12:7** — "Michael and his angels battled with the dragon."
📌 **Revelation 19:14** — Jesus "leads the armies that were in heaven."

Michael fights at the head of the angelic armies. Jesus leads the armies of heaven. One role. One being.

## Conclusion

From Exodus to Revelation, one figure serves as Jehovah's chief warrior and agent of judgment: first known as the angel of Jehovah, the prince of the army, Michael — and revealed in his fullness as Jesus Christ.

[nwtprogress.com](https://nwtprogress.com)
    $c14$,
    false, 'en', '{}'::jsonb
  );

  -- 15. Council of Nicaea
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'The Council of Nicaea — Politics, Not Scripture',
    'council-of-nicaea-325-ce-politics-not-scripture',
    '325 CE. A Roman emperor convenes a council to settle a theological dispute. What happened at Nicaea, and should it determine Christian belief today?',
    $c15$
## What Was the Council of Nicaea?

In 325 CE, Emperor Constantine convened a council of Christian bishops in Nicaea (modern-day Turkey) to resolve the controversy over the nature of Christ. The debate was between Arius — who taught that Christ was a distinct, created being subordinate to God — and Alexander of Alexandria — who taught a closer unity.

The facts of what happened are instructive:

## The Facts

- Only approximately **220-318 bishops** attended — out of thousands of congregations worldwide. Attendance was far from representative.
- The council was almost entirely Eastern; the Western church was barely represented.
- **Emperor Constantine** — who was not yet baptized — called, funded, hosted, and presided over the proceedings.
- Constantine reportedly called the theological question "insignificant" and was primarily concerned with unity for political stability.
- The key word ***homoousios*** ("same substance") — the central term of the Nicene definition — **does not appear anywhere in scripture**.
- Only **2 bishops** initially refused to sign. All others signed under significant political pressure. Dissenters were immediately exiled.
- Constantine was later baptized by **Eusebius of Nicomedia — an Arian bishop** — the very position Nicaea condemned.
- Arianism flourished for decades after Nicaea; the Trinity only became the law of the empire through the **Edict of Thessalonica in 380 CE**.

## What Scholars and Catholic Sources Admit

- ***New Catholic Encyclopedia***: "The Trinitarian dogma is in the last analysis a late 4th-century invention."
- ***Encyclopaedia Britannica***: "Neither the word Trinity nor the explicit doctrine appears in the New Testament."
- **Justin Martyr** (110-165 CE): Called Christ "another God **under** the Creator" — not co-equal.
- **J.N.D. Kelly**, *Early Christian Doctrines*: "Of a doctrine of the Trinity in the strict sense there is of course no sign."

## The Standard to Apply

The Bereans in Acts 17:11 were commended for examining the scriptures to verify even the apostle Paul's teaching. Nicaea should be held to the same standard: does it reflect scripture, or does it reflect the political pressures of a Roman emperor trying to unify his empire?

## Conclusion

The Trinity is a post-biblical theological development enforced by imperial power, not derived from scripture. The test for true Christian teaching is not what a council decreed in 325 CE — it is what the Bible actually says.

*"Do not go beyond the things that are written." — 1 Corinthians 4:6*

[nwtprogress.com](https://nwtprogress.com)
    $c15$,
    false, 'en', '{}'::jsonb
  );

  -- 16. Blood, 1914, and the Governing Body
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'Blood, 1914, and the Governing Body — Answering the Hard Questions',
    'blood-1914-governing-body-bible-answers',
    'Three of the most common challenges to JW beliefs: the blood doctrine, the 1914 chronology, and the role of the Governing Body. What does scripture actually say?',
    $c16$
## The Blood Question

Acts 15:28-29 records the decision of the first-century governing body: "The holy spirit and we ourselves have favored adding no further burden to you except these necessary things: to keep abstaining from things sacrificed to idols, from blood, from what is strangled, and from sexual immorality."

The command to abstain from blood is rooted in scripture going back to Noah (Genesis 9:4) and reinforced in the Mosaic Law (Leviticus 17:14). The Jerusalem council confirmed it applies to Christians. Blood is life; God reserves it as sacred.

**Proverbs 4:18** addresses how understanding develops: "The path of the righteous is like the bright morning light that grows brighter and brighter until full daylight." Medical understanding of blood fractions has grown. The Governing Body continues to study and refine guidance — this is growth, not inconsistency.

## The 1914 Question

Daniel 4 records Nebuchadnezzar's dream of a great tree cut down for "seven times." This has a secondary prophetic application: the "appointed times of the nations" (Luke 21:24) began when Jerusalem fell in 607 BCE (by Bible chronology). Seven times = 2,520 years. 607 BCE + 2,520 years = 1914 CE.

Whether one accepts this chronology or not, 1914 marks a turning point that even secular historians recognize: the beginning of unprecedented global warfare, the end of old-world order, and events consistent with the sign Jesus gave in Matthew 24.

## The Governing Body

The first-century congregation had a governing body — the Jerusalem council of Acts 15 — that gave direction on matters of doctrine and practice. This was not human invention but divine arrangement (Acts 15:28: "the holy spirit and **we**").

The modern Governing Body follows this pattern: a small group providing scriptural oversight and direction. They do not claim infallibility; they claim to be "faithful and discreet" servants doing their best with the light available (Matthew 24:45-47).

## Conclusion

These three areas — blood, chronology, and organizational structure — have scriptural foundations. Not every detail is beyond question, but the core of each teaching is grounded in God's word. Honest examination of the scriptures themselves is always the right approach.

[nwtprogress.com](https://nwtprogress.com)
    $c16$,
    false, 'en', '{}'::jsonb
  );

  -- 17. When You Disobey Jehovah
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'When You Disobey Jehovah — Lessons From Bible History',
    'when-you-disobey-jehovah-bible-lessons',
    'From Eden to the first century, the Bible records the consistent outcome of those who chose to disobey Jehovah. Their stories are preserved as warnings and lessons for us.',
    $c17$
## The Pattern Is Clear

The Bible is an honest book. It records the failures of well-known figures not to shame them, but to teach us. 1 Corinthians 10:11 says these things "happened to them as examples, and they were written for our instruction."

## Eden to the Flood

**Satan** — the first to rebel. His challenge to God's sovereignty set the issue that all subsequent human history addresses. His end is foretold in Revelation 20:10.

**Adam and Eve** — a perfect couple who chose their own judgment over God's. The result: death entered the human family. Romans 5:12.

**The pre-flood world** — widespread corruption and violence led to the Flood. But "Noah found favor in the eyes of Jehovah" (Genesis 6:8) — obedience preserved life.

## Egypt to the Wilderness

**Pharaoh** — ten plagues, and still he hardened his heart. Exodus 14:28. Pride is a fatal obstacle to obedience.

**Korah, Dathan, and Abiram** — challenged Moses' God-appointed authority. Numbers 16:32: "the earth opened its mouth and swallowed them." Challenging Jehovah's arrangements has direct consequences.

**Balaam** — a prophet who knew better but let greed compromise him. 2 Peter 2:15-16.

**Moses** — even the greatest human leader of his era was denied entry to the Promised Land for a single act of failing to sanctify Jehovah (Numbers 20:12). Jehovah does not show favoritism.

## The Promised Land and the Kings

**Achan** — hid spoils from Jericho, causing Israel to lose their next battle. Joshua 7:25. Hidden sin affects the whole community.

**Saul** — the first king of Israel, removed from kingship for presumptuous disobedience (1 Samuel 15:23: "rebelliousness is as the sin of divination").

**Solomon** — the wisest man who ever lived, turned away in his old age by foreign wives (1 Kings 11:4). Wisdom without ongoing loyalty to Jehovah is insufficient.

## The New Testament

**Ananias and Sapphira** — lied to the holy spirit about money. Acts 5:5,10. The stakes of integrity within the congregation are high.

**Judas** — betrayed the Son of God for 30 pieces of silver. Matthew 26:14-15. The pull of materialism can corrupt even those closest to truth.

## The Lesson

"Therefore, since we have so great a cloud of witnesses surrounding us, let us also throw off every weight and the sin that easily entangles us." — Hebrews 12:1

Every one of these figures had access to truth. Every one had opportunity to obey. The difference between them and Noah, Moses, and the faithful apostles was consistent, humble obedience — not perfect performance, but a willing heart.

[nwtprogress.com](https://nwtprogress.com)
    $c17$,
    false, 'en', '{}'::jsonb
  );

  -- 18. John 10:30 — Hen vs Heis
  INSERT INTO blog_posts (author_id, title, slug, excerpt, content, published, lang, translations)
  VALUES (
    v_author,
    'John 10:30 — "Hen" vs "Heis": One Greek Word That Settles the Trinity Debate',
    'john-10-30-hen-vs-heis-greek-grammar',
    '"I and the Father are one." Does this verse teach that Jesus is God? A single Greek word — and how Jesus himself used it in John 17 — answers the question definitively.',
    $c18$
## The Verse That Gets Quoted Most

John 10:30: "I and the Father are one." This is perhaps the most cited verse in Trinitarian argument. But does it actually claim that Jesus and the Father are the same being?

## The Greek Word: Hen

The Greek word for "one" in John 10:30 is *hen* — the neuter form. Greek has three genders: masculine (*heis*), feminine (*mia*), and neuter (*hen*).

*Heis* (masculine) would indicate one person or being.

*Hen* (neuter) indicates **one thing** — unity of purpose, mind, will, or action. It is not a claim of personal identity.

## How Jesus Used the Same Word in John 17

Just a few chapters later, Jesus prays for his disciples in John 17:21-22:

"That they may all be **one** [*hen*], just as you, Father, are in union with me and I am in union with you, that they also may be in union with us."

Jesus prays that his disciples — fallible, individual human beings — may be *hen* (one) in the same way he and the Father are *hen*. This cannot mean they become one single being. It means unity of purpose and devotion.

John 17:22: "I have given them the glory that you have given me, so that they may be **one** [*hen*] just as we are one."

If John 10:30 proves Jesus is God, then John 17:21 proves the disciples are also God. Neither conclusion is intended. Both use *hen* to mean unified, not identical.

## 1 Corinthians 3:8 — The Same Word Applied to People

"Now he who plants and he who waters are **one** [*hen*]." Paul and Apollos — two distinct people — are called *hen* because of their unified purpose. No one concludes they are the same person.

## What the Jews Understood

The Jews who heard John 10:30 accused Jesus of blasphemy (John 10:33). But notice Jesus' response in 10:34-36: he quotes Psalm 82:6 ("I said you are gods") to show that God himself called humans *elohim*. His defense is not "I am saying I am God" but rather "why are you attacking me for a title given even to humans?"

## Conclusion

*Hen* means unity, not identity. John 10:30 is Jesus claiming unity of purpose and will with his Father — the same unity he prays his disciples will have. Greek grammar settles the question that English translation obscures.

*"Examine the scriptures to see whether these things are so." — Acts 17:11*

[nwtprogress.com](https://nwtprogress.com)
    $c18$,
    false, 'en', '{}'::jsonb
  );


  -- ════════════════════════════════════════════════════════════
  -- FORUM THREADS (18 — in Bible Defense category)
  -- ════════════════════════════════════════════════════════════

  INSERT INTO forum_threads (author_id, category_id, title, content, lang) VALUES

  (v_author, v_cat,
   'What does Revelation 7 really teach about the 144,000 and the great crowd?',
   $f01$
Revelation 7 describes two very different groups. The 144,000 are precisely numbered and sealed; the great crowd is too large to count. Revelation 5:9-10 says the 144,000 rule "over the earth" — which implies a populated earth under their reign.

Questions to consider:
- If everyone faithful goes to heaven, who do the 144,000 rule over?
- What do Psalm 37:29 and Matthew 5:5 tell us about earth's future?
- How do Matthew 6:10 and Revelation 21:3-4 fit together?

Feel free to share your thoughts or scriptures. Let's reason together from the Bible.

Acts 17:11 — nwtprogress.com
   $f01$, 'en'),

  (v_author, v_cat,
   'Is Jesus the archangel Michael? Walking through the scriptural evidence',
   $f02$
The name "Michael" never appears alongside Jesus in the same verse. Yet a consistent pattern emerges when we trace both figures through scripture.

Key connections:
- Jude 9 names only one archangel: Michael
- 1 Thessalonians 4:16 says Jesus descends with an archangel's voice
- Daniel 12:1 — Michael is "the great prince" who stands for God's people
- Joshua 5:14 — "the prince of Jehovah's army" with a drawn sword
- Revelation 12:7 vs. Revelation 19:14 — same commander role

Is identifying Jesus as Michael supported or undermined by these scriptures? What other passages are relevant?

nwtprogress.com
   $f02$, 'en'),

  (v_author, v_cat,
   'Why does the Bible use "stars" to represent angels? Tracing the symbol',
   $f03$
Job 38:7, Revelation 1:20, Revelation 12:4 — the Bible consistently uses "stars" as a symbol for spirit beings. Jesus himself defines this in Revelation 1:20.

This has implications for:
- How we read Revelation 12:4 (Satan drawing a third of the stars)
- Revelation 22:16 (Jesus as the "bright morning star")
- Isaiah 14:12 (the "shining one" symbol)

How does recognizing this symbol change how you read prophetic passages?

nwtprogress.com
   $f03$, 'en'),

  (v_author, v_cat,
   'John 1:1 — Greek grammar and what it actually says about "the Word"',
   $f04$
The Trinity argument from John 1:1 depends on reading "the Word was God" as identity — that the Word is the Almighty God.

But Greek grammar tells a different story. The third clause ("the Word was theos") lacks the definite article — making it qualitative (describing the Word's nature) rather than an identity claim.

Scholars who note this:
- William Barclay: "John is not here identifying the Word with God"
- Jason BeDuhn: the construction means "the Word is a god"

How does the grammar of John 1:1 affect your understanding of the verse? And how does John 17:3 (Jesus calls the Father "the only true God") factor in?

nwtprogress.com
   $f04$, 'en'),

  (v_author, v_cat,
   'John 14:28 — "The Father is greater than I am." How do Trinitarians explain this?',
   $f05$
Jesus said it plainly: "The Father is greater than I am." He also said "the Father is greater than all" (John 10:29). Mark 13:32 records Jesus saying only the Father knows the day and hour — not the Son.

If Jesus is co-equal with the Father, these statements are contradictions. If Jesus is God's Son — a distinct being — they are perfectly natural.

How do you reconcile these verses with the idea of Trinity co-equality? What does the overall pattern of John's Gospel show about the Father-Son relationship?

nwtprogress.com
   $f05$, 'en'),

  (v_author, v_cat,
   'Hellfire: What did Jesus mean by Gehenna, and what is the "second death"?',
   $f06$
The word "hell" in many translations is a translation of three different words: Sheol (Hebrew), Hades (Greek), and Gehenna (Greek). These are not the same thing.

Gehenna was the Valley of Hinnom — a garbage dump outside Jerusalem. Jeremiah 7:31 records Jehovah saying that burning people there "had not come up into my heart."

Key passages:
- Ecclesiastes 9:5 — "the dead know nothing at all"
- Romans 6:23 — sin pays wages of death, not torment
- Revelation 20:14 — lake of fire "means the second death"

Does the Bible actually teach conscious torment after death? What do these passages suggest?

nwtprogress.com
   $f06$, 'en'),

  (v_author, v_cat,
   'Who should partake at the Memorial — and what is the new covenant?',
   $f07$
Luke 22:28-30 records Jesus making a covenant specifically with those who "stayed with me in my trials" and promising them thrones. This is a legal covenant with specific parties.

1 Corinthians 11:25 says the cup "represents the new covenant." Not everyone is in the new covenant — just as the Mosaic covenant was with Israel, not all nations.

Questions:
- John 6:53-54 (eat/drink my flesh/blood) was spoken a year before the Last Supper. Does John 6:40 explain what it means?
- What is the Day of Atonement parallel (only the high priest entering the Most Holy)?
- How does Romans 8:15-16 (the spirit witness) connect to who should partake?

nwtprogress.com
   $f07$, 'en'),

  (v_author, v_cat,
   'The heavenly calling vs. the earthly hope — two different destinies?',
   $f08$
Romans 8:15-16 describes a direct spirit witness: "The spirit itself bears witness with our spirit that we are God's children." This is not a decision made at a meeting — it is a direct confirmation from holy spirit.

The "little flock" of Luke 12:32 is given the Kingdom. The "great crowd" of Revelation 7:9 survives Armageddon on earth. Are these the same group with different names, or two distinct groups?

Philippians 3:14 — Paul calls his calling "the upward call." Not everyone has this call. Revelation 17:14 — those with the Lamb are "called and chosen."

What scriptures indicate these are two genuinely different groups with different hopes?

nwtprogress.com
   $f08$, 'en'),

  (v_author, v_cat,
   '1 Corinthians 13:8 — Did miraculous gifts cease after the first century?',
   $f09$
"If there are gifts of prophecy, they will be done away with; if there are tongues, they will cease." Paul said miraculous gifts were temporary. But when? And why?

The gifts authenticated the apostles' message before the Christian scriptures were complete (Hebrews 2:3-4). Once the canon was sealed, the authenticating function was no longer needed.

2 Timothy 3:16-17 says scripture makes us "fully competent, completely equipped." Is an additional miraculous gift needed if scripture already provides complete equipment?

What do you think the evidence shows about miraculous gifts in the post-apostolic era?

nwtprogress.com
   $f09$, 'en'),

  (v_author, v_cat,
   'What does "Christ" mean, and what does the anointing tell us about Jesus?',
   $f10$
"Christ" = "Anointed One" (Greek Christos). Acts 10:38 says "God anointed him with holy spirit and power." The one who anoints is the one with authority. The one anointed receives that authority.

If Jesus is God, who anointed him? You cannot anoint yourself — anointing comes from a superior.

1 Corinthians 3:23 lays out the chain: "You belong to Christ; Christ belongs to God." And 1 Corinthians 15:28 shows the final arrangement: "The Son himself will also subject himself to the One who subjected all things to him."

What does the concept of anointing reveal about the relationship between Jesus and Jehovah?

nwtprogress.com
   $f10$, 'en'),

  (v_author, v_cat,
   'Isaiah 43:11 says "besides me there is no savior" — but the Bible also calls others saviors',
   $f11$
Isaiah 43:11 — "Besides me there is no savior." This is Jehovah speaking. Many use this verse to argue Jesus must be Jehovah, since Jesus is also called savior.

But examine these verses:
- Judges 3:9 — Jehovah raised up Othniel as a "savior"
- Judges 3:15 — Jehovah raised up Ehud as a "savior"
- Nehemiah 9:27 — God gave them "saviors"
- 2 Kings 13:5 — "Jehovah gave Israel a savior"

The pattern: Jehovah is the source; the savior is the agent he appoints. Jesus fits this same pattern (Acts 5:31: "God exalted this one as savior").

Does the agent argument change how you read Isaiah 43:11? What other scriptures are relevant?

nwtprogress.com
   $f11$, 'en'),

  (v_author, v_cat,
   'Adonai vs Adoni in Psalm 110:1 — why this Hebrew distinction matters',
   $f12$
Psalm 110:1 in Hebrew: "YHWH said to my ADONI..." The Messiah is called *adoni* — the word for human lords — not *adonai* — the word used exclusively for God.

This distinction is invisible in Greek (*kyrios* for both) and English ("Lord" for both). But in Hebrew it is unmistakable.

When Jesus quotes this verse in Matthew 22:41-45, he uses it to show that the Messiah is David's lord — a figure greater than David, yet distinct from Jehovah.

Acts 2:34-36 — Peter quotes the same verse and concludes: "God **made** him both Lord and Christ." You cannot make someone something they already are.

How does the Hebrew distinction in Psalm 110:1 affect the Trinitarian reading of this verse?

nwtprogress.com
   $f12$, 'en'),

  (v_author, v_cat,
   '"I became dead" — why Revelation 1:18 proves Jesus is not Jehovah',
   $f13$
Revelation 1:17-18: "I am the First and the Last, and the living one, and I **became dead**, but look! I am living forever and ever."

Jehovah is immortal — he cannot die (1 Timothy 1:17: "the immortal King"). If Jesus became dead, he cannot be Jehovah.

The "First and Last" title describes Jesus' unique role:
- FIRST resurrected to immortal spirit life (Acts 26:23; Colossians 1:18)
- LAST sacrifice ever needed (Hebrews 7:27; 10:12)

The same title appears for Jehovah in Isaiah 44:6 — but in reference to his eternal self-existence (no beginning, no end). Jesus had a beginning (Revelation 3:14; Colossians 1:15).

Do these two uses of "First and Last" have the same meaning, or different ones?

nwtprogress.com
   $f13$, 'en'),

  (v_author, v_cat,
   'The Angel of Jehovah, Abaddon, Michael — one figure through scripture?',
   $f14$
Revelation 9:11 names the angel of the abyss "Abaddon" (Destroyer). Revelation 20:1-3 shows an angel binding Satan with the key of the abyss. Revelation 1:18 shows Jesus holds those keys.

Following this thread through the Hebrew scriptures:
- Exodus 12:23 — "the destroyer" in Egypt
- Joshua 5:14 — the prince of Jehovah's army with a drawn sword
- Daniel 12:1 — Michael the great prince who stands for God's people
- Revelation 12:7 / 19:14 — same commander role in the final battle

The "remove your sandals" command to Joshua mirrors Moses at the burning bush — signaling the same divine presence.

Do you see one consistent figure across all these passages? What other connections have you noticed?

nwtprogress.com
   $f14$, 'en'),

  (v_author, v_cat,
   'Was the Council of Nicaea (325 CE) a scriptural or political decision?',
   $f15$
In 325 CE, Emperor Constantine — not yet baptized — convened a council in Nicaea to settle the Arian controversy. He called it, funded it, hosted it, and presided over it.

Facts worth knowing:
- The key word *homoousios* (same substance) is not in the Bible
- Constantine was later baptized by an Arian bishop
- Dissenters were immediately exiled
- The Trinity only became law in 380 CE under the Edict of Thessalonica
- New Catholic Encyclopedia: "a late 4th-century invention"

Should the decisions of a politically-driven council in 325 CE define Christian doctrine? How does Acts 17:11 apply?

nwtprogress.com
   $f15$, 'en'),

  (v_author, v_cat,
   'Acts 15:28-29 and the blood doctrine — is abstaining from blood still binding?',
   $f16$
The Jerusalem council (Acts 15:28-29) ruled that Christians must "abstain from blood." This decision was made by holy spirit and the apostles — not a human tradition.

The command has roots going back to Noah (Genesis 9:4) and is reinforced throughout the Mosaic Law (Leviticus 17:14). The Jerusalem council confirmed it for Christians.

Proverbs 4:18 describes how understanding grows: "the path of the righteous is like the bright morning light." Medical knowledge about blood fractions has grown, and the understanding of what "abstaining from blood" means has been refined accordingly.

Is the command to abstain from blood still binding today? What does the full biblical context show?

nwtprogress.com
   $f16$, 'en'),

  (v_author, v_cat,
   'What can we learn from biblical figures who disobeyed Jehovah?',
   $f17$
1 Corinthians 10:11 says the stories of ancient Israel "were written for our instruction." The Bible is remarkably honest about the failures of famous people.

From Eden to the first century, we see a consistent pattern: those who put their judgment above Jehovah's instruction suffered consequences. Those who humbly obeyed — even imperfectly — found mercy and life.

Some to consider:
- Korah challenged God-appointed authority (Numbers 16)
- Moses was denied the Promised Land for one act of failing to sanctify Jehovah (Numbers 20:12)
- Solomon turned away in his old age despite receiving exceptional wisdom
- Ananias and Sapphira lied to holy spirit about money (Acts 5)

Which of these accounts stands out most to you? What specific lesson does it hold for us today?

nwtprogress.com
   $f17$, 'en'),

  (v_author, v_cat,
   'John 10:30 — "hen" (neuter) vs "heis" (masculine): why the Greek word matters',
   $f18$
"I and the Father are one." The Greek word is *hen* — neuter gender. If Jesus were claiming to be the same being as the Father, the masculine *heis* would be expected.

John 17:21-22 uses the exact same word *hen* when Jesus prays that his disciples "may all be one [hen]... just as we are one." No one concludes the disciples become God. The word means unified, not identical.

1 Corinthians 3:8 calls Paul and Apollos *hen* — "one" — because they share a purpose. Two distinct individuals described as unified.

How does understanding *hen* vs *heis* change how you read John 10:30? Are there other passages that support or complicate this reading?

nwtprogress.com
   $f18$, 'en');


  -- ════════════════════════════════════════════════════════════
  -- STUDY NOTES (18 — public reference notes)
  -- ════════════════════════════════════════════════════════════

  INSERT INTO study_notes (user_id, title, content, tags, is_public) VALUES

  (v_author,
   'The 144,000 — Key Scriptures & Arguments',
   $n01$
## The 144,000 — Quick Reference

**Key Scriptures:**
- Rev 7:4 — precisely 144,000 sealed
- Rev 7:9 — great crowd, uncountable, from all nations
- Rev 5:9-10 — they rule as kings "over the earth"
- Psalm 37:29 — righteous live forever ON EARTH
- Isaiah 45:18 — earth created to be inhabited
- Matthew 5:5 — meek inherit the earth
- Matthew 6:10 — God's will on earth as in heaven

**Core Argument:**
Two groups. Two destinations. Kings in heaven need subjects on earth. The earthly hope is not a lesser hope — it is the fulfillment of Genesis 1:28.

**Common Objection:**
"John 6:53-54 says you must eat/drink Christ's flesh/blood."
→ Spoken 1 year before Last Supper. John 6:40 explains: "exercises faith in him." About faith, not a ceremony.

*Acts 17:11 | nwtprogress.com*
   $n01$,
   ARRAY['144000', 'great-crowd', 'earthly-hope', 'revelation', 'kingdom'],
   true),

  (v_author,
   'Christ''s True Identity — Key Scriptures & Arguments',
   $n02$
## Christ's True Identity — Quick Reference

**Key Scriptures:**
- Rev 3:14 — "the beginning of the creation of God"
- Col 1:15 — "firstborn of all creation"
- John 1:14; 3:16 — "only-begotten Son"
- Rev 22:16 — "the bright morning star"
- Job 38:7 — morning stars = angels at creation
- 1 Thess 4:16 — Jesus descends with archangel's voice
- Jude 9 — only one archangel: Michael
- Dan 12:1; Josh 5:14 — Michael = great prince of Jehovah's army
- Rev 12:7 / 19:14 — Michael/Jesus leads heavenly armies

**Core Argument:**
Jesus is the firstborn of creation — the archangel Michael before his human birth. He is Jehovah's chief representative, not a second Almighty God.

**Key Quote (Justin Martyr, 110-165 CE):**
"Another God under the Creator"

*Acts 17:11 | nwtprogress.com*
   $n02$,
   ARRAY['jesus-identity', 'archangel', 'michael', 'firstborn', 'morning-star'],
   true),

  (v_author,
   'Stars = Angels — Biblical Symbol Reference',
   $n03$
## Stars = Angels — Quick Reference

**Key Scriptures:**
- Job 38:7 — "morning stars" = "sons of God" = angels at creation
- Rev 1:20 — Jesus defines: "seven stars mean the angels"
- Rev 12:4 — Satan drew 1/3 of stars (angels) with him
- Dan 8:10 — stars = heavenly beings cast down
- Isa 14:12 — "shining one, son of the dawn" — fallen angel symbolism
- Rev 22:16 — Jesus = "bright morning star" → angelic order

**Core Argument:**
When the Bible uses "stars" symbolically, it consistently refers to spirit beings. Jesus himself defines this in Rev 1:20. This unlocks Revelation's imagery throughout.

*Acts 17:11 | nwtprogress.com*
   $n03$,
   ARRAY['angels', 'stars', 'revelation', 'symbolism', 'michael'],
   true),

  (v_author,
   'Why the Trinity Is Not Biblical — Key Scriptures & Arguments',
   $n04$
## Trinity — Quick Reference

**Key Scriptures:**
- John 1:1 — anarthrous theos = qualitative, not identity
- John 10:30 — hen (neuter) = unity of purpose, not persons
- John 17:21-22 — same hen word for disciples
- John 14:28 — "The Father is greater than I am"
- Mark 13:32 — Son does not know the hour; only Father does
- 1 Cor 15:28 — Son subjects himself to the Father

**Historical Facts:**
- No Trinity before Council of Nicaea 325 CE
- Constantine (unbaptized) presided; *homoousios* not in scripture
- New Catholic Encyclopedia: "late 4th-century invention"
- Justin Martyr (110-165 CE): Christ is "another God UNDER the Creator"

**Scholar Quotes:**
- Barclay: "John is not identifying the Word with God"
- BeDuhn: "the Word is not the one-and-only God, but is a god"

*Acts 17:11 | nwtprogress.com*
   $n04$,
   ARRAY['trinity', 'john-1-1', 'nicaea', 'greek-grammar', 'jesus-identity'],
   true),

  (v_author,
   'Calling Jesus God Dishonors Jehovah — Key Scriptures',
   $n05$
## Jesus Is Not Jehovah — Quick Reference

**Key Scriptures:**
- Isa 42:8 — "I give my glory to no one else"
- John 14:28 — "The Father is greater than I am"
- John 17:3 — "you, the only true God, and... Jesus Christ"
- Mark 13:32 — Son does not know the hour
- Acts 5:31 — God exalted Jesus as savior
- 1 Cor 11:3 — "head of the Christ is God"
- 1 Cor 15:28 — Son subjects himself to the Father

**Core Argument:**
An equal is not exalted by an equal. A sent one is sent by a sender. An anointed one is anointed by a superior. Every verb used of Jesus' relationship to the Father (sent, given, exalted, anointed) implies distinction.

*Acts 17:11 | nwtprogress.com*
   $n05$,
   ARRAY['jesus-identity', 'jehovah', 'trinity', 'glory', 'father-son'],
   true),

  (v_author,
   'Hellfire — What the Bible Really Teaches — Key Scriptures',
   $n06$
## Hellfire — Quick Reference

**Key Scriptures:**
- Ecc 9:5 — "the dead know nothing at all"
- Psalm 146:4 — "his thoughts perish"
- Eze 18:4 — "the soul who sins will die"
- Matt 10:28 — God destroys both soul AND body in Gehenna
- Rev 20:14 — lake of fire = "the second death"
- Mark 9:48 → Isa 66:24 — dead BODIES not living people
- Romans 6:23 — wages of sin = DEATH, not torment
- Jer 7:31 — burning people "had not come up into God's heart"
- 1 John 4:8 — "God is love"

**What Is Gehenna?**
Valley of Hinnom — garbage dump outside Jerusalem. Symbol of total destruction, not ongoing torment.

**What Is the Second Death?**
Permanent, irreversible destruction. No resurrection from it. Not a burning room.

*Acts 17:11 | nwtprogress.com*
   $n06$,
   ARRAY['hellfire', 'gehenna', 'death', 'soul', 'second-death', 'resurrection'],
   true),

  (v_author,
   'The Memorial — Who Should Partake? Key Scriptures',
   $n07$
## The Memorial — Quick Reference

**Key Scriptures:**
- John 6:50-54 — spoken 1 YEAR before Last Supper; about faith
- John 6:40 — "exercises faith" = what eating/drinking means here
- Luke 22:19-20 — "keep doing this" said to 11 apostles
- Luke 22:28-30 — Kingdom covenant with specific group
- 1 Cor 11:25 — cup = new covenant (not universal)
- 1 Cor 11:27-29 — partaking unworthily brings judgment
- Rom 8:15-16 — spirit witness confirms heavenly calling

**Day of Atonement Parallel:**
Only the high priest entered the Most Holy. The other priests assisted outside. The 144,000 (royal priesthood) partake; the great crowd attends as observers.

*Acts 17:11 | nwtprogress.com*
   $n07$,
   ARRAY['memorial', 'new-covenant', 'partake', '144000', 'heavenly-calling'],
   true),

  (v_author,
   'The Heavenly Calling — Key Scriptures',
   $n08$
## The Heavenly Calling — Quick Reference

**Key Scriptures:**
- Rom 8:15-16 — spirit bears witness (direct confirmation)
- Phil 3:13-14 — "upward call of God"
- Rev 17:14 — "called and chosen and faithful"
- Luke 12:32 — "little flock" receives the Kingdom
- Rev 7:9 — great crowd, earthly hope
- Gal 6:16 — "Israel of God" = anointed ones

**The Spirit Witness:**
Not a personal decision or church tradition. A direct internal confirmation by holy spirit that the individual is called to heavenly life. Romans 8:15-16.

**Two Groups:**
- 144,000 → heavenly calling → rule with Christ
- Great crowd → earthly hope → live in paradise

*Acts 17:11 | nwtprogress.com*
   $n08$,
   ARRAY['heavenly-calling', 'anointed', '144000', 'great-crowd', 'holy-spirit'],
   true),

  (v_author,
   'Miraculous Gifts Were Temporary — Key Scriptures',
   $n09$
## Miraculous Gifts — Quick Reference

**Key Scriptures:**
- 1 Cor 13:8 — gifts "will be done away with"
- Heb 2:3-4 — gifts authenticated apostles' message
- 2 Tim 3:16-17 — scripture makes us "fully competent"
- John 3:8 — spirit moves where it chooses (not manufactured)
- Acts 19:6 — gifts in early church era
- Gal 3:5 — gifts connected to early preaching confirmation

**Why They Were Temporary:**
Gifts served as God's authentication while the Christian canon was being completed. Once scripture was complete ("the perfect/complete" of 1 Cor 13:10), the fragmentary gifts were no longer needed.

**What Replaced Them:**
The complete Bible — 66 books — provides everything needed (2 Tim 3:17).

*Acts 17:11 | nwtprogress.com*
   $n09$,
   ARRAY['holy-spirit', 'gifts', 'tongues', 'prophecy', 'first-century'],
   true),

  (v_author,
   'Christ Means Anointed — Key Scriptures',
   $n10$
## Christ = Anointed One — Quick Reference

**Key Scriptures:**
- Acts 10:38 — God ANOINTED him with holy spirit and power
- Matt 3:16-17 — anointing at baptism; "my Son, the beloved"
- 1 John 2:22 — denying Jesus is the Christ = the great lie
- 1 Cor 3:23 — "you belong to Christ; Christ belongs to God"
- 1 Cor 15:28 — Son subjects himself to the Father
- 2 Cor 1:21 — "God has anointed us"

**Core Argument:**
Anointing flows from superior to subordinate. "Christ" (Anointed One) declares that Jesus received his authority and mission from Jehovah. He is not the one who anoints — he is the one who was anointed.

*Acts 17:11 | nwtprogress.com*
   $n10$,
   ARRAY['christ', 'anointed', 'jesus-identity', 'jehovah', 'authority'],
   true),

  (v_author,
   '"Only Savior" Argument Debunked — Key Scriptures',
   $n11$
## Only Savior — Quick Reference

**Isaiah 43:11:** Jehovah is the SOURCE of salvation.
But "savior" in the Bible applies to agents Jehovah appoints:

- Judges 3:9 — Othniel called a "savior"
- Judges 3:15 — Ehud called a "savior"
- Neh 9:27 — God gave multiple "saviors"
- 2 Kings 13:5 — Jehovah gave Israel a "savior"

**Jesus as Agent:**
- John 3:16 — God GAVE his Son
- Acts 5:31 — God EXALTED Jesus as savior
- 1 John 4:14 — Father SENT Son as savior
- Jude 25 — salvation from God THROUGH Jesus

**Isaiah 9:6:** El Gibbor (Mighty God) ≠ El Shaddai (God Almighty)
Psalm 82:6 — even human judges called *elohim*

*Acts 17:11 | nwtprogress.com*
   $n11$,
   ARRAY['salvation', 'savior', 'isaiah-43', 'jesus-identity', 'jehovah'],
   true),

  (v_author,
   'Adonai vs Adoni — Hebrew Distinction Reference',
   $n12$
## Adonai vs Adoni — Quick Reference

**The Two Hebrew Words:**
- **Adonai** (אֲדֹנָי) = title for God exclusively
- **Adoni** (אֲדֹנִי) = title for human lords / honorable men

**Psalm 110:1:** "YHWH said to my **ADONI**"
→ The Messiah is called *adoni* (human lord) NOT *adonai* (God)

**The Greek Problem:**
Greek *kyrios* = both Adonai AND Adoni
→ Hebrew distinction disappears in translation
→ Trinitarian arguments built on the lost distinction

**Key Applications:**
- Matt 22:41-45 — Jesus quotes Ps 110:1 to show his pre-existence
- Acts 2:34-36 — "God MADE him Lord and Christ" (made = not always was)
- Heb 1:13 — Father says to Son: "Sit at my right hand"

*Acts 17:11 | nwtprogress.com*
   $n12$,
   ARRAY['adonai', 'adoni', 'hebrew', 'psalm-110', 'greek', 'lord'],
   true),

  (v_author,
   'First and Last — What It Really Means for Jesus',
   $n13$
## First and Last — Quick Reference

**Revelation 1:17-18:** "I became dead" — Jehovah CANNOT die (1 Tim 1:17)
→ Jesus cannot be Jehovah

**"First" = First resurrected to immortal spirit life:**
- Acts 26:23 — firstborn from the dead
- Col 1:18 — firstborn from the dead
- 1 Cor 15:20 — firstfruits of the dead
- 1 Peter 3:18 — made alive in the spirit

**"Last" = Last sacrifice ever needed + last Jehovah directly resurrected:**
- Heb 7:27 — "once for all time"
- Heb 9:26 — offered once at conclusion of the ages
- Heb 10:12 — "one sacrifice for sins for all time"
- All future resurrections through Jesus (John 5:21; 6:40)

**Rev 1:18 — Keys are GIVEN = delegated authority**
**Compare Isa 44:6 — Jehovah's "First and Last" = eternal self-existence (no beginning/end)**

*Acts 17:11 | nwtprogress.com*
   $n13$,
   ARRAY['first-and-last', 'resurrection', 'sacrifice', 'jesus-identity', 'revelation'],
   true),

  (v_author,
   'Abaddon / Angel of the Abyss — Scriptural Trail',
   $n14$
## Abaddon — Quick Reference

**Rev 9:11:** Angel of abyss = Abaddon/Apollyon (Destroyer)
**Rev 20:1-3:** Angel with KEY binds Satan
**Rev 1:18:** Jesus holds the KEYS

**Trail Through Hebrew Scriptures:**
- Exod 12:23 — "the destroyer" in Egypt
- 2 Sam 24:16 / 1 Chron 21:16 — angel of Jehovah with drawn sword
- Josh 5:14 — prince of Jehovah's army with drawn sword
- Josh 5:15 — "remove your sandals" (same as Moses at burning bush)
- Dan 12:1 — Michael = "great prince" standing for God's people
- Rev 12:7 — Michael leads angelic armies
- Rev 19:14 — Jesus leads armies of heaven

**One Figure:**
Angel of Jehovah → Abaddon/Destroyer → Michael → Jesus Christ

*Acts 17:11 | nwtprogress.com*
   $n14$,
   ARRAY['abaddon', 'michael', 'angel-of-jehovah', 'destroyer', 'revelation'],
   true),

  (v_author,
   'Council of Nicaea — Facts & Sources',
   $n15$
## Nicaea 325 CE — Quick Reference

**Key Facts:**
- ~220-318 bishops attended (thousands of congregations existed)
- Almost entirely Eastern church; West barely represented
- Constantine (unbaptized) called, funded, hosted, presided
- *Homoousios* = NOT in scripture
- Only 2 bishops refused; dissenters immediately exiled
- Constantine later baptized by ARIAN bishop Eusebius of Nicomedia
- Trinity only became law under Edict of Thessalonica — 380 CE

**Scholar/Source Admissions:**
- New Catholic Encyclopedia: "late 4th-century invention"
- Encyclopaedia Britannica: "Neither Trinity nor doctrine in NT"
- J.N.D. Kelly: "No doctrine of Trinity in the strict sense"
- Darrell Hannah: early Christians used Michael traditions for Christ
- Justin Martyr (110-165 CE): Christ = "another God UNDER the Creator"

**Protestant Reformers who identified Michael with Christ:**
Luther, Calvin, Melanchthon, Spurgeon, Isaac Watts, John Gill

*Acts 17:11 | nwtprogress.com*
   $n15$,
   ARRAY['nicaea', 'constantine', 'trinity', '325-ce', 'history', 'homoousios'],
   true),

  (v_author,
   'Blood, 1914, and the Governing Body — Key Scriptures',
   $n16$
## Blood / 1914 / GB — Quick Reference

**Blood:**
- Gen 9:4 — abstain from blood (Noah's time)
- Lev 17:14 — blood is sacred, Mosaic Law
- Acts 15:28-29 — Jerusalem council confirms for Christians
- Prov 4:18 — "path of righteous grows brighter" = progressive understanding

**1914 (Daniel 4 chronology):**
- Luke 21:24 — "appointed times of the nations"
- Dan 4 — "seven times" = 2,520 years
- 607 BCE + 2,520 = 1914 CE
- Matt 24 — signs consistent with 1914 onward

**Governing Body:**
- Acts 15 — first-century governing body (Jerusalem council)
- Acts 15:28 — "holy spirit AND we" = divine + human arrangement
- Matt 24:45-47 — "faithful and discreet slave"
- Not infallible; claim faithfulness not perfection

*Acts 17:11 | nwtprogress.com*
   $n16$,
   ARRAY['blood', '1914', 'governing-body', 'daniel', 'acts-15', 'progressive-truth'],
   true),

  (v_author,
   'When You Disobey Jehovah — Biblical Examples Reference',
   $n17$
## Disobedience Series — Quick Reference

**1 Corinthians 10:11:** "Written for our instruction"

**Eden → Flood:**
- Satan (Rev 20:10), Adam/Eve (Rom 5:12), Cain (Gen 4:8), fallen angels (Jude 6)

**Egypt → Wilderness:**
- Pharaoh (Exod 14:28), Golden calf (Exod 32), Nadab/Abihu (Lev 10:1-2)
- Korah (Num 16:32), Moses (Num 20:12), Balaam (2 Pet 2:15-16)

**Promised Land:**
- Achan (Josh 7:25), Samson (Judges 16), Eli's sons (1 Sam 2:34)

**The Kings:**
- Saul (1 Sam 15:23), Solomon (1 Kings 11:4), Ahab/Jezebel (1 Kings 21)

**New Testament:**
- Ananias/Sapphira (Acts 5:5,10), Judas (Matt 26:14-15), Herod (Acts 12:23)

**Common Thread:** All had access to truth. Pride, greed, or fear overrode obedience.

**Lesson:** Hebrews 12:1 — "throw off every weight and the sin that easily entangles us"

*Acts 17:11 | nwtprogress.com*
   $n17$,
   ARRAY['disobedience', 'bible-examples', 'korah', 'balaam', 'warning', 'history'],
   true),

  (v_author,
   'John 10:30 — Hen vs Heis Greek Grammar Reference',
   $n18$
## Hen vs Heis — Quick Reference

**John 10:30:** "I and the Father are one [*hen*]"
- *Hen* = neuter gender = unity of purpose/will
- *Heis* = masculine = one individual/person

**If Jesus claimed to BE the Father, he would use *heis*. He used *hen*.**

**John 17:21-22:** Same word *hen* for disciples:
"That they may all be *one* [hen] just as you Father are in union with me"
→ Disciples are not God. *Hen* = unified, not identical.

**1 Corinthians 3:8:**
"He who plants and he who waters are *one* [hen]"
→ Paul + Apollos = two people described as *hen* (unified purpose)

**What the Jews Understood:**
They accused Jesus of blasphemy (John 10:33).
Jesus responded by quoting Psalm 82:6 — God called humans *elohim*.
His defense is NOT "I am God" but "even humans receive divine titles."

**Parallel: Acts 2:34-36**
"God MADE him Lord" — made = received, not eternally possessed

*Acts 17:11 | nwtprogress.com*
   $n18$,
   ARRAY['john-10-30', 'greek-grammar', 'hen', 'heis', 'trinity', 'unity'],
   true);

END $outer$;
