import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { PostgrestError } from "@supabase/postgrest-js";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
// import { Product } from './products'; // Removed Product import
import { clearSlotImages } from "@/utils/slotStorage"; // Use alias path
import { AuthUserProfile } from "@/types/auth"; // Corrected type name
import { Product, ProductStatus } from "@/types/product"; // Use alias path
import {
  ServiceResponse,
  ServiceErrorType,
  createErrorResponse,
  createSuccessResponse,
} from "./core/ServiceResponse"; // Import helpers and enum
import { DeliveryOption } from "@/types/delivery"; // Assuming DeliveryOption is defined in types/delivery
import { Tables } from "@/types/supabase-types"; // Import Tables type
import { SlotStatus } from "../types/supabase-types";

// Re-export SlotStatus for components that need it
export { SlotStatus };

/**
 * Slot type definition matching the refactored database structure
 */
export interface Slot {
  // Core Slot Identity
  id: number;

  // Live Product Details
  live_product_seller_id?: string;
  live_product_seller?: AuthUserProfile | null; // Use correct type for joined seller data
  live_product_name_en?: string;
  live_product_name_fr?: string;
  live_product_description_en?: string;
  live_product_description_fr?: string;
  live_product_price?: number;
  live_product_currency?: string; // 'XAF', 'USD', 'EUR'
  live_product_categories?: string[];
  live_product_delivery_options?: DeliveryOption[]; // Use specific type for delivery options if available
  live_product_tags?: string[];
  live_product_image_urls?: string[]; // URLs/paths of live images

  // Slot Operational State
  slot_status: "empty" | "live" | "maintenance";
  start_time?: string; // ISO timestamp string
  end_time?: string; // ISO timestamp string
  featured: boolean;
  view_count: number;

  // Draft Product Details
  draft_product_name_en?: string;
  draft_product_name_fr?: string;
  draft_product_description_en?: string;
  draft_product_description_fr?: string;
  draft_product_price?: number;
  draft_product_currency?: string; // 'XAF', 'USD', 'EUR'
  draft_product_categories?: string[];
  draft_product_delivery_options?: DeliveryOption[]; // Use specific type for delivery options if available
  draft_product_tags?: string[];
  draft_product_image_urls?: string[]; // URLs/paths of draft images
  draft_status: "empty" | "drafting" | "ready_to_publish";
  draft_updated_at?: string; // ISO timestamp string

  // Timestamps
  created_at: string; // ISO timestamp string
  updated_at: string; // ISO timestamp string

  // Joined/Derived Fields
  draft_seller_id?: string; // Added field for the looked-up seller UUID
  draft_seller_whatsapp_number?: string | null; // Added missing field from database
}

// Represents the data structure for saving draft content
export type SlotDraftData = Partial<
  Pick<
    Slot,
    | "draft_product_name_en"
    | "draft_product_name_fr"
    | "draft_product_description_en"
    | "draft_product_description_fr"
    | "draft_product_price"
    | "draft_product_currency"
    | "draft_product_categories"
    | "draft_product_delivery_options"
    | "draft_product_tags"
    | "draft_product_image_urls"
  >
>;

// Add type guard for PostgrestError
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "details" in error &&
    "hint" in error &&
    "code" in error
  );
}

/**
 * Hook for fetching slots with optional filtering by slot_status, draft_status, and search term
 */
