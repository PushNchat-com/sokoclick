import { supabase } from '../supabase';
import { BaseServiceImpl } from '../core/BaseService';
import { ServiceResponse, createSuccessResponse, createErrorResponse, ServiceErrorType } from '../core/ServiceResponse';
import { offlineStorage, PendingOperationType } from '../core/OfflineStorage';
import { PostgrestError } from '@supabase/postgrest-js';

/**
 * Product entity interface
 */
export interface Product {
  id: string;
  name_en: string;
  name_fr: string;
  description_en?: string;
  description_fr?: string;
  price: number;
  currency: string;
  images: string[];
  seller_id: string;
  category_id?: string;
  auction_slot_id?: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  seller?: {
    id: string;
    name: string;
    whatsapp_number: string;
    location?: string;
    is_verified: boolean;
  };
  category?: {
    id: string;
    name_en: string;
    name_fr: string;
  };
}

/**
 * Product create/update payload
 */
export interface ProductPayload {
  name_en: string;
  name_fr: string;
  description_en?: string;
  description_fr?: string;
  price: number;
  currency: string;
  images: string[];
  seller_id: string;
  category_id?: string;
  auction_slot_id?: number;
  status?: ProductStatus;
}

/**
 * Product status enum
 */
export enum ProductStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  INACTIVE = 'inactive'
}

/**
 * Product filter options
 */
export interface ProductFilter {
  status?: ProductStatus;
  sellerId?: string;
  categoryId?: string;
  slotId?: number;
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Check if error is a Postgrest error
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'details' in error &&
    'hint' in error &&
    'code' in error
  );
}

/**
 * Product service for managing product operations
 */
class ProductService extends BaseServiceImpl {
  constructor() {
    super('ProductService', 'products');
  }

