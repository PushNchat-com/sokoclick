import {
  ServiceResponse,
  createSuccessResponse,
  createErrorResponse,
  ServiceErrorType,
} from "./ServiceResponse";
import React, { useEffect } from "react";

/**
 * Network status event types
 */
export enum NetworkStatusEvent {
  ONLINE = "online",
  OFFLINE = "offline",
}

/**
 * Handler for network status changes
 */
export type NetworkStatusHandler = (online: boolean) => void;

/**
 * Service for managing network connectivity status
 */
class NetworkStatusService {
  private online: boolean = navigator.onLine;
  private handlers: NetworkStatusHandler[] = [];
  private initialized: boolean = false;

  /**
   * Initialize the network status listeners
   */
  initialize(): Promise<ServiceResponse> {
    if (this.initialized) {
      return Promise.resolve(createSuccessResponse());
    }

    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
    this.initialized = true;

    return Promise.resolve(createSuccessResponse());
  }

  /**
   * Clean up event listeners
   */
  cleanup(): Promise<ServiceResponse> {
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
    this.initialized = false;
    this.handlers = [];

    return Promise.resolve(createSuccessResponse());
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    this.online = true;
    this.notifyHandlers();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    this.online = false;
    this.notifyHandlers();
  };

  /**
   * Notify all registered handlers of network status change
   */
  private notifyHandlers(): void {
    this.handlers.forEach((handler) => handler(this.online));
  }

  /**
   * Check if the application is online
   */
  isOnline(): boolean {
    return this.online;
  }

  /**
   * Register a handler for network status changes
   */
  registerHandler(handler: NetworkStatusHandler): void {
    if (!this.handlers.includes(handler)) {
      this.handlers.push(handler);
    }
  }

  /**
   * Unregister a handler
   */
  unregisterHandler(handler: NetworkStatusHandler): void {
    this.handlers = this.handlers.filter((h) => h !== handler);
  }

  /**
   * Test network connectivity by making a request
   */
  async testConnectivity(): Promise<ServiceResponse<boolean>> {
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch("/api/ping", {
        method: "HEAD",
        cache: "no-store",
      });

      const online = response.ok;

      // Update the status if it's different
      if (online !== this.online) {
        this.online = online;
        this.notifyHandlers();
      }

      return createSuccessResponse(online);
    } catch (error) {
      // If fetch fails, we're offline
      if (this.online) {
        this.online = false;
        this.notifyHandlers();
      }

      return createErrorResponse(
        ServiceErrorType.NETWORK_ERROR,
        "Network connectivity test failed",
        error,
      );
    }
  }
}

// Create singleton instance
export const networkStatus = new NetworkStatusService();

// Export a React hook for using this service
export function useNetworkStatus(handler?: NetworkStatusHandler): boolean {
  // Initialize on first use
  if (!networkStatus.isOnline) {
    networkStatus.initialize();
  }

  // Register the handler if provided
  if (handler) {
    useEffect(() => {
      networkStatus.registerHandler(handler);
      return () => networkStatus.unregisterHandler(handler);
    }, [handler]);
  }

  // Return current status
  return networkStatus.isOnline();
}
