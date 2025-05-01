-- Add function to toggle maintenance mode for a slot

CREATE OR REPLACE FUNCTION public.toggle_slot_maintenance(target_slot_id integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Necessary to check admin role inside the function
SET search_path = public -- Ensure public schema functions like is_admin are found
AS $$
DECLARE
  current_status TEXT;
  has_live_product BOOLEAN;
  new_status TEXT;
BEGIN
  -- 1. Check if the user is an admin
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Permission denied: Only admins can toggle maintenance mode.', 'slot_id', target_slot_id);
  END IF;

  -- 2. Fetch current slot details
  SELECT 
    slot_status, 
    (live_product_seller_id IS NOT NULL) -- Check if there was a live product
  INTO 
    current_status, 
    has_live_product
  FROM public.auction_slots
  WHERE id = target_slot_id;

  -- 3. Check if slot exists
  IF current_status IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Slot not found.', 'slot_id', target_slot_id);
  END IF;

  -- 4. Determine the new status
  IF current_status = 'maintenance' THEN
    IF has_live_product THEN
      new_status := 'live';
    ELSE
      new_status := 'empty';
    END IF;
  ELSE -- If current_status is 'live' or 'empty'
    new_status := 'maintenance';
  END IF;

  -- 5. Update the slot status
  UPDATE public.auction_slots
  SET slot_status = new_status
  WHERE id = target_slot_id;

  -- 6. Return success
  RETURN jsonb_build_object('status', 'success', 'message', 'Slot maintenance mode toggled successfully.', 'slot_id', target_slot_id, 'new_status', new_status);

EXCEPTION
  WHEN others THEN
    -- Catch any unexpected errors during execution
    RETURN jsonb_build_object('status', 'error', 'message', 'An unexpected error occurred: ' || SQLERRM, 'slot_id', target_slot_id);
END;
$$;

-- Grant execution permission to authenticated users (RPC is protected internally by is_admin check)
GRANT EXECUTE ON FUNCTION public.toggle_slot_maintenance(integer) TO authenticated;

COMMENT ON FUNCTION public.toggle_slot_maintenance(integer) IS 'Toggles the maintenance status of a specific auction slot. Can only be executed by admins.'; 