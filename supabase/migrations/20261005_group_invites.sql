-- ============================================================================
-- Group invites (friends, email, link) + close the private-group self-join hole.
--
-- Who can invite (can_invite_to_group): owners/admins of any group, plus any
-- member of a public group. Private-group members can't, so the owner and
-- admins decide who gets in.
--
-- 1. group_invites: one invite code per group, only reachable through the
--    permission-checked RPCs below.
-- 2. get_group_invite_code (inviters) / reset_group_invite_code (admins).
-- 3. join_group_with_invite(code): adds the caller as a full member. Holding
--    the code is the inviter's approval.
-- 4. add_friends_to_group: inviter adds people they're friends with.
-- 5. invite_to_group_by_email: service_role only (called from
--    /api/group-invite after verifying the caller) so clients can't use it to
--    probe which emails have accounts. Existing users are added; otherwise
--    the route emails the invite link.
-- 6. notifications.type gains 'group_invite'.
-- 7. gm_insert was `auth.uid() = user_id` only, so anyone could insert
--    themselves into a private group as status 'member' (or role 'admin')
--    straight from the API. Self-inserts are now limited to:
--      - the group owner creating their own owner row, or
--      - role 'member' that is pending, or joining a public group.
--
-- Apply via the Supabase Studio SQL Editor.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.group_invites (
  group_id   uuid        PRIMARY KEY REFERENCES public.groups ON DELETE CASCADE,
  code       text        NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No policies: all access goes through the SECURITY DEFINER functions.
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.group_invites FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.can_invite_to_group(p_group_id uuid, p_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM group_members m
    JOIN groups g ON g.id = m.group_id
    WHERE m.group_id = p_group_id
      AND m.user_id  = p_user
      AND m.status   = 'member'
      AND (m.role IN ('owner', 'admin') OR g.privacy = 'public')
  );
$$;

-- Adds p_user as a full member (promoting a pending request) and notifies
-- them. Returns false if they were already a member. Internal helper.
CREATE OR REPLACE FUNCTION public._add_group_member_with_notice(p_group_id uuid, p_user uuid, p_actor uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user AND status = 'member'
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO group_members (group_id, user_id, role, status)
  VALUES (p_group_id, p_user, 'member', 'member')
  ON CONFLICT (group_id, user_id) DO UPDATE SET status = 'member';

  INSERT INTO notifications (user_id, actor_id, type, link_hash)
  VALUES (p_user, p_actor, 'group_invite', 'groups/' || p_group_id);

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_group_invite_code(p_group_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_code text;
BEGIN
  IF NOT can_invite_to_group(p_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'not allowed to invite to this group' USING ERRCODE = '42501';
  END IF;

  INSERT INTO group_invites (group_id) VALUES (p_group_id)
  ON CONFLICT (group_id) DO NOTHING;

  SELECT code INTO v_code FROM group_invites WHERE group_id = p_group_id;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_group_invite_code(p_group_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_code text := replace(gen_random_uuid()::text, '-', '');
BEGIN
  IF NOT is_group_admin(p_group_id) THEN
    RAISE EXCEPTION 'only group admins can reset the invite link' USING ERRCODE = '42501';
  END IF;

  INSERT INTO group_invites (group_id, code) VALUES (p_group_id, v_code)
  ON CONFLICT (group_id) DO UPDATE SET code = EXCLUDED.code, created_at = now();

  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_group_with_invite(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_me    uuid := auth.uid();
  v_group uuid;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT group_id INTO v_group FROM group_invites WHERE code = p_code;
  IF v_group IS NULL THEN
    RETURN NULL;
  END IF;

  -- Promote a pending request; never touch an existing member's role.
  INSERT INTO group_members (group_id, user_id, role, status)
  VALUES (v_group, v_me, 'member', 'member')
  ON CONFLICT (group_id, user_id) DO UPDATE SET status = 'member'
    WHERE group_members.status <> 'member';

  RETURN v_group;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_friends_to_group(p_group_id uuid, p_user_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_me    uuid := auth.uid();
  v_uid   uuid;
  v_added integer := 0;
BEGIN
  IF v_me IS NULL OR NOT can_invite_to_group(p_group_id, v_me) THEN
    RAISE EXCEPTION 'not allowed to invite to this group' USING ERRCODE = '42501';
  END IF;
  IF coalesce(array_length(p_user_ids, 1), 0) > 50 THEN
    RAISE EXCEPTION 'too many invites at once';
  END IF;

  FOREACH v_uid IN ARRAY coalesce(p_user_ids, '{}'::uuid[]) LOOP
    -- Only people the inviter is actually friends with.
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM friendships
      WHERE user_a_id = LEAST(v_me, v_uid) AND user_b_id = GREATEST(v_me, v_uid)
    );
    IF _add_group_member_with_notice(p_group_id, v_uid, v_me) THEN
      v_added := v_added + 1;
    END IF;
  END LOOP;

  RETURN v_added;
END;
$$;

-- service_role only. Returns status 'added' | 'already_member' | 'not_found',
-- plus what the API route needs to email a non-user.
CREATE OR REPLACE FUNCTION public.invite_to_group_by_email(p_actor uuid, p_group_id uuid, p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user  uuid;
  v_code  text;
  v_group text;
  v_actor text;
BEGIN
  IF NOT can_invite_to_group(p_group_id, p_actor) THEN
    RAISE EXCEPTION 'not allowed to invite to this group' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_user FROM profiles WHERE lower(email) = lower(trim(p_email)) LIMIT 1;

  IF v_user IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status',
      CASE WHEN _add_group_member_with_notice(p_group_id, v_user, p_actor) THEN 'added' ELSE 'already_member' END
    );
  END IF;

  SELECT name INTO v_group FROM groups WHERE id = p_group_id;
  SELECT display_name INTO v_actor FROM profiles WHERE id = p_actor;
  INSERT INTO group_invites (group_id) VALUES (p_group_id) ON CONFLICT (group_id) DO NOTHING;
  SELECT code INTO v_code FROM group_invites WHERE group_id = p_group_id;

  RETURN jsonb_build_object(
    'status', 'not_found',
    'code', v_code,
    'group_name', v_group,
    'inviter_name', v_actor
  );
END;
$$;

REVOKE ALL ON FUNCTION public.can_invite_to_group(uuid, uuid)                 FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public._add_group_member_with_notice(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_group_invite_code(uuid)                     FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reset_group_invite_code(uuid)                   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_group_with_invite(text)                    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_friends_to_group(uuid, uuid[])              FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.invite_to_group_by_email(uuid, uuid, text)      FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_invite_to_group(uuid, uuid)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_invite_code(uuid)                TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_group_invite_code(uuid)              TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_with_invite(text)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_friends_to_group(uuid, uuid[])         TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_to_group_by_email(uuid, uuid, text) TO service_role;

DROP POLICY IF EXISTS gm_insert ON public.group_members;
CREATE POLICY gm_insert ON public.group_members FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    AND (
      (role = 'owner' AND EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = group_id AND g.owner_id = (select auth.uid())
      ))
      OR (role = 'member' AND (
        status = 'pending'
        OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.privacy = 'public')
      ))
    )
  );

-- Add 'group_invite' to whatever the live notifications_type_check allows
-- (the repo's copies of this constraint have drifted from production).
DO $do$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO v_def
  FROM pg_constraint
  WHERE conrelid = 'public.notifications'::regclass
    AND conname = 'notifications_type_check';

  IF v_def IS NOT NULL AND position('group_invite' IN v_def) = 0 THEN
    IF position('ARRAY[' IN v_def) = 0 THEN
      RAISE EXCEPTION 'unexpected notifications_type_check shape: %', v_def;
    END IF;
    ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
    EXECUTE 'ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check '
      || replace(v_def, 'ARRAY[', 'ARRAY[''group_invite''::text, ');
  END IF;
END;
$do$;

COMMIT;
