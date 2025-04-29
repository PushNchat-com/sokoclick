import {
  ServiceResponse,
  createSuccessResponse,
  createErrorResponse,
  ServiceErrorType,
  BaseService,
} from "./ServiceResponse";
import { networkStatus } from "./NetworkStatus";
import { offlineStorage, PendingOperationType } from "./OfflineStorage";

/**
 * Base service implementation with common functionality
 */
export abstract class BaseServiceImpl implements BaseService {
  protected serviceName: string;
  protected initialized: boolean = false;
  protected entityType: string;

  constructor(serviceName: string, entityType: string) {
    this.serviceName = serviceName;
    this.entityType = entityType;
  }

  /**
   * Check if the service is online
   */
  isOnline(): boolean {
    return networkStatus.isOnline();
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<ServiceResponse> {
    if (this.initialized) {
      return createSuccessResponse();
    }

    try {
      // Initialize network status service
      await networkStatus.initialize();

      // Initialize offline storage
      await offlineStorage.initialize();

      this.initialized = true;
      return createSuccessResponse();
    } catch (error) {
      return createErrorResponse(
        ServiceErrorType.UNKNOWN_ERROR,
        `Failed to initialize ${this.serviceName} service`,
        error,
      );
    }
  }

  /**
   * Execute a function with offline fallback
   */
  protected async executeWithOfflineFallback<T>(
    onlineOperation: () => Promise<ServiceResponse<T>>,
    offlineOperation: () => Promise<ServiceResponse<T>>,
    entityId?: string | number,
  ): Promise<ServiceResponse<T>> {
    try {
      // Make sure we're initialized
      if (!this.initialized) {
        await this.initialize();
      }

      // If we're online, try the online operation
      if (this.isOnline()) {
        try {
          const result = await onlineOperation();
          return result;
        } catch (error) {
          // If online operation fails, try offline fallback
          console.warn(
            `Online operation failed for ${this.serviceName}, falling back to offline:`,
            error,
          );
          return offlineOperation();
        }
      }

      // We're offline, use the offline operation
      return offlineOperation();
    } catch (error) {
      return createErrorResponse(
        ServiceErrorType.UNKNOWN_ERROR,
        `Operation failed in ${this.serviceName} service`,
        error,
      );
    }
  }

  /**
   * Save a pending operation for later sync
   */
  protected async savePendingOperation<T>(
    type: PendingOperationType,
    data: T,
    entityId?: string | number,
  ): Promise<ServiceResponse<T>> {
    try {
      const result = await offlineStorage.storePendingOperation({
        type,
        entityType: this.entityType,
        data,
        entityId,
      });

      if (!result.success) {
        return createErrorResponse(
          result.error?.type || ServiceErrorType.STORAGE_ERROR,
          `Failed to save pending ${type} operation: ${result.error?.message || "Unknown error"}`,
          result.error?.details,
        );
      }

      return createSuccessResponse(data, true);
    } catch (error) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        `Failed to save pending ${type} operation`,
        error,
      );
    }
  }

  /**
   * Log a service error
   */
  protected logError(method: string, error: unknown): void {
    console.error(`${this.serviceName}.${method} error:`, error);
  }

  /**
   * Process an error into a standardized response
   */
  protected processError<T = void>(
    method: string,
    error: unknown,
  ): ServiceResponse<T> {
    this.logError(method, error);

    if (typeof error === "object" && error !== null) {
      if ("type" in error && "message" in error) {
        // It's already in our error format
        return createErrorResponse(
          (error as any).type || ServiceErrorType.UNKNOWN_ERROR,
          (error as any).message || `Error in ${this.serviceName}.${method}`,
          error,
        );
      }

      if (error instanceof Error) {
        return createErrorResponse(
          ServiceErrorType.UNKNOWN_ERROR,
          error.message || `Error in ${this.serviceName}.${method}`,
          error,
        );
      }
    }

    return createErrorResponse(
      ServiceErrorType.UNKNOWN_ERROR,
      `Unknown error in ${this.serviceName}.${method}`,
      error,
    );
  }

  /**
   * Clear any cached data
   */
  async clearCache(): Promise<ServiceResponse> {
    return createSuccessResponse();
  }
}
