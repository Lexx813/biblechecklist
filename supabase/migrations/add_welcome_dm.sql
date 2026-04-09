-- ── Welcome DM on signup ──────────────────────────────────────────────────────
-- When a new user signs up, automatically open a DM conversation and send a
-- welcome message from the app owner account (alexx813@gmail.com).
-- Runs inside handle_new_user so it shares the same transaction as profile
-- creation. SECURITY DEFINER bypasses RLS so the trigger can write directly.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status       text;
  v_owner_id     uuid;
  v_conv_id      uuid;
BEGIN
  -- ── 1. Subscription status (early-adopter gift) ──────────────────────────
  IF (SELECT COUNT(*) FROM public.profiles) < 500 THEN
    v_status := 'gifted';
  ELSE
    v_status := 'free';
  END IF;

  -- ── 2. Create profile ────────────────────────────────────────────────────
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

  -- ── 3. Send welcome DM from owner account ───────────────────────────────
  -- Look up owner by email in auth.users (safe — trigger runs as postgres)
  SELECT id INTO v_owner_id
  FROM auth.users
  WHERE email = 'alexx813@gmail.com'
  LIMIT 1;

  -- Only proceed if the owner account exists and this isn't the owner signing up
  IF v_owner_id IS NOT NULL AND v_owner_id <> new.id THEN

    -- Create conversation
    INSERT INTO public.conversations DEFAULT VALUES
    RETURNING id INTO v_conv_id;

    -- Add both participants
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES
      (v_conv_id, v_owner_id),
      (v_conv_id, new.id);

    -- Send welcome message
    INSERT INTO public.messages (conversation_id, sender_id, content)
    VALUES (
      v_conv_id,
      v_owner_id,
      'Hey, welcome to JW Study! 👋 I''m Alexi, the person who built this app. '
      'Feel free to message me anytime — whether you have a question, run into a bug, '
      'or just want to share how your Bible reading is going. Happy studying! 📖'
    );

  END IF;

  RETURN new;
END;
$$;
