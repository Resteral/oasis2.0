-- Enable PostGIS
create extension if not exists postgis;

-- 1. USERS PROFILES (Enhanced for Social/Services)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text check (role in ('customer', 'driver', 'provider')) default 'customer',
  full_name text,
  avatar_url text,
  
  -- Social / Professional Fields
  bio text, -- "Carpentry expert with 10 years exp..."
  skills text[], -- ['Carpentry', 'Roofing']
  portfolio_images text[], -- URLs to images of work
  hourly_rate numeric,
  rating numeric default 0,
  review_count int default 0,
  
  is_online boolean default false,
  current_location geography(POINT),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- 2. SERVICE REQUESTS (For hiring Carpenter/Plumber)
create table public.service_requests (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.profiles(id) not null,
  provider_id uuid references public.profiles(id), -- Nullable until booked
  
  service_type text not null, -- 'Plumbing', 'Electric'
  description text,
  location geography(POINT),
  address text,
  status text check (status in ('open', 'negotiating', 'booked', 'completed', 'cancelled')) default 'open',
  
  budget numeric,
  scheduled_for timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.service_requests enable row level security;
create policy "Public view open requests" on public.service_requests for select using (status = 'open');
create policy "Users view own requests" on public.service_requests for select using (auth.uid() = customer_id OR auth.uid() = provider_id);
create policy "Customers create requests" on public.service_requests for insert with check (auth.uid() = customer_id);

-- 3. ORDERS (Delivery - Existing)
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.profiles(id) not null,
  driver_id uuid references public.profiles(id),
  product_name text not null,
  store_name text not null,
  store_address text,
  store_location geography(POINT),
  delivery_address text not null,
  delivery_location geography(POINT),
  status text default 'pending',
  price_offer numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orders enable row level security;
create policy "Access own orders" on public.orders for select using (auth.uid() = customer_id OR auth.uid() = driver_id);

-- Auth Trigger
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
