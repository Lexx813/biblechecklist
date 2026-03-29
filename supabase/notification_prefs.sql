-- Add email notification preference columns to profiles.
-- Run this in the Supabase SQL Editor.

alter table public.profiles
  add column if not exists email_notifications_blog   boolean not null default true,
  add column if not exists email_notifications_digest boolean not null default true,
  add column if not exists email_notifications_streak boolean not null default true;
