-- Daily briefs: remember which language a cached brief was written in, so the
-- /api/daily-brief cache regenerates when the user switches UI language instead
-- of serving a stale brief in the wrong language until the next day.

alter table public.daily_briefs
  add column if not exists lang text not null default 'en';
