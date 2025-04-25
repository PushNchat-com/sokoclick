import { ServiceResponse, ServiceErrorType, createSuccessResponse, createErrorResponse } from './ServiceResponse';
import { networkStatus } from './NetworkStatus';
import React, { useEffect } from 'react';

/**
 * Pending operation types
 */
export enum PendingOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  BATCH = 'batch'
}

/**
 * Structure for pending operations
 */
export interface PendingOperation<T = any> {
  id: string;
  type: PendingOperationType;
  entityType: string;
  data: T;
  timestamp: number;
  retryCount: number;
  entityId?: string | number;
}

/**
 * Options for the IndexedDB store
 */
interface OfflineStorageOptions {
  dbName: string;
  version: number;
  pendingOperationsStore: string;
  entityStores: {
    name: string;
    keyPath: string;
  }[];
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: OfflineStorageOptions = {
  dbName: 'sokoclick_offline',
  version: 1,
  pendingOperationsStore: 'pendingOperations',
  entityStores: [
    { name: 'slots', keyPath: 'id' },
    { name: 'products', keyPath: 'id' }
  ]
};

/**
 * Service for managing offline data and pending operations
 */
class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private options: OfflineStorageOptions;
  private initialized = false;
  private pendingSync = false;

  constructor(options: Partial<OfflineStorageOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<ServiceResponse> {
    if (this.initialized) {
      return createSuccessResponse();
    }

    try {
      this.db = await this.openDatabase();
      this.initialized = true;

      // Register for online events to trigger syncing
      networkStatus.registerHandler(this.handleNetworkChange);

      return createSuccessResponse();
    } catch (error) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        'Failed to initialize offline storage',
        error
      );
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<ServiceResponse> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    networkStatus.unregisterHandler(this.handleNetworkChange);
    this.initialized = false;

    return createSuccessResponse();
  }

  /**
   * Handle network status changes
   */
  private handleNetworkChange = (online: boolean): void => {
    if (online && !this.pendingSync) {
      this.syncPendingOperations();
    }
  };

