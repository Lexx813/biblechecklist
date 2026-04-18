-- ── New columns on profiles ────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_marketing_unsubscribed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';

-- ── email_campaigns ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  subject         text NOT NULL,
  preview_text    text,
  html_body       text NOT NULL DEFAULT '',
  type            text NOT NULL DEFAULT 'broadcast'
                    CHECK (type IN ('broadcast', 'newsletter', 'sequence')),
  status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'recurring')),
  segment_config  jsonb NOT NULL DEFAULT '{}',
  schedule_at     timestamptz,
  recurrence_cron text,
  next_run_at     timestamptz,
  last_sent_at    timestamptz,
  sent_count      integer NOT NULL DEFAULT 0,
  created_by      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_admin_all" ON email_campaigns
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- ── campaign_sends ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_sends (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resend_email_id text,
  status          text NOT NULL DEFAULT 'sent'
                    CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  sent_at         timestamptz NOT NULL DEFAULT now(),
  delivered_at    timestamptz,
  opened_at       timestamptz,
  clicked_at      timestamptz,
  bounced_at      timestamptz,
  UNIQUE (campaign_id, user_id)
);

ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sends_admin_read" ON campaign_sends
  FOR SELECT USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- ── user_tags ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_tags (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag        text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tag)
);

ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_admin_all" ON user_tags
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- ── estimate_campaign_audience RPC ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION estimate_campaign_audience(segment_config jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count        integer;
  v_plan         text;
  v_languages    text[];
  v_inactive     integer;
  v_joined_bef   timestamptz;
  v_joined_aft   timestamptz;
  v_min_chapters integer;
  v_inc_tags     text[];
  v_exc_tags     text[];
BEGIN
  v_plan         := segment_config->>'plan';
  v_languages    := ARRAY(SELECT jsonb_array_elements_text(COALESCE(segment_config->'languages', '[]'::jsonb)));
  v_inactive     := (segment_config->>'inactive_days')::integer;
  v_joined_bef   := (segment_config->>'joined_before')::timestamptz;
  v_joined_aft   := (segment_config->>'joined_after')::timestamptz;
  v_min_chapters := (segment_config->>'min_chapters_read')::integer;
  v_inc_tags     := ARRAY(SELECT jsonb_array_elements_text(COALESCE(segment_config->'tags', '[]'::jsonb)));
  v_exc_tags     := ARRAY(SELECT jsonb_array_elements_text(COALESCE(segment_config->'exclude_tags', '[]'::jsonb)));

  SELECT COUNT(DISTINCT p.id) INTO v_count
  FROM profiles p
  WHERE p.email_marketing_unsubscribed = false
    AND p.is_banned = false
    AND (
      v_plan IS NULL OR v_plan = 'all' OR
      (v_plan = 'premium' AND p.subscription_status = 'active') OR
      (v_plan = 'free'    AND p.subscription_status != 'active')
    )
    AND (array_length(v_languages, 1) IS NULL OR p.preferred_language = ANY(v_languages))
    AND (v_inactive IS NULL OR p.last_active_at < now() - (v_inactive || ' days')::interval)
    AND (v_joined_bef IS NULL OR p.created_at < v_joined_bef)
    AND (v_joined_aft IS NULL OR p.created_at > v_joined_aft)
    AND (
      v_min_chapters IS NULL OR
      (SELECT COUNT(*) FROM chapter_reads cr WHERE cr.user_id = p.id) >= v_min_chapters
    )
    AND (
      array_length(v_inc_tags, 1) IS NULL OR
      EXISTS (SELECT 1 FROM user_tags ut WHERE ut.user_id = p.id AND ut.tag = ANY(v_inc_tags))
    )
    AND (
      array_length(v_exc_tags, 1) IS NULL OR
      NOT EXISTS (SELECT 1 FROM user_tags ut WHERE ut.user_id = p.id AND ut.tag = ANY(v_exc_tags))
    );

  RETURN COALESCE(v_count, 0);
END;
$$;
