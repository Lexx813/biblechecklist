-- Harden referral code generation.
-- Old: 8 hex chars from gen_random_uuid() → 32 bits of entropy (enumerable in hours).
-- New: 12 chars from base32 alphabet (no confusable chars) → ~60 bits.

CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Crockford-ish; no 0/1/I/O
  v_bytes bytea;
  v_i int;
BEGIN
  -- If user already has one, return it.
  SELECT referral_code INTO v_code FROM profiles WHERE id = p_user_id;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  LOOP
    v_bytes := gen_random_bytes(12);
    v_code := '';
    FOR v_i IN 0..11 LOOP
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, v_i) % 32) + 1, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = v_code);
  END LOOP;

  UPDATE profiles SET referral_code = v_code WHERE id = p_user_id;
  RETURN v_code;
END;
$$;
