-- Phase 19: AI-Powered Search Migration
-- Enable the vector extension to work with embeddings
create extension if not exists vector;

-- Add an embedding column to the products table
-- text-embedding-3-small uses 1536 dimensions
alter table public.products 
add column if not exists embedding vector(1536);

-- Create a function to search for products using vector similarity
create or replace function match_products (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  min_distance float default null,
  max_distance float default null,
  requires_delivery boolean default false
)
returns table (
  id uuid,
  business_id uuid,
  name text,
  description text,
  price numeric,
  image_url text,
  similarity float,
  business_name text,
  business_slug text,
  business_location text
)
language plpgsql
as $$
begin
  return query
  select
    p.id,
    p.business_id,
    p.name,
    p.description,
    p.price,
    p.image_url,
    1 - (p.embedding <=> query_embedding) as similarity,
    b.name as business_name,
    b.slug as business_slug,
    b.location as business_location
  from public.products p
  join public.businesses b on p.business_id = b.id
  where 1 - (p.embedding <=> query_embedding) > match_threshold
  -- Simple distance filter logic (placeholder if we had coordinates)
  -- and (max_distance is null or distance_calculation_here < max_distance)
  and (not requires_delivery or (b.delivery_settings->>'selfDelivery')::boolean = true)
  order by p.embedding <=> query_embedding
  limit match_count;
end;
$$;
