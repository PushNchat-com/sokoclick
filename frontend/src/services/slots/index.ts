import { BaseServiceImpl } from '../core/BaseService';
import { ServiceResponse, createErrorResponse, createSuccessResponse } from '../core/ServiceResponse';

// Enum for slot status
export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE',
  OCCUPIED = 'OCCUPIED'
}

// Slot interface
export interface Slot {
  id: string;
  slotNumber: number;
  status: SlotStatus;
  imageUrl?: string; 
  productId?: string;
  createdAt: string;
  updatedAt: string;
}

// Slot creation/update payload
export interface SlotPayload {
  slotNumber: number;
  status?: SlotStatus;
  imageUrl?: string;
  productId?: string;
}

// Slot filtering options
export interface SlotFilter {
  status?: SlotStatus;
  productId?: string;
  search?: string;
}

// Slot service interface
export interface SlotService {
  getSlots(filter?: SlotFilter): Promise<ServiceResponse<Slot[]>>;
  getSlotById(id: string): Promise<ServiceResponse<Slot>>;
  createSlot(slot: SlotPayload): Promise<ServiceResponse<Slot>>;
  updateSlot(id: string, slot: Partial<SlotPayload>): Promise<ServiceResponse<Slot>>;
  deleteSlot(id: string): Promise<ServiceResponse<void>>;
  uploadSlotImage(id: string, file: File): Promise<ServiceResponse<string>>;
  toggleMaintenance(id: string): Promise<ServiceResponse<Slot>>;
  reserveSlot(id: string): Promise<ServiceResponse<Slot>>;
  cancelReservation(id: string): Promise<ServiceResponse<Slot>>;
}

// Slot service implementation
class SlotServiceImpl extends BaseServiceImpl implements SlotService {
  private tableName = 'slots';
  private storageBucket = 'slot-images';

  constructor() {
    super('slot-service');
  }

  async getSlots(filter?: SlotFilter): Promise<ServiceResponse<Slot[]>> {
    try {
      // Try to do the operation online
      if (await this.isOnline()) {
        // Import supabase here
        const { supabase } = await import('../../lib/supabaseClient');
        
        let query = supabase
          .from(this.tableName)
          .select('*');

        // Apply filters if provided
        if (filter) {
          if (filter.status) {
            query = query.eq('status', filter.status);
          }
          
          if (filter.productId) {
            query = query.eq('productId', filter.productId);
          }
        }

        const { data, error } = await query.order('slotNumber', { ascending: true });

        if (error) {
          console.error('Error fetching slots:', error);
          return createErrorResponse('DATABASE_ERROR', 'Failed to fetch slots');
        }

        // Filter by search term if provided
        let slots = data as Slot[];
        if (filter?.search) {
          const searchTerm = filter.search.toLowerCase();
          slots = slots.filter(slot => 
            slot.slotNumber.toString().includes(searchTerm)
          );
        }

        // Cache the slots for offline use
        await this.cacheData(this.tableName, slots);
        
        return createSuccessResponse(slots);
      } 
      
      // If offline, try to get cached data
      const cachedSlots = await this.getCachedData<Slot[]>(this.tableName);
      
      if (cachedSlots) {
        // Apply filters to cached slots
        let filteredSlots = cachedSlots;
        
        if (filter) {
          if (filter.status) {
            filteredSlots = filteredSlots.filter(slot => slot.status === filter.status);
          }
          
          if (filter.productId) {
            filteredSlots = filteredSlots.filter(slot => slot.productId === filter.productId);
          }
          
          if (filter.search) {
            const searchTerm = filter.search.toLowerCase();
            filteredSlots = filteredSlots.filter(slot => 
              slot.slotNumber.toString().includes(searchTerm)
            );
          }
        }
        
        return createSuccessResponse(filteredSlots);
      }
      
      return createErrorResponse('OFFLINE_ERROR', 'No cached slot data available');
    } catch (error) {
      console.error('Error in getSlots:', error);
      return createErrorResponse('UNKNOWN_ERROR', 'An unexpected error occurred');
    }
  }

