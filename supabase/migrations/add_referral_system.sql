-- Referral system: referral_code on profiles + referrals table + RPCs

-- 1. Add referral columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id);

-- 2. Referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_id)
);

-- RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select_own" ON referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "referrals_insert_system" ON referrals
  FOR INSERT WITH CHECK (true);

-- 3. Generate (or return existing) referral code for a user
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
BEGIN
  SELECT referral_code INTO v_code FROM profiles WHERE id = p_user_id;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  -- Generate a short unique code (8 chars)
  LOOP
    v_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = v_code);
  END LOOP;

  UPDATE profiles SET referral_code = v_code WHERE id = p_user_id;
  RETURN v_code;
END;
$$;

-- 4. Apply a referral code for a new user
DROP FUNCTION IF EXISTS apply_referral(uuid, text);

CREATE OR REPLACE FUNCTION apply_referral(p_new_user_id uuid, p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  -- Find the referrer
  SELECT id INTO v_referrer_id FROM profiles WHERE referral_code = upper(p_code);
  IF v_referrer_id IS NULL THEN RETURN false; END IF;
  -- Don't allow self-referral
  IF v_referrer_id = p_new_user_id THEN RETURN false; END IF;
  -- Already referred?
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = p_new_user_id) THEN RETURN false; END IF;

  -- Link referred_by on new user's profile
  UPDATE profiles SET referred_by = v_referrer_id WHERE id = p_new_user_id;

  -- Record the referral
  INSERT INTO referrals (referrer_id, referred_id, status)
  VALUES (v_referrer_id, p_new_user_id, 'pending')
  ON CONFLICT (referred_id) DO NOTHING;

  RETURN true;
END;
$$;

-- 5. Confirm a referral when the referred user completes onboarding/first read
CREATE OR REPLACE FUNCTION confirm_referral(p_referred_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE referrals SET status = 'confirmed' WHERE referred_id = p_referred_id AND status = 'pending';
$$;
