import { useState, useEffect, useCallback } from 'react';
import supabase from './supabase';
import type { PostgrestError } from '@supabase/postgrest-js';
import { Product as BaseProduct } from '../types/product';

// Re-export the Product interface with additional properties
export interface Product extends BaseProduct {
  // Additional properties needed by components
  seller?: {
    name: string;
    whatsapp_number: string;
    location: string;
    is_verified: boolean;
  };
  category?: {
    name: string;
    name_en: string;
    name_fr: string;
  };
  delivery_info?: {
    available_areas: string[];
    estimated_days: number;
    has_fee: boolean;
    fee_amount: number;
  };
  end_date?: string;
}

/**
 * Sort criteria enum
 */
export enum SortCriteria {
  NEWEST = 'newest',
  ENDING_SOON = 'ending_soon',
  PRICE_HIGH = 'price_high',
  PRICE_LOW = 'price_low'
}

/**
 * Hook for fetching a single product by ID
 */
export const useProduct = (productId: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch product with seller information
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*, seller:users(*)')
        .eq('id', productId)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Get category if category_id exists
      if (data.category_id) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', data.category_id)
          .single();
          
        if (!categoryError && categoryData) {
          data.category = categoryData;
        }
      }
      
        setProduct(data as Product);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(isPostgrestError(err) ? err.message : 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  }, [productId]);
  
  // Fetch product on mount and when productId changes
  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);
  
  return { product, loading, error, refetch: fetchProduct };
};

/**
 * Hook for fetching a product by slot number
 */
