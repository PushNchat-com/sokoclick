    -- Function: approve_slot
    -- Purpose: Approves a ready-to-publish draft in a specific slot, making it live.
    --          Copies draft details to live fields, sets status/times, and clears draft info.
    -- Requires: Admin privileges.
    -- Inputs: slot_id_to_approve (integer) - The ID of the slot to approve.
    -- Returns: JSONB object indicating status ({status: 'success'|'error', message?: text, slot_id?: integer}).

    create or replace function public.approve_slot(slot_id_to_approve integer)
    returns jsonb
    language plpgsql
    security definer -- Runs with elevated privileges, but checks caller role internally
    set search_path = '' -- Enforce explicit schema qualification
    as $$
    declare
      target_slot record;
      calculated_end_time timestamp with time zone;
    begin
      -- 1. authorization check: ensure the caller is an admin using the dedicated function
      if not public.is_admin() then
        return jsonb_build_object('status', 'error', 'message', 'permission denied: admin role required.');
      end if;

      -- 2. validation: check if slot exists and is ready for approval
      select * into target_slot
      from public.auction_slots
      where id = slot_id_to_approve;

      if not found then
        return jsonb_build_object('status', 'error', 'message', 'slot not found.');
      end if;

      if target_slot.draft_status <> 'ready_to_publish' then
        return jsonb_build_object('status', 'error', 'message', 'slot is not ready for approval.');
      end if;

      -- 3. calculate start and end times (example: 24-hour duration from now)
      -- adjust the interval '24 hours' as per your business logic for slot duration
      calculated_end_time := now() + interval '24 hours';

      -- 4. perform the update
      update public.auction_slots
      set
        -- copy draft details to live
        -- assumption: live_product_seller_id is correctly populated during draft creation/review
        live_product_seller_id = target_slot.live_product_seller_id,
        live_product_name_en = target_slot.draft_product_name_en,
        live_product_name_fr = target_slot.draft_product_name_fr,
        live_product_description_en = target_slot.draft_product_description_en,
        live_product_description_fr = target_slot.draft_product_description_fr,
        live_product_price = target_slot.draft_product_price,
        live_product_currency = target_slot.draft_product_currency,
        live_product_categories = target_slot.draft_product_categories,
        live_product_delivery_options = target_slot.draft_product_delivery_options,
        live_product_tags = target_slot.draft_product_tags,
        live_product_image_urls = target_slot.draft_product_image_urls,

        -- update slot state
        slot_status = 'live',
        start_time = now(),
        end_time = calculated_end_time,

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
        draft_updated_at = null,

        -- ensure updated_at triggers (though the table trigger should handle this)
        updated_at = now()

      where id = slot_id_to_approve;

      -- 5. return success
      return jsonb_build_object('status', 'success', 'slot_id', slot_id_to_approve);

    exception
      when others then
        -- catch any unexpected errors during the update
        raise warning '[approve_slot] error approving slot id %: %', slot_id_to_approve, sqlerrm;
        return jsonb_build_object('status', 'error', 'message', 'an unexpected error occurred during approval: ' || sqlerrm);
    end;
    $$;

    -- grant execution rights to authenticated users (the function itself checks for admin role)
    -- note: grants might be handled differently by the declarative schema diff tool,
    -- but including it here aligns with standard practice. review the diff output.
    grant execute on function public.approve_slot(integer) to authenticated;

    comment on function public.approve_slot(integer) is 'approves a ready-to-publish draft in a specific slot, making it live.';