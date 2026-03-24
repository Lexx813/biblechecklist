-- ============================================================
-- Bible Quiz System Migration
-- ============================================================

-- 1. quiz_questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level         int NOT NULL CHECK (level BETWEEN 1 AND 12),
  question      text NOT NULL,
  options       jsonb NOT NULL,  -- array of 4 strings
  correct_index int NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. user_quiz_progress table
CREATE TABLE IF NOT EXISTS public.user_quiz_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level        int NOT NULL CHECK (level BETWEEN 1 AND 12),
  unlocked     bool NOT NULL DEFAULT false,
  badge_earned bool NOT NULL DEFAULT false,
  best_score   int NOT NULL DEFAULT 0,
  attempts     int NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, level)
);

-- 3. Row-Level Security

ALTER TABLE public.quiz_questions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_progress ENABLE ROW LEVEL SECURITY;

-- quiz_questions: public read (no auth required)
CREATE POLICY "quiz_questions_public_read"
  ON public.quiz_questions FOR SELECT
  USING (true);

-- user_quiz_progress: authenticated users read/write their own rows
CREATE POLICY "user_quiz_progress_select_own"
  ON public.user_quiz_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_quiz_progress_insert_own"
  ON public.user_quiz_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_quiz_progress_update_own"
  ON public.user_quiz_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. RPC: submit_quiz_result
