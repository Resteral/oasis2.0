-- Community Forums Migration

create table if not exists public.communities (
  id uuid default uuid_generate_v4() primary key,
  name text not null, -- e.g. "Carpentry Tips", "Local Events"
  description text,
  icon text, -- Emoji or URL
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.communities enable row level security;
create policy "Public view communities" on public.communities for select using (true);

-- Add community_id to posts to link them
alter table public.posts add column if not exists community_id uuid references public.communities(id);

-- Seed some initial communities
insert into public.communities (name, description, icon) values
('General Chat', 'Talk about anything related to Oasis.', '💬'),
('Marketplace Support', 'Help with buying and selling.', '🛒'),
('Pro Services', 'Discussions for Carpenters, Plumbers, and Pros.', '🛠️'),
('Local Recommendations', 'Best places to eat and shop near you.', '📍');
