CREATE OR REPLACE FUNCTION toggle_slot_maintenance(slot_id_input uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Ensure 'public' schema is searched for tables/functions
AS $$
DECLARE
  updated_slot RECORD;
  is_caller_admin BOOLEAN;
BEGIN
  -- 1. Authorization Check
  SELECT is_admin() INTO is_caller_admin;
  IF NOT is_caller_admin THEN
    RETURN jsonb_build_object('error', 'Forbidden', 'message', 'User does not have sufficient privileges.');
  END IF;

  -- 2. Toggle Maintenance Status and Retrieve Updated Slot
  UPDATE slots
  SET is_in_maintenance = NOT is_in_maintenance
  WHERE id = slot_id_input
  RETURNING * INTO updated_slot; -- Capture the updated row

  -- 3. Check if the slot was found and updated
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Not Found', 'message', 'Slot with the specified ID not found.');
  END IF;

  -- 4. Return the updated slot data
  -- Convert RECORD to JSONB. Select specific columns if needed for brevity.
  RETURN to_jsonb(updated_slot);

EXCEPTION
  WHEN OTHERS THEN
    -- Generic error handler
    RETURN jsonb_build_object('error', 'Internal Server Error', 'message', SQLERRM);
END;
$$;

-- Grant execution permission to the authenticated role
GRANT EXECUTE ON FUNCTION toggle_slot_maintenance(uuid) TO authenticated;

-- Optional: Revoke execution from anon if it exists, though 'authenticated' is usually sufficient
-- REVOKE EXECUTE ON FUNCTION toggle_slot_maintenance(uuid) FROM anon;