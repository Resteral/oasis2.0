-- Ensure PostGIS is enabled and reachable
create extension if not exists postgis schema public; 
-- If it already exists in 'extensions' schema, the above might warn but is safe-ish. 
-- Crucially, let's explicit SET the path for this session:
set search_path = public, extensions;

-- Drop table first to ensure we start fresh (Fixes "column user_id does not exist" error)
drop table if exists public.orders cascade;

-- Create Orders Table for Delivery System
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  product_name text not null,
  store_name text not null,
  store_address text,
  store_location geography(POINT), -- PostGIS Point for Pickup
  delivery_address text not null,
  delivery_location geography(POINT), -- PostGIS Point for Dropoff (optional for now)
  status text default 'pending' check (status in ('pending', 'claimed', 'picked_up', 'delivered', 'cancelled')),
  driver_id uuid references auth.users(id), -- Nullable until claimed
  driver_payout numeric, -- Calculated cost
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.orders enable row level security;

-- Users can see their own orders
create policy "Users can view own orders" 
  on public.orders for select 
  using (auth.uid() = user_id);

-- Users can create orders
create policy "Users can create orders" 
  on public.orders for insert 
  with check (auth.uid() = user_id);

-- Drivers (Providers) can view pending orders
-- Note: Assuming 'role' in profiles is 'provider' or 'driver'.
-- For simplicity, allowing authenticated users to view pending orders for now
create policy "Anyone can view pending orders"
  on public.orders for select
  using (status = 'pending');

-- Drivers can update orders (claim them)
create policy "Drivers can update orders"
  on public.orders for update
  using (true); -- Refine later based on role
