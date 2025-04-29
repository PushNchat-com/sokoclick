import { supabase } from "../supabase";
import { BaseServiceImpl } from "../core/BaseService";
import {
  ServiceResponse,
  createSuccessResponse,
  createErrorResponse,
  ServiceErrorType,
} from "../core/ServiceResponse";
import { offlineStorage, PendingOperationType } from "../core/OfflineStorage";
import { PostgrestError } from "@supabase/postgrest-js";
import { Database } from "../../types/supabase-types";
import { SlotStatus, DraftStatus } from "../../types/supabase-types";

/**
 * Product entity interface - now based on auction_slots structure
 */
export interface Product {
  id: number; // This is now the slot_id
  name_en: string;
  name_fr: string;
  description_en?: string;
  description_fr?: string;
  price: number;
  currency: string;
  images: string[];
  seller_id: string;
  categories: string[];
  delivery_options?: any;
  tags?: string[];
  slot_status: SlotStatus;
  start_time?: string;
  end_time?: string;
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
  categories?: string[];
  delivery_options?: any;
  tags?: string[];
  slot_status?: SlotStatus;
  start_time?: string;
  end_time?: string;
}

/**
 * Product status enum - now using SlotStatus
 */
export type ProductStatus = SlotStatus;

/**
 * Product filter options
 */
export interface ProductFilter {
  status?: SlotStatus;
  sellerId?: string;
  category?: string;
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Check if error is a Postgrest error
 */
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
 * Product service for managing product operations - now using auction_slots
 */
class ProductService extends BaseServiceImpl {
  constructor() {
    super("ProductService", "auction_slots");
  }

  /**
   * Get all products with optional filtering
   */
  async getProducts(
    filter?: ProductFilter,
  ): Promise<ServiceResponse<Product[]>> {
    return this.executeWithOfflineFallback(
      // Online operation
      async () => {
        try {
          let query = supabase.from("auction_slots").select(`
              *,
              seller:users (
                id,
                name,
                whatsapp_number,
                location,
                is_verified
              )
            `);

          // Only get slots with live products
          query = query.eq("slot_status", "live");

          // Apply filters
          if (filter) {
            if (filter.status) {
              query = query.eq("slot_status", filter.status);
            }

            if (filter.sellerId) {
              query = query.eq("live_product_seller_id", filter.sellerId);
            }

            if (filter.category) {
              // Filter for slots where the category array contains the specified category
              query = query.contains("live_product_categories", [filter.category]);
            }

            if (filter.minPrice !== undefined) {
              query = query.gte("live_product_price", filter.minPrice);
            }

            if (filter.maxPrice !== undefined) {
              query = query.lte("live_product_price", filter.maxPrice);
            }

            if (filter.startDate) {
              query = query.gte("start_time", filter.startDate);
            }

            if (filter.endDate) {
              query = query.lte("end_time", filter.endDate);
            }
          }

          const { data, error } = await query.order("updated_at", {
            ascending: false,
          });

          if (error) {
            throw error;
          }

          // Transform auction_slots to Product interface
          let products: Product[] = [];
          
          if (data) {
            products = data.map(slot => this.slotToProduct(slot));
            
            // Handle search term client-side filtering if needed
            if (filter?.searchTerm) {
              const searchTerm = filter.searchTerm.toLowerCase();
              products = products.filter(
                (product) =>
                  product.name_en.toLowerCase().includes(searchTerm) ||
                  product.name_fr.toLowerCase().includes(searchTerm) ||
                  (product.description_en &&
                    product.description_en.toLowerCase().includes(searchTerm)) ||
                  (product.description_fr &&
                    product.description_fr.toLowerCase().includes(searchTerm)),
              );
            }
          }

          // Cache products for offline use
          this.cacheProducts(products);

          return createSuccessResponse(products);
        } catch (error) {
          return this.processError<Product[]>("getProducts", error);
        }
      },
      // Offline operation
      async () => {
        try {
          const response =
            await offlineStorage.getAllEntities<Product>("products");
          return createSuccessResponse(response);
        } catch (err) {
          return createErrorResponse<Product[]>("Offline storage error", {
            type: ServiceErrorType.OFFLINE_STORAGE_ERROR,
            originalError: err,
          });
        }
      },
    );
  }

  /**
   * Get a single product by ID (slot ID)
   */
  async getProduct(id: number): Promise<ServiceResponse<Product>> {
    return this.executeWithOfflineFallback(
      // Online operation
      async () => {
        try {
          const { data, error } = await supabase
            .from("auction_slots")
            .select(`
              *,
              seller:users (
                id,
                name,
                whatsapp_number,
                location,
                is_verified
              )
            `)
            .eq("id", id)
            .eq("slot_status", "live")
            .single();

          if (error) {
            throw error;
          }

          if (!data) {
            return createErrorResponse<Product>("Product not found", {
              type: ServiceErrorType.NOT_FOUND,
            });
          }

          const product = this.slotToProduct(data);

          // Cache product for offline use
          this.cacheProduct(product);

          return createSuccessResponse(product);
        } catch (error) {
          return this.processError<Product>("getProduct", error);
        }
      },
      // Offline operation
      async () => {
        try {
          const product = await offlineStorage.getEntity<Product>(
            "products",
            id.toString(),
          );
          if (!product) {
            return createErrorResponse<Product>("Product not found offline", {
              type: ServiceErrorType.NOT_FOUND,
            });
          }
          return createSuccessResponse(product);
        } catch (err) {
          return createErrorResponse<Product>("Offline storage error", {
            type: ServiceErrorType.OFFLINE_STORAGE_ERROR,
            originalError: err,
          });
        }
      },
    );
  }