  /**
   * Get all products with optional filtering
   */
  async getProducts(filter?: ProductFilter): Promise<ServiceResponse<Product[]>> {
    return this.executeWithOfflineFallback(
      // Online operation
      async () => {
        try {
          let query = supabase
            .from('products')
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
            `);

          // Apply filters
          if (filter) {
            if (filter.status) {
              query = query.eq('status', filter.status);
            }
            
            if (filter.sellerId) {
              query = query.eq('seller_id', filter.sellerId);
            }
            
            if (filter.categoryId) {
              query = query.eq('category_id', filter.categoryId);
            }
            
            if (filter.slotId) {
              query = query.eq('auction_slot_id', filter.slotId);
            }
            
            if (filter.minPrice !== undefined) {
              query = query.gte('price', filter.minPrice);
            }
            
            if (filter.maxPrice !== undefined) {
              query = query.lte('price', filter.maxPrice);
            }
            
            // TODO: Implement search term filtering on the server side
            // For now, we'll filter client-side after fetching
          }

          const { data, error } = await query.order('created_at', { ascending: false });
          
          if (error) {
            throw error;
          }

          // Handle search term client-side filtering if needed
          let products = data as Product[];
          
          if (filter?.searchTerm) {
            const searchTerm = filter.searchTerm.toLowerCase();
            products = products.filter(product => 
              product.name_en.toLowerCase().includes(searchTerm) ||
              product.name_fr.toLowerCase().includes(searchTerm) ||
              (product.description_en && product.description_en.toLowerCase().includes(searchTerm)) ||
              (product.description_fr && product.description_fr.toLowerCase().includes(searchTerm))
            );
          }

          // Cache products for offline use
          this.cacheProducts(products);
          
          return createSuccessResponse(products);
        } catch (error) {
          return this.processError<Product[]>('getProducts', error);
        }
      },
      // Offline operation
      async () => {
        try {
          const response = await offlineStorage.getAllEntities<Product>('products');
          
          if (!response.success || !response.data) {
            return createErrorResponse(
              ServiceErrorType.NOT_FOUND,
              'No products found in offline storage'
            );
          }
          
          let products = response.data;
          
          // Apply offline filtering
          if (filter) {
            if (filter.status) {
              products = products.filter(p => p.status === filter.status);
            }
            
            if (filter.sellerId) {
              products = products.filter(p => p.seller_id === filter.sellerId);
            }
            
            if (filter.categoryId) {
              products = products.filter(p => p.category_id === filter.categoryId);
            }
            
            if (filter.slotId) {
              products = products.filter(p => p.auction_slot_id === filter.slotId);
            }
            
            if (filter.minPrice !== undefined) {
              products = products.filter(p => p.price >= filter.minPrice!);
            }
            
            if (filter.maxPrice !== undefined) {
              products = products.filter(p => p.price <= filter.maxPrice!);
            }
            
            if (filter.searchTerm) {
              const searchTerm = filter.searchTerm.toLowerCase();
              products = products.filter(p => 
                p.name_en.toLowerCase().includes(searchTerm) ||
                p.name_fr.toLowerCase().includes(searchTerm) ||
                (p.description_en && p.description_en.toLowerCase().includes(searchTerm)) ||
                (p.description_fr && p.description_fr.toLowerCase().includes(searchTerm))
              );
            }
          }
          
          return createSuccessResponse(products);
        } catch (error) {
          return this.processError<Product[]>('getProducts(offline)', error);
        }
      }
    );
  }

  /**
   * Get a product by ID
   */
  async getProduct(id: string): Promise<ServiceResponse<Product>> {
    return this.executeWithOfflineFallback(
      // Online operation
      async () => {
        try {
          const { data, error } = await supabase
            .from('products')
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
            .eq('id', id)
            .single();
          
          if (error) {
            if (error.code === 'PGRST116') {
              return createErrorResponse(
                ServiceErrorType.NOT_FOUND,
                `Product with ID ${id} not found`
              );
            }
            throw error;
          }
          
          if (!data) {
            return createErrorResponse(
              ServiceErrorType.NOT_FOUND,
              `Product with ID ${id} not found`
            );
          }
          
          const product = data as Product;
          
          // Cache for offline use
          this.cacheProduct(product);
          
          return createSuccessResponse(product);
        } catch (error) {
          return this.processError<Product>('getProduct', error);
        }
      },
      // Offline operation
      async () => {
        try {
          const response = await offlineStorage.getEntity<Product>('products', id);
          
          if (!response.success || !response.data) {
            return createErrorResponse(
              ServiceErrorType.NOT_FOUND,
              `Product with ID ${id} not found in offline storage`
            );
          }
          
          return createSuccessResponse(response.data);
        } catch (error) {
          return this.processError<Product>('getProduct(offline)', error);
        }
      },
      id
    );
  }

  /**
   * Create a new product
   */
  async createProduct(payload: ProductPayload): Promise<ServiceResponse<Product>> {
    return this.executeWithOfflineFallback(
      // Online operation
      async () => {
        try {
          // Set default status if not provided
          if (!payload.status) {
            payload.status = ProductStatus.PENDING;
          }
          
          const newProduct = {
            ...payload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data, error } = await supabase
            .from('products')
            .insert(newProduct)
            .select()
            .single();
          
          if (error) {
            throw error;
          }
          
          if (!data) {
            return createErrorResponse(
              ServiceErrorType.UNKNOWN_ERROR,
              'Failed to create product - no data returned'
            );
          }
          
          const product = data as Product;
          
          // Cache for offline use
          this.cacheProduct(product);
          
          return createSuccessResponse(product);
        } catch (error) {
          return this.processError<Product>('createProduct', error);
        }
      },
      // Offline operation - Save pending operation
      async () => {
        try {
          // Generate temporary ID
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          
          // Create offline product entity
          const offlineProduct: Product = {
            id: tempId,
            ...payload,
            status: payload.status || ProductStatus.PENDING,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            images: payload.images || []
          };
          
          // Cache locally
          await offlineStorage.storeEntity('products', offlineProduct);
          
          // Save as pending operation
          return this.savePendingOperation(
            PendingOperationType.CREATE,
            payload,
            tempId
          );
        } catch (error) {
          return this.processError<Product>('createProduct(offline)', error);
        }
      }
    );
  }

  /**
   * Update an existing product
   */
  async updateProduct(id: string, payload: Partial<ProductPayload>): Promise<ServiceResponse<Product>> {
    return this.executeWithOfflineFallback(
      // Online operation
      async () => {
        try {
          // First, check if product exists
          const { data: existingData, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
          
          if (fetchError) {
            if (fetchError.code === 'PGRST116') {
              return createErrorResponse(
                ServiceErrorType.NOT_FOUND,
                `Product with ID ${id} not found`
              );
            }
            throw fetchError;
          }
          
          if (!existingData) {
            return createErrorResponse(
              ServiceErrorType.NOT_FOUND,
              `Product with ID ${id} not found`
            );
          }
          
          // Update the product
          const updatePayload = {
            ...payload,
            updated_at: new Date().toISOString()
          };
          
          const { data, error } = await supabase
            .from('products')
            .update(updatePayload)
            .eq('id', id)
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
            throw error;
          }
          
          if (!data) {
            return createErrorResponse(
              ServiceErrorType.UNKNOWN_ERROR,
              'Failed to update product - no data returned'
            );
          }
          
          const updatedProduct = data as Product;
          
          // Cache for offline use
          this.cacheProduct(updatedProduct);
          
          return createSuccessResponse(updatedProduct);
        } catch (error) {
          return this.processError<Product>('updateProduct', error);
        }
      },
      // Offline operation
      async () => {
        try {
          // Get existing product from offline storage
          const existingResponse = await offlineStorage.getEntity<Product>('products', id);
          
          if (!existingResponse.success || !existingResponse.data) {
            return createErrorResponse(
              ServiceErrorType.NOT_FOUND,
              `Product with ID ${id} not found in offline storage`
            );
          }
          
          // Update product
          const existingProduct = existingResponse.data;
          const updatedProduct: Product = {
            ...existingProduct,
            ...payload,
            updated_at: new Date().toISOString()
          };
          
          // Store locally
          await offlineStorage.storeEntity('products', updatedProduct);
          
          // Save as pending operation
          return this.savePendingOperation(
            PendingOperationType.UPDATE,
            { id, ...payload },
            id
          );
        } catch (error) {
          return this.processError<Product>('updateProduct(offline)', error);
        }
      },
      id
    );
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<ServiceResponse> {
    return this.executeWithOfflineFallback(
      // Online operation
      async () => {
        try {
          // First check if product exists
          const { data: existingData, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
          
          if (fetchError) {
            if (fetchError.code === 'PGRST116') {
              return createErrorResponse(
                ServiceErrorType.NOT_FOUND,
                `Product with ID ${id} not found`
              );
            }
            throw fetchError;
          }
          
          if (!existingData) {
            return createErrorResponse(
              ServiceErrorType.NOT_FOUND,
              `Product with ID ${id} not found`
            );
          }
          
          // Delete the product
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
          
          if (error) {
            throw error;
          }
          
          return createSuccessResponse();
        } catch (error) {
          return this.processError('deleteProduct', error);
        }
      },
      // Offline operation
      async () => {
        try {
          // Check if product exists in offline storage
          const existingResponse = await offlineStorage.getEntity<Product>('products', id);
          
          if (!existingResponse.success || !existingResponse.data) {
            return createErrorResponse(
              ServiceErrorType.NOT_FOUND,
              `Product with ID ${id} not found in offline storage`
            );
          }
          
          // Save pending operation
          const pendingResult = await this.savePendingOperation(
            PendingOperationType.DELETE,
            { id },
            id
          );
          
          if (!pendingResult.success) {
            return pendingResult;
          }
          
          return createSuccessResponse(undefined, true);
        } catch (error) {
          return this.processError('deleteProduct(offline)', error);
        }
      },
      id
    );
  }

  /**
   * Cache products for offline use
   */
  private async cacheProducts(products: Product[]): Promise<void> {
    for (const product of products) {
      await this.cacheProduct(product);
    }
  }

  /**
   * Cache a single product for offline use
   */
  private async cacheProduct(product: Product): Promise<void> {
    try {
      await offlineStorage.storeEntity('products', product);
    } catch (error) {
      console.warn('Failed to cache product:', error);
    }
  }

  /**
   * Clear the product cache
   */
  async clearCache(): Promise<ServiceResponse> {
    try {
      await offlineStorage.clearEntityStore('products');
      return createSuccessResponse();
    } catch (error) {
      return this.processError('clearCache', error);
    }
  }
}

// Create and export singleton instance
export const productService = new ProductService(); 