-- Social Features Migration

-- 1. POSTS (The Feed)
create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  
  content text,
  image_url text,
  
  -- Metrics (denormalized for performance)
  likes_count int default 0,
  comments_count int default 0,
  
  is_promoted boolean default false, -- True if boosted with tokens
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.posts enable row level security;
create policy "Public view posts" on public.posts for select using (true);
create policy "Users create posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "Users update likes" on public.posts for update using (true); -- Simplified for demo

-- 2. COMMENTS
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;
create policy "Public view comments" on public.comments for select using (true);
create policy "Users create comments" on public.comments for insert with check (auth.uid() = user_id);

-- 3. GAMIFICATION TRIGGER (Earn Tokens on Activity)
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

-- Trigger: Award 10 points for creating a post
create or replace function public.on_post_created()
returns trigger as $$
begin
  perform public.award_tokens(new.user_id, 10);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists award_points_on_post on public.posts;
create trigger award_points_on_post
  after insert on public.posts
  for each row execute procedure public.on_post_created();

-- Trigger: Award 5 points for commenting
create or replace function public.on_comment_created()
returns trigger as $$
begin
  perform public.award_tokens(new.user_id, 5);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists award_points_on_comment on public.comments;
create trigger award_points_on_comment
  after insert on public.comments
  for each row execute procedure public.on_comment_created();
