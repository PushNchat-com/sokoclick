/**
 * Standard error types for service operations
 */
export enum ServiceErrorType {
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OFFLINE_ERROR = 'OFFLINE_ERROR'
}

/**
 * Consistent service response format
 */
export interface ServiceResponse<T = void> {
  success: boolean;
  data?: T;
  error?: {
    type: ServiceErrorType;
    message: string;
    details?: unknown;
  };
  /** Used for offline operations that will be synced later */
  pendingSync?: boolean;
}

/**
 * Batch operation result interface
 */
export interface BatchOperationResult<T = void, I = number> {
  overallSuccess: boolean;
  results: ServiceResponse<T>[];
  successCount: number;
  failureCount: number;
  errors: {
    itemId: I;
    error: {
      type: ServiceErrorType;
      message: string;
    };
  }[];
}

/**
 * Create a standardized error response
 */
export function createErrorResponse<T = void>(
  type: ServiceErrorType, 
  message: string,
  details?: unknown
): ServiceResponse<T> {
  return {
    success: false,
    error: {
      type,
      message,
      details
    }
  };
}

/**
 * Create a successful response
 */
export function createSuccessResponse<T = void>(
  data?: T,
  pendingSync: boolean = false
): ServiceResponse<T> {
  return {
    success: true,
    data,
    pendingSync
  };
}

/**
 * Base interface for all services
 */
export interface BaseService {
  /**
   * Check if the service is online
   */
  isOnline(): boolean;
  
  /**
   * Initialize the service
   */
  initialize(): Promise<ServiceResponse>;
  
  /**
   * Clear any cached data
   */
  clearCache?(): Promise<ServiceResponse>;
} 