-- Seed public community notes.
-- Inserts notes under the alexx813@gmail.com account (the only real user needed).
-- Safe to re-run — skips any note whose title already exists as a public note.

DO $$
DECLARE
  v_user_id uuid;
BEGIN

  SELECT id INTO v_user_id FROM auth.users WHERE email = 'alexx813@gmail.com' LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User alexx813@gmail.com not found.';
  END IF;

  -- ── Helper macro: insert only if title not already public ────────────────────

  -- 1
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    'The patience of Job',
    '<p>What struck me re-reading Job is how he never actually cursed God — he questioned, he grieved, but he held on. Job 1:21 sums it up: "Jehovah himself has given, and Jehovah himself has taken away. Let the name of Jehovah continue to be praised." A reminder that faith isn''t the absence of pain.</p>',
    ARRAY['faith','suffering','hope'],
    17, 1, '21', true, 14,
    NOW() - INTERVAL '11 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'The patience of Job' AND is_public = true);

  -- 2
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    'Proverbs on words',
    '<p>Proverbs has so much to say about speech. "The tongue of the wise makes knowledge appealing, but the mouth of the stupid blurts out foolishness" (15:2). I''ve been making a mental note before responding when I''m frustrated — does this build up or tear down?</p>',
    ARRAY['wisdom','speech','proverbs'],
    19, 15, '2', true, 9,
    NOW() - INTERVAL '13 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Proverbs on words' AND is_public = true);

  -- 3
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    'Isaiah''s prophecy of restoration',
    '<p>Isaiah 40:28-31 never gets old. The image of "mounting up with wings like eagles" is so vivid. What I appreciate is the context: it comes right after God asks "do you not know? Have you not heard?" — a gentle correction that exhaustion doesn''t mean abandonment.</p>',
    ARRAY['prophecy','comfort','strength'],
    22, 40, '28-31', true, 22,
    NOW() - INTERVAL '16 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Isaiah''s prophecy of restoration' AND is_public = true);

  -- 4
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    'The sermon on the mount — beatitudes',
    '<p>Matthew 5 opens with qualities that seem upside-down to the world: the meek, the mourning, the merciful. Studying the Greek behind "meek" (praus) was eye-opening — it describes a horse that''s powerful but trained. Meekness isn''t weakness, it''s strength under control.</p>',
    ARRAY['sermon-on-the-mount','beatitudes','character'],
    39, 5, '3-12', true, 31,
    NOW() - INTERVAL '21 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'The sermon on the mount — beatitudes' AND is_public = true);

  -- 5
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    'Revelation — letters to the congregations',
    '<p>The seven letters in Revelation 2–3 each follow a pattern: commendation, correction, counsel. I found it striking that even the faithful congregation in Smyrna gets no criticism — just encouragement to endure. A good model for how to give feedback.</p>',
    ARRAY['revelation','congregation','endurance'],
    65, 2, NULL, true, 17,
    NOW() - INTERVAL '26 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Revelation — letters to the congregations' AND is_public = true);

  -- 6
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    'Psalm 23 — more than a funeral verse',
    '<p>We quote Psalm 23 at funerals, but it''s really about present-tense provision. "He causes me to lie down in green pastures" — sheep only lie down when they feel safe. It''s a picture of rest that has to be given, not achieved. Still sitting with that.</p>',
    ARRAY['psalms','trust','comfort'],
    18, 23, NULL, true, 28,
    NOW() - INTERVAL '6 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Psalm 23 — more than a funeral verse' AND is_public = true);

  -- 7
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    'Romans 8 — no condemnation',
    '<p>Romans 8:1 is one of the most freeing verses in all of scripture: "There is now no condemnation for those in union with Christ Jesus." Paul spends the rest of the chapter unpacking why — the spirit, adoption, intercession, and the unbreakable love of God. I keep coming back to verse 38: nothing can separate us.</p>',
    ARRAY['romans','grace','assurance'],
    44, 8, '1', true, 41,
    NOW() - INTERVAL '9 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Romans 8 — no condemnation' AND is_public = true);

  -- 8
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    'Genesis 1 — "it was good"',
    '<p>Reading the creation account slowly, I noticed God evaluates each day with "it was good" — but day 2 (the expanse) gets no such evaluation. Scholars think it''s because the separation of waters isn''t finished until day 3. The point: God doesn''t call something good until it''s complete. That hit differently.</p>',
    ARRAY['genesis','creation','observation'],
    0, 1, NULL, true, 19,
    NOW() - INTERVAL '12 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Genesis 1 — "it was good"' AND is_public = true);

  -- 9
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    'John 11 — the shortest verse',
    '<p>"Jesus wept" (John 11:35) is famous for being the shortest verse, but the context makes it profound. Jesus already knew he was about to raise Lazarus. He wept anyway. Not from despair but from compassion — he entered into the grief of those he loved. That''s the kind of God worth serving.</p>',
    ARRAY['john','compassion','resurrection'],
    42, 11, '35', true, 37,
    NOW() - INTERVAL '14 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'John 11 — the shortest verse' AND is_public = true);

  -- 10
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    'Daniel in Babylon — uncompromised',
    '<p>Daniel 1 sets the tone for the whole book: four young men in a foreign empire, offered the king''s food, and they quietly ask for an alternative. No dramatic protest — just a clear, respectful boundary. Their faithfulness in small things preceded their faithfulness in large ones.</p>',
    ARRAY['daniel','integrity','faithfulness'],
    26, 1, NULL, true, 16,
    NOW() - INTERVAL '17 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Daniel in Babylon — uncompromised' AND is_public = true);

  -- 11
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    'Ecclesiastes — vanity and meaning',
    '<p>Ecclesiastes gets a bad rap for being depressing, but I think the Preacher is doing something important: he''s exhausting every worldly avenue — pleasure, work, wisdom — to show they all fall short. The conclusion in 12:13 isn''t nihilism, it''s clarity: fear God and keep his commandments. Everything else is vapor.</p>',
    ARRAY['ecclesiastes','meaning','wisdom'],
    20, 12, '13', true, 12,
    NOW() - INTERVAL '19 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Ecclesiastes — vanity and meaning' AND is_public = true);

  -- 12
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    'Luke 15 — three parables, one point',
    '<p>The lost sheep, the lost coin, the prodigal son — they''re all the same story at different scales. What I noticed: in each case the one who lost something goes looking. The sheep can''t find itself. The coin can''t find itself. And the son comes home to a father who was already watching. The initiative is always with the one who loves.</p>',
    ARRAY['luke','parables','grace'],
    41, 15, NULL, true, 44,
    NOW() - INTERVAL '23 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Luke 15 — three parables, one point' AND is_public = true);

  -- 13
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    'Hebrews 11 — the faith chapter',
    '<p>Hebrews 11 is sometimes called the "faith chapter" because it lists example after example of men and women who acted on faith before seeing the outcome. What struck me is verse 13: "In faith all of these died, although they did not receive the fulfillment of the promises." Their faith wasn''t contingent on the result.</p>',
    ARRAY['hebrews','faith','examples'],
    57, 11, '1', true, 26,
    NOW() - INTERVAL '4 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Hebrews 11 — the faith chapter' AND is_public = true);

  -- 14
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    'Philippians 4:6-7 — the peace that surpasses',
    '<p>"Do not be anxious over anything, but in everything by prayer and supplication along with thanksgiving, let your petitions be made known to God; and the peace of God that surpasses all understanding will guard your hearts and your mental powers." I''ve prayed this verse back to God many times. The peace isn''t the removal of the problem — it''s the guard placed over your heart while the problem remains.</p>',
    ARRAY['philippians','anxiety','prayer','peace'],
    49, 4, '6-7', true, 53,
    NOW() - INTERVAL '2 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Philippians 4:6-7 — the peace that surpasses' AND is_public = true);

  -- 15
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    'Nehemiah — rebuilding under opposition',
    '<p>Nehemiah chapter 4 is remarkable. While the wall is being rebuilt, enemies mock and threaten. Nehemiah''s response is to pray and post a guard. Both. Not just pray and do nothing, not just work and ignore the threat. "We prayed to our God and kept a guard posted" (4:9). That combination has stayed with me.</p>',
    ARRAY['nehemiah','perseverance','opposition','prayer'],
    15, 4, '9', true, 21,
    NOW() - INTERVAL '8 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = 'Nehemiah — rebuilding under opposition' AND is_public = true);

  -- 16
  INSERT INTO study_notes (user_id, title, content, tags, book_index, chapter, verse, is_public, like_count, updated_at)
  SELECT v_user_id,
    '1 Corinthians 13 — love is a verb',
    '<p>The love chapter is often read at weddings, but Paul wrote it to a congregation torn apart by jealousy and pride. Every quality listed — patient, kind, not jealous, not boastful — is a correction to something they were actually doing. It''s less a poem about love and more a mirror held up to their behaviour.</p>',
    ARRAY['corinthians','love','congregation'],
    45, 13, NULL, true, 38,
    NOW() - INTERVAL '5 days'
  WHERE NOT EXISTS (SELECT 1 FROM study_notes WHERE title = '1 Corinthians 13 — love is a verb' AND is_public = true);

END $$;
