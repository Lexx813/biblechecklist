-- Block user feature: mutual content hiding between users

create table if not exists user_blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references profiles(id) on delete cascade,
  blocked_id  uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(blocker_id, blocked_id)
);
