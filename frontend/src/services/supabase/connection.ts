/**
 * Supabase connection testing utilities
 *
 * This file contains functions to test and monitor the connection to Supabase.
 */

import { supabase } from "./config";

/**
 * Connection Status object returned by connection tests
 */
export interface ConnectionStatus {
  isConnected: boolean;
  latency?: number;
  error?: Error | null;
  timestamp: Date;
  details?: Record<string, unknown>;
}

/**
 * Tests the connection to Supabase with detailed metrics
 *
 * @returns Promise resolving to ConnectionStatus object
 */
export async function testConnection(): Promise<ConnectionStatus> {
  // First check if the browser reports as online
  if (!navigator.onLine) {
    return {
      isConnected: false,
      error: new Error("Browser is offline"),
      timestamp: new Date(),
      details: {
        reason: "OFFLINE",
      },
    };
  }

  const startTime = performance.now();

  try {
    // Ping a lightweight RPC function
    const { data, error } = await supabase.rpc("ping");

    if (error) {
      throw error;
    }

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    return {
      isConnected: true,
      latency,
      error: null,
      timestamp: new Date(),
      details: {
        serverTimestamp: data?.timestamp,
        clientTimestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Supabase connection test failed:", error);

    return {
      isConnected: false,
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp: new Date(),
      details: {
        reason: "REQUEST_FAILED",
      },
    };
  }
}

/**
 * Performs a health check on the Supabase connection
 *
 * @returns Promise resolving to a boolean indicating connection health
 */
export async function checkConnectionHealth(): Promise<boolean> {
  try {
    const status = await testConnection();

    // Consider the connection healthy if connected with acceptable latency
    const isHealthy =
      status.isConnected && (status.latency ? status.latency < 2000 : true);

    // Log health metrics
    if (!isHealthy) {
      console.warn("Supabase connection health check failed:", status);
    }

    return isHealthy;
  } catch (error) {
    console.error("Supabase health check error:", error);
    return false;
  }
}

/**
 * Sets up periodic connection health checks
 *
 * @param intervalMs - Interval in milliseconds between checks (default: 60000)
 * @param onStatusChange - Optional callback for status changes
 * @returns Function to stop the monitoring
 */
export function monitorConnection(
  intervalMs = 60000,
  onStatusChange?: (status: ConnectionStatus) => void,
): () => void {
  let lastStatus: ConnectionStatus | null = null;

  // Use NodeJS.Timeout type for proper TypeScript compatibility
  const intervalId: NodeJS.Timeout = setInterval(async () => {
    const currentStatus = await testConnection();

    // Check if status has changed
    if (
      onStatusChange &&
      (!lastStatus || lastStatus.isConnected !== currentStatus.isConnected)
    ) {
      onStatusChange(currentStatus);
    }

    lastStatus = currentStatus;
  }, intervalMs);

  // Return function to stop monitoring
  return () => clearInterval(intervalId);
}
