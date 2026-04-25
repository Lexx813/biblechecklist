-- Meeting prep weekly scrape cron
--
-- Invokes the scrape-meeting-content Edge Function every Sunday at 23:00 UTC
-- so the upcoming week's CLAM + Watchtower study content is ready for users
-- by Monday morning local time.
--
-- Pre-requisites (run-once setup, already done for the project):
--   create extension if not exists pg_cron;
--   create extension if not exists pg_net;
--   alter database postgres set vault.secret_keys = ...;  -- via Supabase dashboard
--
-- Required vault secrets:
--   CRON_SECRET — same value set on the Edge Function's CRON_SECRET secret
--
-- This file is run manually in Supabase SQL Editor (per project workflow).
-- Re-running is safe: it unschedules the previous job before re-creating it.

-- 1) Drop previous schedule if it exists (idempotent)
do $$
declare
  job_id bigint;
begin
  select jobid into job_id from cron.job where jobname = 'meeting-prep-weekly-scrape';
  if job_id is not null then
    perform cron.unschedule(job_id);
  end if;
end
$$;

-- 2) Schedule weekly scrape every Sunday 23:00 UTC
select cron.schedule(
  'meeting-prep-weekly-scrape',
  '0 23 * * 0',  -- minute hour day-of-month month day-of-week (Sun=0)
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/scrape-meeting-content',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- 3) Verification — should show one row for 'meeting-prep-weekly-scrape'
-- select jobname, schedule, active from cron.job where jobname = 'meeting-prep-weekly-scrape';
