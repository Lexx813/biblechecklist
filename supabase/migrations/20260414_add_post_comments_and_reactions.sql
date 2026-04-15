-- ── Post comments ───────────────────────────────────────────────────────────
create table if not exists public.user_post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.user_posts(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index idx_post_comments_post on public.user_post_comments(post_id, created_at);
create index idx_post_comments_author on public.user_post_comments(author_id);

alter table public.user_post_comments enable row level security;

create policy "Anyone can read comments on public posts"
  on public.user_post_comments for select
  using (true);

create policy "Authenticated users can add comments"
  on public.user_post_comments for insert
  with check (auth.uid() = author_id);

create policy "Authors can delete own comments"
  on public.user_post_comments for delete
  using (auth.uid() = author_id);

-- ── Post reactions (emoji) ──────────────────────────────────────────────────
create table if not exists public.user_post_reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.user_posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  emoji      text not null check (char_length(emoji) between 1 and 8),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, emoji)
);

create index idx_post_reactions_post on public.user_post_reactions(post_id);
create index idx_post_reactions_user on public.user_post_reactions(user_id);

alter table public.user_post_reactions enable row level security;

create policy "Anyone can read reactions"
  on public.user_post_reactions for select
  using (true);

create policy "Authenticated users can add reactions"
  on public.user_post_reactions for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own reactions"
  on public.user_post_reactions for delete
  using (auth.uid() = user_id);

-- Add comment_count and reaction_count to user_posts for fast display
alter table public.user_posts
  add column if not exists comment_count int not null default 0,
  add column if not exists reaction_counts jsonb not null default '{}'::jsonb;

-- ── Trigger: auto-update comment_count ──────────────────────────────────────
create or replace function public.update_post_comment_count() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.user_posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.user_posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger trg_post_comment_count
  after insert or delete on public.user_post_comments
  for each row execute function public.update_post_comment_count();

-- ── Trigger: auto-update reaction_counts JSONB ──────────────────────────────
create or replace function public.update_post_reaction_counts() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.user_posts
      set reaction_counts = (
        select coalesce(jsonb_object_agg(emoji, cnt), '{}'::jsonb)
        from (select emoji, count(*)::int as cnt from public.user_post_reactions where post_id = new.post_id group by emoji) sub
      )
    where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.user_posts
      set reaction_counts = (
        select coalesce(jsonb_object_agg(emoji, cnt), '{}'::jsonb)
        from (select emoji, count(*)::int as cnt from public.user_post_reactions where post_id = old.post_id group by emoji) sub
      )
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger trg_post_reaction_counts
  after insert or delete on public.user_post_reactions
  for each row execute function public.update_post_reaction_counts();
