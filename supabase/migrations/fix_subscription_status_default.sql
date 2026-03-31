-- Fix: new users were automatically getting 'gifted' (premium) status.
-- The column default was set to 'gifted' instead of 'free'.
ALTER TABLE profiles ALTER COLUMN subscription_status SET DEFAULT 'free';
