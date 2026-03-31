-- Track which onboarding emails have been sent to each user
-- Values: 'welcome', 'day3', 'day7'
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_emails_sent TEXT[] NOT NULL DEFAULT '{}';
