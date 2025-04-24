import supabase from './supabase';
import { DeliveryOption } from '../types/delivery';

/**
 * Fetch delivery options for a specific product
 */
export const fetchDeliveryOptions = async (productId: string): Promise<{ data: DeliveryOption[] | null; error: string | null }> => {
  try {
    if (!productId) {
      return { data: null, error: 'Product ID is required' };
    }
    
    const { data, error } = await supabase
      .from('delivery_options')
      .select('*')
      .eq('product_id', productId);
      
    if (error) {
      throw error;
    }
    
    return { data: data as DeliveryOption[], error: null };
  } catch (err) {
    console.error('Error fetching delivery options:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Failed to fetch delivery options'
    };
  }
};

/**
 * Create a delivery option
 */
export const createDeliveryOption = async (option: DeliveryOption & { product_id: string }): Promise<{ success: boolean; data?: any; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('delivery_options')
      .insert([option])
      .select();
      
    if (error) {
      throw error;
    }
    
    return { success: true, data, error: null };
  } catch (err) {
    console.error('Error creating delivery option:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to create delivery option'
    };
  }
};

/**
 * Update a delivery option
 */
export const updateDeliveryOption = async (optionId: string, updates: Partial<DeliveryOption>): Promise<{ success: boolean; data?: any; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('delivery_options')
      .update(updates)
      .eq('id', optionId)
      .select();
      
    if (error) {
      throw error;
    }
    
    return { success: true, data, error: null };
  } catch (err) {
    console.error('Error updating delivery option:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to update delivery option'
    };
  }
};

/**
 * Delete a delivery option
 */
export const deleteDeliveryOption = async (optionId: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('delivery_options')
      .delete()
      .eq('id', optionId);
      
    if (error) {
      throw error;
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Error deleting delivery option:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to delete delivery option'
    };
  }
};

export default {
  fetchDeliveryOptions,
  createDeliveryOption,
  updateDeliveryOption,
  deleteDeliveryOption
}; 