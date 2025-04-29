import { supabase } from "@/services/supabase";
import { SlotStatus, Slot } from "./slots";
import { clearSlotImages } from "../utils/slotStorage";
import { PostgrestError } from "@supabase/postgrest-js";

/**
 * Error types for slot operations
 */
export enum SlotErrorType {
  NOT_FOUND = "NOT_FOUND",
  ALREADY_OCCUPIED = "ALREADY_OCCUPIED",
  UNDER_MAINTENANCE = "UNDER_MAINTENANCE",
  ALREADY_RESERVED = "ALREADY_RESERVED",
  INVALID_SLOT_NUMBER = "INVALID_SLOT_NUMBER",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Strongly typed response format for all slot operations
 */
export interface SlotOperationResponse<T = void> {
  success: boolean;
  data?: T;
  error?: {
    type: SlotErrorType;
    message: string;
    details?: unknown;
  };
}

/**
 * Batch operation result interface
 */
export interface BatchOperationResult<T = void> {
  overallSuccess: boolean;
  results: SlotOperationResponse<T>[];
  successCount: number;
  failureCount: number;
  errors: {
    slotId: number;
    error: {
      type: SlotErrorType;
      message: string;
    };
  }[];
}

/**
 * Valid maintenance status operations
 */
export type MaintenanceOperation = "enable" | "disable";

/**
 * Batch operation type for slots
 */
export interface SlotBatchOperation {
  /**
   * Batch update maintenance status for multiple slots
   */
  setMaintenanceStatus(
    slotIds: number[],
    operation: MaintenanceOperation,
  ): Promise<BatchOperationResult>;

  /**
   * Clear products from multiple slots at once
   */
  clearMultipleSlots(slotIds: number[]): Promise<BatchOperationResult>;

  /**
   * Reserve multiple slots for a specified duration
   */
  reserveMultipleSlots(
    slotIds: number[],
    endTime: Date,
    reservedBy: string,
  ): Promise<BatchOperationResult>;

  /**
   * Cancel reservations for multiple slots
   */
  cancelMultipleReservations(slotIds: number[]): Promise<BatchOperationResult>;

  /**
   * Get detailed status of multiple slots
   */
  getMultipleSlotsStatus(
    slotIds: number[],
  ): Promise<SlotOperationResponse<Slot[]>>;

