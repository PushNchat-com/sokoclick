-- Description: Fix vendor and product-related issues
-- Following cursor rules for SQL migrations

-- Step 1: Ensure default vendor exists
do $$
declare
  vendor_id uuid;
begin
  -- First check if the vendor already exists
  select id into vendor_id
  from public.users
  where name = 'SokoClick Vendor';
  
  -- If vendor doesn't exist, create it
  if vendor_id is null then
    insert into public.users (
      name,
      whatsapp_number,
      email,
      location,
      is_verified,
      verification_level
    )
    values (
      'SokoClick Vendor',
      '+237000000000',
      'vendor@sokoclick.com',
      'Cameroon',
      true,
      'complete'
    )
    returning id into vendor_id;
    
    raise notice 'Created default vendor with ID: %', vendor_id;
  else
    raise notice 'Default vendor already exists with ID: %', vendor_id;
  end if;
end;
$$;

-- Step 2: Fix any products with invalid seller_id
do $$
declare
  vendor_id uuid;
  invalid_products int;
begin
  -- Get the default vendor ID
  select id into vendor_id
  from public.users
  where name = 'SokoClick Vendor';
  
  -- Update any products with invalid seller_id to use default vendor
  with updated_products as (
    update public.products
    set seller_id = vendor_id
    where seller_id not in (select id from public.users)
    returning id
  )
  select count(*) into invalid_products
  from updated_products;
  
  raise notice 'Fixed % products with invalid seller_id', invalid_products;
end;
$$;

-- Step 3: Add trigger to ensure products always have valid seller_id
create or replace function public.ensure_valid_seller_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  vendor_id uuid;
begin
  -- Check if the seller_id exists in users table
  if not exists (select 1 from public.users where id = NEW.seller_id) then
    -- Get default vendor ID
    select id into vendor_id
    from public.users
    where name = 'SokoClick Vendor';
    
    -- Use default vendor if available, otherwise raise exception
    if vendor_id is not null then
      NEW.seller_id := vendor_id;
    else
      raise exception 'Invalid seller_id and no default vendor available';
    end if;
  end if;
  
  return NEW;
end;
$$;

-- Create trigger
drop trigger if exists ensure_valid_seller_id_trigger on public.products;
create trigger ensure_valid_seller_id_trigger
before insert or update on public.products
for each row
execute function public.ensure_valid_seller_id(); 