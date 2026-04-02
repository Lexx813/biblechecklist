-- ── Early-Adopter Promotion ──────────────────────────────────────────────────
-- The first 500 users to create an account receive subscription_status = 'gifted'
-- automatically. After 500 profiles exist the trigger falls back to 'free'.

-- 1. Updated signup trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status text;
BEGIN
  -- Gift premium to the first 500 sign-ups
  IF (SELECT COUNT(*) FROM public.profiles) < 500 THEN
    v_status := 'gifted';
  ELSE
    v_status := 'free';
  END IF;

  INSERT INTO public.profiles (id, email, display_name, subscription_status)
  VALUES (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    ),
    v_status
  )
  ON CONFLICT (id) DO UPDATE
    SET display_name = coalesce(excluded.display_name, profiles.display_name);

  RETURN new;
END;
$$;

-- 2. Backfill existing free-tier users who are within the first 500 ────────────
-- Only promotes users currently on 'free' — does not touch active/trialing/canceled.
UPDATE public.profiles
SET subscription_status = 'gifted'
WHERE id IN (
  SELECT id
  FROM   public.profiles
  ORDER  BY created_at ASC
  LIMIT  500
)
AND subscription_status = 'free';

-- 3. RPC: spots remaining for the landing page counter ────────────────────────
CREATE OR REPLACE FUNCTION public.get_early_adopter_spots_left()
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT GREATEST(0, 500 - COUNT(*)::integer) FROM public.profiles;
$$;

GRANT EXECUTE ON FUNCTION public.get_early_adopter_spots_left() TO anon, authenticated;
