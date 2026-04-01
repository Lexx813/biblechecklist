-- Seed FAQ & Help category with one tutorial thread per feature.
-- Safe to re-run — each thread is only inserted if it doesn't already exist.
-- Auto-detects your admin user — no UUID to replace.

DO $$
DECLARE
  v_system_id  uuid;
  v_cat_id     uuid;
BEGIN

  -- Look up the alexx813@gmail.com account from auth.users
  SELECT id INTO v_system_id FROM auth.users WHERE email = 'alexx813@gmail.com' LIMIT 1;
  IF v_system_id IS NULL THEN
    RAISE EXCEPTION 'User alexx813@gmail.com not found in auth.users.';
  END IF;


  -- ── 1. Ensure FAQ & Help category exists ────────────────────────────────────
  INSERT INTO forum_categories (icon, name, description, sort_order)
  SELECT '❓', 'FAQ & Help', 'Guides and tutorials for every feature in NWT Progress.', 0
  WHERE NOT EXISTS (
    SELECT 1 FROM forum_categories WHERE name = 'FAQ & Help'
  );

  SELECT id INTO v_cat_id FROM forum_categories WHERE name = 'FAQ & Help' LIMIT 1;

  -- ── 3. Thread: Reading Progress (Book Checklist) ─────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM forum_threads
    WHERE category_id = v_cat_id AND title = '📖 How to track your reading progress'
  ) THEN
    INSERT INTO forum_threads (author_id, category_id, title, content, lang, pinned, locked)
    VALUES (
      v_system_id, v_cat_id,
      '📖 How to track your reading progress',
      '<h2>Tracking Your Reading Progress</h2>
<p>The <strong>Book Checklist</strong> is the heart of NWT Progress. Here is how to use it effectively.</p>

<h3>Opening a book</h3>
<p>From the home screen, tap any book card. It expands to show a grid of chapter buttons — one for each chapter in that book.</p>

<h3>Marking a chapter read</h3>
<p>Tap a chapter button to toggle it between unread (empty) and read (teal/filled). The date you marked it is saved automatically and shown when you hover or long-press the button.</p>

<h3>Mark an entire book at once</h3>
<p>Each book card has a <strong>circle checkmark</strong> button on the right. Tap it to mark all chapters in that book as read in one action. Tap it again to clear all chapters.</p>

<h3>Inside the book panel</h3>
<ul>
  <li><strong>Mark All Read</strong> — marks every chapter in one tap.</li>
  <li><strong>Clear All</strong> — resets the whole book.</li>
  <li><strong>↗ link on each chapter</strong> — opens that chapter directly on JW.org.</li>
</ul>

<h3>Progress bar</h3>
<p>Each book card shows a mini progress bar and a "done/total" count (e.g., 42/42). The overall Bible completion percentage is shown on your Profile page.</p>

<h3>Tips</h3>
<ul>
  <li>Fully completed books get a green border and a ✓ icon — easy to see at a glance.</li>
  <li>Your progress is saved to the cloud and syncs across devices.</li>
  <li>You can also add chapter-level notes right from the book panel (tap "+ Add Note").</li>
</ul>',
      'en', true, true
    );
  END IF;


  -- ── 4. Thread: Study Notes ────────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM forum_threads
    WHERE category_id = v_cat_id AND title = '📝 How to use Study Notes'
  ) THEN
    INSERT INTO forum_threads (author_id, category_id, title, content, lang, pinned, locked)
    VALUES (
      v_system_id, v_cat_id,
      '📝 How to use Study Notes',
      '<h2>Study Notes — Your Personal Bible Journal</h2>
<p>Study Notes let you write rich, organized notes tied to specific Bible passages. Here is a complete walkthrough.</p>

<h3>Creating a note</h3>
<ol>
  <li>Navigate to <strong>Study Notes</strong> from the home screen or the navigation bar.</li>
  <li>Tap <strong>+ New Note</strong> in the top right.</li>
  <li>Give your note a title (optional but recommended).</li>
  <li>Select a <strong>book, chapter, and verse</strong> to link the note to a passage.</li>
  <li>Add <strong>tags</strong> — short keywords like <code>prayer</code>, <code>prophecy</code>, or <code>faith</code> — to make your notes searchable and filterable.</li>
  <li>Write your note in the <strong>rich-text editor</strong>. You can bold, italicise, add bullet lists, and blockquotes.</li>
  <li>Tap <strong>Save Note</strong>.</li>
</ol>

<h3>Organising with folders</h3>
<p>Create folders to group related notes (e.g., "Sermon prep", "Family study", "Isaiah deep-dive"). Use the <strong>+ New Folder</strong> button in the sidebar on the My Notes tab.</p>

<h3>Tags and filtering</h3>
<p>After you have several notes with tags, coloured filter chips appear above the grid. Tap a tag chip to see only notes with that tag. Tap <strong>All</strong> to clear the filter.</p>

<h3>Sorting</h3>
<p>Use the sort dropdown to order notes by <em>Last updated</em>, <em>Date created</em>, or <em>Title</em>.</p>

<h3>Making a note public</h3>
<p>At the bottom of the note editor, check <strong>Make public</strong>. Public notes appear in the <strong>Community Notes</strong> tab where other users can read and like them. You can make a note private again at any time by unchecking the box and saving.</p>

<h3>Exporting a note</h3>
<p>Open any note and use the <strong>⬇ .md</strong> button to download it as a Markdown file, or <strong>🖨 PDF</strong> to print or save as PDF.</p>

<h3>Searching</h3>
<p>The search bar at the top of the notes page searches note titles, content, and tags in real time.</p>',
      'en', true, true
    );
  END IF;


  -- ── 5. Thread: Reading Plans ─────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM forum_threads
    WHERE category_id = v_cat_id AND title = '📅 How to use Reading Plans'
  ) THEN
    INSERT INTO forum_threads (author_id, category_id, title, content, lang, pinned, locked)
    VALUES (
      v_system_id, v_cat_id,
      '📅 How to use Reading Plans',
      '<h2>Reading Plans — Stay on Schedule</h2>
<p>Reading Plans help you read through the Bible (or specific books) on a structured schedule. Here is how to get started.</p>

<h3>Choosing a plan</h3>
<ol>
  <li>Go to <strong>Reading Plans</strong> from the home screen.</li>
  <li>Browse the available plan templates — chronological, canonical, New Testament first, etc.</li>
  <li>Tap a plan card and then <strong>Start Plan</strong>.</li>
  <li>Choose your <strong>start date</strong>. The plan will calculate a daily reading assignment for you.</li>
</ol>

<h3>Your daily reading</h3>
<p>Each day, your plan shows the chapters assigned for that day. Tap a chapter assignment to open it on JW.org, then come back and mark it done. The plan tracks your streak and how far ahead or behind schedule you are.</p>

<h3>Multiple active plans</h3>
<p>You can run more than one plan at a time — for example, a full-Bible plan alongside a focused Psalms plan.</p>

<h3>Adjusting pace</h3>
<p>If you fall behind, use the <strong>Adjust</strong> option on the plan to shift your start date forward. If you are ahead, the plan will show you are ahead of schedule.</p>

<h3>Plan progress</h3>
<p>A progress ring on each plan card shows the percentage of the plan you have completed. Plans also show how many days remain.</p>

<h3>Sharing a plan in DMs</h3>
<p>You can share a reading plan with a friend directly from the plan detail view. Tap <strong>Share via message</strong> — your friend will receive a card in their inbox they can tap to start the same plan.</p>',
      'en', true, true
    );
  END IF;


  -- ── 6. Thread: Community Forum ───────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM forum_threads
    WHERE category_id = v_cat_id AND title = '💬 How to use the Community Forum'
  ) THEN
    INSERT INTO forum_threads (author_id, category_id, title, content, lang, pinned, locked)
    VALUES (
      v_system_id, v_cat_id,
      '💬 How to use the Community Forum',
      '<h2>The Community Forum</h2>
<p>The forum is where NWT Progress users discuss scripture, share insights, ask questions, and encourage each other. Here is everything you need to know.</p>

<h3>Browsing categories</h3>
<p>The forum home shows category cards — for example, <em>Bible Discussion</em>, <em>Reading Tips</em>, <em>Prayer Requests</em>, and this <em>FAQ & Help</em> category. Tap a card to see all threads in that category.</p>

<h3>Starting a thread</h3>
<ol>
  <li>Open a category.</li>
  <li>Tap <strong>New Thread</strong>.</li>
  <li>Enter a clear title and write your post using the rich-text editor.</li>
  <li>Tap <strong>Post Thread</strong>.</li>
</ol>

<h3>Replying to a thread</h3>
<p>Scroll to the bottom of any thread and type your reply in the reply box. You can quote another reply by tapping the <strong>Quote</strong> button next to it.</p>

<h3>Reactions</h3>
<p>Tap 🙏, ❤️, or 💡 below any post or reply to react without writing a full response.</p>

<h3>Likes</h3>
<p>Tap the 👍 button on a thread or reply to like it. Liked threads can be found in your Bookmarks.</p>

<h3>Marking a solution</h3>
<p>If you asked a question and a reply answers it, tap <strong>✓ Mark as Solution</strong> on that reply. The thread will be marked as solved so others can find it easily.</p>

<h3>Watching a thread</h3>
<p>Tap <strong>Watch</strong> on a thread to receive notifications when someone replies.</p>

<h3>Sorting threads</h3>
<p>Use the sort tabs to filter by: <em>Latest</em>, <em>Most Liked</em>, <em>Most Replied</em>, <em>Unanswered</em>, or <em>Solved</em>.</p>

<h3>Searching</h3>
<p>Use the search bar at the top of any category to find threads by keyword.</p>

<h3>Language filter</h3>
<p>By default you see threads in your language. Tap <strong>All Languages</strong> to see threads from the whole community.</p>

<h3>Reporting</h3>
<p>If you see content that violates community guidelines, tap the 🚩 flag on the post or reply. Moderators review all reports promptly.</p>',
      'en', true, true
    );
  END IF;


  -- ── 7. Thread: Direct Messages ───────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM forum_threads
    WHERE category_id = v_cat_id AND title = '✉️ How to use Direct Messages'
  ) THEN
    INSERT INTO forum_threads (author_id, category_id, title, content, lang, pinned, locked)
    VALUES (
      v_system_id, v_cat_id,
      '✉️ How to use Direct Messages',
      '<h2>Direct Messages — Private Conversations</h2>
<p>Direct Messages (DMs) let you have private, end-to-end encrypted conversations with other NWT Progress users.</p>

<h3>Starting a conversation</h3>
<ol>
  <li>Go to <strong>Messages</strong> from the navigation bar.</li>
  <li>Tap <strong>New Conversation</strong> (the compose icon).</li>
  <li>Search for the user by display name.</li>
  <li>Select them and start typing.</li>
</ol>

<h3>End-to-end encryption</h3>
<p>All messages are encrypted with a key that only you and the other person hold. Not even the server can read your messages. The lock icon in the conversation header confirms encryption is active.</p>

<h3>Reacting to a message</h3>
<p>Long-press (or hover and click) any message to add a quick emoji reaction.</p>

<h3>Starring messages</h3>
<p>Tap the ⭐ icon on any message to star it. Starred messages are accessible from the <strong>Starred</strong> tab at the top of your inbox so you can find important ones quickly.</p>

<h3>Editing and deleting</h3>
<p>You can edit or delete your own messages within a conversation. Tap the message to see the edit/delete options.</p>

<h3>Sharing a reading plan</h3>
<p>From a Reading Plan detail view, tap <strong>Share via message</strong>. Choose a conversation, and the plan is sent as an interactive card the recipient can tap to join the same plan.</p>

<h3>Message notifications</h3>
<p>Enable push notifications (see the Notifications FAQ) to get alerted when you receive a new message even when the app is in the background.</p>

<h3>Conversation settings</h3>
<p>Tap the ⚙️ icon inside a conversation to set a custom nickname for that conversation.</p>',
      'en', true, true
    );
  END IF;


  -- ── 8. Thread: Community Notes ───────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM forum_threads
    WHERE category_id = v_cat_id AND title = '🌐 How to use Community Notes'
  ) THEN
    INSERT INTO forum_threads (author_id, category_id, title, content, lang, pinned, locked)
    VALUES (
      v_system_id, v_cat_id,
      '🌐 How to use Community Notes',
      '<h2>Community Notes — Learn from Other Readers</h2>
<p>Community Notes is the public feed of study notes shared by NWT Progress users. It is a great place to discover fresh insights on passages you are studying.</p>

<h3>Browsing community notes</h3>
<ol>
  <li>Go to <strong>Study Notes</strong> from the home screen.</li>
  <li>Tap the <strong>Community Notes</strong> tab at the top.</li>
  <li>Scroll through notes shared by other users. Each card shows the author, passage reference, tags, and a preview of the note content.</li>
</ol>

<h3>Searching</h3>
<p>Use the search bar to find community notes by title, content, or tag.</p>

<h3>Liking a note</h3>
<p>Tap the ♡ heart button on any community note to like it. The like count is visible to everyone. Tap again to unlike.</p>

<h3>Sharing your own notes publicly</h3>
<p>When writing or editing a note, check the <strong>Make public</strong> toggle at the bottom of the editor. Your note will then appear in the Community Notes feed for all users.</p>

<h3>Privacy</h3>
<p>Only notes you explicitly mark public are visible to others. All other notes remain private to you. You can make a public note private again at any time by editing it and unchecking <strong>Make public</strong>.</p>',
      'en', true, true
    );
  END IF;


  -- ── 9. Thread: Profile & Streaks ─────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM forum_threads
    WHERE category_id = v_cat_id AND title = '🏆 Understanding your Profile and Streaks'
  ) THEN
    INSERT INTO forum_threads (author_id, category_id, title, content, lang, pinned, locked)
    VALUES (
      v_system_id, v_cat_id,
      '🏆 Understanding your Profile and Streaks',
      '<h2>Profile & Streaks</h2>
<p>Your profile is your personal Bible-reading dashboard. Here is what everything means.</p>

<h3>Reading streak</h3>
<p>Your streak counts how many consecutive days you have marked at least one chapter as read. The flame 🔥 and count appear at the top of your profile. Your streak resets if you miss a day, so try to mark even one chapter daily to keep it going.</p>

<h3>Overall progress</h3>
<p>The large percentage ring shows how much of the entire Bible you have read (based on chapters marked). Below it you can see completed books vs total books.</p>

<h3>Testament breakdown</h3>
<p>Separate progress rings show your completion percentage for the Old Testament and New Testament independently.</p>

<h3>Recent activity</h3>
<p>The activity section shows the last books you marked chapters in, so you can quickly see where you left off.</p>

<h3>Badges</h3>
<p>Badges are earned automatically as you reach milestones — completing a book, finishing a testament, maintaining a streak, and more. Tap a badge to see what it is for.</p>

<h3>Editing your profile</h3>
<ol>
  <li>Tap your avatar or name at the top of the profile page.</li>
  <li>Update your <strong>display name</strong> and <strong>avatar</strong>.</li>
  <li>Tap <strong>Save</strong>.</li>
</ol>

<h3>Settings</h3>
<p>Tap the ⚙️ Settings icon to manage your account, notification preferences, language, dark/light mode, and subscription.</p>',
      'en', true, true
    );
  END IF;


  -- ── 10. Thread: Daily Verse ───────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM forum_threads
    WHERE category_id = v_cat_id AND title = '🌅 How the Daily Verse works'
  ) THEN
    INSERT INTO forum_threads (author_id, category_id, title, content, lang, pinned, locked)
    VALUES (
      v_system_id, v_cat_id,
      '🌅 How the Daily Verse works',
      '<h2>Daily Verse</h2>
<p>The Daily Verse is the scripture card shown at the top of the home screen each day.</p>

<h3>How it is chosen</h3>
<p>A new verse is selected every day. The verse is the same for all users on a given day, so you can discuss it with friends and in the forum.</p>

<h3>Reading the full chapter</h3>
<p>Tap the <strong>↗ Read on JW.org</strong> link on the verse card to open the full chapter in context on the Watchtower Online Library.</p>

<h3>Sharing the verse</h3>
<p>Tap the <strong>Share</strong> icon on the verse card to copy the verse text and reference to your clipboard, ready to paste into a message or post.</p>

<h3>Discussing it in the forum</h3>
<p>If the verse sparks a thought, head to the <strong>Forum</strong> and start a thread in the <em>Bible Discussion</em> category — mention the reference in your title so others can find it.</p>',
      'en', true, true
    );
  END IF;


  -- ── 11. Thread: Bookmarks ────────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM forum_threads
    WHERE category_id = v_cat_id AND title = '🔖 How to use Bookmarks'
  ) THEN
    INSERT INTO forum_threads (author_id, category_id, title, content, lang, pinned, locked)
    VALUES (
      v_system_id, v_cat_id,
      '🔖 How to use Bookmarks',
      '<h2>Bookmarks</h2>
<p>Bookmarks let you save forum threads you want to come back to later.</p>

<h3>Bookmarking a thread</h3>
<p>In any thread list, tap the <strong>🔖 bookmark icon</strong> on the right side of a thread row. The icon fills in to confirm the bookmark was saved.</p>

<h3>Viewing your bookmarks</h3>
<ol>
  <li>Open the navigation menu.</li>
  <li>Tap <strong>Bookmarks</strong>.</li>
  <li>All your saved threads are listed here. Tap any one to open it.</li>
</ol>

<h3>Removing a bookmark</h3>
<p>Tap the filled bookmark icon on any bookmarked thread (either in the thread list or in your Bookmarks page) to remove it.</p>

<h3>Tips</h3>
<ul>
  <li>Bookmark threads with unanswered questions you plan to reply to later.</li>
  <li>Save helpful threads from the FAQ & Help category for quick reference.</li>
</ul>',
      'en', true, true
    );
  END IF;


  -- ── 12. Thread: Search ────────────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM forum_threads
    WHERE category_id = v_cat_id AND title = '🔍 How to use Search'
  ) THEN
    INSERT INTO forum_threads (author_id, category_id, title, content, lang, pinned, locked)
    VALUES (
      v_system_id, v_cat_id,
      '🔍 How to use Search',
      '<h2>Search</h2>
<p>The Search page lets you find content across the entire app from one place.</p>

<h3>Opening Search</h3>
<p>Tap the 🔍 magnifying-glass icon in the navigation bar, or use the search bar at the top of specific pages (Study Notes, Forum categories).</p>

<h3>What gets searched</h3>
<ul>
  <li><strong>Forum threads</strong> — titles and content across all categories.</li>
  <li><strong>Study notes</strong> — your personal notes by title, content, and tag.</li>
  <li><strong>Community notes</strong> — public notes by title, content, and tag.</li>
  <li><strong>Users</strong> — find other members by display name to visit their profile or start a DM.</li>
</ul>

<h3>Tips</h3>
<ul>
  <li>Search by a book name (e.g., "Proverbs") to surface notes and threads that reference it.</li>
  <li>Search by tag to find community notes tagged with a topic (e.g., "prayer").</li>
  <li>Results update as you type — no need to press Enter.</li>
</ul>',
      'en', true, true
    );
  END IF;


  -- ── 13. Thread: Notifications ────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM forum_threads
    WHERE category_id = v_cat_id AND title = '🔔 How to set up Notifications'
  ) THEN
    INSERT INTO forum_threads (author_id, category_id, title, content, lang, pinned, locked)
    VALUES (
      v_system_id, v_cat_id,
      '🔔 How to set up Notifications',
      '<h2>Notifications</h2>
<p>Push notifications keep you updated on replies, messages, and activity without having to open the app.</p>

<h3>Enabling push notifications</h3>
<ol>
  <li>Go to <strong>Settings</strong> (tap your avatar → Settings).</li>
  <li>Tap <strong>Enable push notifications</strong>.</li>
  <li>When your browser or device asks for permission, tap <strong>Allow</strong>.</li>
</ol>

<h3>What triggers a notification</h3>
<ul>
  <li>Someone replies to a forum thread you are watching.</li>
  <li>Someone replies to your thread or post.</li>
  <li>You receive a new direct message.</li>
  <li>Someone likes your thread or study note.</li>
  <li>A reading plan daily reminder (if enabled in plan settings).</li>
</ul>

<h3>The notification bell</h3>
<p>The 🔔 bell icon in the top navigation shows a badge count when you have unread notifications. Tap it to see the full list. Tap any notification to jump directly to the relevant thread, message, or note.</p>

<h3>Watching a forum thread</h3>
<p>Inside any forum thread, tap the <strong>Watch</strong> button to subscribe to notifications for that specific thread. Tap again to unwatch.</p>

<h3>Turning off notifications</h3>
<p>Go to Settings → Notifications and toggle push notifications off. You can also revoke permission in your browser or device notification settings.</p>',
      'en', true, true
    );
  END IF;


  -- ── 14. Thread: Dark Mode & Settings ─────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM forum_threads
    WHERE category_id = v_cat_id AND title = '⚙️ Settings, Dark Mode & Language'
  ) THEN
    INSERT INTO forum_threads (author_id, category_id, title, content, lang, pinned, locked)
    VALUES (
      v_system_id, v_cat_id,
      '⚙️ Settings, Dark Mode & Language',
      '<h2>Settings, Dark Mode & Language</h2>
<p>Customise NWT Progress to suit your preferences.</p>

<h3>Dark Mode</h3>
<p>Tap the 🌙 moon icon in the top navigation bar to toggle between light and dark mode. Your preference is saved automatically.</p>

<h3>Changing language</h3>
<ol>
  <li>Tap your avatar → <strong>Settings</strong>.</li>
  <li>Under <strong>Language</strong>, choose your preferred language from the dropdown.</li>
  <li>The app UI switches immediately. Forum thread language filters will also update to match.</li>
</ol>
<p>You can also change language from the landing page before logging in, using the language selector in the top-right corner.</p>

<h3>Account settings</h3>
<ul>
  <li><strong>Display name</strong> — change how your name appears to others.</li>
  <li><strong>Avatar</strong> — upload a profile picture.</li>
  <li><strong>Email</strong> — view the email linked to your account.</li>
  <li><strong>Change password</strong> — available in Account settings.</li>
  <li><strong>Delete account</strong> — permanently removes your account and all data.</li>
</ul>

<h3>Subscription</h3>
<p>Tap <strong>Subscription</strong> in Settings to view your current plan, upgrade to Premium, or manage billing. Premium unlocks Study Notes folders, AI tools, and reading plan sharing.</p>',
      'en', true, true
    );
  END IF;

END $$;
