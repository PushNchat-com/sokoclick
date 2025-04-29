import {
  ConnectionMonitoringState,
  ConnectionMonitoringOptions,
} from "../useConnectionMonitoring";

/**
 * Mock implementation of the useConnectionMonitoring hook for testing
 */
export function useConnectionMonitoring(
  options: ConnectionMonitoringOptions = {},
): ConnectionMonitoringState {
  // Default mock values for testing
  return {
    isOnline: true,
    isConnected: true,
    connectionStatus: {
      isConnected: true,
      latency: 50,
      timestamp: new Date(),
      error: null,
      details: {
        serverTimestamp: new Date().toISOString(),
        clientTimestamp: new Date().toISOString(),
      },
    },
    latency: 50,
    checkConnection: async () => ({
      isConnected: true,
      latency: 50,
      timestamp: new Date(),
      error: null,
      details: {
        serverTimestamp: new Date().toISOString(),
        clientTimestamp: new Date().toISOString(),
      },
    }),
  };
}
