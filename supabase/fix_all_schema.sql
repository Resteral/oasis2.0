-- MASTER FIX SCRIPT
-- Run this to fix "user_id" errors and enable Community/Storefronts

-- 1. Enable Extensions
create extension if not exists postgis schema public;
set search_path = public, extensions;

-- 2. FIX ORDERS TABLE (Delivery & Online Ordering)
drop table if exists public.orders cascade;
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null, -- Fixed from customer_id
  product_name text not null,
  store_name text not null,
  store_address text,
  store_location geography(POINT),
  delivery_address text not null,
  delivery_location geography(POINT),
  
  -- New: Online Ordering Fields
  price numeric default 0,
  quantity int default 1,
  total_amount numeric generated always as (price * quantity) stored,
  
  status text default 'pending' check (status in ('pending', 'confirmed', 'claimed', 'picked_up', 'delivered', 'cancelled')),
  driver_id uuid references auth.users(id),
  driver_payout numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.orders enable row level security;
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can create orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Anyone can view pending orders" on public.orders for select using (status = 'pending');
create policy "Drivers/Sellers update orders" on public.orders for update using (true);

-- 2.5 NEW: FORUMS (User Created Topics)
drop table if exists public.forums cascade;
create table public.forums (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  icon text, -- Emoji or URL
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.forums enable row level security;
create policy "Public view forums" on public.forums for select using (true);
create policy "Users create forums" on public.forums for insert with check (auth.uid() = creator_id);

-- 3. FIX SOCIAL TABLES (Community Feed)
drop table if exists public.posts cascade;
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  forum_id uuid references public.forums(id), -- Optional: Link to specific forum
  content text,
  image_url text,
  video_url text, -- New: Video Support
  likes_count int default 0,
  comments_count int default 0,
  is_promoted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.posts enable row level security;
create policy "Public view posts" on public.posts for select using (true);
create policy "Users create posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "Users update likes" on public.posts for update using (true);

-- Comments Table (Adding this to "Finish" discussions)
drop table if exists public.comments cascade;
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.comments enable row level security;
create policy "Public view comments" on public.comments for select using (true);
create policy "Users create comments" on public.comments for insert with check (auth.uid() = user_id);

-- 5. NEW: EVENTS TABLE (Map Markers)
drop table if exists public.events cascade;
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  organizer_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  event_date timestamp with time zone not null,
  location geography(POINT) not null, -- For Radar Map
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.events enable row level security;
create policy "Public view events" on public.events for select using (true);
create policy "Users create events" on public.events for insert with check (auth.uid() = organizer_id);

-- 6. NEW: PROMOTION FUNCTION (Deduct 5 tokens)
create or replace function public.promote_post(p_post_id uuid, p_user_id uuid)
returns void as $$
declare
  v_cost int := 5;
  v_balance int;
begin
  -- Check balance
  select points into v_balance from public.profiles where id = p_user_id;
  
  if v_balance < v_cost then
    raise exception 'Insufficient tokens';
  end if;

  -- Deduct tokens
  update public.profiles 
  set points = points - v_cost 
  where id = p_user_id;

  -- Mark post as promoted
  update public.posts 
  set is_promoted = true 
  where id = p_post_id;
end;
$$ language plpgsql security definer;

-- 7. FIX STOREFRONT TABLES (Products)
drop table if exists public.products cascade;
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) not null,
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  category text, 
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.products enable row level security;
create policy "Public view available products" on public.products for select using (is_available = true);
create policy "Sellers manage own products" on public.products for all using (auth.uid() = seller_id);

-- 8. NEW: PROFILE CUSTOMIZATION (Myspace Style)
-- Use alter table to be safe since we don't drop profiles
alter table public.profiles add column if not exists theme_settings jsonb default '{"bg_color": "#111827", "text_color": "#ffffff", "bg_image": ""}'::jsonb;
alter table public.profiles add column if not exists phone_number text;

-- 9. UPDATE ROLES
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check 
  check (role in ('customer', 'driver', 'provider', 'business'));

-- 10. NEW: MESSAGING SYSTEM
drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;

create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  participant_one uuid references public.profiles(id) not null,
  participant_two uuid references public.profiles(id) not null,
  last_message text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(participant_one, participant_two)
);
alter table public.conversations enable row level security;
create policy "Users view their conversations" on public.conversations 
  for select using (auth.uid() = participant_one or auth.uid() = participant_two);
create policy "Users create conversations" on public.conversations 
  for insert with check (auth.uid() = participant_one or auth.uid() = participant_two);

create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) not null,
  sender_id uuid references public.profiles(id) not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.messages enable row level security;
create policy "Users view messages in their chats" on public.messages 
  for select using (
    exists (
      select 1 from public.conversations c 
      where c.id = messages.conversation_id 
      and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );
-- 11. NEW: STORAGE BUCKETS (Images/Videos)
insert into storage.buckets (id, name, public) 
values ('posts_media', 'posts_media', true)
on conflict (id) do nothing;

create policy "Public view media" on storage.objects for select using (bucket_id = 'posts_media');
create policy "Users upload media" on storage.objects for insert with check (bucket_id = 'posts_media' and auth.uid() = (storage.foldername(name))[1]::uuid);
