-- RPC to atomically decrement stock and prevent overselling
create or replace function decrement_stock(p_product_id uuid, p_quantity integer)
returns void as $$
begin
  update public.products
  set stock = stock - p_quantity
  where id = p_product_id and stock >= p_quantity;
  
  if not found then
    raise exception 'Insufficient stock for product %', p_product_id;
  end if;
end;
$$ language plpgsql;

-- RPC to increment stock (for cancellation/reversals)
create or replace function increment_stock(p_product_id uuid, p_quantity integer)
returns void as $$
begin
  update public.products
  set stock = stock + p_quantity
  where id = p_product_id;
end;
$$ language plpgsql;