  /**
   * Verify slot availability (for multiple slots)
   */
  verifyAvailability(slotIds: number[]): Promise<
    BatchOperationResult<
      {
        slotId: number;
        available: boolean;
        status: SlotStatus;
      }[]
    >
  >;
}

/**
 * Function to check if an error is a PostgrestError
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
 * Create a standardized error response
 */
function createErrorResponse<T = void>(
  type: SlotErrorType,
  message: string,
  details?: unknown,
): SlotOperationResponse<T> {
  return {
    success: false,
    error: {
      type,
      message,
      details,
    },
  };
}

/**
 * Process errors consistently
 */
function handleError<T = void>(error: unknown): SlotOperationResponse<T> {
  if (isPostgrestError(error)) {
    return createErrorResponse(SlotErrorType.DATABASE_ERROR, error.message, {
      code: error.code,
      details: error.details,
    });
  }

  if (error instanceof Error) {
    return createErrorResponse(
      SlotErrorType.UNKNOWN_ERROR,
      error.message,
      error,
    );
  }

  return createErrorResponse(
    SlotErrorType.UNKNOWN_ERROR,
    "An unknown error occurred",
    error,
  );
}

/**
 * Implementation of batch operations for slot management
 */
export const slotBatchOperations: SlotBatchOperation = {
  /**
   * Set maintenance status for multiple slots at once
   */
  async setMaintenanceStatus(
    slotIds: number[],
    operation: MaintenanceOperation,
  ): Promise<BatchOperationResult> {
    // Validate input
    if (!slotIds.length) {
      return {
        overallSuccess: false,
        results: [
          createErrorResponse(
            SlotErrorType.VALIDATION_ERROR,
            "No slot IDs provided",
          ),
        ],
        successCount: 0,
        failureCount: 1,
        errors: [
          {
            slotId: -1,
            error: {
              type: SlotErrorType.VALIDATION_ERROR,
              message: "No slot IDs provided",
            },
          },
        ],
      };
    }

    const results: SlotOperationResponse[] = [];
    const errors: {
      slotId: number;
      error: { type: SlotErrorType; message: string };
    }[] = [];

    // Maintenance value based on operation
    const maintenance = operation === "enable";

    try {
      // Process each slot individually to track success/failure
      for (const slotId of slotIds) {
        try {
          // Update the slot's maintenance status
          const { error } = await supabase
            .from("auction_slots")
            .update({
              is_maintenance: maintenance,
              updated_at: new Date().toISOString(),
            })
            .eq("id", slotId);

          if (error) {
            // Handle the error for this specific slot
            const errorResponse = createErrorResponse(
              SlotErrorType.DATABASE_ERROR,
              `Failed to update maintenance status for slot ${slotId}`,
              error,
            );

            results.push(errorResponse);
            errors.push({
              slotId,
              error: {
                type: SlotErrorType.DATABASE_ERROR,
                message: `Failed to update maintenance status for slot ${slotId}: ${error.message}`,
              },
            });
          } else {
            // Success for this slot
            results.push({ success: true });
          }
        } catch (err) {
          // Handle unexpected errors for this slot
          const errorResponse = handleError(err);
          results.push(errorResponse);
          errors.push({
            slotId,
            error: {
              type: errorResponse.error?.type || SlotErrorType.UNKNOWN_ERROR,
              message: errorResponse.error?.message || "Unknown error",
            },
          });
        }
      }

      // Calculate success/failure counts
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      return {
        overallSuccess: failureCount === 0,
        results,
        successCount,
        failureCount,
        errors,
      };
    } catch (err) {
      // Handle unexpected errors for the entire operation
      const errorResponse = handleError(err);
      return {
        overallSuccess: false,
        results: [errorResponse],
        successCount: 0,
        failureCount: 1,
        errors: [
          {
            slotId: -1,
            error: {
              type: errorResponse.error?.type || SlotErrorType.UNKNOWN_ERROR,
              message: errorResponse.error?.message || "Unknown error",
            },
          },
        ],
      };
    }
  },

  /**
   * Clear products from multiple slots at once
   */
  async clearMultipleSlots(slotIds: number[]): Promise<BatchOperationResult> {
    // Validate input
    if (!slotIds.length) {
      return {
        overallSuccess: false,
        results: [
          createErrorResponse(
            SlotErrorType.VALIDATION_ERROR,
            "No slot IDs provided",
          ),
        ],
        successCount: 0,
        failureCount: 1,
        errors: [
          {
            slotId: -1,
            error: {
              type: SlotErrorType.VALIDATION_ERROR,
              message: "No slot IDs provided",
            },
          },
        ],
      };
    }

    const results: SlotOperationResponse[] = [];
    const errors: {
      slotId: number;
      error: { type: SlotErrorType; message: string };
    }[] = [];

    try {
      // Process each slot individually to track success/failure
      for (const slotId of slotIds) {
        try {
          // Check if slot exists and has a product
          const { data: slotData, error: slotError } = await supabase
            .from("auction_slots")
            .select("product_id")
            .eq("id", slotId)
            .single();

          if (slotError) {
            // Handle error for this specific slot
            const errorResponse = createErrorResponse(
              SlotErrorType.DATABASE_ERROR,
              `Failed to fetch slot ${slotId}`,
              slotError,
            );

            results.push(errorResponse);
            errors.push({
              slotId,
              error: {
                type: SlotErrorType.DATABASE_ERROR,
                message: `Failed to fetch slot ${slotId}: ${slotError.message}`,
              },
            });
            continue;
          }

          if (!slotData) {
            // Slot not found
            const errorResponse = createErrorResponse(
              SlotErrorType.NOT_FOUND,
              `Slot ${slotId} not found`,
            );

            results.push(errorResponse);
            errors.push({
              slotId,
              error: {
                type: SlotErrorType.NOT_FOUND,
                message: `Slot ${slotId} not found`,
              },
            });
            continue;
          }

          // If the slot has a product, update product's auction_slot_id
          if (slotData.product_id) {
            const { error: productError } = await supabase
              .from("products")
              .update({ auction_slot_id: null })
              .eq("id", slotData.product_id);

            if (productError) {
              // Handle error updating product
              const errorResponse = createErrorResponse(
                SlotErrorType.DATABASE_ERROR,
                `Failed to update product ${slotData.product_id}`,
                productError,
              );

              results.push(errorResponse);
              errors.push({
                slotId,
                error: {
                  type: SlotErrorType.DATABASE_ERROR,
                  message: `Failed to update product ${slotData.product_id}: ${productError.message}`,
                },
              });
              continue;
            }
          }

          // Update the slot
          const { error: updateError } = await supabase
            .from("auction_slots")
            .update({
              product_id: null,
              start_time: null,
              end_time: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", slotId);

          if (updateError) {
            // Handle error updating slot
            const errorResponse = createErrorResponse(
              SlotErrorType.DATABASE_ERROR,
              `Failed to update slot ${slotId}`,
              updateError,
            );

            results.push(errorResponse);
            errors.push({
              slotId,
              error: {
                type: SlotErrorType.DATABASE_ERROR,
                message: `Failed to update slot ${slotId}: ${updateError.message}`,
              },
            });
            continue;
          }

          // Clear slot images
          const clearResult = await clearSlotImages(slotId);
          if (!clearResult.success) {
            console.warn(
              `Failed to clear images for slot ${slotId}: ${clearResult.message}`,
            );
            // Continue execution - this is not a critical failure
          }

          // Success for this slot
          results.push({ success: true });
        } catch (err) {
          // Handle unexpected errors for this slot
          const errorResponse = handleError(err);
          results.push(errorResponse);
          errors.push({
            slotId,
            error: {
              type: errorResponse.error?.type || SlotErrorType.UNKNOWN_ERROR,
              message: errorResponse.error?.message || "Unknown error",
            },
          });
        }
      }

      // Calculate success/failure counts
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      return {
        overallSuccess: failureCount === 0,
        results,
        successCount,
        failureCount,
        errors,
      };
    } catch (err) {
      // Handle unexpected errors for the entire operation
      const errorResponse = handleError(err);
      return {
        overallSuccess: false,
        results: [errorResponse],
        successCount: 0,
        failureCount: 1,
        errors: [
          {
            slotId: -1,
            error: {
              type: errorResponse.error?.type || SlotErrorType.UNKNOWN_ERROR,
              message: errorResponse.error?.message || "Unknown error",
            },
          },
        ],
      };
    }
  },

  /**
   * Reserve multiple slots for a specified duration
   */
  async reserveMultipleSlots(
    slotIds: number[],
    endTime: Date,
    reservedBy: string,
  ): Promise<BatchOperationResult> {
    // Validate input
    if (!slotIds.length) {
      return {
        overallSuccess: false,
        results: [
          createErrorResponse(
            SlotErrorType.VALIDATION_ERROR,
            "No slot IDs provided",
          ),
        ],
        successCount: 0,
        failureCount: 1,
        errors: [
          {
            slotId: -1,
            error: {
              type: SlotErrorType.VALIDATION_ERROR,
              message: "No slot IDs provided",
            },
          },
        ],
      };
    }

    if (!reservedBy.trim()) {
      return {
        overallSuccess: false,
        results: [
          createErrorResponse(
            SlotErrorType.VALIDATION_ERROR,
            "Reserved by identifier is required",
          ),
        ],
        successCount: 0,
        failureCount: 1,
        errors: [
          {
            slotId: -1,
            error: {
              type: SlotErrorType.VALIDATION_ERROR,
              message: "Reserved by identifier is required",
            },
          },
        ],
      };
    }

    const results: SlotOperationResponse[] = [];
    const errors: {
      slotId: number;
      error: { type: SlotErrorType; message: string };
    }[] = [];

    try {
      // Process each slot individually to track success/failure
      for (const slotId of slotIds) {
        try {
          // Check if slot is available
          const { data: slotData, error: slotError } = await supabase
            .from("auction_slots")
            .select("*")
            .eq("id", slotId)
            .single();

          if (slotError) {
            // Handle error for this specific slot
            const errorResponse = createErrorResponse(
              SlotErrorType.DATABASE_ERROR,
              `Failed to fetch slot ${slotId}`,
              slotError,
            );

            results.push(errorResponse);
            errors.push({
              slotId,
              error: {
                type: SlotErrorType.DATABASE_ERROR,
                message: `Failed to fetch slot ${slotId}: ${slotError.message}`,
              },
            });
            continue;
          }

          if (!slotData) {
            // Slot not found
            const errorResponse = createErrorResponse(
              SlotErrorType.NOT_FOUND,
              `Slot ${slotId} not found`,
            );

            results.push(errorResponse);
            errors.push({
              slotId,
              error: {
                type: SlotErrorType.NOT_FOUND,
                message: `Slot ${slotId} not found`,
              },
            });
            continue;
          }

          if (slotData.product_id) {
            // Slot is already occupied
            const errorResponse = createErrorResponse(
              SlotErrorType.ALREADY_OCCUPIED,
              `Slot ${slotId} is already occupied`,
            );

            results.push(errorResponse);
            errors.push({
              slotId,
              error: {
                type: SlotErrorType.ALREADY_OCCUPIED,
                message: `Slot ${slotId} is already occupied`,
              },
            });
            continue;
          }

          if (slotData.is_maintenance) {
            // Slot is under maintenance
            const errorResponse = createErrorResponse(
              SlotErrorType.UNDER_MAINTENANCE,
              `Slot ${slotId} is under maintenance`,
            );

            results.push(errorResponse);
            errors.push({
              slotId,
              error: {
                type: SlotErrorType.UNDER_MAINTENANCE,
                message: `Slot ${slotId} is under maintenance`,
              },
            });
            continue;
          }

          if (
            slotData.reserved_until &&
            new Date(slotData.reserved_until) > new Date()
          ) {
            // Slot is already reserved
            const errorResponse = createErrorResponse(
              SlotErrorType.ALREADY_RESERVED,
              `Slot ${slotId} is already reserved until ${slotData.reserved_until}`,
            );

            results.push(errorResponse);
            errors.push({
              slotId,
              error: {
                type: SlotErrorType.ALREADY_RESERVED,
                message: `Slot ${slotId} is already reserved until ${slotData.reserved_until}`,
              },
            });
            continue;
          }

          // Reserve the slot
          const { error: updateError } = await supabase
            .from("auction_slots")
            .update({
              reserved_until: endTime.toISOString(),
              reserved_by: reservedBy,
              updated_at: new Date().toISOString(),
            })
            .eq("id", slotId);

          if (updateError) {
            // Handle error updating slot
            const errorResponse = createErrorResponse(
              SlotErrorType.DATABASE_ERROR,
              `Failed to reserve slot ${slotId}`,
              updateError,
            );

            results.push(errorResponse);
            errors.push({
              slotId,
              error: {
                type: SlotErrorType.DATABASE_ERROR,
                message: `Failed to reserve slot ${slotId}: ${updateError.message}`,
              },
            });
            continue;
          }

          // Success for this slot
          results.push({ success: true });
        } catch (err) {
          // Handle unexpected errors for this slot
          const errorResponse = handleError(err);
          results.push(errorResponse);
          errors.push({
            slotId,
            error: {
              type: errorResponse.error?.type || SlotErrorType.UNKNOWN_ERROR,
              message: errorResponse.error?.message || "Unknown error",
            },
          });
        }
      }

      // Calculate success/failure counts
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      return {
        overallSuccess: failureCount === 0,
        results,
        successCount,
        failureCount,
        errors,
      };
    } catch (err) {
      // Handle unexpected errors for the entire operation
      const errorResponse = handleError(err);
      return {
        overallSuccess: false,
        results: [errorResponse],
        successCount: 0,
        failureCount: 1,
        errors: [
          {
            slotId: -1,
            error: {
              type: errorResponse.error?.type || SlotErrorType.UNKNOWN_ERROR,
              message: errorResponse.error?.message || "Unknown error",
            },
          },
        ],
      };
    }
  },

  /**
   * Cancel reservations for multiple slots
   */
  async cancelMultipleReservations(
    slotIds: number[],
  ): Promise<BatchOperationResult> {
    // Validate input
    if (!slotIds.length) {
      return {
        overallSuccess: false,
        results: [
          createErrorResponse(
            SlotErrorType.VALIDATION_ERROR,
            "No slot IDs provided",
          ),
        ],
        successCount: 0,
        failureCount: 1,
        errors: [
          {
            slotId: -1,
            error: {
              type: SlotErrorType.VALIDATION_ERROR,
              message: "No slot IDs provided",
            },
          },
        ],
      };
    }

    const results: SlotOperationResponse[] = [];
    const errors: {
      slotId: number;
      error: { type: SlotErrorType; message: string };
    }[] = [];

    try {
      // Process each slot individually to track success/failure
      for (const slotId of slotIds) {
        try {
          // Update the slot to clear reservation
          const { error: updateError } = await supabase
            .from("auction_slots")
            .update({
              reserved_until: null,
              reserved_by: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", slotId);

          if (updateError) {
            // Handle error for this specific slot
            const errorResponse = createErrorResponse(
              SlotErrorType.DATABASE_ERROR,
              `Failed to cancel reservation for slot ${slotId}`,
              updateError,
            );

            results.push(errorResponse);
            errors.push({
              slotId,
              error: {
                type: SlotErrorType.DATABASE_ERROR,
                message: `Failed to cancel reservation for slot ${slotId}: ${updateError.message}`,
              },
            });
          } else {
            // Success for this slot
            results.push({ success: true });
          }
        } catch (err) {
          // Handle unexpected errors for this slot
          const errorResponse = handleError(err);
          results.push(errorResponse);
          errors.push({
            slotId,
            error: {
              type: errorResponse.error?.type || SlotErrorType.UNKNOWN_ERROR,
              message: errorResponse.error?.message || "Unknown error",
            },
          });
        }
      }

      // Calculate success/failure counts
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      return {
        overallSuccess: failureCount === 0,
        results,
        successCount,
        failureCount,
        errors,
      };
    } catch (err) {
      // Handle unexpected errors for the entire operation
      const errorResponse = handleError(err);
      return {
        overallSuccess: false,
        results: [errorResponse],
        successCount: 0,
        failureCount: 1,
        errors: [
          {
            slotId: -1,
            error: {
              type: errorResponse.error?.type || SlotErrorType.UNKNOWN_ERROR,
              message: errorResponse.error?.message || "Unknown error",
            },
          },
        ],
      };
    }
  },

  /**
   * Get detailed status of multiple slots
   */
  async getMultipleSlotsStatus(
    slotIds: number[],
  ): Promise<SlotOperationResponse<Slot[]>> {
    try {
      // Validate input
      if (!slotIds.length) {
        return createErrorResponse(
          SlotErrorType.VALIDATION_ERROR,
          "No slot IDs provided",
        );
      }

      // Fetch slots
      const { data, error } = await supabase
        .from("auction_slots")
        .select(
          `
          *,
          product:products (
            id,
            name_en,
            name_fr,
            description_en,
            description_fr,
            price,
            currency,
            seller_id
          )
        `,
        )
        .in("id", slotIds);

      if (error) {
        return createErrorResponse(
          SlotErrorType.DATABASE_ERROR,
          "Failed to fetch slots",
          error,
        );
      }

      // Transform to Slot type with calculated status
      const now = new Date();
      const slots: Slot[] = (data || []).map((slot) => {
        let status: SlotStatus;

        if (slot.is_maintenance) {
          status = SlotStatus.MAINTENANCE;
        } else if (slot.product_id && slot.is_active) {
          status = SlotStatus.OCCUPIED;
        } else if (slot.reserved_until && new Date(slot.reserved_until) > now) {
          status = SlotStatus.RESERVED;
        } else {
          status = SlotStatus.AVAILABLE;
        }

        // Transform to match Slot interface
        return {
          id: slot.id,
          product_id: slot.product_id,
          product: slot.product,
          is_active: slot.is_active,
          start_time: slot.start_time,
          end_time: slot.end_time,
          featured: slot.featured,
          view_count: slot.view_count,
          created_at: slot.created_at,
          updated_at: slot.updated_at,
          status,
          reservedUntil: slot.reserved_until,
          reservedBy: slot.reserved_by,
          maintenance: slot.is_maintenance || false,
          product_name: slot.product?.name_en || "",
          product_image: "", // This would need to be fetched separately
          price: slot.product?.price,
          currency: slot.product?.currency,
        };
      });

      return {
        success: true,
        data: slots,
      };
    } catch (err) {
      return handleError<Slot[]>(err);
    }
  },

  /**
   * Verify availability of multiple slots
   */
  async verifyAvailability(slotIds: number[]): Promise<
    BatchOperationResult<
      {
        slotId: number;
        available: boolean;
        status: SlotStatus;
      }[]
    >
  > {
    try {
      // Validate input
      if (!slotIds.length) {
        return {
          overallSuccess: false,
          results: [
            createErrorResponse(
              SlotErrorType.VALIDATION_ERROR,
              "No slot IDs provided",
            ),
          ],
          successCount: 0,
          failureCount: 1,
          errors: [
            {
              slotId: -1,
              error: {
                type: SlotErrorType.VALIDATION_ERROR,
                message: "No slot IDs provided",
              },
            },
          ],
        };
      }

      // Fetch all requested slots
      const { data, error } = await supabase
        .from("auction_slots")
        .select("*")
        .in("id", slotIds);

      if (error) {
        const errorResponse = createErrorResponse(
          SlotErrorType.DATABASE_ERROR,
          "Failed to verify slot availability",
          error,
        );

        return {
          overallSuccess: false,
          results: [errorResponse],
          successCount: 0,
          failureCount: 1,
          errors: [
            {
              slotId: -1,
              error: {
                type: SlotErrorType.DATABASE_ERROR,
                message: "Failed to verify slot availability: " + error.message,
              },
            },
          ],
        };
      }

      // For slots not found in the result, create not found errors
      const foundSlotIds = data?.map((slot) => slot.id) || [];
      const notFoundSlotIds = slotIds.filter(
        (id) => !foundSlotIds.includes(id),
      );

      const notFoundErrors = notFoundSlotIds.map((slotId) => ({
        slotId,
        error: {
          type: SlotErrorType.NOT_FOUND,
          message: `Slot ${slotId} not found`,
        },
      }));

      // Process each found slot
      const results: SlotOperationResponse<{
        slotId: number;
        available: boolean;
        status: SlotStatus;
      }>[] = [];

      const now = new Date();

      (data || []).forEach((slot) => {
        let status: SlotStatus;
        let available = false;

        if (slot.is_maintenance) {
          status = SlotStatus.MAINTENANCE;
        } else if (slot.product_id) {
          status = SlotStatus.OCCUPIED;
        } else if (slot.reserved_until && new Date(slot.reserved_until) > now) {
          status = SlotStatus.RESERVED;
        } else {
          status = SlotStatus.AVAILABLE;
          available = true;
        }

        results.push({
          success: true,
          data: {
            slotId: slot.id,
            available,
            status,
          },
        });
      });

      // Add not found results
      notFoundSlotIds.forEach((slotId) => {
        results.push(
          createErrorResponse(
            SlotErrorType.NOT_FOUND,
            `Slot ${slotId} not found`,
          ),
        );
      });

      // Calculate success/failure counts
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      return {
        overallSuccess: notFoundSlotIds.length === 0,
        results,
        successCount,
        failureCount,
        errors: notFoundErrors,
      };
    } catch (err) {
      const errorResponse = handleError(err);
      return {
        overallSuccess: false,
        results: [errorResponse],
        successCount: 0,
        failureCount: 1,
        errors: [
          {
            slotId: -1,
            error: {
              type: errorResponse.error?.type || SlotErrorType.UNKNOWN_ERROR,
              message: errorResponse.error?.message || "Unknown error",
            },
          },
        ],
      };
    }
  },
};

// Export the batch operations service
export default slotBatchOperations;
