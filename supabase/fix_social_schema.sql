-- Fix Social Features Migration (Safe Run)

-- 1. Ensure Comments table exists
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safely reset policies for Comments
alter table public.comments enable row level security;

drop policy if exists "Public view comments" on public.comments;
create policy "Public view comments" on public.comments for select using (true);

drop policy if exists "Users create comments" on public.comments;
create policy "Users create comments" on public.comments for insert with check (auth.uid() = user_id);

-- 2. GAMIFICATION FUNCTIONS & TRIGGERS

-- Function to award tokens
create or replace function public.award_tokens(p_user_id uuid, p_amount int)
returns void as $$
begin
  update public.profiles 
  set points = points + p_amount, 
      xp = xp + p_amount 
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- Trigger Function: Post Created
create or replace function public.on_post_created()
returns trigger as $$
begin
  perform public.award_tokens(new.user_id, 10);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: Post (Award 10 pts)
drop trigger if exists award_points_on_post on public.posts;
create trigger award_points_on_post
  after insert on public.posts
  for each row execute procedure public.on_post_created();

-- Trigger Function: Comment Created
create or replace function public.on_comment_created()
returns trigger as $$
begin
  perform public.award_tokens(new.user_id, 5);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: Comment (Award 5 pts)
drop trigger if exists award_points_on_comment on public.comments;
create trigger award_points_on_comment
  after insert on public.comments
  for each row execute procedure public.on_comment_created();
