-- friend_requests
create table if not exists public.friend_requests (
  id          uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id   uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at   timestamptz not null default now(),
  unique(from_user_id, to_user_id)
);

alter table public.friend_requests enable row level security;

create policy "users can read their own requests"
  on public.friend_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "users can send requests"
  on public.friend_requests for insert
  with check (auth.uid() = from_user_id);

create policy "recipients can update status"
  on public.friend_requests for update
  using (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id);

create policy "sender can delete pending request"
  on public.friend_requests for delete
  using (auth.uid() = from_user_id and status = 'pending');

create index on public.friend_requests(to_user_id, status);
create index on public.friend_requests(from_user_id, status);

-- friendships
create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  user_a_id    uuid not null references auth.users(id) on delete cascade,
  user_b_id    uuid not null references auth.users(id) on delete cascade,
  sponsored_by uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique(user_a_id, user_b_id),
  check (user_a_id < user_b_id)
);

alter table public.friendships enable row level security;

create policy "users can read their own friendships"
  on public.friendships for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

create policy "system insert only"
  on public.friendships for insert
  with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

create index on public.friendships(user_a_id);
create index on public.friendships(user_b_id);

-- invite_tokens
create table if not exists public.invite_tokens (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  token      text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

alter table public.invite_tokens enable row level security;

create policy "users can insert their own token"
  on public.invite_tokens for insert
  with check (auth.uid() = user_id);

-- public read for invite landing page (token lookup by visitors)
create policy "anyone can look up token owner"
  on public.invite_tokens for select
  using (true);
