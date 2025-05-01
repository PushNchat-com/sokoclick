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
import { DeliveryOption } from "@/types/delivery"; // Use alias path
import { Tables, Json } from "@/types/supabase-types"; // Import only needed types from generated file
import { SlotStatus } from "@/types/enums"; // Import SlotStatus from the new enum file

// Re-export SlotStatus for components that need it (from the new location)
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
    | "draft_seller_whatsapp_number"
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
    setRefreshTrigger((prev: number) => prev + 1);
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
            name
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
      const transformedSlots = (slotsData || []).map((slot: any) => {
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
        filteredSlots = filteredSlots.filter((slot: Slot) => {
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
    setRefreshTrigger((prev: number) => prev + 1);
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
    setRefreshTrigger((prev: number) => prev + 1);
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
   * Sets or clears maintenance mode for a specific slot using RPC.
   */
  async setSlotMaintenance(
    slotId: number,
    maintenance: boolean,
  ): Promise<ServiceResponse> {
    try {
      type MaintenanceRpcResponse = { status: 'success' | 'error'; message?: string; new_status?: string };

      // Remove 'as any' assertion - types should be correct now
      const { data, error } = await supabase.rpc("toggle_slot_maintenance", {
        target_slot_id: slotId,
      });
      const typedData = data as MaintenanceRpcResponse | null;

      if (error) {
        console.error("RPC toggle_slot_maintenance Error:", error);
        return createErrorResponse(ServiceErrorType.DATABASE_ERROR, error.message); 
      }

      if (typedData && typedData.status === "error") {
        console.error("RPC toggle_slot_maintenance Logic Error:", typedData.message);
        return createErrorResponse(
          ServiceErrorType.VALIDATION_ERROR, 
          typedData.message || "Failed to toggle maintenance mode",
        );
      }
      
      if (typedData && typedData.status === "success") {
        return createSuccessResponse();
      }
      
      return createErrorResponse(ServiceErrorType.UNKNOWN_ERROR, "Unexpected response from toggle maintenance RPC.");

    } catch (err) {
      console.error("Unexpected error toggling maintenance:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      return createErrorResponse(ServiceErrorType.UNKNOWN_ERROR, message);
    }
  },

  /**
   * Clears the live product details and sets status to 'empty' for a specific slot using RPC.
   */
  async removeProductFromSlot(slotId: number): Promise<ServiceResponse> {
    try {
      type RemoveProductRpcResponse = { status: 'success' | 'error'; message?: string };
      
      // Remove 'as any' assertion
      const { data, error } = await supabase.rpc("remove_live_product", {
        target_slot_id: slotId,
      });
      const typedData = data as RemoveProductRpcResponse | null;

      if (error) {
        console.error("RPC remove_live_product Error:", error);
        return createErrorResponse(ServiceErrorType.DATABASE_ERROR, error.message);
      }

      if (typedData && typedData.status === "error") {
        console.error("RPC remove_live_product Logic Error:", typedData.message);
        return createErrorResponse(
          ServiceErrorType.VALIDATION_ERROR,
          typedData.message || "Failed to remove product.",
        );
      }

      if (typedData && typedData.status === "success") {
        return createSuccessResponse();
      }

      return createErrorResponse(ServiceErrorType.UNKNOWN_ERROR, "Unexpected response from remove product RPC.");

    } catch (err) {
      console.error("Unexpected error removing product:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      return createErrorResponse(ServiceErrorType.UNKNOWN_ERROR, message);
    }
  },

  /**
   * Calls the backend RPC function to approve a draft.
   * Assumes validation (status check, seller lookup) is done *before* calling this.
   * @param slotId The ID of the slot to approve.
   * @returns ServiceResponse indicating success or failure based on RPC result.
   */
  async approveDraft(slotId: number): Promise<ServiceResponse> {
    if (!slotId || slotId < 1 || slotId > 25) {
      return createErrorResponse(
        ServiceErrorType.VALIDATION_ERROR,
        "Invalid Slot ID."
      );
    }

    try {
      type RpcResponse = { status: 'success' | 'error'; message?: string; slot_id?: number };
      
      // Remove 'as any' assertion
      const { data: rawData, error: rpcError } = await supabase.rpc("approve_slot", {
        slot_id_to_approve: slotId,
      });

      if (rpcError) {
        console.error(`RPC approve_slot error for slot ${slotId}:`, rpcError);
        throw rpcError;
      }

      // Explicit Type Guard for the response data
      if (typeof rawData === 'object' && rawData !== null && 'status' in rawData) {
        // Now TypeScript knows rawData has at least a 'status' property
        const data = rawData as RpcResponse; // Can safely assert type here
        
        if (data.status === "success") {
          return createSuccessResponse();
        } else {
          // RPC executed but returned a logical error (e.g., permission denied, slot not ready)
          const errorMessage = data.message || "Approval failed due to backend validation.";
          console.warn(`RPC approve_slot logic error for slot ${slotId}: ${errorMessage}`);
          return createErrorResponse(ServiceErrorType.VALIDATION_ERROR, errorMessage);
        }
      } else {
        // Handle unexpected response format (e.g., null, boolean, or wrong object structure)
        console.error(`RPC approve_slot unexpected response format for slot ${slotId}:`, rawData);
        return createErrorResponse(ServiceErrorType.UNKNOWN_ERROR, "Received unexpected response from approval function.");
      }
    } catch (err: unknown) {
      console.error(`Error calling approve_slot RPC for slot ${slotId}:`, err);
      const message = isPostgrestError(err)
        ? err.message
        : `Failed to approve draft for slot ${slotId}.`;
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

  /**
   * Calls the backend RPC to reject a draft, clearing draft fields and resetting draft_status.
   * @param slotId The ID of the slot whose draft is to be rejected.
   * @param rejectionReason Optional reason for rejection (passed to RPC but not stored by default).
   * @returns ServiceResponse indicating success or failure.
   */
  async rejectDraft(slotId: number, rejectionReason?: string): Promise<ServiceResponse<void>> {
    if (!slotId || slotId < 1 || slotId > 25) {
      return createErrorResponse(
        ServiceErrorType.VALIDATION_ERROR,
        "Invalid Slot ID."
      );
    }

    try {
      type RpcResponse = { status: 'success' | 'error'; message?: string; slot_id?: number };
      
      // Remove 'as any' assertion
      const { data: rawData, error: rpcError } = await supabase.rpc("reject_slot", {
        slot_id_to_reject: slotId,
        rejection_reason: rejectionReason || undefined,
      });

      if (rpcError) {
         console.error(`RPC reject_slot error for slot ${slotId}:`, rpcError);
        throw rpcError;
      }

      // Explicit Type Guard for the response data
      if (typeof rawData === 'object' && rawData !== null && 'status' in rawData) {
        const data = rawData as RpcResponse;
        
        if (data.status === "success") {
          return createSuccessResponse(); // Return void for success
        } else {
          const errorMessage = data.message || "Rejection failed due to backend validation.";
          console.warn(`RPC reject_slot logic error for slot ${slotId}: ${errorMessage}`);
          return createErrorResponse(ServiceErrorType.VALIDATION_ERROR, errorMessage);
        }
      } else {
        console.error(`RPC reject_slot unexpected response format for slot ${slotId}:`, rawData);
        return createErrorResponse(ServiceErrorType.UNKNOWN_ERROR, "Received unexpected response from rejection function.");
      }

    } catch (err: unknown) {
      console.error(`Error calling reject_slot RPC for slot ${slotId}:`, err);
      const message = isPostgrestError(err)
        ? err.message
        : `Failed to reject draft for slot ${slotId}.`;
      const errorType = isPostgrestError(err)
        ? ServiceErrorType.DATABASE_ERROR
        : ServiceErrorType.UNKNOWN_ERROR;
      return createErrorResponse(errorType, message, err);
    }
  },

  /**
   * Saves draft product details to a specific slot.
   * If the slot doesn't exist or fails, returns an error response.
   */
  async saveProductDraft(
    slotId: number,
    draftData: SlotDraftData,
  ): Promise<ServiceResponse> {
    if (!slotId) {
      return createErrorResponse(
        ServiceErrorType.VALIDATION_ERROR,
        "Slot ID is required to save a draft.",
      );
    }

    // Prepare data for update, including setting draft_status and casting delivery options
    const updateData = {
      ...draftData,
      draft_product_delivery_options: draftData.draft_product_delivery_options as unknown as Json, // Correct casing
      draft_status: "drafting", 
    };

    try {
      const { error } = await supabase
        .from("auction_slots")
        .update(updateData) // Use the data with casted type
        .eq("id", slotId);

      if (error) {
        console.error("Error saving product draft:", error);
        // Map Supabase error to a ServiceErrorType
        if (error.code === "PGRST116") { // Not found potentially
           return createErrorResponse(ServiceErrorType.NOT_FOUND, `Slot with ID ${slotId} not found.`);
        }
        return createErrorResponse(
          ServiceErrorType.DATABASE_ERROR,
          error.message || "Failed to save draft.",
        );
      }

      console.log(`Draft saved successfully for slot ${slotId}`);
      return createSuccessResponse(); // Correct return for void signature
    } catch (err) {
      console.error("Unexpected error saving draft:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred while saving the draft.";
      return createErrorResponse(ServiceErrorType.UNKNOWN_ERROR, message); // Use UNKNOWN_ERROR
    }
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
      .from('auction_slots')
      .select('id')
      .eq('slot_status', 'empty')
      .order('id');

    if (error) throw error;
    
    return data.map((slot: { id: number }) => slot.id);
  } catch (err) {
    console.error("Error fetching available slots:", err);
    throw err; // Re-throw the error to be handled by the caller
  }
}
