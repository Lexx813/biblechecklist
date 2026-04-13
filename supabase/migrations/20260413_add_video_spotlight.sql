alter table videos
  add column if not exists is_spotlight boolean not null default false;
