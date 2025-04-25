import { BaseServiceImpl } from "../core/BaseService";
import { ServiceResponse, createErrorResponse, createSuccessResponse, ServiceErrorType } from "../core/ServiceResponse";
import { supabase } from "../../clients/supabase";
import { PostgrestError } from "@supabase/supabase-js";
import { offlineStorage } from "../core/OfflineStorage";
import { PendingOperationType } from "../core/OfflineStorage";

export enum SlotStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  OUT_OF_ORDER = 'out_of_order',
  RESERVED = 'reserved'
}

export interface Slot {
  id: string;
  position: number;
  row: number;
  column: number;
  status: SlotStatus;
  productId?: string;
  updatedAt: string;
  createdAt: string;
}

export interface SlotFilter {
  status?: SlotStatus;
  row?: number;
  column?: number;
  productId?: string | null;
  searchTerm?: string;
}

export interface SlotPayload {
  position?: number;
  row?: number;
  column?: number;
  status?: SlotStatus;
  productId?: string | null;
}

export class SlotService extends BaseServiceImpl {
  protected tableName = 'slots';
  
  constructor() {
    super('SlotService', 'Slot');
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
    return result.success ? result.data : null;
  }
  
  /**
   * Get all slots with optional filtering
   */
  public async getSlots(filter?: SlotFilter): Promise<ServiceResponse<Slot[]>> {
    return this.executeWithOfflineFallback(
      async () => {
        try {
          let query = supabase.from(this.tableName).select('*');
          
          // Apply filters
          if (filter?.status) {
            query = query.eq('status', filter.status);
          }
          
          if (filter?.row !== undefined) {
            query = query.eq('row', filter.row);
          }
          
          if (filter?.column !== undefined) {
            query = query.eq('column', filter.column);
          }
          
          if (filter?.productId) {
            query = query.eq('productId', filter.productId);
          }
          
          const { data, error } = await query.order('position', { ascending: true });
          
          if (error) {
            throw error;
          }
          
          let slots = data as Slot[];
          
          // Client-side filtering for search term
          if (filter?.searchTerm) {
            const searchLower = filter.searchTerm.toLowerCase();
            slots = slots.filter(slot => 
              slot.position.toString().includes(searchLower) ||
              slot.status.toLowerCase().includes(searchLower)
            );
          }
          
          // Cache slots for offline use
          await this.saveToOfflineStorage(this.tableName, slots);
          
          return createSuccessResponse(slots);
        } catch (error) {
          return this.processError('getSlots', error as PostgrestError);
        }
      },
      async () => {
        // Offline fallback - get from cache
        const cachedSlots = await this.getFromOfflineStorage<Slot[]>(this.tableName) || [];
        
        // Apply client-side filtering
        let filteredSlots = cachedSlots;
        
        if (filter?.status) {
          filteredSlots = filteredSlots.filter((slot: Slot) => slot.status === filter.status);
        }
        
        if (filter?.row !== undefined) {
          filteredSlots = filteredSlots.filter((slot: Slot) => slot.row === filter.row);
        }
        
        if (filter?.column !== undefined) {
          filteredSlots = filteredSlots.filter((slot: Slot) => slot.column === filter.column);
        }
        
        if (filter?.productId) {
          filteredSlots = filteredSlots.filter((slot: Slot) => slot.productId === filter.productId);
        }
        
        if (filter?.searchTerm) {
          const searchLower = filter.searchTerm.toLowerCase();
          filteredSlots = filteredSlots.filter((slot: Slot) => 
            slot.position.toString().includes(searchLower) ||
            slot.status.toLowerCase().includes(searchLower)
          );
        }
        
        return createSuccessResponse(filteredSlots);
      }
    );
  }
  
