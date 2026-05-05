-- Add Kingdom song number to `songs` for SEO/discovery aliases.
--
-- Why: TikTok analytics show people searching by Kingdom song number
-- ("Song 113 jehovahs witness"). Surfacing the number in URLs and
-- metadata gives us a wedge into both TikTok's in-app search and
-- general web search.
--
-- Nullable because not every song is a Kingdom song — original
-- compositions stay numberless. Unique partial index enforces "at most
-- one song per Kingdom number" without blocking multiple NULLs.

alter table public.songs
  add column if not exists song_number int;

create unique index if not exists songs_song_number_unique
  on public.songs (song_number)
  where song_number is not null;

comment on column public.songs.song_number is
  'Kingdom song number (1–N) when applicable. Used for /songs/song-<N> URL alias and "Kingdom song N" SEO copy. NULL for original compositions.';
