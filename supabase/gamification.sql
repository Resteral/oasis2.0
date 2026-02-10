-- Gamification & Promotions Migration

-- 1. Add Leveling Fields to Profiles
alter table public.profiles add column if not exists points int default 0; -- Spendable currency
alter table public.profiles add column if not exists xp int default 0; -- Lifetime progress (Level based on this)
alter table public.profiles add column if not exists level int default 1; 

-- 2. Create Promotions Table (Advertising)
create table if not exists public.promotions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  
  details text, -- "Boost Profile" or "Sale on Product X"
  cost_points int not null,
  
  starts_at timestamp with time zone default now(),
  ends_at timestamp with time zone, -- e.g. starts_at + 24 hours
  
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Promotions
alter table public.promotions enable row level security;
create policy "Public view active promotions" on public.promotions for select using (is_active = true and now() < ends_at);
create policy "Users view own promotions" on public.promotions for select using (auth.uid() = user_id);
create policy "Users create promotions" on public.promotions for insert with check (auth.uid() = user_id);

-- 3. Function to Purchase Promotion
-- This ensures atomic transaction: Deduct points AND create promotion
create or replace function public.purchase_promotion(p_details text, p_cost int, p_duration_hours int)
returns boolean as $$
declare
  v_current_points int;
begin
  -- Check balance
  select points into v_current_points from public.profiles where id = auth.uid();
  
  if v_current_points < p_cost then
    return false; -- Insufficient funds
  end if;
  
  -- Deduct points
  update public.profiles set points = points - p_cost where id = auth.uid();
  
  -- Create Promotion
  insert into public.promotions (user_id, details, cost_points, ends_at)
  values (auth.uid(), p_details, p_cost, now() + (p_duration_hours || ' hours')::interval);
  
  return true;
end;
$$ language plpgsql security definer;
