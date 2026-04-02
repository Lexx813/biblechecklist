-- supabase/migrations/add_group_challenges.sql

-- 1. Group challenges table
create table if not exists group_challenges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references study_groups(id) on delete cascade,
  plan_key text not null,
  start_date date not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  ended_at timestamptz
);

create index if not exists idx_group_challenges_group_created
  on group_challenges(group_id, created_at desc);

alter table group_challenges enable row level security;

create policy "Group members read challenges"
  on group_challenges for select
  using (
    exists (
      select 1 from study_group_members
      where study_group_members.group_id = group_challenges.group_id
        and study_group_members.user_id = auth.uid()
    )
  );

create policy "Group admins insert challenges"
  on group_challenges for insert
  with check (
    exists (
      select 1 from study_group_members
      where study_group_members.group_id = group_challenges.group_id
        and study_group_members.user_id = auth.uid()
        and study_group_members.role = 'admin'
    )
  );

create policy "Group admins update challenges"
  on group_challenges for update
  using (
    exists (
      select 1 from study_group_members
      where study_group_members.group_id = group_challenges.group_id
        and study_group_members.user_id = auth.uid()
        and study_group_members.role = 'admin'
    )
  );

-- 2. RPC: get_group_challenge_progress
create or replace function get_group_challenge_progress(
  p_challenge_id uuid,
  p_plan_chapters jsonb
)
returns table(
  user_id uuid,
  display_name text,
  avatar_url text,
  chapters_done int,
  total_chapters int,
  pct numeric
)
language plpgsql
security definer
as $$
declare
  v_group_id uuid;
  v_start_date date;
  v_total int;
begin
  select gc.group_id, gc.start_date
  into v_group_id, v_start_date
  from group_challenges gc
  where gc.id = p_challenge_id;

  if v_group_id is null then
    return;
  end if;

  v_total := jsonb_array_length(p_plan_chapters);

  return query
  select
    m.user_id,
    coalesce(p.display_name, 'Anonymous') as display_name,
    p.avatar_url,
    count(cr.id)::int as chapters_done,
    v_total as total_chapters,
    case when v_total > 0
      then round(count(cr.id)::numeric / v_total * 100, 1)
      else 0
    end as pct
  from study_group_members m
  join profiles p on p.id = m.user_id
  left join chapter_reads cr on cr.user_id = m.user_id
    and cr.read_at::date >= v_start_date
    and exists (
      select 1
      from jsonb_array_elements(p_plan_chapters) as pc
      where (pc->>'bookIndex')::int = cr.book_index
        and (pc->>'chapter')::int = cr.chapter
    )
  where m.group_id = v_group_id
  group by m.user_id, p.display_name, p.avatar_url
  order by chapters_done desc, p.display_name;
end;
$$;
