-- ── Stripe subscription columns on profiles ──────────────────────────────────
-- Run this in the Supabase SQL editor (dev project)

alter table profiles
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status    text not null default 'inactive';
  -- values: 'inactive' | 'active' | 'past_due' | 'canceled' | 'trialing'

-- Only the service role (Edge Functions) may write to these columns.
-- Authenticated users can read their own status.
alter table profiles enable row level security;

create policy "Users can read own subscription status"
  on profiles for select
  using (auth.uid() = id);

-- Service role bypasses RLS automatically — no policy needed for writes.

comment on column profiles.subscription_status is
  'Mirrors the Stripe subscription status. Set by the stripe-webhook Edge Function.';
