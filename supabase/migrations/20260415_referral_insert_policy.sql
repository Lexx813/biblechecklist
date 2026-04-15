-- Create referrals table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.referrals (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can see referrals they are part of
DROP POLICY IF EXISTS "referrals_select_own" ON public.referrals;
CREATE POLICY "referrals_select_own"
  ON public.referrals FOR SELECT
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Drop the open INSERT policy — all inserts go through apply_referral() RPC
-- (SECURITY DEFINER) which enforces: no self-referral, no duplicate, valid code.
DROP POLICY IF EXISTS "referrals_insert_system" ON public.referrals;