  /**
   * Create a product (assigns it to an available slot)
   */
  async createProduct(
    payload: ProductPayload,
  ): Promise<ServiceResponse<Product>> {
    return this.executeWithOfflineFallback(
      // Online operation
      async () => {
        try {
          // Find an empty slot
          const { data: emptySlots, error: findError } = await supabase
            .from("auction_slots")
            .select("id")
            .eq("slot_status", "empty")
            .limit(1);

          if (findError) {
            throw findError;
          }

          if (!emptySlots || emptySlots.length === 0) {
            return createErrorResponse<Product>("No empty slots available", {
              type: ServiceErrorType.BUSINESS_RULE_VIOLATION,
            });
          }

          const slotId = emptySlots[0].id;

          // Prepare slot data with live product information
          const slotData = {
            live_product_seller_id: payload.seller_id,
            live_product_name_en: payload.name_en,
            live_product_name_fr: payload.name_fr,
            live_product_description_en: payload.description_en,
            live_product_description_fr: payload.description_fr,
            live_product_price: payload.price,
            live_product_currency: payload.currency,
            live_product_image_urls: payload.images,
            live_product_categories: payload.categories || [],
            live_product_delivery_options: payload.delivery_options,
            live_product_tags: payload.tags || [],
            slot_status: "live",
            start_time: payload.start_time || new Date().toISOString(),
            end_time: payload.end_time,
          };

          // Update the slot with product data
          const { data, error } = await supabase
            .from("auction_slots")
            .update(slotData)
            .eq("id", slotId)
            .select(`
              *,
              seller:users (
                id,
                name,
                whatsapp_number,
                location,
                is_verified
              )
            `)
            .single();

          if (error) {
            throw error;
          }

          const product = this.slotToProduct(data);

          // Cache product for offline use
          this.cacheProduct(product);

          return createSuccessResponse(product);
        } catch (error) {
          return this.processError<Product>("createProduct", error);
        }
      },
      // Offline operation
      async () => {
        try {
          const newProduct: Product = {
            id: Date.now(), // Temporary ID until synced
            name_en: payload.name_en,
            name_fr: payload.name_fr,
            description_en: payload.description_en,
            description_fr: payload.description_fr,
            price: payload.price,
            currency: payload.currency,
            images: payload.images,
            seller_id: payload.seller_id,
            categories: payload.categories || [],
            slot_status: "live",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          await offlineStorage.addPendingOperation({
            type: PendingOperationType.CREATE,
            entityType: "products",
            payload,
          });

          await offlineStorage.saveEntity("products", newProduct);

          return createSuccessResponse(newProduct);
        } catch (err) {
          return createErrorResponse<Product>("Offline storage error", {
            type: ServiceErrorType.OFFLINE_STORAGE_ERROR,
            originalError: err,
          });
        }
      },
    );
  }

  /**
   * Update a product (updates fields in an existing slot)
   */
  async updateProduct(
    id: number,
    payload: Partial<ProductPayload>,
  ): Promise<ServiceResponse<Product>> {
    return this.executeWithOfflineFallback(
      // Online operation
      async () => {
        try {
          // First check if the slot exists and is in 'live' status
          const { data: existingSlot, error: checkError } = await supabase
            .from("auction_slots")
            .select("*")
            .eq("id", id)
            .single();

          if (checkError) {
            throw checkError;
          }

          if (!existingSlot) {
            return createErrorResponse<Product>("Product not found", {
              type: ServiceErrorType.NOT_FOUND,
            });
          }

          if (existingSlot.slot_status !== "live") {
            return createErrorResponse<Product>(
              "Cannot update product: slot is not in live status",
              {
                type: ServiceErrorType.BUSINESS_RULE_VIOLATION,
              },
            );
          }

          // Prepare update data
          const updateData: any = {};

          if (payload.name_en !== undefined)
            updateData.live_product_name_en = payload.name_en;
          if (payload.name_fr !== undefined)
            updateData.live_product_name_fr = payload.name_fr;
          if (payload.description_en !== undefined)
            updateData.live_product_description_en = payload.description_en;
          if (payload.description_fr !== undefined)
            updateData.live_product_description_fr = payload.description_fr;
          if (payload.price !== undefined)
            updateData.live_product_price = payload.price;
          if (payload.currency !== undefined)
            updateData.live_product_currency = payload.currency;
          if (payload.images !== undefined)
            updateData.live_product_image_urls = payload.images;
          if (payload.categories !== undefined)
            updateData.live_product_categories = payload.categories;
          if (payload.delivery_options !== undefined)
            updateData.live_product_delivery_options = payload.delivery_options;
          if (payload.tags !== undefined)
            updateData.live_product_tags = payload.tags;
          if (payload.start_time !== undefined)
            updateData.start_time = payload.start_time;
          if (payload.end_time !== undefined)
            updateData.end_time = payload.end_time;
          if (payload.slot_status !== undefined)
            updateData.slot_status = payload.slot_status;

          // Update the slot
          const { data, error } = await supabase
            .from("auction_slots")
            .update(updateData)
            .eq("id", id)
            .select(`
              *,
              seller:users (
                id,
                name,
                whatsapp_number,
                location,
                is_verified
              )
            `)
            .single();

          if (error) {
            throw error;
          }

          const product = this.slotToProduct(data);

          // Cache updated product for offline use
          this.cacheProduct(product);

          return createSuccessResponse(product);
        } catch (error) {
          return this.processError<Product>("updateProduct", error);
        }
      },
      // Offline operation
      async () => {
        try {
          const existingProduct = await offlineStorage.getEntity<Product>(
            "products",
            id.toString(),
          );

          if (!existingProduct) {
            return createErrorResponse<Product>("Product not found offline", {
              type: ServiceErrorType.NOT_FOUND,
            });
          }

          // Update product with new values
          const updatedProduct = {
            ...existingProduct,
            ...payload,
            updated_at: new Date().toISOString(),
          };

          await offlineStorage.addPendingOperation({
            type: PendingOperationType.UPDATE,
            entityType: "products",
            entityId: id.toString(),
            payload,
          });

          await offlineStorage.saveEntity("products", updatedProduct);

          return createSuccessResponse(updatedProduct as Product);
        } catch (err) {
          return createErrorResponse<Product>("Offline storage error", {
            type: ServiceErrorType.OFFLINE_STORAGE_ERROR,
            originalError: err,
          });
        }
      },
    );
  }

  /**
   * Delete a product (set slot status to empty and clear product data)
   */
  async deleteProduct(id: number): Promise<ServiceResponse> {
    return this.executeWithOfflineFallback(
      // Online operation
      async () => {
        try {
          // We don't actually delete - we set the slot to empty and clear data
          const { error } = await supabase
            .from("auction_slots")
            .update({
              slot_status: "empty",
              live_product_seller_id: null,
              live_product_name_en: null,
              live_product_name_fr: null,
              live_product_description_en: null,
              live_product_description_fr: null,
              live_product_price: null,
              live_product_currency: null,
              live_product_image_urls: null,
              live_product_categories: null,
              live_product_delivery_options: null,
              live_product_tags: null,
              start_time: null,
              end_time: null,
            })
            .eq("id", id);

          if (error) {
            throw error;
          }

          // Remove from offline cache
          await offlineStorage.removeEntity("products", id.toString());

          return createSuccessResponse(true);
        } catch (error) {
          return this.processError("deleteProduct", error);
        }
      },
      // Offline operation
      async () => {
        try {
          await offlineStorage.addPendingOperation({
            type: PendingOperationType.DELETE,
            entityType: "products",
            entityId: id.toString(),
          });

          await offlineStorage.removeEntity("products", id.toString());

          return createSuccessResponse(true);
        } catch (err) {
          return createErrorResponse("Offline storage error", {
            type: ServiceErrorType.OFFLINE_STORAGE_ERROR,
            originalError: err,
          });
        }
      },
    );
  }

  /**
   * Convert an auction_slot to a Product interface
   */
  private slotToProduct(slot: any): Product {
    return {
      id: slot.id,
      name_en: slot.live_product_name_en || "",
      name_fr: slot.live_product_name_fr || "",
      description_en: slot.live_product_description_en,
      description_fr: slot.live_product_description_fr,
      price: slot.live_product_price || 0,
      currency: slot.live_product_currency || "XAF",
      images: slot.live_product_image_urls || [],
      seller_id: slot.live_product_seller_id || "",
      categories: slot.live_product_categories || [],
      delivery_options: slot.live_product_delivery_options,
      tags: slot.live_product_tags || [],
      slot_status: slot.slot_status,
      start_time: slot.start_time,
      end_time: slot.end_time,
      created_at: slot.created_at,
      updated_at: slot.updated_at,
      seller: slot.seller,
    };
  }

  /**
   * Cache multiple products for offline use
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
    await offlineStorage.saveEntity("products", product);
  }

  /**
   * Clear the product cache
   */
  async clearCache(): Promise<ServiceResponse> {
    try {
      await offlineStorage.clearEntities("products");
      return createSuccessResponse(true);
    } catch (err) {
      return createErrorResponse("Failed to clear cache", {
        type: ServiceErrorType.OFFLINE_STORAGE_ERROR,
        originalError: err,
      });
    }
  }
}

// Export singleton instance
export const productService = new ProductService();
export default productService;
