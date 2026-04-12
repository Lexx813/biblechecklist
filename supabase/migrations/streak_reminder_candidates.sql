-- RPC: get_streak_reminder_candidates
-- Returns users who have an active reading streak but haven't read today.
-- Used by the streak-reminder edge function cron job.

CREATE OR REPLACE FUNCTION public.get_streak_reminder_candidates(p_today date)
RETURNS TABLE(user_id uuid, streak int)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    ra.user_id,
    -- count consecutive days ending yesterday (they haven't read today yet)
    COUNT(*)::int AS streak
  FROM public.reading_activity ra
  WHERE
    -- Active in the last 7 days (has a streak worth preserving)
    ra.activity_date >= (p_today - INTERVAL '7 days')::date
    AND ra.activity_date < p_today
    -- Has NOT read today
    AND NOT EXISTS (
      SELECT 1 FROM public.reading_activity ra2
      WHERE ra2.user_id = ra.user_id
        AND ra2.activity_date = p_today
    )
    -- Has at least one push subscription (opted into push notifications)
    AND EXISTS (
      SELECT 1 FROM public.push_subscriptions ps
      WHERE ps.user_id = ra.user_id
    )
    -- Don't send if we already sent a streak_reminder today
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = ra.user_id
        AND n.type = 'streak_reminder'
        AND n.created_at::date = p_today
    )
  GROUP BY ra.user_id
  HAVING COUNT(*) >= 2 -- Only remind if streak is at least 2 days
$$;
