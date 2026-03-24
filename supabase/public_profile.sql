-- Allow any authenticated user to read any user's reading progress
-- (needed so public profile pages can display Bible reading stats)
CREATE POLICY "reading_progress_authenticated_read"
  ON public.reading_progress FOR SELECT
  TO authenticated
  USING (true);

-- Allow any authenticated user to read any user's quiz progress
-- (needed so public profile pages can display quiz badges)
-- Note: multiple SELECT policies are OR'd, so own-rows policy still applies;
-- this just adds the broader authenticated-read permission.
CREATE POLICY "user_quiz_progress_authenticated_read"
  ON public.user_quiz_progress FOR SELECT
  TO authenticated
  USING (true);