  /**
   * Get a single slot by ID
   */
  public async getSlotById(id: string): Promise<ServiceResponse<Slot>> {
    return this.executeWithOfflineFallback(
      async () => {
        try {
          const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) {
            throw error;
          }
          
          return createSuccessResponse(data as Slot);
        } catch (error) {
          return this.processError('getSlotById', error as PostgrestError);
        }
      },
      async () => {
        const cachedSlots = await this.getFromOfflineStorage<Slot[]>(this.tableName) || [];
        const slot = cachedSlots.find((slot: Slot) => slot.id === id);
        
        if (!slot) {
          return createErrorResponse(
            ServiceErrorType.NOT_FOUND,
            `${this.entityType} not found`,
            `${this.entityType} with ID ${id} not found in offline storage`
          );
        }
        
        return createSuccessResponse(slot);
      }
    );
  }
  
  /**
   * Create a new slot
   */
  public async createSlot(payload: SlotPayload): Promise<ServiceResponse<Slot>> {
    return this.executeWithOfflineFallback(
      async () => {
        try {
          const now = new Date().toISOString();
          const newSlot = {
            ...payload,
            status: payload.status || SlotStatus.AVAILABLE,
            createdAt: now,
            updatedAt: now
          };
          
          const { data, error } = await supabase
            .from(this.tableName)
            .insert(newSlot)
            .select()
            .single();
          
          if (error) {
            throw error;
          }
          
          // Update offline cache
          const cachedSlots = await this.getFromOfflineStorage<Slot[]>(this.tableName) || [];
          await this.saveToOfflineStorage(this.tableName, [...cachedSlots, data as Slot]);
          
          return createSuccessResponse(data as Slot);
        } catch (error) {
          return this.processError('createSlot', error as PostgrestError);
        }
      },
      async () => {
        // Save pending operation for when we're back online
        const operationId = `create_${this.tableName}_${Date.now()}`;
        await this.savePendingOperation(PendingOperationType.CREATE, payload);
        
        return createErrorResponse(
          ServiceErrorType.OFFLINE_ERROR,
          'Operation saved for later',
          'This operation will be performed when you are back online'
        );
      }
    );
  }
  
  /**
   * Update a slot
   */
  public async updateSlot(id: string, payload: SlotPayload): Promise<ServiceResponse<Slot>> {
    return this.executeWithOfflineFallback(
      async () => {
        try {
          const updatedSlot = {
            ...payload,
            updatedAt: new Date().toISOString()
          };
          
          const { data, error } = await supabase
            .from(this.tableName)
            .update(updatedSlot)
            .eq('id', id)
            .select()
            .single();
          
          if (error) {
            throw error;
          }
          
          // Update offline cache
          const cachedSlots = await this.getFromOfflineStorage<Slot[]>(this.tableName) || [];
          const updatedSlots = cachedSlots.map((slot: Slot) => 
            slot.id === id ? { ...slot, ...data } as Slot : slot
          );
          await this.saveToOfflineStorage(this.tableName, updatedSlots);
          
          return createSuccessResponse(data as Slot);
        } catch (error) {
          return this.processError('updateSlot', error as PostgrestError);
        }
      },
      async () => {
        // Save pending operation for when we're back online
        const operationId = `update_${this.tableName}_${id}_${Date.now()}`;
        await this.savePendingOperation(PendingOperationType.UPDATE, payload, id);
        
        // Optimistically update the local cache
        const cachedSlots = await this.getFromOfflineStorage<Slot[]>(this.tableName) || [];
        const now = new Date().toISOString();
        
        const updatedSlots = cachedSlots.map((slot: Slot) => 
          slot.id === id ? { ...slot, ...payload, updatedAt: now } : slot
        );
        
        await this.saveToOfflineStorage(this.tableName, updatedSlots);
        
        return createErrorResponse(
          ServiceErrorType.OFFLINE_ERROR,
          'Operation saved for later',
          'This operation will be performed when you are back online'
        );
      }
    );
  }
  
  /**
   * Delete a slot
   */
  public async deleteSlot(id: string): Promise<ServiceResponse<void>> {
    return this.executeWithOfflineFallback(
      async () => {
        try {
          const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);
          
          if (error) {
            throw error;
          }
          
          // Update offline cache
          const cachedSlots = await this.getFromOfflineStorage<Slot[]>(this.tableName) || [];
          const updatedSlots = cachedSlots.filter((slot: Slot) => slot.id !== id);
          await this.saveToOfflineStorage(this.tableName, updatedSlots);
          
          return createSuccessResponse(undefined);
        } catch (error) {
          return this.processError('deleteSlot', error as PostgrestError);
        }
      },
      async () => {
        // Save pending operation for when we're back online
        const operationId = `delete_${this.tableName}_${id}_${Date.now()}`;
        await this.savePendingOperation(PendingOperationType.DELETE, {}, id);
        
        // Optimistically update the local cache
        const cachedSlots = await this.getFromOfflineStorage<Slot[]>(this.tableName) || [];
        const updatedSlots = cachedSlots.filter((slot: Slot) => slot.id !== id);
        await this.saveToOfflineStorage(this.tableName, updatedSlots);
        
        return createErrorResponse(
          ServiceErrorType.OFFLINE_ERROR,
          'Operation saved for later',
          'This operation will be performed when you are back online'
        );
      }
    );
  }
  
  /**
   * Change a slot status
   */
  public async changeSlotStatus(id: string, status: SlotStatus): Promise<ServiceResponse<Slot>> {
    return this.updateSlot(id, { status });
  }
  
  /**
   * Assign a product to a slot
   */
  public async assignProductToSlot(slotId: string, productId: string): Promise<ServiceResponse<Slot>> {
    return this.updateSlot(slotId, { 
      productId,
      status: SlotStatus.OCCUPIED 
    });
  }
  
  /**
   * Remove a product from a slot
   */
  public async removeProductFromSlot(slotId: string): Promise<ServiceResponse<Slot>> {
    return this.updateSlot(slotId, { 
      productId: null,
      status: SlotStatus.AVAILABLE 
    });
  }
} 