-- Author-bio infrastructure for blog SSR (per-post E-E-A-T signal).
--
-- The blog SSR fallback at `app/blog/[slug]/page.tsx` renders an "About the
-- author" block. When the profile has no custom bio it falls back to a
-- generic JW-publisher description. These columns let authors override.
--
-- All three are nullable — every existing profile keeps working without
-- touch. RLS already lets users update their own profile row, so no policy
-- changes are needed.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio              text,
  ADD COLUMN IF NOT EXISTS years_baptized   smallint,
  ADD COLUMN IF NOT EXISTS congregation_role text;

COMMENT ON COLUMN public.profiles.bio              IS 'Author bio shown on /blog/[slug] SSR. Max 600 chars recommended for readability.';
COMMENT ON COLUMN public.profiles.years_baptized   IS 'Optional, self-attested. Surfaced as an E-E-A-T signal on blog posts.';
COMMENT ON COLUMN public.profiles.congregation_role IS 'Optional, self-attested (publisher / pioneer / elder / ministerial servant).';
