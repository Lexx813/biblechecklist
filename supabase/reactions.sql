-- Generic reactions table — works for forum threads, user posts, badges, verses, notes, etc.
-- target_type is a free-form text discriminator ("thread" | "post" | "badge" | "verse" | "note" | ...)
-- target_id is text to allow composite keys (e.g. "user_id:level" for badges)

create table if not exists public.feed_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id, emoji)
);

create index if not exists idx_feed_reactions_target
  on public.feed_reactions (target_type, target_id);

create index if not exists idx_feed_reactions_user
  on public.feed_reactions (user_id);

alter table public.feed_reactions enable row level security;

drop policy if exists "feed_reactions_select_all" on public.feed_reactions;
create policy "feed_reactions_select_all"
  on public.feed_reactions for select
  using (true);

drop policy if exists "feed_reactions_insert_own" on public.feed_reactions;
create policy "feed_reactions_insert_own"
  on public.feed_reactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "feed_reactions_delete_own" on public.feed_reactions;
create policy "feed_reactions_delete_own"
  on public.feed_reactions for delete
  using (auth.uid() = user_id);

-- Toggle a reaction. Returns true if added, false if removed.
create or replace function public.toggle_reaction(
  p_target_type text,
  p_target_id text,
  p_emoji text
) returns boolean
language plpgsql security definer as $$
declare
  v_uid uuid := auth.uid();
  v_existing uuid;
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;

  select id into v_existing
  from public.feed_reactions
  where user_id = v_uid
    and target_type = p_target_type
    and target_id = p_target_id
    and emoji = p_emoji;

  if v_existing is not null then
    delete from public.feed_reactions where id = v_existing;
    return false;
  end if;

  insert into public.feed_reactions (user_id, target_type, target_id, emoji)
  values (v_uid, p_target_type, p_target_id, p_emoji);
  return true;
end; $$;

-- Bulk fetch reaction summary for a list of targets.
-- Input: jsonb array [{"type":"thread","id":"<uuid>"}, ...]
-- Output: jsonb { "<type>:<id>": { "counts": {"👍": 3, ...}, "mine": ["👍","🙏"] } }
create or replace function public.get_reactions_bulk(p_targets jsonb)
returns jsonb
language plpgsql stable security definer as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb := '{}'::jsonb;
  v_pairs record;
  v_counts jsonb;
  v_mine jsonb;
  v_key text;
begin
  for v_pairs in
    select (t->>'type')::text as ttype, (t->>'id')::text as tid
    from jsonb_array_elements(p_targets) as t
  loop
    v_key := v_pairs.ttype || ':' || v_pairs.tid;

    select coalesce(jsonb_object_agg(emoji, c), '{}'::jsonb)
      into v_counts
    from (
      select emoji, count(*)::int as c
      from public.feed_reactions
      where target_type = v_pairs.ttype and target_id = v_pairs.tid
      group by emoji
    ) s;

    if v_uid is not null then
      select coalesce(jsonb_agg(emoji), '[]'::jsonb)
        into v_mine
      from public.feed_reactions
      where target_type = v_pairs.ttype
        and target_id = v_pairs.tid
        and user_id = v_uid;
    else
      v_mine := '[]'::jsonb;
    end if;

    v_result := v_result || jsonb_build_object(v_key, jsonb_build_object('counts', v_counts, 'mine', v_mine));
  end loop;

  return v_result;
end; $$;

grant execute on function public.toggle_reaction(text, text, text) to authenticated;
grant execute on function public.get_reactions_bulk(jsonb) to authenticated, anon;