export const useSlots = (
  filterStatus?: Slot["slot_status"],
  searchTerm?: string,
  filterDraftStatus?: Slot["draft_status"],
) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fix the select statement for the joined seller
      // Add join for draft seller based on whatsapp number
      let query = supabase
        .from("auction_slots")
        .select(
          `
          *,
          live_product_seller:live_product_seller_id (
            id,
            email,
            name,
            whatsapp_number,
            role,
            is_verified,
            verification_level
          ),
          draft_seller:users!inner(id)
        `,
        )
        .eq(
          "users.whatsapp_number",
          "auction_slots.draft_seller_whatsapp_number",
        ) // Join condition
        .order("id");

      if (filterStatus) {
        query = query.eq("slot_status", filterStatus);
      }

      // Add filtering by draft_status if provided
      if (filterDraftStatus) {
        query = query.eq("draft_status", filterDraftStatus);
      }

      const { data: slotsData, error: slotsError } = await query;

      if (slotsError) throw slotsError;

      // Apply type assertion for delivery options during transformation
      // Extract draft_seller_id from the joined data
      const transformedSlots = (slotsData || []).map((slot) => {
        // Extract the joined draft_seller info
        const draftSeller = (slot as any).draft_seller;
        const draft_seller_id = draftSeller?.id;

        // Remove the joined object before returning
        const { draft_seller, ...restOfSlot } = slot as any;

        return {
          ...restOfSlot,
          live_product_seller:
            restOfSlot.live_product_seller as AuthUserProfile | null,
          live_product_delivery_options:
            restOfSlot.live_product_delivery_options as DeliveryOption[] | null,
          draft_product_delivery_options:
            restOfSlot.draft_product_delivery_options as
              | DeliveryOption[]
              | null,
          draft_seller_id: draft_seller_id, // Add the extracted ID
        } as Slot;
      });

      // Search logic (remains the same)
      let filteredSlots = transformedSlots;
      if (searchTerm?.trim()) {
        const term = searchTerm.trim().toLowerCase();
        filteredSlots = filteredSlots.filter((slot) => {
          if (slot.id.toString().includes(term)) return true;
          return (
            slot.live_product_name_en?.toLowerCase().includes(term) ||
            slot.live_product_name_fr?.toLowerCase().includes(term) ||
            slot.live_product_description_en?.toLowerCase().includes(term) ||
            slot.live_product_description_fr?.toLowerCase().includes(term)
          );
        });
      }

      setSlots(filteredSlots);
    } catch (err) {
      console.error("Error fetching slots:", err);
      setError(isPostgrestError(err) ? err.message : "Failed to fetch slots");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchTerm, filterDraftStatus]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots, refreshTrigger]);

  return { slots, loading, error, refresh };
};

/**
 * Hook for fetching stats about slots (counts by status) using aggregation
 */
