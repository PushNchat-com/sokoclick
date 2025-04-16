import supabase from '../lib/supabase';
import type { Product } from '../types/supabase';
import { ToastService } from '../utils/toast';

/**
 * Fetch products with pagination and filtering
 */
export const getProducts = async (
  limit = 20,
  offset = 0,
  filters?: {
    sellerId?: string;
    category?: string;
    search?: string;
  },
  showToast = true
): Promise<{ data: Product[]; count: number }> => {
  try {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Apply filters if provided
    if (filters) {
      if (filters.sellerId) {
        query = query.eq('seller_id', filters.sellerId);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.search) {
        query = query.or(`name_en.ilike.%${filters.search}%,name_fr.ilike.%${filters.search}%`);
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      if (showToast) ToastService.apiError(error);
      throw new Error(error.message);
    }

    return { data: data || [], count: count || 0 };
  } catch (error) {
    if (showToast) ToastService.apiError(error);
    throw error;
  }
};

/**
 * Get a single product by ID
 */
export const getProductById = async (
  id: string,
  showToast = true
): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (showToast) ToastService.apiError(error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    if (showToast) ToastService.apiError(error);
    throw error;
  }
};

/**
 * Create a new product
 */
export const createProduct = async (
  product: Omit<Product, 'id' | 'created_at'>,
  showToast = true
): Promise<Product> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) {
      if (showToast) ToastService.apiError(error);
      throw new Error(error.message);
    }

    if (showToast) ToastService.success('Product created successfully');
    return data;
  } catch (error) {
    if (showToast) ToastService.apiError(error);
    throw error;
  }
};

/**
 * Update a product
 */
export const updateProduct = async (
  id: string,
  updates: Partial<Product>,
  showToast = true
): Promise<Product> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (showToast) ToastService.apiError(error);
      throw new Error(error.message);
    }

    if (showToast) ToastService.success('Product updated successfully');
    return data;
  } catch (error) {
    if (showToast) ToastService.apiError(error);
    throw error;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (
  id: string,
  showToast = true
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      if (showToast) ToastService.apiError(error);
      throw new Error(error.message);
    }

    if (showToast) ToastService.success('Product deleted successfully');
  } catch (error) {
    if (showToast) ToastService.apiError(error);
    throw error;
  }
};

/**
 * Get product categories
 */
export const getProductCategories = async (
  showToast = true
): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_distinct_categories');

    if (error) {
      if (showToast) ToastService.apiError(error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    if (showToast) ToastService.apiError(error);
    throw error;
  }
}; 