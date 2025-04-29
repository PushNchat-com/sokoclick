import { BaseServiceImpl } from "../core/BaseService";
import {
  ServiceResponse,
  createErrorResponse,
  createSuccessResponse,
  ServiceErrorType,
} from "../core/ServiceResponse";
import { supabase } from "../../clients/supabase";
import { PostgrestError } from "@supabase/supabase-js";
import { offlineStorage } from "../core/OfflineStorage";
import { PendingOperationType } from "../core/OfflineStorage";
// Import generated types
import type { definitions } from "../../types/supabase-types";

// Use the generated type for AuctionSlot
export type AuctionSlot = definitions["auction_slots"];

// Remove or update old SlotStatus enum if not perfectly aligned with new schema
// export enum SlotStatus {
//   AVAILABLE = 'available',
//   OCCUPIED = 'occupied',
//   OUT_OF_ORDER = 'out_of_order',
//   RESERVED = 'reserved'
// }

// Use the generated type for slot status if available, otherwise use string
export type SlotStatus = definitions["auction_slots"]["slot_status"];

// Remove old Slot interface
// export interface Slot {
//   id: string;
//   position: number;
//   row: number;
//   column: number;
//   status: SlotStatus;
//   productId?: string;
//   updatedAt: string;
//   createdAt: string;
// }

export interface SlotFilter {
  status?: SlotStatus;
  // Remove old filters like row, column, productId
  // Add new relevant filters based on auction_slots schema
  sellerId?: string; // live_product_seller_id
  featured?: boolean;
  searchTerm?: string; // Will search relevant text fields
}

// Define payload type for updating slots (can be partial)
// Use the generated Insert/Update types if preferred for full type safety
export type SlotUpdatePayload = Partial<
  Omit<AuctionSlot, "id" | "created_at" | "updated_at">
>;

export class SlotService extends BaseServiceImpl {
  protected tableName = "auction_slots"; // Update table name

  constructor() {
    super("SlotService", "AuctionSlot"); // Update entity type name
  }

  /**
   * Save data to offline storage
   */
  private async saveToOfflineStorage(key: string, data: any): Promise<void> {
    await offlineStorage.storeEntity(key, data);
  }

  /**
   * Get data from offline storage
   */
  private async getFromOfflineStorage<T>(key: string): Promise<T[] | null> {
    const result = await offlineStorage.getAllEntities<T>(key);
    return result.success ? result.data || null : null;
  }

  /**
   * Get all slots with optional filtering, aligned with new schema
   */
  public async getSlots(
    filter?: SlotFilter,
  ): Promise<ServiceResponse<AuctionSlot[]>> {
    return this.executeWithOfflineFallback(
      async () => {
        try {
          let query = supabase.from(this.tableName).select("*");

          if (filter?.status) {
            query = query.eq("slot_status", filter.status);
          }

          if (filter?.sellerId) {
            query = query.eq("live_product_seller_id", filter.sellerId);
          }

          if (filter?.featured !== undefined) {
            query = query.eq("featured", filter.featured);
          }

          if (filter?.searchTerm) {
            const searchTerm = `%${filter.searchTerm}%`;
            query = query.or(
              `live_product_name_en.ilike.${searchTerm},live_product_name_fr.ilike.${searchTerm},live_product_description_en.ilike.${searchTerm},live_product_description_fr.ilike.${searchTerm}`,
            );
          }

          const { data, error } = await query.order("id", { ascending: true });

          if (error) {
            throw error;
          }

          const slots = data || [];

          await this.saveToOfflineStorage(this.tableName, slots);

          return createSuccessResponse(slots);
        } catch (error) {
          return this.processError("getSlots", error as PostgrestError | Error);
        }
      },
      async () => {
        const cachedSlots =
          (await this.getFromOfflineStorage<AuctionSlot>(this.tableName)) || [];

        let filteredSlots = cachedSlots;

        if (filter?.status) {
          filteredSlots = filteredSlots.filter(
            (slot) => slot.slot_status === filter.status,
          );
        }

        if (filter?.sellerId) {
          filteredSlots = filteredSlots.filter(
            (slot) => slot.live_product_seller_id === filter.sellerId,
          );
        }

        if (filter?.featured !== undefined) {
          filteredSlots = filteredSlots.filter(
            (slot) => slot.featured === filter.featured,
          );
        }

        if (filter?.searchTerm) {
          const searchLower = filter.searchTerm.toLowerCase();
          filteredSlots = filteredSlots.filter(
            (slot) =>
              slot.id.toString().includes(searchLower) ||
              slot.live_product_name_en?.toLowerCase().includes(searchLower) ||
              slot.live_product_name_fr?.toLowerCase().includes(searchLower) ||
              slot.live_product_description_en
                ?.toLowerCase()
                .includes(searchLower) ||
              slot.live_product_description_fr
                ?.toLowerCase()
                .includes(searchLower),
          );
        }

        return createSuccessResponse(filteredSlots);
      },
    );
  }

  /**
   * Get a single slot by ID
   */
  public async getSlotById(id: number): Promise<ServiceResponse<AuctionSlot>> {
    return this.executeWithOfflineFallback(
      async () => {
        try {
          const { data, error } = await supabase
            .from(this.tableName)
            .select("*")
            .eq("id", id)
            .single();

          if (error) {
            throw error;
          }

          return createSuccessResponse(data);
        } catch (error) {
          return this.processError(
            "getSlotById",
            error as PostgrestError | Error,
          );
        }
      },
      async () => {
        const cachedSlots =
          (await this.getFromOfflineStorage<AuctionSlot>(this.tableName)) || [];
        const slot = cachedSlots.find((slot) => slot.id === id);

        if (!slot) {
          return createErrorResponse(
            ServiceErrorType.NOT_FOUND,
            `${this.entityType} not found`,
            `${this.entityType} with ID ${id} not found in offline storage`,
          );
        }

        return createSuccessResponse(slot);
      },
    );
  }

