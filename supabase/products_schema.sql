-- Products / Menu Items Migration

create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) not null,
  
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  category text, -- 'food', 'retail', 'service'
  
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.products enable row level security;
create policy "Public view available products" on public.products for select using (is_available = true);
create policy "Sellers manage own products" on public.products for all using (auth.uid() = seller_id);

-- Update Profiles to support 'business' role
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check 
  check (role in ('customer', 'driver', 'provider', 'business'));