CREATE OR REPLACE FUNCTION public.submit_quiz_result(
  p_user_id uuid,
  p_level   int,
  p_score   int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_score  int := 0;
  v_new_best        int;
  v_badge_earned    bool := false;
  v_next_unlocked   bool := false;
BEGIN
  -- Get existing best score if any
  SELECT best_score INTO v_existing_score
  FROM public.user_quiz_progress
  WHERE user_id = p_user_id AND level = p_level;

  v_new_best := GREATEST(COALESCE(v_existing_score, 0), p_score);

  -- Determine badge
  IF p_score = 10 THEN
    v_badge_earned := true;
  END IF;

  -- Upsert current level row
  INSERT INTO public.user_quiz_progress (user_id, level, unlocked, badge_earned, best_score, attempts, updated_at)
  VALUES (p_user_id, p_level, true, v_badge_earned, v_new_best, 1, now())
  ON CONFLICT (user_id, level) DO UPDATE SET
    best_score   = v_new_best,
    badge_earned = CASE WHEN p_score = 10 THEN true ELSE user_quiz_progress.badge_earned END,
    attempts     = user_quiz_progress.attempts + 1,
    updated_at   = now();

  -- Unlock next level only on a perfect score
  IF p_level < 12 AND p_score = 10 THEN
    INSERT INTO public.user_quiz_progress (user_id, level, unlocked, badge_earned, best_score, attempts, updated_at)
    VALUES (p_user_id, p_level + 1, true, false, 0, 0, now())
    ON CONFLICT (user_id, level) DO UPDATE SET
      unlocked   = true,
      updated_at = now();
    v_next_unlocked := true;
  END IF;

  RETURN jsonb_build_object(
    'badge_earned',   v_badge_earned,
    'next_unlocked',  v_next_unlocked
  );
END;
$$;

-- 5. Questions — 240 total (20 per level)

INSERT INTO public.quiz_questions (level, question, options, correct_index) VALUES

-- LEVEL 1: Bible Basics
(1, 'How many books are in the Bible?', '["39","66","73","27"]', 1),
(1, 'How many books are in the Old Testament?', '["27","33","39","46"]', 2),
(1, 'How many books are in the New Testament?', '["21","27","33","39"]', 1),
(1, 'What is the first book of the Bible?', '["Exodus","Psalms","Genesis","Matthew"]', 2),
(1, 'What is the last book of the Bible?', '["Jude","Hebrews","Acts","Revelation"]', 3),
(1, 'What is the first book of the New Testament?', '["Mark","Luke","John","Matthew"]', 3),
(1, 'What is the last book of the Old Testament?', '["Zechariah","Micah","Malachi","Nahum"]', 2),
(1, 'How many Psalms are there?', '["100","120","150","175"]', 2),
(1, 'What language was most of the Old Testament written in?', '["Latin","Greek","Aramaic","Hebrew"]', 3),
(1, 'What language was the New Testament written in?', '["Latin","Hebrew","Greek","Aramaic"]', 2),
(1, 'Which book of the Bible has the most chapters?', '["Isaiah","Genesis","Psalms","Jeremiah"]', 2),
(1, 'What is the shortest verse in the Bible?', '["God is love","Pray constantly","Jesus wept","Rejoice always"]', 2),
(1, 'How many chapters does Genesis have?', '["40","45","50","55"]', 2),
(1, 'What does the word Bible come from?', '["A Latin word meaning holy","A Greek word meaning books","A Hebrew word meaning scripture","A Latin word meaning truth"]', 1),
(1, 'Which is the longest chapter in the Bible?', '["Genesis 1","Psalm 119","Isaiah 53","Revelation 21"]', 1),
(1, 'Which book comes after Genesis?', '["Leviticus","Numbers","Deuteronomy","Exodus"]', 3),
(1, 'How many chapters does Revelation have?', '["18","20","22","24"]', 2),
(1, 'What is the NWT?', '["New World Translation","New World Testament","New Written Translation","New World Transcription"]', 0),
(1, 'Which Psalm is known as the Shepherd Psalm?', '["Psalm 1","Psalm 23","Psalm 91","Psalm 100"]', 1),
(1, 'How many chapters does Isaiah have?', '["50","60","66","72"]', 2),

-- LEVEL 2: Books of the Bible
(2, 'Which of these is NOT a book of the Bible?', '["Obadiah","Zephaniah","Hezekiah","Habakkuk"]', 2),
(2, 'Which book comes right before Psalms?', '["Proverbs","Job","Ecclesiastes","Song of Solomon"]', 1),
(2, 'Which book follows Psalms?', '["Ecclesiastes","Job","Proverbs","Song of Solomon"]', 2),
(2, 'How many books of John are there in the New Testament?', '["2","3","4","5"]', 2),
(2, 'Which of these books is a Major Prophet?', '["Hosea","Joel","Amos","Ezekiel"]', 3),
(2, 'What are the four Gospels?', '["Matthew Mark Luke Acts","Matthew Mark Luke John","Mark Luke John Acts","Matthew Luke John Romans"]', 1),
(2, 'Which book comes right before Revelation?', '["1 John","2 John","3 John","Jude"]', 3),
(2, 'Which book is between Galatians and Philippians?', '["Romans","Colossians","Ephesians","Titus"]', 2),
(2, 'How many letters did John write?', '["1","2","3","4"]', 2),
(2, 'Which book comes between Ruth and 2 Samuel?', '["1 Chronicles","Judges","1 Kings","1 Samuel"]', 3),
(2, 'Which of these is NOT a Minor Prophet?', '["Nahum","Haggai","Ezekiel","Malachi"]', 2),
(2, 'What book comes after Acts?', '["Galatians","Romans","1 Corinthians","Ephesians"]', 1),
(2, 'How many books of Kings are in the Bible?', '["1","2","3","4"]', 1),
(2, 'Which of these books is in the Old Testament?', '["Philemon","Titus","Amos","Jude"]', 2),
(2, 'What is the last book of the Pentateuch?', '["Joshua","Numbers","Leviticus","Deuteronomy"]', 3),
(2, 'Which book comes before Isaiah?', '["Ezekiel","Jeremiah","Daniel","Song of Solomon"]', 3),
(2, 'How many books make up the Pentateuch?', '["3","4","5","6"]', 2),
(2, 'Which of these is a wisdom book?', '["Numbers","Ezra","Job","Amos"]', 2),
(2, 'What book comes right after Malachi?', '["Luke","Acts","Mark","Matthew"]', 3),
(2, 'How many books of Chronicles are there?', '["1","2","3","4"]', 1),

-- LEVEL 3: Creation & Early History
(3, 'In how many days did God create the heavens and the earth?', '["5","6","7","8"]', 1),
(3, 'What did God create on the first day?', '["The sun and moon","Land and sea","Light","Sky"]', 2),
(3, 'What were the names of the first man and woman?', '["Adam and Eve","Adam and Sarah","Noah and Eve","Cain and Eve"]', 0),
(3, 'What was forbidden in the Garden of Eden?', '["An apple","A pear","Fruit from the tree of knowledge of good and bad","A fig"]', 2),
(3, 'What was the name of the garden where Adam and Eve lived?', '["Garden of Gethsemane","Garden of Eden","Garden of Paradise","Garden of God"]', 1),
(3, 'Who was Adam and Eve''s firstborn son?', '["Abel","Seth","Cain","Enoch"]', 2),
(3, 'Why did Cain kill Abel?', '["Abel stole from Cain","God accepted Abel''s offering but not Cain''s","Abel spoke badly of Cain","They argued over land"]', 1),
(3, 'How many days and nights did it rain during the Flood?', '["20","30","40","50"]', 2),
(3, 'How old was Noah when the floodwaters came?', '["500","600","700","800"]', 1),
(3, 'What sign did God give as a promise not to flood the earth again?', '["A dove","A rainbow","A cloud","A star"]', 1),
(3, 'How many of each kind of animal did Noah take?', '["1 pair of each","2 of each","7 of clean 2 of unclean","7 of each kind"]', 2),
(3, 'What was the tower built by people after the flood called?', '["Tower of Babel","Tower of Babylon","Tower of God","Tower of Heaven"]', 0),
(3, 'Why did God confuse the languages at Babel?', '["To punish idolatry","To stop them from building a tower to heaven","Because they worshipped false gods","Because they forgot God"]', 1),
(3, 'Who was the oldest person recorded in the Bible?', '["Noah","Adam","Methuselah","Enoch"]', 2),
(3, 'What was the name of Adam''s third son?', '["Enoch","Cain","Abel","Seth"]', 3),
(3, 'On which day did God create humans?', '["Fourth","Fifth","Sixth","Seventh"]', 2),
(3, 'From what did God form Adam''s body?', '["Clay from the river","Dust from the ground","Sand from the sea","Stone from the earth"]', 1),
(3, 'From what part of Adam did God form Eve?', '["A piece of clay","His arm","His rib","His side"]', 2),
(3, 'Who tempted Eve in the garden?', '["Satan in the form of a serpent","An angel","Cain","A stranger"]', 0),
(3, 'What was the name of the land east of Eden where Cain went?', '["Canaan","Nod","Shinar","Ur"]', 1),

-- LEVEL 4: The Patriarchs
(4, 'What was Abraham''s name before God changed it?', '["Abram","Aram","Abiram","Amram"]', 0),
(4, 'From which city did Abraham originally come?', '["Jerusalem","Babylon","Ur of the Chaldeans","Haran"]', 2),
(4, 'What was the name of Abraham''s wife?', '["Rachel","Rebekah","Sarah","Leah"]', 2),
(4, 'What was the name of Abraham''s son born to Hagar?', '["Isaac","Ishmael","Esau","Jacob"]', 1),
(4, 'How old was Abraham when Isaac was born?', '["90","99","100","110"]', 2),
(4, 'God tested Abraham by asking him to sacrifice which son?', '["Ishmael","Jacob","Isaac","Joseph"]', 2),
(4, 'Who were Isaac''s twin sons?', '["Joseph and Benjamin","Cain and Abel","Esau and Jacob","Manasseh and Ephraim"]', 2),
(4, 'For how many years total did Jacob work to marry Rachel?', '["7","14","21","7 then another 7"]', 3),
(4, 'How many sons did Jacob have?', '["10","11","12","13"]', 2),
(4, 'What was Jacob''s name changed to by God?', '["Abraham","Israel","Judah","Joseph"]', 1),
(4, 'What gift did Jacob give to Joseph that made his brothers jealous?', '["A gold ring","A special robe","A horse","Land"]', 1),
(4, 'Who bought Joseph when his brothers sold him?', '["Egyptian soldiers","Midianite traders","Ishmaelite merchants","Babylonian merchants"]', 2),
(4, 'What position did Joseph rise to in Egypt?', '["Head of the army","Chief of the guards","Second only to Pharaoh","Chief priest"]', 2),
(4, 'How many years of famine did Pharaoh''s dream predict?', '["5","7","10","14"]', 1),
(4, 'What was the name of Joseph''s mother?', '["Leah","Bilhah","Rachel","Zilpah"]', 2),
(4, 'In what country did the Israelites become enslaved?', '["Babylon","Assyria","Canaan","Egypt"]', 3),
(4, 'Who was the father of the 12 tribes of Israel?', '["Abraham","Isaac","Jacob","Joseph"]', 2),
(4, 'What ability did Joseph have regarding dreams?', '["He could sleep without dreaming","He could interpret dreams","He could cause others to dream","He could record dreams exactly"]', 1),
(4, 'Jacob''s son Judah became the ancestor of which important figure?', '["Moses","David","Abraham","Joshua"]', 1),
(4, 'How old was Jacob when he died in Egypt?', '["130","147","120","175"]', 1),

-- LEVEL 5: Moses & the Exodus
(5, 'Where was Moses found as a baby?', '["Hidden in a cave","In a basket in the Nile","Left at the palace gates","In the wilderness"]', 1),
(5, 'Who was Moses'' sister?', '["Deborah","Miriam","Ruth","Hannah"]', 1),
(5, 'What happened at the burning bush?', '["God spoke to Abraham","God spoke to Moses from a bush that did not burn up","The angel destroyed Sodom","Elijah called fire from heaven"]', 1),
(5, 'How many plagues did God send on Egypt?', '["7","8","10","12"]', 2),
(5, 'What was the last plague?', '["Darkness","Locusts","Hail","Death of firstborns"]', 3),
(5, 'What was the Passover?', '["When God passed over Egypt with plagues","When the angel of death passed over homes with lamb''s blood","When Israel crossed the Red Sea","When Moses left Egypt"]', 1),
(5, 'How did God divide the Red Sea for Israel?', '["Moses struck it with his staff","A strong east wind overnight","Moses stretched his hand and a strong wind blew","God sent an earthquake"]', 2),
(5, 'What did God provide as food in the wilderness?', '["Bread and fish","Manna and quail","Fruit and grain","Milk and honey"]', 1),
(5, 'On which mountain did God give Moses the Ten Commandments?', '["Mount Zion","Mount Carmel","Mount Sinai","Mount Hermon"]', 2),
(5, 'How many commandments did God give Moses?', '["5","7","10","12"]', 2),
(5, 'What did the Israelites make while Moses was on the mountain?', '["A wooden idol","A golden calf","A silver statue","An altar to Baal"]', 1),
(5, 'For how many years did Israel wander in the wilderness?', '["20","30","40","50"]', 2),
(5, 'What was the ark of the covenant?', '["Noah''s boat","A sacred chest containing the stone tablets","The tent of meeting","Moses'' walking staff"]', 1),
(5, 'Who helped Moses when his arms grew tired during battle?', '["Aaron and Joshua","Aaron and Hur","Joshua and Caleb","Hur and Caleb"]', 1),
(5, 'What was Moses'' wife''s name?', '["Miriam","Zipporah","Deborah","Jochebed"]', 1),
(5, 'Who was Moses'' brother?', '["Joshua","Caleb","Aaron","Hur"]', 2),
(5, 'Why was Moses not allowed to enter the Promised Land?', '["He was too old","He struck the rock instead of speaking to it","He married a foreign woman","He broke the stone tablets"]', 1),
(5, 'What was the name of the agreement God made with Israel at Sinai?', '["The Abrahamic covenant","The Noahic covenant","The Law covenant","The Davidic covenant"]', 2),
(5, 'Who succeeded Moses as leader of Israel?', '["Caleb","Aaron","Joshua","Phinehas"]', 2),
(5, 'How old was Moses when he died?', '["100","110","120","130"]', 2),

-- LEVEL 6: Joshua through the Kings
(6, 'How did the walls of Jericho fall?', '["Battering rams","Earthquakes","The Israelites marched around and shouted","Moses prayed and they fell"]', 2),
(6, 'Who was the judge who defeated Sisera?', '["Samson","Gideon","Deborah","Samuel"]', 2),
(6, 'How many men did Gideon use to defeat the Midianites?', '["100","300","1000","3000"]', 1),
(6, 'What was the source of Samson''s strength?', '["His prayer life","His diet","His long hair","His faith"]', 2),
(6, 'Who was Ruth''s mother-in-law?', '["Naomi","Orpah","Hannah","Miriam"]', 0),
(6, 'What did Hannah ask God for?', '["Long life","Wealth","A son","A husband"]', 2),
(6, 'Who was Israel''s first king?', '["David","Solomon","Saul","Rehoboam"]', 2),
(6, 'Who killed the giant Goliath?', '["Saul","Jonathan","David","Abner"]', 2),
(6, 'Who was David''s closest friend?', '["Abner","Joab","Jonathan","Hushai"]', 2),
(6, 'Who was the wisest king of Israel?', '["David","Solomon","Hezekiah","Josiah"]', 1),
(6, 'How many wives did Solomon have?', '["100","300","700","1000"]', 2),
(6, 'What famous structure did Solomon build?', '["The walls of Jerusalem","The Temple in Jerusalem","The ark of the covenant","The palace of David"]', 1),
(6, 'What happened to Israel after Solomon died?', '["It became stronger","It was conquered by Babylon","It split into two kingdoms","It fell to Assyria"]', 2),
(6, 'Who challenged the prophets of Baal on Mount Carmel?', '["Elisha","Isaiah","Elijah","Jeremiah"]', 2),
(6, 'How many prophets of Baal did Elijah challenge?', '["100","250","450","850"]', 2),
(6, 'How did Elijah go to heaven?', '["He died and was resurrected","In a windstorm and fiery chariot","He ascended on a cloud","He simply disappeared"]', 1),
(6, 'Who succeeded Elijah as prophet?', '["Isaiah","Jeremiah","Elisha","Amos"]', 2),
(6, 'Which righteous king of Judah led a major religious reformation?', '["Ahab","Manasseh","Josiah","Asa"]', 2),
(6, 'Which empire destroyed Jerusalem and took the Jews into exile?', '["Assyria","Persia","Babylon","Egypt"]', 2),
(6, 'How many years did the Babylonian exile last according to Jeremiah?', '["40","50","70","100"]', 2),

-- LEVEL 7: Poetry & Wisdom
(7, 'Who wrote most of the book of Psalms?', '["Solomon","Moses","Asaph","David"]', 3),
(7, 'What does Psalm 23:1 say in the NWT?', '["God is my Shepherd","Jehovah is my Shepherd","The Lord is my Shepherd","My God is my shepherd"]', 1),
(7, 'Who wrote the book of Proverbs primarily?', '["David","Solomon","Asaph","Moses"]', 1),
(7, 'What is the main theme of Ecclesiastes?', '["Love and marriage","The vanity of life without God","Praise and worship","Prophecy"]', 1),
(7, 'Who is the main character in Job?', '["A king of Israel","A prophet","A righteous man tested by Satan","A priest"]', 2),
(7, 'What did Satan claim about Job?', '["That Job was secretly sinful","That Job only served God for selfish reasons","That Job did not believe in God","That Job worshipped idols"]', 1),
(7, 'How many children did Job originally have?', '["5","7","10","12"]', 2),
(7, 'Which Psalm begins "My God, my God, why have you forsaken me?"', '["Psalm 22","Psalm 23","Psalm 51","Psalm 119"]', 0),
(7, 'How many verses does Psalm 119 have?', '["100","150","176","200"]', 2),
(7, 'What does Proverbs say is the beginning of wisdom?', '["Love","Fear of God","Knowledge","Humility"]', 1),
(7, 'Who wrote the Song of Solomon?', '["David","Asaph","Moses","Solomon"]', 3),
(7, 'What does Psalm 136 repeat in every verse?', '["Praise Jehovah forever","His loyal love endures forever","Holy is the Lord","Give thanks to God"]', 1),
(7, 'What happened to Job at the end of the book?', '["He remained poor but faithful","He was restored with double what he had","He died peacefully","He was made a king"]', 1),
(7, 'Proverbs 3:5-6 says to trust in Jehovah and not lean on what?', '["Your own wisdom","Your own understanding","Your own strength","Your own heart"]', 1),
(7, 'In Ecclesiastes, what does Solomon call everything under the sun?', '["Blessed","Meaningless or vanity","Temporary","Sinful"]', 1),
(7, 'How many friends came to comfort Job?', '["2","3","4","5"]', 1),
(7, 'Which Psalm opens with "Make a joyful shout to Jehovah"?', '["Psalm 96","Psalm 98","Psalm 100","Psalm 150"]', 2),
(7, 'What does Ecclesiastes 12:13 say is the conclusion of the whole matter?', '["Fear God and keep his commandments","Love your neighbor as yourself","Trust in God with all your heart","Seek wisdom above all things"]', 0),
(7, 'Which Psalm is the "Great Hallel" praising God''s eternal love?', '["Psalm 100","Psalm 136","Psalm 150","Psalm 23"]', 1),
(7, 'What does Proverbs 22:6 say about training children?', '["Discipline them strictly","Train a child in the way he should go","Teach them the law of God","Let them find their own path"]', 1),

-- LEVEL 8: The Major Prophets
(8, 'Which prophet had a vision of God''s throne with seraphim?', '["Jeremiah","Ezekiel","Isaiah","Daniel"]', 2),
(8, 'Isaiah 53 prophesied about whom?', '["Moses","Elijah","The Messiah Jesus","Israel"]', 2),
(8, 'Who was thrown into the lions'' den?', '["Shadrach","Meshach","Abednego","Daniel"]', 3),
(8, 'Who were the three men thrown into the fiery furnace?', '["Daniel Shadrach Meshach","Shadrach Meshach Abednego","Daniel Ezra Nehemiah","Hananiah Azariah Mishael"]', 1),
(8, 'What did Jeremiah tell the Israelites to do during Babylonian captivity?', '["Revolt against Babylon","Seek the peace of the city where they were exiled","Pray for immediate deliverance","Return to Israel"]', 1),
(8, 'Ezekiel had a famous vision of what?', '["The walls of Jerusalem","A valley of dry bones","The fall of Babylon","The New Jerusalem"]', 1),
(8, 'How many years did Jeremiah prophesy the exile would last?', '["40","50","70","100"]', 2),
(8, 'Isaiah 9:6 prophesied a child called what?', '["Son of God Holy One Prince","Wonderful Counselor Mighty God Prince of Peace","Emmanuel Messiah Lord","King of Kings Lord of Lords Holy One"]', 1),
(8, 'What did Daniel interpret for King Nebuchadnezzar?', '["A sign on the wall","A dream about a great statue","A vision of four beasts","A dream about a great tree"]', 1),
(8, 'Who wrote the book of Lamentations?', '["Isaiah","Ezekiel","Jeremiah","Daniel"]', 2),
(8, 'Daniel 2''s statue had a head of gold representing which kingdom?', '["Persia","Greece","Rome","Babylon"]', 3),
(8, 'Which prophet ate a scroll in a vision?', '["Isaiah","Jeremiah","Ezekiel","Daniel"]', 2),
(8, 'Micah 5:2 prophesied the Messiah''s birthplace. Where?', '["Jerusalem","Nazareth","Bethlehem","Hebron"]', 2),
(8, 'What was the handwriting on the wall interpreted by Daniel?', '["A warning to Nebuchadnezzar","Belshazzar''s kingdom was finished","A prophecy about the Messiah","Instructions for the temple"]', 1),
(8, 'Isaiah 11:6 says what about the future paradise?', '["Lions will be tamed by angels","The wolf will reside with the lamb","No animal will harm another","All beasts will eat grass"]', 1),
(8, 'Where was Daniel when thrown into the lions'' den?', '["Babylon under Nebuchadnezzar","Persia under Darius the Mede","Media under Cyrus","Jerusalem under Zedekiah"]', 1),
(8, 'Isaiah 40:31 says those who hope in Jehovah will do what?', '["Never grow weary","Renew their strength and soar like eagles","Walk and not tire out","Both b and c"]', 3),
(8, 'Which prophet said the soul that is sinning will die?', '["Isaiah","Ezekiel","Jeremiah","Daniel"]', 1),
(8, 'Ezekiel''s vision of dry bones represented what?', '["The dead rising","The restoration of Israel","The defeat of enemies","Future resurrection"]', 1),
(8, 'What was Isaiah''s commission from God?', '["To rebuild the temple","To call the people to repentance","To anoint a new king","To lead Israel from exile"]', 1),

-- LEVEL 9: The Gospels
(9, 'In which city was Jesus born?', '["Nazareth","Jerusalem","Bethlehem","Capernaum"]', 2),
(9, 'Who baptized Jesus?', '["Peter","James","John the Baptist","Andrew"]', 2),
(9, 'How long did Jesus fast in the wilderness?', '["20 days","30 days","40 days","7 days"]', 2),
(9, 'How many apostles did Jesus choose?', '["7","10","12","70"]', 2),
(9, 'What was Jesus'' first miracle?', '["Feeding 5000","Walking on water","Turning water into wine","Healing a blind man"]', 2),
(9, 'Jesus said "I am the resurrection and the life" to whom?', '["Mary Magdalene","Martha","Mary sister of Lazarus","Peter"]', 1),
(9, 'Which Gospel is the shortest?', '["Matthew","Mark","Luke","John"]', 1),
(9, 'What does the Sermon on the Mount begin with?', '["The Lord''s Prayer","The Beatitudes","The Ten Commandments","The Greatest Commandment"]', 1),
(9, 'What was Lazarus'' hometown?', '["Jerusalem","Nazareth","Bethany","Capernaum"]', 2),
(9, 'Who betrayed Jesus?', '["Peter","Judas Iscariot","Thomas","Pilate"]', 1),
(9, 'For how much money did Judas betray Jesus?', '["20 pieces of silver","30 pieces of silver","40 pieces of silver","50 pieces of silver"]', 1),
(9, 'What is the model prayer Jesus gave sometimes called?', '["The Lord''s Prayer","The Prayer of Jesus","The Holy Prayer","The Kingdom Prayer"]', 0),
(9, 'Who helped Jesus carry his torture stake?', '["Simon of Cyrene","John","Joseph of Arimathea","Nicodemus"]', 0),
(9, 'What did Jesus say were the two greatest commandments?', '["Keep the Sabbath and honor your parents","Love God and love your neighbor","Worship only God and do not kill","Pray and fast"]', 1),
(9, 'How many people did Jesus feed with 5 loaves and 2 fish?', '["2000","3000","4000","5000"]', 3),
(9, 'What is the meaning of Christ?', '["Savior","Son of God","Anointed One","King of Kings"]', 2),
(9, 'Who was the first to discover the empty tomb?', '["Peter and John","Mary and Martha","Mary Magdalene","The disciples"]', 2),
(9, 'Jesus was tried before whom?', '["Caiaphas only","Herod only","Pontius Pilate only","Caiaphas Herod and Pilate"]', 3),
(9, 'What did the angel say when the women arrived at the tomb?', '["He is risen","He is not here for he was raised up","Go and tell his disciples","All three of these"]', 3),
(9, 'John 3:16 says God loved the world so much he gave what?', '["His law","His Spirit","His only-begotten Son","His blessing"]', 2),

-- LEVEL 10: Acts & Paul's Letters
(10, 'What event marked the start of the Christian congregation?', '["Jesus'' baptism","The Last Supper","Pentecost","Jesus'' resurrection"]', 2),
(10, 'Who gave a famous speech at Pentecost?', '["James","John","Peter","Stephen"]', 2),
(10, 'How many were baptized on the day of Pentecost?', '["1000","2000","3000","5000"]', 2),
(10, 'What was Paul''s name before his conversion?', '["Simon","Saul","Barnabas","Silas"]', 1),
(10, 'What happened to Paul on the road to Damascus?', '["He was arrested","He was blinded by light and heard Jesus'' voice","He had a dream about Jesus","He met Peter"]', 1),
(10, 'Romans 6:23 says the wages sin pays is death. What is the gift of God?', '["Salvation","Forgiveness","Everlasting life","Peace"]', 2),
(10, 'Who was Paul''s companion on his first missionary journey?', '["Silas","Timothy","Barnabas","Luke"]', 2),
(10, 'Where was Paul when he wrote Philippians?', '["Corinth","Rome in prison","Antioch","Ephesus"]', 1),
(10, 'What does 1 Corinthians 13 describe?', '["Resurrection","Gifts of the spirit","Love agape","The congregation"]', 2),
(10, 'Stephen was the first what in the Christian congregation?', '["Apostle","Deacon","Martyr","Elder"]', 2),
(10, 'How many missionary journeys did Paul make?', '["2","3","4","5"]', 1),
(10, 'Philippians 4:13 says "For all things I have the strength through..."?', '["God who sustains me","Jesus who gives me power","The one who gives me power","My faith in Christ"]', 2),
(10, 'Paul was shipwrecked on which island going to Rome?', '["Crete","Cyprus","Malta","Rhodes"]', 2),
(10, 'Who was the first Gentile household baptized by Peter?', '["Lydia''s household","Cornelius'' household","The jailer''s household","Zacchaeus'' household"]', 1),
(10, 'What was the Jerusalem council about?', '["Whether to rebuild the temple","Whether Gentiles needed circumcision","The authority of Paul","Collecting money for the poor"]', 1),
(10, 'Who wrote the book of Acts?', '["Paul","Peter","Luke","John"]', 2),
(10, 'Where did Paul write the letter to the Romans from?', '["Jerusalem","Antioch","Corinth","Rome"]', 2),
(10, 'What city did Paul''s letter to the Ephesians address?', '["Athens","Corinth","Ephesus","Philippi"]', 2),
(10, 'Who was converted after the Ethiopian eunuch met Philip?', '["The Ethiopian eunuch himself","His entire household","No one else","The queen of Ethiopia"]', 0),
(10, 'What gift did Lydia offer Paul and his companions?', '["Money for the ministry","Hospitality in her home","A place to preach","A boat for travel"]', 1),

-- LEVEL 11: Prophecy & Revelation
(11, 'How many horsemen appear in Revelation 6?', '["2","4","6","7"]', 1),
(11, 'What do the four horsemen represent?', '["The four gospels","Conquest war famine death","The four kingdoms of Daniel","Angels of judgment"]', 1),
(11, 'What is the number of the beast in Revelation?', '["444","555","616","666"]', 3),
(11, 'How many seals are opened in Revelation?', '["4","5","6","7"]', 3),
(11, 'Who is described as the great prostitute in Revelation?', '["Rome","Babylon the Great","Egypt","Jerusalem"]', 1),
(11, 'What is Armageddon?', '["A mountain in Israel","A final battle at the end of this system","The place where Jesus died","A period of tribulation"]', 1),
(11, 'How long is the Millennial Reign in Revelation 20?', '["100 years","500 years","1000 years","Forever"]', 2),
(11, 'What happens to Satan at the start of the Millennium?', '["He is destroyed","He is bound and thrown into an abyss","He is exiled to earth","He flees to the ends of the earth"]', 1),
(11, 'How many from each tribe of Israel are sealed in Revelation 7?', '["10000","12000","1000","All of them"]', 1),
(11, 'What did Daniel''s vision of four beasts represent?', '["Four prophets","Four world powers","Four angels","Four ages of Israel"]', 1),
(11, 'What is the new Jerusalem in Revelation 21?', '["A rebuilt Jerusalem in Israel","The holy city coming down from heaven","The Millennial Kingdom","Heaven itself"]', 1),
(11, 'Daniel 2''s image ended with what?', '["The image grew larger","A stone struck it and became a mountain filling earth","The image was buried","The king of the north destroyed it"]', 1),
(11, 'How many trumpets are blown in Revelation?', '["4","5","6","7"]', 3),
(11, 'Revelation 21:4 promises that God will do what?', '["Create a new heaven","Destroy the wicked","Wipe out every tear from their eyes","Restore Paradise"]', 2),
(11, 'How many plagues are poured out in Revelation 16?', '["5","7","10","12"]', 1),
(11, 'What does Daniel 12 say follows the great time of distress?', '["The Millennium begins","A resurrection for many","God''s judgment on nations","Both a resurrection and judgment"]', 3),
(11, 'Revelation 4:8 says four living creatures ceaselessly say what?', '["Praise and glory to God forever","Holy holy holy is Jehovah God the Almighty","Worthy is the Lamb","Great and wonderful are your works"]', 1),
(11, 'What does the tree of life in Revelation 22 produce?', '["Golden fruit once a year","12 crops with healing leaves","Enough food for all nations","Seven types of fruit"]', 1),
(11, 'The 144,000 in Revelation are described as what?', '["Angels","Sealed servants of God from Israel''s tribes","All who believe in Jesus","The great crowd"]', 1),
(11, 'What happens to death and Hades at the end of Revelation 20?', '["They continue forever","They are thrown into the lake of fire","They are emptied","They are given to Satan"]', 1),

-- LEVEL 12: Expert Level
(12, 'How many times does Jehovah appear in the original Hebrew scriptures approximately?', '["About 3000","About 5500","About 7000","About 10000"]', 2),
(12, 'Which books of the Bible do not explicitly mention God by name?', '["Song of Solomon and Esther","Ruth and Esther","Philemon and 3 John","Obadiah and Nahum"]', 0),
(12, 'What Hebrew word begins the Bible (translated "In the beginning")?', '["Shema","Bereshit","Hallelujah","Adonai"]', 1),
(12, 'What is the Masoretic Text?', '["The oldest Greek manuscripts","The authoritative Hebrew text of the Old Testament","The Dead Sea Scrolls","The Latin Vulgate"]', 1),
(12, 'What was the Septuagint?', '["A Latin translation of the Bible","A Greek translation of the Hebrew scriptures","A collection of 70 lost books","The first New Testament canon"]', 1),
(12, 'Acts 15:16 quotes which Old Testament prophet about rebuilding David''s fallen tent?', '["Isaiah","Jeremiah","Amos","Micah"]', 2),
(12, 'How many times did Peter deny Jesus and before what?', '["Three times before the cock crowed twice","Twice before dawn","Three times before the cock crowed","Three times before sunrise"]', 0),
(12, 'What was the Greek word used in John 1:1 for Word?', '["Pneuma","Logos","Sophia","Theos"]', 1),
(12, 'Galatians 3:24 calls the Mosaic Law what in the NWT?', '["A burden","A guide leading to Christ","A tutor leading to Christ","A shadow of good things"]', 2),
(12, 'How many times does the divine name Jehovah appear in the NWT New Testament?', '["0 not in manuscripts","27","237","7000"]', 2),
(12, 'Which New Testament writer quoted the Old Testament most frequently?', '["Peter","John","Paul","Matthew"]', 3),
(12, 'The Council of Nicea in 325 CE primarily debated what?', '["The biblical canon","The nature of Christ Arianism vs Trinitarianism","The date of Easter","Paul''s authority"]', 1),
(12, 'What does the Hebrew word Elohim mean?', '["A specific name for God","A Hebrew word translated God or gods","The Holy Spirit","The angels"]', 1),
(12, 'Which two books of the Bible are named after women?', '["Ruth and Esther","Ruth and Deborah","Esther and Mary","Hannah and Ruth"]', 0),
(12, 'Hebrews 11 is often called what?', '["The Hall of Prayer","The Hall of Faith","The Hall of Prophets","The Hall of Wisdom"]', 1),
(12, 'What is the Hebrew Sheol equivalent to in Greek?', '["Hell a place of torment","Hades the common grave","Gehenna","Tartarus"]', 1),
(12, 'The Greek word parousia in Matthew 24:3 refers to what?', '["Jesus'' death","Jesus'' presence or coming","The Kingdom of God","The end of the age"]', 1),
(12, 'What is significant about the number 7 in the Bible?', '["It represents completeness or perfection","It represents the Trinity","It represents God''s judgment only","It represents only the days of creation"]', 0),
(12, 'Who are described as the "other sheep" in John 10:16?', '["Gentile believers who would also follow Jesus","The 144000","Angels","Future apostles"]', 0),
(12, 'Which manuscript discovery in 1947 confirmed the accuracy of Old Testament texts?', '["The Cairo Geniza","The Codex Sinaiticus","The Dead Sea Scrolls","The Nag Hammadi Library"]', 2);
