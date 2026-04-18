  -- AI usage logging table
  CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at     timestamptz NOT NULL DEFAULT now(),
    user_id        uuid        REFERENCES profiles(id) ON DELETE SET NULL,
    model          text        NOT NULL,
    input_tokens   integer     NOT NULL DEFAULT 0,
    output_tokens  integer     NOT NULL DEFAULT 0,
    tool_used      text,                          -- 'save_note' | 'get_my_notes' | 'create_blog_draft' | null
    page           text,                          -- nav context page
    cost_usd       numeric(10,6) NOT NULL DEFAULT 0
  );

  -- Only admins can read; the service role key writes from the API route
  ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "ai_usage_admin_read" ON ai_usage_logs
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    );

  -- Indexes for the analytics queries
  CREATE INDEX IF NOT EXISTS ai_usage_logs_created_at_idx ON ai_usage_logs (created_at DESC);
  CREATE INDEX IF NOT EXISTS ai_usage_logs_user_id_idx    ON ai_usage_logs (user_id);
  CREATE INDEX IF NOT EXISTS ai_usage_logs_tool_used_idx  ON ai_usage_logs (tool_used);
