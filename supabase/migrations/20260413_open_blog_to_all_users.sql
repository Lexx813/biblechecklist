-- Open blog posting to all authenticated users (remove can_blog gate)

-- Drop the old permission-gated policies
drop policy if exists "Blog writers can create posts" on public.blog_posts;
drop policy if exists "Authors can update own posts" on public.blog_posts;

-- Any authenticated user can create their own posts
create policy "Authenticated users can create posts"
  on public.blog_posts for insert
  with check (auth.uid() = author_id);

-- Any authenticated user can update their own posts
create policy "Authors can update own posts"
  on public.blog_posts for update
  using (auth.uid() = author_id);
