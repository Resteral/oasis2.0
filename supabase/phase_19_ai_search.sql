-- Phase 19: AI-Powered Search - Vector Database Setup

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Add embedding column to products (1536 is the dimension for OpenAI text-embedding-3-small)
alter table public.products 
add column if not exists embedding vector(1536);

-- 3. Create a function to match products using vector similarity
create or replace function match_products (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  business_id uuid,
  name text,
  description text,
  price numeric,
  image_url text,
  similarity float
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
    1 - (p.embedding <=> query_embedding) as similarity
  from products p
  where 1 - (p.embedding <=> query_embedding) > match_threshold
  order by p.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 4. Create an index for vector search performance
create index on public.products using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
