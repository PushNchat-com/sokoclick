/*
 * Function: get_auction_statistics
 * Description: Calculates statistics about auctions based on time period
 * Parameters:
 *   - p_time_period: The time period to calculate statistics for ('day', 'week', 'month', 'year', 'all')
 * Returns: A record with auction statistics
 */
create or replace function public.get_auction_statistics(p_time_period text default 'week')
returns json
language plpgsql
security invoker
set search_path = ''
as $$
declare
  start_date timestamp with time zone;
  v_result json;
begin
  -- Determine the start date based on the time period
  case p_time_period
    when 'day' then
      start_date := current_timestamp - interval '1 day';
    when 'week' then
      start_date := current_timestamp - interval '1 week';
    when 'month' then
      start_date := current_timestamp - interval '1 month';
    when 'year' then
      start_date := current_timestamp - interval '1 year';
    when 'all' then
      start_date := timestamp '2000-01-01';
    else
      raise exception 'Invalid time period: %. Must be one of: day, week, month, year, all', p_time_period;
  end case;

  -- Calculate statistics for the given time period
  select
    json_build_object(
      'time_period', p_time_period,
      'total_auctions', (
        select count(*)
        from public.auction_slots
        where created_at >= start_date
      ),
      'active_auctions', (
        select count(*)
        from public.auction_slots
        where is_active = true
      ),
      'completed_auctions', (
        select count(*)
        from public.auction_slots
        where auction_state = 'completed'
        and created_at >= start_date
      ),
      'average_view_count', (
        select coalesce(round(avg(view_count), 2), 0)
        from public.auction_slots
        where created_at >= start_date
      ),
      'featured_auctions_count', (
        select count(*)
        from public.auction_slots
        where featured = true
        and created_at >= start_date
      ),
      'most_viewed_product', (
        select json_build_object(
          'slot_id', a.id,
          'product_id', a.product_id,
          'product_name', p.name_en,
          'view_count', a.view_count
        )
        from public.auction_slots a
        join public.products p on a.product_id = p.id
        where a.created_at >= start_date
        order by a.view_count desc
        limit 1
      ),
      'recent_auctions', (
        select json_agg(json_build_object(
          'id', a.id,
          'product_id', a.product_id,
          'product_name', p.name_en,
          'state', a.auction_state,
          'created_at', a.created_at
        ))
        from public.auction_slots a
        join public.products p on a.product_id = p.id
        where a.created_at >= start_date
        order by a.created_at desc
        limit 5
      )
    ) into v_result;

  return v_result;
end;
$$; 