export const useProductBySlot = (slotNumber: number) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchProduct = useCallback(async () => {
    if (!slotNumber) {
      setError('Slot number is required');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First find the product ID from auction_slots table
      const { data: slotData, error: slotError } = await supabase
        .from('auction_slots')
        .select('product_id')
        .eq('id', slotNumber)
        .maybeSingle();
      
      if (slotError) {
        throw slotError;
      }
      
      if (!slotData || !slotData.product_id) {
        // No product in this slot
        setProduct(null);
        setLoading(false);
        return;
      }
      
      // Then fetch the product with related data
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          seller:users(*),
          category:categories(*)
        `)
        .eq('id', slotData.product_id)
        .single();
      
      if (productError) {
        throw productError;
      }
      
      setProduct(productData as Product);
    } catch (err) {
      console.error('Error fetching product by slot:', err);
      setError(isPostgrestError(err) ? err.message : 'Failed to fetch product by slot');
    } finally {
      setLoading(false);
    }
  }, [slotNumber]);
  
  // Fetch product on mount and when slotNumber changes
  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);
  
  return { product, loading, error, refetch: fetchProduct };
};

/**
 * Hook for fetching multiple products with optional filtering
 */
export const useProducts = (options: {
  limit?: number;
  categoryId?: string;
  isApproved?: boolean;
  isFeatured?: boolean;
  sellerId?: string;
  searchTerm?: string;
  sortBy?: SortCriteria;
  offset?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'inactive';
} = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
  
  const fetchProducts = useCallback(async () => {
    // Safety check for seller ID before making request
    if (options.sellerId && !options.sellerId.trim()) {
      console.warn('Invalid seller ID provided to useProducts:', options.sellerId);
      setProducts([]);
      setLoading(false);
      setError('Invalid seller ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching products with options:', options);
      
      // Start building query
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });
      
      // Filter by status if provided, otherwise use default filter for public viewing
      if (options.status) {
        query = query.eq('status', options.status);
      } else if (!options.sellerId) {
        // Default to approved products for public viewing, not for seller's own products
        query = query.eq('status', 'approved');
      }

      // Apply seller ID filter - this is critical for the dashboard
      if (options.sellerId) {
        query = query.eq('seller_id', options.sellerId);
      }
      
      // Get category data separately to avoid relationship errors
      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }
      
      // Apply additional filters
      if (options.isApproved !== undefined) {
        query = query.eq('is_approved', options.isApproved);
      }
      
      if (options.isFeatured !== undefined) {
        query = query.eq('is_featured', options.isFeatured);
      }
      
      if (options.searchTerm) {
        const term = options.searchTerm.trim();
        query = query.or(`name_en.ilike.%${term}%,name_fr.ilike.%${term}%,description_en.ilike.%${term}%,description_fr.ilike.%${term}%`);
      }
      
      // Apply sorting
      if (options.sortBy) {
        switch (options.sortBy) {
          case SortCriteria.NEWEST:
            query = query.order('created_at', { ascending: false });
            break;
          case SortCriteria.ENDING_SOON:
            query = query.order('end_date', { ascending: true });
            break;
          case SortCriteria.PRICE_HIGH:
            query = query.order('price', { ascending: false });
            break;
          case SortCriteria.PRICE_LOW:
            query = query.order('price', { ascending: true });
            break;
        }
      } else {
        // Default sort by newest
        query = query.order('created_at', { ascending: false });
      }
      
      // Apply offset and limit for pagination
      if (options.limit) {
        if (options.offset !== undefined) {
          query = query.range(options.offset, options.offset + options.limit - 1);
        } else {
          query = query.limit(options.limit);
        }
      }
      
      // Execute query
      const { data, error: fetchError, count: totalCount } = await query;
      
      if (fetchError) {
        console.error('Supabase query error:', fetchError);
        throw fetchError;
      }
      
      console.log('Products fetched successfully:', { count: data?.length, totalCount });
      
      setProducts(data as Product[] || []);
      if (totalCount !== null) {
        setCount(totalCount);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      
      // Check for RLS recursion error
      if (isPostgrestError(err) && err.code === '42P17') {
        setError('Database permission error with admin_users table. Please contact support.');
      } else {
        setError(isPostgrestError(err) ? err.message : 'Failed to fetch products');
      }
    } finally {
      setLoading(false);
    }
  }, [
    options.sellerId,
    options.categoryId,
    options.isApproved,
    options.isFeatured,
    options.searchTerm,
    options.sortBy,
    options.limit,
    options.offset,
    options.status
  ]);
  
  // Fetch products on mount and when options change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  return { products, loading, error, count, refetch: fetchProducts };
};

// Service Response Type
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a new product
 * @param productData Product data
 * @returns Promise with the created product
 */
export const createProduct = async (productData: Partial<Product>): Promise<ServiceResponse<Product>> => {
  try {
    // First, ensure we have a valid seller
    let sellerId = productData.seller_id;
    
    if (!sellerId) {
      // Try to find the default vendor
      const { data: vendorData, error: vendorError } = await supabase
        .from('users')
        .select('id')
        .eq('name', 'SokoClick Vendor')
        .single();
      
      if (vendorError || !vendorData) {
        throw new Error('No valid seller ID provided and default vendor not found');
      }
      
      sellerId = vendorData.id;
    }
    
    // Create the product with the validated seller ID
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...productData,
        seller_id: sellerId,
        status: 'pending' // Always start as pending
      }])
      .select(`
        *,
        seller:users (
          id,
          name,
          whatsapp_number,
          location,
          is_verified
        ),
        category:categories (
          id,
          name_en,
          name_fr
        )
      `)
      .single();
    
    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }
    
    return {
      success: true,
      data: data as Product
    };
  } catch (err) {
    console.error('Error in createProduct:', err);
    return {
      success: false,
      error: isPostgrestError(err) ? err.message : 'Failed to create product'
    };
  }
};

/**
 * Update an existing product
 * @param productId Product ID
 * @param productData Updated product data
 * @returns Promise with the updated product
 */
export const updateProduct = async (productId: string, productData: Partial<Product>): Promise<ServiceResponse<Product>> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    
    return {
      success: true,
      data
    };
  } catch (err) {
    console.error('Error updating product:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
};

/**
 * Delete a product
 * @param productId Product ID
 * @returns Promise with success status
 */
export const deleteProduct = async (productId: string): Promise<ServiceResponse<null>> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) throw new Error(error.message);
    
    return {
      success: true
    };
  } catch (err) {
    console.error('Error deleting product:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
};

/**
 * Approve a product
 */
export const approveProduct = async (productId: string) => {
  return updateProduct(productId, { is_approved: true });
};

/**
 * Upload product images to storage
 */
export const uploadProductImages = async (
  productId: string,
  files: File[]
): Promise<{ urls: string[]; error: string | null }> => {
  try {
    const urls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}-${i}-${Date.now()}.${fileExt}`;
      const filePath = `products/${productId}/${fileName}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      urls.push(urlData.publicUrl);
    }
    
    return { urls, error: null };
  } catch (err) {
    console.error('Error uploading images:', err);
    return { 
      urls: [], 
      error: err instanceof Error ? err.message : 'Failed to upload images'
    };
  }
};

/**
 * Get a product by ID
 * @param productId Product ID
 * @returns Promise with the product
 */
export const getProduct = async (productId: string): Promise<ServiceResponse<Product>> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error) throw new Error(error.message);
    
    return {
      success: true,
      data
    };
  } catch (err) {
    console.error('Error fetching product:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
};

/**
 * Get products with filtering and pagination
 * @param filters Optional filters
 * @param page Page number
 * @param limit Items per page
 * @returns Promise with products and total count
 */
export const getProducts = async (
  filters: { [key: string]: any } = {},
  page = 1,
  limit = 10
): Promise<ServiceResponse<{ products: Product[], total: number }>> => {
  try {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });
    
    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    
    query = query.range(start, end);
    
    const { data, error, count } = await query;
    
    if (error) throw new Error(error.message);
    
    return {
      success: true,
      data: {
        products: data || [],
        total: count || 0
      }
    };
  } catch (err) {
    console.error('Error fetching products:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
};

// Add type guard for PostgrestError
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

/**
 * Default export for service functions
 */
export default {
  useProduct,
  useProducts,
  useProductBySlot,
  createProduct,
  updateProduct,
  deleteProduct,
  approveProduct,
  uploadProductImages,
  getProduct,
  getProducts
};
