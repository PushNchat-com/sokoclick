CREATE OR REPLACE FUNCTION remove_live_product(target_slot_id integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status TEXT;
BEGIN
  -- 1. Authorization Check
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Permission denied: Only admins can remove live products.');
  END IF;

  -- 2. Check current status
  SELECT slot_status INTO current_status
  FROM public.auction_slots
  WHERE id = target_slot_id;

  -- 3. Check if slot exists
  IF current_status IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Slot not found.', 'slot_id', target_slot_id);
  END IF;

  -- 4. Check if slot is actually live
  IF current_status <> 'live' THEN
      RETURN jsonb_build_object('status', 'info', 'message', 'Slot is not currently live, no product to remove.', 'slot_id', target_slot_id);
  END IF;

  -- 5. Clear live product fields and reset status
  UPDATE public.auction_slots
  SET
    live_product_seller_id = NULL,
    live_product_name_en = NULL,
    live_product_name_fr = NULL,
    live_product_description_en = NULL,
    live_product_description_fr = NULL,
    live_product_price = NULL,
    live_product_currency = NULL,
    live_product_categories = NULL,
    live_product_delivery_options = NULL,
    live_product_tags = NULL,
    live_product_image_urls = NULL,
    slot_status = 'empty', -- Set status to empty
    start_time = NULL,     -- Clear start time
    end_time = NULL        -- Clear end time
  WHERE id = target_slot_id;

  -- 6. Return success
  RETURN jsonb_build_object('status', 'success', 'message', 'Live product removed successfully.', 'slot_id', target_slot_id, 'new_status', 'empty');

EXCEPTION
  WHEN others THEN
    -- Catch any unexpected errors
    RETURN jsonb_build_object('status', 'error', 'message', 'An unexpected error occurred: ' || SQLERRM, 'slot_id', target_slot_id);
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION remove_live_product(integer) TO authenticated;

COMMENT ON FUNCTION remove_live_product(integer) IS 'Removes the live product details from a specified slot and sets its status to empty. Requires admin privileges.';