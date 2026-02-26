-- Enable Row Level Security (RLS) on public tables
-- Note: auth.users RLS is managed by Supabase by default

-- 1. PROFILES TABLE (Public profile info for Users & Business Owners)
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  role text check (role in ('business', 'consumer')) default 'consumer',
  subscription_tier text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Public read, User update own
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- 2. BUSINESSES TABLE (Storefront details)
create table public.businesses (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) not null,
  slug text unique not null,
  name text not null,
  description text,
  category text, -- Retail, Restaurant, Health, etc.
  location text,
  image_url text, -- Storefront banner
  integrations jsonb default '{}'::jsonb, -- Channel configs: { twilio: { phone: '+1...' }, instagram: { handle: '@...' } }
  theme jsonb default '{}'::jsonb, -- Website colors: { primaryColor: '#...', backgroundColor: '#...' }
  delivery_settings jsonb default '{}'::jsonb, -- Delivery config: { radius: 5, providers: ['doordash'], selfDelivery: true }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS: Public read, Owner update
alter table public.businesses enable row level security;
create policy "Businesses are viewable by everyone." on public.businesses for select using (true);
create policy "Owners can insert their business." on public.businesses for insert with check (auth.uid() = owner_id);
create policy "Owners can update their business." on public.businesses for update using (auth.uid() = owner_id);

-- 3. PRODUCTS TABLE
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) not null,
  name text not null,
  description text,
  price numeric not null,
  stock integer default 0,
  category text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Public read, Business Owner update
alter table public.products enable row level security;
create policy "Products are viewable by everyone." on public.products for select using (true);
-- Complex policy simplified: Allow insert if user owns the business
create policy "Owners can insert products." on public.products for insert with check (
  exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid())
);
create policy "Owners can update products." on public.products for update using (
  exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid())
);
create policy "Owners can delete products." on public.products for delete using (
  exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid())
);

-- 4. ORDERS TABLE
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) not null,
  consumer_id uuid references public.profiles(id), -- Nullable if guest checkout
  customer_name text,
  customer_contact text, -- Phone number or social handle
  channel text check (channel in ('web', 'sms', 'instagram', 'offline')) default 'web',
  status text default 'pending', -- pending, completed, cancelled
  total numeric not null,
  items jsonb, -- Snapshot of cart items
  type text, -- pickup, shipping
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. MESSAGES TABLE (For AI Context & History)
create table public.messages (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references public.businesses(id),
    customer_contact text not null, -- Phone or Handle
    channel text not null,
    direction text check (direction in ('inbound', 'outbound')),
    content text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;
create policy "Owners can view messages." on public.messages for select using (
    exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid())
);

-- RLS: Business see own orders, Consumer see own orders
alter table public.orders enable row level security;
create policy "Business owners can view orders for their business." on public.orders for select using (
  exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid())
);
create policy "Consumers can view their own orders." on public.orders for select using (
  auth.uid() = consumer_id
);
create policy "Anyone can create an order." on public.orders for insert with check (true);

-- 5. Enable Text Search (AI Feature Helper)
-- Create an index to help 'ilike' or full text search
create extension if not exists pg_trgm;
create index products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
create index businesses_category_idx on public.businesses (category);