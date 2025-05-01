-- Function: reject_slot
-- Purpose: Rejects a ready-to-publish draft in a specific slot, clearing draft details.
-- Requires: Admin privileges.
-- Inputs:
--   slot_id_to_reject (integer): The ID of the slot to reject.
--   rejection_reason (text, optional): Reason for rejection (currently unused but available for logging).
-- Returns: JSONB object indicating status ({status: 'success'|'error', message?: text, slot_id?: integer}).

create or replace function public.reject_slot(
    slot_id_to_reject integer,
    rejection_reason text default null -- Parameter for reason, though not stored in this version
)
returns jsonb
language plpgsql
security definer -- Runs with elevated privileges, but checks caller role internally
set search_path = '' -- Enforce explicit schema qualification
as $$
declare
  target_slot record;
begin
  -- 1. authorization check: ensure the caller is an admin
  if not public.is_admin() then
    return jsonb_build_object('status', 'error', 'message', 'permission denied: admin role required.');
  end if;

  -- 2. validation: check if slot exists and is ready for rejection
  select * into target_slot
  from public.auction_slots
  where id = slot_id_to_reject;

  if not found then
    return jsonb_build_object('status', 'error', 'message', 'slot not found.');
  end if;

  if target_slot.draft_status <> 'ready_to_publish' then
    return jsonb_build_object('status', 'error', 'message', 'slot draft is not in ready_to_publish state.');
  end if;

  -- 3. perform the update to reject the draft
  update public.auction_slots
  set
    -- reset draft state
    draft_status = 'empty',
    draft_seller_whatsapp_number = null,
    draft_product_name_en = null,
    draft_product_name_fr = null,
    draft_product_description_en = null,
    draft_product_description_fr = null,
    draft_product_price = null,
    draft_product_currency = null,
    draft_product_categories = null,
    draft_product_delivery_options = null,
    draft_product_tags = null,
    draft_product_image_urls = null,
    draft_updated_at = null, -- Reset draft timestamp

    -- ensure updated_at triggers
    updated_at = now()

  where id = slot_id_to_reject;

  -- (Optional Future Step: Log the rejection_reason using the auditLog service or similar)

  -- 4. return success
  return jsonb_build_object('status', 'success', 'slot_id', slot_id_to_reject);

exception
  when others then
    -- catch any unexpected errors during the update
    raise warning '[reject_slot] error rejecting slot id %: %', slot_id_to_reject, sqlerrm;
    return jsonb_build_object('status', 'error', 'message', 'an unexpected error occurred during rejection: ' || sqlerrm);
end;
$$;

-- grant execution rights to authenticated users (function checks for admin)
grant execute on function public.reject_slot(integer, text) to authenticated;

comment on function public.reject_slot(integer, text) is 'rejects a ready-to-publish draft in a specific slot, clearing its details.';
