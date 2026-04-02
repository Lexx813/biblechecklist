-- Add meeting_prep_reminder to the notifications.type check constraint
-- The original constraint only allows: 'reply', 'comment', 'mention'
-- This migration drops and recreates it to include 'meeting_prep_reminder'

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('reply', 'comment', 'mention', 'meeting_prep_reminder'));