  /**
   * Update a slot (including draft or live product details)
   */
  public async updateSlot(
    id: number,
    payload: SlotUpdatePayload,
  ): Promise<ServiceResponse<AuctionSlot>> {
    return this.executeWithOfflineFallback(
      async () => {
        try {
          const { data, error } = await supabase
            .from(this.tableName)
            .update(payload as any)
            .eq("id", id)
            .select()
            .single();

          if (error) {
            throw error;
          }

          const cachedSlots =
            (await this.getFromOfflineStorage<AuctionSlot>(this.tableName)) ||
            [];
          const updatedCache = cachedSlots.map((slot) =>
            slot.id === id ? data : slot,
          );
          await this.saveToOfflineStorage(this.tableName, updatedCache);

          return createSuccessResponse(data);
        } catch (error) {
          return this.processError(
            "updateSlot",
            error as PostgrestError | Error,
          );
        }
      },
      async () => {
        await this.savePendingOperation(PendingOperationType.UPDATE, {
          id,
          ...payload,
        });
        return createErrorResponse(
          ServiceErrorType.OFFLINE_ERROR,
          "Update saved for later",
          "Slot update will be performed when you are back online",
        );
      },
    );
  }

  /**
   * Updates only the draft fields for a specific slot.
   */
  public async updateDraftProduct(
    id: number,
    draftData: Partial<Pick<AuctionSlot, `draft_${string}`>>,
  ): Promise<ServiceResponse<AuctionSlot>> {
    const payload = { ...draftData };
    if (Object.keys(payload).length > 0 && !payload.draft_status) {
      payload.draft_status = "drafting";
    }
    return this.updateSlot(id, payload);
  }

  /**
   * Publishes the draft content to the live fields for a specific slot.
   */
  public async publishDraftToLive(
    id: number,
    durationDays: number = 30,
  ): Promise<ServiceResponse<AuctionSlot>> {
    const slotResponse = await this.getSlotById(id);
    if (!slotResponse.success || !slotResponse.data) {
      return createErrorResponse(ServiceErrorType.NOT_FOUND, "Slot not found");
    }

    const slot = slotResponse.data;
    if (slot.draft_status !== "ready_to_publish") {
      return createErrorResponse(
        ServiceErrorType.VALIDATION_ERROR,
        "Draft not ready to publish",
      );
    }

    const now = new Date();
    const endTime = new Date(
      now.getTime() + durationDays * 24 * 60 * 60 * 1000,
    );

    const livePayload: SlotUpdatePayload = {
      live_product_seller_id: null,
      live_product_name_en: slot.draft_product_name_en,
      live_product_name_fr: slot.draft_product_name_fr,
      live_product_description_en: slot.draft_product_description_en,
      live_product_description_fr: slot.draft_product_description_fr,
      live_product_price: slot.draft_product_price,
      live_product_currency: slot.draft_product_currency,
      live_product_categories: slot.draft_product_categories,
      live_product_delivery_options: slot.draft_product_delivery_options,
      live_product_tags: slot.draft_product_tags,
      live_product_image_urls: slot.draft_product_image_urls,
      slot_status: "live",
      start_time: now.toISOString(),
      end_time: endTime.toISOString(),
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
      draft_status: "empty",
    };

    if (slot.draft_seller_whatsapp_number) {
      console.warn("Need to implement fetching seller ID by WhatsApp number");
    }

    return this.updateSlot(id, livePayload);
  }

  /**
   * Clears the live product details from a slot, setting its status to 'empty'.
   */
  public async clearLiveProduct(
    id: number,
  ): Promise<ServiceResponse<AuctionSlot>> {
    const payload: SlotUpdatePayload = {
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
      slot_status: "empty",
      start_time: null,
      end_time: null,
      view_count: 0,
      featured: false,
    };
    return this.updateSlot(id, payload);
  }

  /**
   * Toggle maintenance mode for a slot.
   */
  public async toggleMaintenance(
    id: number,
    setMaintenance: boolean,
  ): Promise<ServiceResponse<AuctionSlot>> {
    const currentSlotResponse = await this.getSlotById(id);
    if (!currentSlotResponse.success || !currentSlotResponse.data) {
      return createErrorResponse(ServiceErrorType.NOT_FOUND, "Slot not found");
    }

    const newStatus = setMaintenance
      ? "maintenance"
      : currentSlotResponse.data.live_product_name_en
        ? "live"
        : "empty";

    const payload: SlotUpdatePayload = {
      slot_status: newStatus,
    };
    return this.updateSlot(id, payload);
  }

  public async deleteSlot(id: number): Promise<ServiceResponse<void>> {
    console.warn("Deleting fixed slots is generally not recommended.");
    return this.executeWithOfflineFallback(
      async () => {
        try {
          const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq("id", id);

          if (error) {
            throw error;
          }

          const cachedSlots =
            (await this.getFromOfflineStorage<AuctionSlot>(this.tableName)) ||
            [];
          await this.saveToOfflineStorage(
            this.tableName,
            cachedSlots.filter((slot) => slot.id !== id),
          );

          return createSuccessResponse(undefined);
        } catch (error) {
          return this.processError(
            "deleteSlot",
            error as PostgrestError | Error,
          );
        }
      },
      async () => {
        await this.savePendingOperation(PendingOperationType.DELETE, { id });
        return createErrorResponse(
          ServiceErrorType.OFFLINE_ERROR,
          "Delete saved for later",
          "Slot deletion will be performed when you are back online",
        );
      },
    );
  }
}

export const slotService = new SlotService();
