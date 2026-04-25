-- AI Conversations — persistent chat history for the /ai page
--
-- Schema:
--   ai_conversations  : one row per conversation (user-owned)
--   ai_messages       : one row per turn (user message OR assistant response)
--
-- The existing /api/ai-chat route is stateless. The /ai page persists turns
-- here so users can resume conversations across sessions.
--
-- The AIStudyBubble (in-app floating bubble) does NOT use these tables —
-- it stays ephemeral. /ai is the persistent surface.
--
-- Run in Supabase SQL Editor.

-- ── ai_conversations ───────────────────────────────────────────────────────
create table if not exists public.ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'New conversation',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Optional context captured at creation (page, book, chapter)
  context     jsonb
);

create index if not exists ai_conversations_user_updated_idx
  on public.ai_conversations (user_id, updated_at desc);

alter table public.ai_conversations enable row level security;

drop policy if exists "ai_conversations_owner_select" on public.ai_conversations;
create policy "ai_conversations_owner_select"
  on public.ai_conversations for select
  using (auth.uid() = user_id);

drop policy if exists "ai_conversations_owner_insert" on public.ai_conversations;
create policy "ai_conversations_owner_insert"
  on public.ai_conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "ai_conversations_owner_update" on public.ai_conversations;
create policy "ai_conversations_owner_update"
  on public.ai_conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ai_conversations_owner_delete" on public.ai_conversations;
create policy "ai_conversations_owner_delete"
  on public.ai_conversations for delete
  using (auth.uid() = user_id);

-- ── ai_messages ────────────────────────────────────────────────────────────
create table if not exists public.ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  -- Content blocks as Anthropic SDK shape: text + tool_use + tool_result.
  -- Plain text-only turns store [{ "type": "text", "text": "..." }].
  content         jsonb not null,
  created_at      timestamptz not null default now()
);

create index if not exists ai_messages_conversation_created_idx
  on public.ai_messages (conversation_id, created_at);

alter table public.ai_messages enable row level security;

drop policy if exists "ai_messages_owner_select" on public.ai_messages;
create policy "ai_messages_owner_select"
  on public.ai_messages for select
  using (auth.uid() = user_id);

drop policy if exists "ai_messages_owner_insert" on public.ai_messages;
create policy "ai_messages_owner_insert"
  on public.ai_messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "ai_messages_owner_delete" on public.ai_messages;
create policy "ai_messages_owner_delete"
  on public.ai_messages for delete
  using (auth.uid() = user_id);

-- ── Updated_at trigger on conversations ────────────────────────────────────
-- When a message is inserted, bump the parent conversation's updated_at
-- so it floats to the top of the sidebar.
create or replace function public.touch_ai_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ai_conversations
     set updated_at = now()
   where id = new.conversation_id;
  return new;
end
$$;

drop trigger if exists ai_messages_touch_conversation on public.ai_messages;
create trigger ai_messages_touch_conversation
  after insert on public.ai_messages
  for each row
  execute function public.touch_ai_conversation_on_message();
