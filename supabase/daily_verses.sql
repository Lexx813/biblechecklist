-- Daily verses table
-- Populate this with your verse schedule.
-- The Edge Function picks the row where scheduled_date = today (UTC).

create table public.daily_verses (
  id            bigint generated always as identity primary key,
  scheduled_date date not null unique,
  reference     text not null,          -- e.g. "John 3:16"
  verse_text    text not null,
  reflection    text not null,
  accent_color  text not null default '#00d4ff',
  posted_at     timestamptz,            -- set after successful TikTok upload
  tiktok_video_id text                  -- TikTok publish_id returned by API
);

-- Only service role can write; no public read needed
alter table public.daily_verses enable row level security;

-- Seed a few upcoming verses (adjust dates as needed)
insert into public.daily_verses (scheduled_date, reference, verse_text, reflection, accent_color) values
  (current_date + 0, 'John 3:16',
   'For God so loved the world that he gave his only-begotten Son, so that everyone exercising faith in him might not be destroyed but have everlasting life.',
   'How does this verse shape your day?', '#00d4ff'),

  (current_date + 1, 'Psalm 119:105',
   'Your word is a lamp to my foot and a light for my path.',
   'In what area of your life do you need this light?', '#fbbf24'),

  (current_date + 2, 'Proverbs 3:5-6',
   'Trust in Jehovah with all your heart, and do not rely on your own understanding. In all your ways take notice of him, and he will make your paths straight.',
   'Where do you need to trust more fully today?', '#34d399'),

  (current_date + 3, 'Isaiah 40:31',
   'But those hoping in Jehovah will regain power. They will soar up with wings like eagles. They will run and not grow weary; they will walk and not tire out.',
   'What gives you strength to keep going?', '#a78bfa'),

  (current_date + 4, 'Matthew 6:33',
   'Keep on, then, seeking first the Kingdom and his righteousness, and all these other things will be added to you.',
   'What does seeking the Kingdom look like in your routine?', '#f472b6');