  async getSlotById(id: string): Promise<ServiceResponse<Slot>> {
    try {
      if (await this.isOnline()) {
        const { supabase } = await import('../../lib/supabaseClient');
        const { data, error } = await supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching slot by ID:', error);
          return createErrorResponse('DATABASE_ERROR', `Failed to fetch slot with ID ${id}`);
        }

        return createSuccessResponse(data as Slot);
      }
      
      // If offline, try to find slot in cache
      const cachedSlots = await this.getCachedData<Slot[]>(this.tableName);
      if (cachedSlots) {
        const slot = cachedSlots.find(s => s.id === id);
        if (slot) {
          return createSuccessResponse(slot);
        }
      }
      
      return createErrorResponse('OFFLINE_ERROR', `Slot with ID ${id} not found in cache`);
    } catch (error) {
      console.error('Error in getSlotById:', error);
      return createErrorResponse('UNKNOWN_ERROR', 'An unexpected error occurred');
    }
  }

  async createSlot(slot: SlotPayload): Promise<ServiceResponse<Slot>> {
    if (!(await this.isOnline())) {
      return createErrorResponse('OFFLINE_ERROR', 'Cannot create slots while offline');
    }

    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          ...slot,
          status: slot.status || SlotStatus.AVAILABLE,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating slot:', error);
        return createErrorResponse('DATABASE_ERROR', 'Failed to create slot');
      }

      // Update cache
      const cachedSlots = await this.getCachedData<Slot[]>(this.tableName) || [];
      await this.cacheData(this.tableName, [...cachedSlots, data as Slot]);

      return createSuccessResponse(data as Slot);
    } catch (error) {
      console.error('Error in createSlot:', error);
      return createErrorResponse('UNKNOWN_ERROR', 'An unexpected error occurred');
    }
  }

  async updateSlot(id: string, slotUpdate: Partial<SlotPayload>): Promise<ServiceResponse<Slot>> {
    if (!(await this.isOnline())) {
      return createErrorResponse('OFFLINE_ERROR', 'Cannot update slots while offline');
    }

    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...slotUpdate,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating slot:', error);
        return createErrorResponse('DATABASE_ERROR', `Failed to update slot with ID ${id}`);
      }

      // Update cache
      const cachedSlots = await this.getCachedData<Slot[]>(this.tableName) || [];
      const updatedCachedSlots = cachedSlots.map(s => s.id === id ? data as Slot : s);
      await this.cacheData(this.tableName, updatedCachedSlots);

      return createSuccessResponse(data as Slot);
    } catch (error) {
      console.error('Error in updateSlot:', error);
      return createErrorResponse('UNKNOWN_ERROR', 'An unexpected error occurred');
    }
  }

  async deleteSlot(id: string): Promise<ServiceResponse<void>> {
    if (!(await this.isOnline())) {
      return createErrorResponse('OFFLINE_ERROR', 'Cannot delete slots while offline');
    }

    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting slot:', error);
        return createErrorResponse('DATABASE_ERROR', `Failed to delete slot with ID ${id}`);
      }

      // Update cache
      const cachedSlots = await this.getCachedData<Slot[]>(this.tableName) || [];
      const updatedCachedSlots = cachedSlots.filter(s => s.id !== id);
      await this.cacheData(this.tableName, updatedCachedSlots);

      return createSuccessResponse(undefined);
    } catch (error) {
      console.error('Error in deleteSlot:', error);
      return createErrorResponse('UNKNOWN_ERROR', 'An unexpected error occurred');
    }
  }

  async uploadSlotImage(id: string, file: File): Promise<ServiceResponse<string>> {
    if (!(await this.isOnline())) {
      return createErrorResponse('OFFLINE_ERROR', 'Cannot upload images while offline');
    }

    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const fileName = `${id}-${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase
        .storage
        .from(this.storageBucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error uploading image:', error);
        return createErrorResponse('STORAGE_ERROR', 'Failed to upload image');
      }

      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from(this.storageBucket)
        .getPublicUrl(data.path);

      // Update slot with image URL
      const imageUrl = urlData.publicUrl;
      await this.updateSlot(id, { imageUrl });

      return createSuccessResponse(imageUrl);
    } catch (error) {
      console.error('Error in uploadSlotImage:', error);
      return createErrorResponse('UNKNOWN_ERROR', 'An unexpected error occurred');
    }
  }

  async toggleMaintenance(id: string): Promise<ServiceResponse<Slot>> {
    try {
      // Get current slot state
      const slotResponse = await this.getSlotById(id);
      
      if (!slotResponse.success) {
        return slotResponse;
      }
      
      const slot = slotResponse.data;
      
      // Toggle maintenance status
      const newStatus = slot.status === SlotStatus.MAINTENANCE 
        ? SlotStatus.AVAILABLE 
        : SlotStatus.MAINTENANCE;
      
      // Update the slot
      return await this.updateSlot(id, { status: newStatus });
    } catch (error) {
      console.error('Error in toggleMaintenance:', error);
      return createErrorResponse('UNKNOWN_ERROR', 'An unexpected error occurred');
    }
  }

  async reserveSlot(id: string): Promise<ServiceResponse<Slot>> {
    try {
      // Get current slot state
      const slotResponse = await this.getSlotById(id);
      
      if (!slotResponse.success) {
        return slotResponse;
      }
      
      const slot = slotResponse.data;
      
      // Check if slot is available
      if (slot.status !== SlotStatus.AVAILABLE) {
        return createErrorResponse(
          'SLOT_UNAVAILABLE', 
          `Cannot reserve slot ${id} because it is not available`
        );
      }
      
      // Update the slot to reserved status
      return await this.updateSlot(id, { status: SlotStatus.RESERVED });
    } catch (error) {
      console.error('Error in reserveSlot:', error);
      return createErrorResponse('UNKNOWN_ERROR', 'An unexpected error occurred');
    }
  }

  async cancelReservation(id: string): Promise<ServiceResponse<Slot>> {
    try {
      // Get current slot state
      const slotResponse = await this.getSlotById(id);
      
      if (!slotResponse.success) {
        return slotResponse;
      }
      
      const slot = slotResponse.data;
      
      // Check if slot is reserved
      if (slot.status !== SlotStatus.RESERVED) {
        return createErrorResponse(
          'SLOT_NOT_RESERVED', 
          `Cannot cancel reservation for slot ${id} because it is not reserved`
        );
      }
      
      // Update the slot to available status
      return await this.updateSlot(id, { status: SlotStatus.AVAILABLE });
    } catch (error) {
      console.error('Error in cancelReservation:', error);
      return createErrorResponse('UNKNOWN_ERROR', 'An unexpected error occurred');
    }
  }
}

// Export a singleton instance of the service
export const slotService = new SlotServiceImpl();

// Export the service interface for dependency injection
export type { SlotService }; 
export default slotService; 