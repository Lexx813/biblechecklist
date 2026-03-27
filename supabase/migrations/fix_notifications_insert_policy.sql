-- Drop the overly permissive insert policy.
-- Direct client inserts are no longer allowed.
-- All notification creation must go through create_notification() which is security definer.
drop policy if exists "insert_notifs" on public.notifications;