  /**
   * Open the IndexedDB database
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.options.dbName, this.options.version);

      request.onerror = () => {
        reject(new Error('Failed to open offline database'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;

        // Create the pending operations store
        if (!db.objectStoreNames.contains(this.options.pendingOperationsStore)) {
          db.createObjectStore(this.options.pendingOperationsStore, { keyPath: 'id' });
        }

        // Create the entity stores
        this.options.entityStores.forEach(store => {
          if (!db.objectStoreNames.contains(store.name)) {
            db.createObjectStore(store.name, { keyPath: store.keyPath });
          }
        });
      };
    });
  }

  /**
   * Store entity data for offline use
   */
  async storeEntity<T>(
    storeName: string,
    data: T
  ): Promise<ServiceResponse<T>> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        'Offline database not available'
      );
    }

    try {
      return await new Promise((resolve) => {
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => {
          resolve(createSuccessResponse(data));
        };

        request.onerror = () => {
          resolve(createErrorResponse(
            ServiceErrorType.STORAGE_ERROR,
            `Failed to store ${storeName} data`
          ));
        };
      });
    } catch (error) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        `Error storing ${storeName} data`,
        error
      );
    }
  }

  /**
   * Get entity data from offline storage
   */
  async getEntity<T>(
    storeName: string,
    id: string | number
  ): Promise<ServiceResponse<T>> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        'Offline database not available'
      );
    }

    try {
      return await new Promise((resolve) => {
        const transaction = this.db!.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => {
          if (request.result) {
            resolve(createSuccessResponse(request.result));
          } else {
            resolve(createErrorResponse(
              ServiceErrorType.NOT_FOUND,
              `${storeName} with id ${id} not found in offline storage`
            ));
          }
        };

        request.onerror = () => {
          resolve(createErrorResponse(
            ServiceErrorType.STORAGE_ERROR,
            `Failed to retrieve ${storeName} data`
          ));
        };
      });
    } catch (error) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        `Error retrieving ${storeName} data`,
        error
      );
    }
  }

  /**
   * Get all entities from a store
   */
  async getAllEntities<T>(storeName: string): Promise<ServiceResponse<T[]>> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        'Offline database not available'
      );
    }

    try {
      return await new Promise((resolve) => {
        const transaction = this.db!.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(createSuccessResponse(request.result));
        };

        request.onerror = () => {
          resolve(createErrorResponse(
            ServiceErrorType.STORAGE_ERROR,
            `Failed to retrieve all ${storeName} data`
          ));
        };
      });
    } catch (error) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        `Error retrieving all ${storeName} data`,
        error
      );
    }
  }

  /**
   * Store a pending operation
   */
  async storePendingOperation<T>(
    operation: Omit<PendingOperation<T>, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<ServiceResponse<PendingOperation<T>>> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        'Offline database not available'
      );
    }

    const pendingOp: PendingOperation<T> = {
      ...operation,
      id: `${operation.entityType}_${operation.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    try {
      return await new Promise((resolve) => {
        const transaction = this.db!.transaction(this.options.pendingOperationsStore, 'readwrite');
        const store = transaction.objectStore(this.options.pendingOperationsStore);
        const request = store.add(pendingOp);

        request.onsuccess = () => {
          resolve(createSuccessResponse(pendingOp));
        };

        request.onerror = () => {
          resolve(createErrorResponse(
            ServiceErrorType.STORAGE_ERROR,
            'Failed to store pending operation'
          ));
        };
      });
    } catch (error) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        'Error storing pending operation',
        error
      );
    }
  }

  /**
   * Get all pending operations
   */
  async getPendingOperations(): Promise<ServiceResponse<PendingOperation[]>> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        'Offline database not available'
      );
    }

    try {
      return await new Promise((resolve) => {
        const transaction = this.db!.transaction(this.options.pendingOperationsStore, 'readonly');
        const store = transaction.objectStore(this.options.pendingOperationsStore);
        const request = store.getAll();

        request.onsuccess = () => {
          // Sort by timestamp (oldest first)
          const operations = request.result.sort((a, b) => a.timestamp - b.timestamp);
          resolve(createSuccessResponse(operations));
        };

        request.onerror = () => {
          resolve(createErrorResponse(
            ServiceErrorType.STORAGE_ERROR,
            'Failed to retrieve pending operations'
          ));
        };
      });
    } catch (error) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        'Error retrieving pending operations',
        error
      );
    }
  }

  /**
   * Delete a pending operation
   */
  async deletePendingOperation(id: string): Promise<ServiceResponse> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        'Offline database not available'
      );
    }

    try {
      return await new Promise((resolve) => {
        const transaction = this.db!.transaction(this.options.pendingOperationsStore, 'readwrite');
        const store = transaction.objectStore(this.options.pendingOperationsStore);
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve(createSuccessResponse());
        };

        request.onerror = () => {
          resolve(createErrorResponse(
            ServiceErrorType.STORAGE_ERROR,
            'Failed to delete pending operation'
          ));
        };
      });
    } catch (error) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        'Error deleting pending operation',
        error
      );
    }
  }

  /**
   * Update a pending operation (e.g., to increment retry count)
   */
  async updatePendingOperation<T>(
    operation: PendingOperation<T>
  ): Promise<ServiceResponse<PendingOperation<T>>> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        'Offline database not available'
      );
    }

    try {
      return await new Promise((resolve) => {
        const transaction = this.db!.transaction(this.options.pendingOperationsStore, 'readwrite');
        const store = transaction.objectStore(this.options.pendingOperationsStore);
        const request = store.put(operation);

        request.onsuccess = () => {
          resolve(createSuccessResponse(operation));
        };

        request.onerror = () => {
          resolve(createErrorResponse(
            ServiceErrorType.STORAGE_ERROR,
            'Failed to update pending operation'
          ));
        };
      });
    } catch (error) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        'Error updating pending operation',
        error
      );
    }
  }

  /**
   * Sync all pending operations
   * This method will be customized to integrate with your API
   */
  async syncPendingOperations(): Promise<ServiceResponse> {
    if (!networkStatus.isOnline()) {
      return createErrorResponse(
        ServiceErrorType.OFFLINE_ERROR,
        'Cannot sync while offline'
      );
    }

    // Prevent multiple syncs from running simultaneously
    if (this.pendingSync) {
      return createErrorResponse(
        ServiceErrorType.VALIDATION_ERROR,
        'Sync already in progress'
      );
    }

    this.pendingSync = true;

    try {
      const pendingOpsResponse = await this.getPendingOperations();
      
      if (!pendingOpsResponse.success || !pendingOpsResponse.data || pendingOpsResponse.data.length === 0) {
        this.pendingSync = false;
        return createSuccessResponse();
      }

      const pendingOps = pendingOpsResponse.data;
      
      // Process each pending operation
      // For now, just log them - in a real implementation,
      // you'd send these to your API and handle success/failure
      console.log('Syncing pending operations:', pendingOps);
      
      for (const operation of pendingOps) {
        // This would be replaced with actual API calls
        console.log(`Processing operation: ${operation.type} for ${operation.entityType}`);
        
        // Example implementation (pseudo-code)
        try {
          // Simulate API call
          // const result = await apiClient.syncOperation(operation);
          
          // If successful, remove the operation
          await this.deletePendingOperation(operation.id);
        } catch (error) {
          // If failed, increment retry count
          operation.retryCount++;
          await this.updatePendingOperation(operation);
          
          // Stop processing if we encounter an error
          break;
        }
      }

      this.pendingSync = false;
      return createSuccessResponse();
    } catch (error) {
      this.pendingSync = false;
      return createErrorResponse(
        ServiceErrorType.UNKNOWN_ERROR,
        'Error during sync process',
        error
      );
    }
  }

  /**
   * Clear a specific entity store
   */
  async clearEntityStore(storeName: string): Promise<ServiceResponse> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        'Offline database not available'
      );
    }

    try {
      return await new Promise((resolve) => {
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve(createSuccessResponse());
        };

        request.onerror = () => {
          resolve(createErrorResponse(
            ServiceErrorType.STORAGE_ERROR,
            `Failed to clear ${storeName} store`
          ));
        };
      });
    } catch (error) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        `Error clearing ${storeName} store`,
        error
      );
    }
  }

  /**
   * Clear all offline data
   */
  async clearAllData(): Promise<ServiceResponse> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        'Offline database not available'
      );
    }

    try {
      // Clear pending operations
      await this.clearEntityStore(this.options.pendingOperationsStore);
      
      // Clear all entity stores
      for (const store of this.options.entityStores) {
        await this.clearEntityStore(store.name);
      }
      
      return createSuccessResponse();
    } catch (error) {
      return createErrorResponse(
        ServiceErrorType.STORAGE_ERROR,
        'Error clearing all offline data',
        error
      );
    }
  }

  /**
   * Get the count of pending operations
   */
  async getPendingOperationCount(): Promise<ServiceResponse<number>> {
    const response = await this.getPendingOperations();
    
    if (!response.success) {
      return createErrorResponse(
        response.error?.type || ServiceErrorType.UNKNOWN_ERROR,
        response.error?.message || 'Failed to get pending operation count'
      );
    }
    
    return createSuccessResponse(response.data?.length || 0);
  }
}

// Create singleton instance
export const offlineStorage = new OfflineStorageService();

// Export a hook for components
export function useOfflineStorage() {
  useEffect(() => {
    offlineStorage.initialize();
    return () => {
      // Don't actually clean up on component unmount, as other components may need it
    };
  }, []);

  return offlineStorage;
} 