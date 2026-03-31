-- Fix infinite recursion in study_group_members / study_groups RLS policies.
--
-- The old sgm_select, sgm_update, sgm_delete policies queried study_group_members
-- from within a study_group_members policy → infinite recursion → 500 errors.
--
-- Fix: SECURITY DEFINER helper functions that run as the function owner and
-- therefore bypass RLS on their internal query, breaking the recursion.

CREATE OR REPLACE FUNCTION is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM study_group_members
    WHERE group_id = p_group_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_group_admin(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM study_group_members
    WHERE group_id = p_group_id AND user_id = auth.uid() AND role = 'admin'
  );
$$;

-- study_group_members policies

DROP POLICY IF EXISTS sgm_select ON study_group_members;
CREATE POLICY sgm_select ON study_group_members
  FOR SELECT
  USING (is_group_member(group_id));

DROP POLICY IF EXISTS sgm_update ON study_group_members;
CREATE POLICY sgm_update ON study_group_members
  FOR UPDATE
  USING (
    is_group_admin(group_id) OR
    EXISTS (SELECT 1 FROM study_groups sg WHERE sg.id = group_id AND sg.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS sgm_delete ON study_group_members;
CREATE POLICY sgm_delete ON study_group_members
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    is_group_admin(group_id) OR
    EXISTS (SELECT 1 FROM study_groups sg WHERE sg.id = group_id AND sg.creator_id = auth.uid())
  );

-- study_groups select policy

DROP POLICY IF EXISTS sg_select ON study_groups;
CREATE POLICY sg_select ON study_groups
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      is_private = false OR
      creator_id = auth.uid() OR
      is_group_member(id)
    )
  );
