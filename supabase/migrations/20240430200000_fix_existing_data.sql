-- Step 4: Verify the fixes were applied
do $$
declare
  null_category_count integer;
  null_status_count integer;
begin
  -- Check for null category_id
  select count(*) into null_category_count
  from public.products
  where category_id is null or category_id = '';
  
  -- Check for null status
  select count(*) into null_status_count
  from public.products
  where status is null or status not in ('pending', 'approved', 'rejected', 'inactive');
  
  -- Output the results
  raise notice 'Products with null category_id: %', null_category_count;
  raise notice 'Products with invalid status: %', null_status_count;
  
  -- Verify using if statements instead of assert
  if null_category_count > 0 then
    raise exception 'There are still products with null category_id';
  end if;
  
  if null_status_count > 0 then
    raise exception 'There are still products with invalid status';
  end if;
end
$$; 