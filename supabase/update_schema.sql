-- Incremental update for Oasis Services
-- Run this if 'profiles' table already exists

-- 1. Update Profiles Table
-- Add new columns if they don't exist
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists skills text[]; -- Array of strings
alter table public.profiles add column if not exists portfolio_images text[]; -- Array of URLs
alter table public.profiles add column if not exists hourly_rate numeric;
alter table public.profiles add column if not exists rating numeric default 0;
alter table public.profiles add column if not exists review_count int default 0;
alter table public.profiles add column if not exists avatar_url text;

-- Update role check constraint to include 'provider'
-- Postgres doesn't easily allow altering check constraints, so we drop and re-add
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check 
  check (role in ('customer', 'driver', 'provider'));

-- 2. Create Service Requests Table (if not exists)
create table if not exists public.service_requests (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.profiles(id) not null,
  provider_id uuid references public.profiles(id), 
  
  service_type text not null, 
  description text,
  location geography(POINT),
  address text,
  status text check (status in ('open', 'negotiating', 'booked', 'completed', 'cancelled')) default 'open',
  
  budget numeric,
  scheduled_for timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Service Requests
alter table public.service_requests enable row level security;

-- Drop existing policies to avoid conflicts if re-running
drop policy if exists "Public view open requests" on public.service_requests;
drop policy if exists "Users view own requests" on public.service_requests;
drop policy if exists "Customers create requests" on public.service_requests;

create policy "Public view open requests" on public.service_requests for select using (status = 'open');
create policy "Users view own requests" on public.service_requests for select using (auth.uid() = customer_id OR auth.uid() = provider_id);
create policy "Customers create requests" on public.service_requests for insert with check (auth.uid() = customer_id);
