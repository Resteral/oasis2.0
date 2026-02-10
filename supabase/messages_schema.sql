-- Messaging & Business Location Migration

-- 1. MESSAGES
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) not null,
  receiver_id uuid references public.profiles(id) not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Messages
alter table public.messages enable row level security;
create policy "Users view their own messages" on public.messages 
  for select using (auth.uid() = sender_id OR auth.uid() = receiver_id);
create policy "Users send messages" on public.messages 
  for insert with check (auth.uid() = sender_id);

-- 2. BUSINESS LOCATION (Frontless Stores)
-- We need a specific location column for the business establishment, separate from the user's live driver location
alter table public.profiles add column if not exists business_location geography(POINT);
alter table public.profiles add column if not exists business_address text;
alter table public.profiles add column if not exists is_frontless boolean default false; -- e.g. Ghost Kitchen

-- Index for geospatial search
create index if not exists profiles_business_location_idx on public.profiles using gist(business_location);