export const useSlotStats = () => {
  const [stats, setStats] = useState({
    total: 25,
    available: 0, // Calculated
    live: 0,
    maintenance: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { count: liveCount, error: liveError } = await supabase
        .from("auction_slots")
        .select("*", { count: "exact", head: true })
        .eq("slot_status", "live");

      if (liveError) throw liveError;

      const { count: maintenanceCount, error: maintenanceError } =
        await supabase
          .from("auction_slots")
          .select("*", { count: "exact", head: true })
          .eq("slot_status", "maintenance");

      if (maintenanceError) throw maintenanceError;

      const live = liveCount ?? 0;
      const maintenance = maintenanceCount ?? 0;
      const available = 25 - live - maintenance;

      setStats({
        total: 25,
        available: available < 0 ? 0 : available, // Ensure non-negative
        live,
        maintenance,
      });
    } catch (err: unknown) {
      console.error("Error fetching slot stats:", err);
      setError(
        isPostgrestError(err) ? err.message : "Failed to fetch slot stats",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats on mount and when refresh trigger changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshTrigger]);

  return { stats, loading, error, refresh };
};

/**
 * Hook for fetching a single slot by ID
 */
export const useSlot = (slotId: number | null) => {
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const fetchSlot = useCallback(async () => {
    if (slotId === null || slotId < 1 || slotId > 25) {
      setSlot(null); // Ensure slot is null for invalid ID
      setLoading(false);
      setError(slotId === null ? null : "Invalid Slot ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fix the select statement for the joined seller
      const { data, error: fetchError } = await supabase
        .from("auction_slots")
        .select(
          `
          *,
          live_product_seller:live_product_seller_id (
            id,
            email,
            name, 
            whatsapp_number, 
            role, 
            is_verified, 
            verification_level
          )
        `,
        )
        .eq("id", slotId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        // Apply type assertion for delivery options during transformation
        const fetchedSlot = {
          ...data,
          live_product_seller:
            data.live_product_seller as AuthUserProfile | null,
          // Cast JSON type from Supabase to our specific frontend type
          live_product_delivery_options: data.live_product_delivery_options as
            | DeliveryOption[]
            | null,
          draft_product_delivery_options:
            data.draft_product_delivery_options as DeliveryOption[] | null,
        } as Slot;
        setSlot(fetchedSlot);
      } else {
        setSlot(null);
      }
    } catch (err: unknown) {
      console.error(`Error fetching slot ${slotId}:`, err);
      setError(
        isPostgrestError(err) ? err.message : `Failed to fetch slot ${slotId}`,
      );
      setSlot(null);
    } finally {
      setLoading(false);
    }
  }, [slotId]);

  useEffect(() => {
    fetchSlot();
  }, [fetchSlot, refreshTrigger]);

  return { slot, loading, error, refresh };
};

/**
 * Service object for managing slot operations
 */
export const slotService = {
  /**
   * Saves draft data for a specific slot.
   * @param slotId The ID of the slot to save the draft for.
   * @param draftData An object containing the draft fields to update.
   * @returns ServiceResponse indicating success or failure.
   */
  async saveDraft(
    slotId: number,
    draftData: SlotDraftData,
  ): Promise<ServiceResponse> {
    if (!slotId || slotId < 1 || slotId > 25) {
      return createErrorResponse(
        ServiceErrorType.VALIDATION_ERROR,
        "Invalid Slot ID.",
      );
    }

    try {
      const updates = {
        ...draftData,
        draft_status: "drafting" as const,
      };

      // Cast updates to 'any' to bypass strict JSON type check for delivery_options
      const { error } = await supabase
        .from("auction_slots")
        .update(updates as any)
        .eq("id", slotId);

      if (error) throw error;

      return createSuccessResponse();
    } catch (err: unknown) {
      console.error(`Error saving draft for slot ${slotId}:`, err);
      const message = isPostgrestError(err)
        ? err.message
        : `Failed to save draft for slot ${slotId}.`;
      const errorType = isPostgrestError(err)
        ? ServiceErrorType.DATABASE_ERROR
        : ServiceErrorType.UNKNOWN_ERROR;
      return createErrorResponse(errorType, message, err);
    }
  },

  /**
   * Sets or clears maintenance mode for a slot.
   * @param slotId The ID of the slot.
   * @param maintenance True to set maintenance mode, false to clear it.
   * @returns ServiceResponse indicating success or failure.
   */
  async setSlotMaintenance(
    slotId: number,
    maintenance: boolean,
  ): Promise<ServiceResponse> {
    if (!slotId || slotId < 1 || slotId > 25) {
      return createErrorResponse(
        ServiceErrorType.VALIDATION_ERROR,
        "Invalid Slot ID.",
      );
    }
    try {
      // Determine the target status based on current state and maintenance flag
      const { data: currentSlot, error: fetchError } = await supabase
        .from("auction_slots")
        .select("slot_status")
        .eq("id", slotId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentSlot)
        return createErrorResponse(
          ServiceErrorType.NOT_FOUND,
          "Slot not found.",
        );

      let newStatus: Slot["slot_status"];
      if (maintenance) {
        newStatus = "maintenance";
      } else {
        // Revert to 'empty' if clearing maintenance, assuming no live product logic here
        // A more complex logic might be needed if clearing maintenance should potentially restore 'live' status
        newStatus = "empty"; // Simple case: revert to empty. Needs review based on exact requirements.
        // TODO: Revisit this logic. If a product was live before maintenance, should it become live again?
      }

      const { error } = await supabase
        .from("auction_slots")
        .update({ slot_status: newStatus })
        .eq("id", slotId);

      if (error) throw error;
      return createSuccessResponse();
    } catch (err: unknown) {
      console.error(`Error setting maintenance for slot ${slotId}:`, err);
      const message = isPostgrestError(err)
        ? err.message
        : `Failed to update maintenance mode for slot ${slotId}.`;
      const errorType = isPostgrestError(err)
        ? ServiceErrorType.DATABASE_ERROR
        : ServiceErrorType.UNKNOWN_ERROR;
      return createErrorResponse(errorType, message, err);
    }
  },

  /**
   * Removes the currently live product from a slot, resetting it to 'empty'.
   * Also clears associated images from storage.
   * @param slotId The ID of the slot to clear.
   * @returns ServiceResponse indicating success or failure.
   */
  async removeProductFromSlot(slotId: number): Promise<ServiceResponse> {
    if (!slotId || slotId < 1 || slotId > 25) {
      return createErrorResponse(
        ServiceErrorType.VALIDATION_ERROR,
        "Invalid Slot ID.",
      );
    }
    try {
      // Clear live product fields and reset status
      const updates = {
        live_product_seller_id: null,
        live_product_name_en: null,
        live_product_name_fr: null,
        live_product_description_en: null,
        live_product_description_fr: null,
        live_product_price: null,
        live_product_currency: null,
        live_product_categories: null,
        live_product_delivery_options: null,
        live_product_tags: null,
        live_product_image_urls: null,
        slot_status: "empty" as const,
        start_time: null,
        end_time: null,
        featured: false, // Reset featured status as well
        view_count: 0, // Reset view count
      };

      const { error } = await supabase
        .from("auction_slots")
        .update(updates)
        .eq("id", slotId);

      if (error) throw error;

      // After successful DB update, clear images from storage path slot-X
      const storageResult = await clearSlotImages(slotId);
      if (!storageResult.success) {
        // Log warning but don't necessarily fail the whole operation
        console.warn(
          `DB updated but failed to clear images for slot ${slotId}: ${storageResult.message}`,
        );
      }

      return createSuccessResponse();
    } catch (err: unknown) {
      console.error(`Error removing product from slot ${slotId}:`, err);
      const message = isPostgrestError(err)
        ? err.message
        : `Failed to remove product from slot ${slotId}.`;
      const errorType = isPostgrestError(err)
        ? ServiceErrorType.DATABASE_ERROR
        : ServiceErrorType.UNKNOWN_ERROR;
      return createErrorResponse(errorType, message, err);
    }
  },

  /**
   * Publishes the prepared draft content to the live slot.
   * Copies draft fields to live fields, sets start/end times, updates statuses,
   * clears draft fields, and potentially clears old images from slot-X path.
   * @param slotId The ID of the slot to publish.
   * @param durationDays The duration in days the product should be live. Defaults to 7.
   * @param sellerId The ID of the seller associated with this product.
   * @returns ServiceResponse indicating success or failure.
   */
  async publishDraftToLive(
    slotId: number,
    durationDays: number = 7,
    sellerId: string,
  ): Promise<ServiceResponse> {
    if (!slotId || slotId < 1 || slotId > 25) {
      return createErrorResponse(
        ServiceErrorType.VALIDATION_ERROR,
        "Invalid Slot ID.",
      );
    }
    if (!sellerId) {
      return createErrorResponse(
        ServiceErrorType.VALIDATION_ERROR,
        "Seller ID is required to publish.",
      );
    }

    try {
      // 1. Fetch the current draft data
      const { data: slotData, error: fetchError } = await supabase
        .from("auction_slots")
        .select("*")
        .eq("id", slotId)
        .single(); // Use single() as we expect the slot to exist

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          return createErrorResponse(
            ServiceErrorType.NOT_FOUND,
            "Slot not found.",
          );
        }
        throw fetchError;
      }
      if (slotData.draft_status !== "ready_to_publish") {
        return createErrorResponse(
          ServiceErrorType.VALIDATION_ERROR,
          "Draft is not ready to publish.",
        );
      }
      if (slotData.slot_status === "maintenance") {
        return createErrorResponse(
          ServiceErrorType.VALIDATION_ERROR,
          "Cannot publish to a slot under maintenance.",
        );
      }

      // 2. Prepare updates: Copy draft to live, set times, update status, clear draft
      const startTime = new Date();
      const endTime = new Date(startTime);
      endTime.setDate(startTime.getDate() + durationDays);

      // Prepare update object using correct fields
      const updates = {
        live_product_seller_id: sellerId,
        live_product_name_en: slotData.draft_product_name_en,
        live_product_name_fr: slotData.draft_product_name_fr,
        live_product_description_en: slotData.draft_product_description_en,
        live_product_description_fr: slotData.draft_product_description_fr,
        live_product_price: slotData.draft_product_price,
        live_product_currency: slotData.draft_product_currency,
        live_product_categories: slotData.draft_product_categories,
        // Ensure delivery options are included (already correct type via slotData)
        live_product_delivery_options: slotData.draft_product_delivery_options,
        live_product_tags: slotData.draft_product_tags,
        live_product_image_urls: slotData.draft_product_image_urls,

        slot_status: "live" as const,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        featured: false,
        view_count: 0,

        draft_seller_whatsapp_number: null,
        draft_product_name_en: null,
        draft_product_name_fr: null,
        draft_product_description_en: null,
        draft_product_description_fr: null,
        draft_product_price: null,
        draft_product_currency: null,
        draft_product_categories: null,
        draft_product_delivery_options: null,
        draft_product_tags: null,
        draft_product_image_urls: null,
        draft_status: "empty" as const,
      };

      // Cast updates to satisfy Supabase client type for JSON field
      // Alternatively, cast specific field: { ...updates, live_product_delivery_options: updates.live_product_delivery_options as Json }
      const { error: updateError } = await supabase
        .from("auction_slots")
        .update(updates as any)
        .eq("id", slotId);

      if (updateError) throw updateError;

      // Potential next step: Clear old images from storage if needed?
      // This might be complex if draft images are reused for live.
      // Assuming for now that draft_product_image_urls were finalized before publish.

      return createSuccessResponse();
    } catch (err: unknown) {
      console.error(`Error publishing draft for slot ${slotId}:`, err);
      const message = isPostgrestError(err)
        ? err.message
        : `Failed to publish draft for slot ${slotId}.`;
      const errorType = isPostgrestError(err)
        ? ServiceErrorType.DATABASE_ERROR
        : ServiceErrorType.UNKNOWN_ERROR;
      return createErrorResponse(errorType, message, err);
    }
  },

  /**
   * Marks a draft as ready to publish.
   * @param slotId The ID of the slot whose draft is ready.
   * @returns ServiceResponse indicating success or failure.
   */
  async markDraftAsReady(slotId: number): Promise<ServiceResponse> {
    if (!slotId || slotId < 1 || slotId > 25) {
      return createErrorResponse(
        ServiceErrorType.VALIDATION_ERROR,
        "Invalid Slot ID.",
      );
    }
    try {
      // Optional validation: Check if draft exists and has required fields?

      const { error } = await supabase
        .from("auction_slots")
        .update({ draft_status: "ready_to_publish" as const })
        .eq("id", slotId)
        .eq("draft_status", "drafting"); // Only update if currently drafting

      if (error) throw error;

      // We might want to check if the update actually affected any rows here
      // to confirm the draft was in the correct state, but Supabase doesn't make this easy.

      return createSuccessResponse();
    } catch (err: unknown) {
      console.error(`Error marking draft ready for slot ${slotId}:`, err);
      const message = isPostgrestError(err)
        ? err.message
        : `Failed to mark draft as ready for slot ${slotId}.`;
      const errorType = isPostgrestError(err)
        ? ServiceErrorType.DATABASE_ERROR
        : ServiceErrorType.UNKNOWN_ERROR;
      return createErrorResponse(errorType, message, err);
    }
  },

  // TODO: Implement Reject Draft Logic
  async rejectDraft(slotId: number): Promise<ServiceResponse<void>> {
    console.warn(`rejectDraft(${slotId}) - Implementation pending.`);
    // Placeholder implementation:
    // 1. Fetch the slot to ensure it exists and draft_status is ready_to_publish
    // 2. Update the slot:
    //    - Set draft_* fields to null/defaults
    //    - Set draft_status to 'empty' or 'drafting' (TBD)
    //    - Potentially clear associated draft images in storage
    // 3. Return success/error
    // Example (needs refinement):
    /*
      const { error } = await supabase
        .from('auction_slots')
        .update({
          draft_status: 'empty', // Or 'drafting'?
          draft_product_name_en: null,
          draft_product_name_fr: null,
          draft_product_description_en: null,
          // ... other draft fields ...
          draft_product_image_urls: null,
          draft_updated_at: new Date().toISOString(),
        })
        .eq('id', slotId)
        .eq('draft_status', 'ready_to_publish');

      if (error) {
        return createErrorResponse(ServiceErrorType.DatabaseError, 'Failed to reject draft', error);
      }
      // TODO: Add image cleanup logic if needed
      */
    return createSuccessResponse(); // Return void for success
  },
};

/**
 * Returns a list of slot IDs that are available for product assignment in forms.
 * Available slots are those with status 'empty' or without an active product.
 * @returns Promise<number[]> A list of available slot IDs
 */
export async function getAvailableSlotsForProductForm(): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from("auction_slots")
      .select("id")
      .eq("slot_status", "empty");
    
    if (error) throw error;
    
    return data.map(slot => slot.id);
  } catch (err) {
    console.error("Error fetching available slots:", err);
    return []; // Return empty array on error
  }
}
