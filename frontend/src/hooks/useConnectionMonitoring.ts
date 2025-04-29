import { useState, useEffect, useCallback } from "react";
import {
  testConnection,
  monitorConnection,
  type ConnectionStatus,
} from "../services/supabase/connection";
import { toast } from "../utils/toast";
import { useLanguage } from "../store/LanguageContext";

/**
 * Connection monitoring state object
 */
export interface ConnectionMonitoringState {
  /**
   * Whether the client is online according to the browser API
   */
  isOnline: boolean;

  /**
   * Whether the backend connection is active
   */
  isConnected: boolean;

  /**
   * The full connection status from the last check
   */
  connectionStatus: ConnectionStatus | null;

  /**
   * Connection latency in milliseconds
   */
  latency: number | null;

  /**
   * Manually trigger a connection check
   */
  checkConnection: () => Promise<ConnectionStatus>;
}

/**
 * Hook configuration options
 */
export interface ConnectionMonitoringOptions {
  /**
   * How often to check connection in milliseconds
   * @default 60000 (60 seconds)
   */
  checkInterval?: number;

  /**
   * Whether to enable automatic monitoring
   * @default true
   */
  enableMonitoring?: boolean;

  /**
   * Callback when connection status changes
   */
  onStatusChange?: (status: ConnectionStatus) => void;

  /**
   * Whether to show toast notifications on connection change
   * @default false
   */
  showToasts?: boolean;
}

/**
 * Determine if the error is a DNS resolution failure
 */
function isDnsResolutionError(error: Error | null): boolean {
  if (!error) return false;
  
  const errorString = error.toString().toLowerCase();
  return (
    errorString.includes("err_name_not_resolved") || 
    errorString.includes("failed to fetch") ||
    errorString.includes("network error")
  );
}

/**
 * Hook for monitoring network and backend connection status
 *
 * @param options Configuration options for the connection monitoring
 * @returns Connection monitoring state
 */
export function useConnectionMonitoring(
  options: ConnectionMonitoringOptions = {},
): ConnectionMonitoringState {
  const {
    checkInterval = 60000,
    enableMonitoring = true,
    onStatusChange,
    showToasts = false,
  } = options;

  const { t } = useLanguage();

  // Network status state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  /**
   * Check connection to the backend and update state
   */
  const checkConnection = useCallback(async (): Promise<ConnectionStatus> => {
    const status = await testConnection();

    setConnectionStatus(status);
    setLatency(status.latency || null);

    if (onStatusChange) {
      onStatusChange(status);
    }

    if (showToasts && !status.isConnected) {
      // Provide more specific message based on error type
      const message = !navigator.onLine || (status.error && isDnsResolutionError(status.error))
        ? t({
            en: "You appear to be offline. Please check your internet connection.",
            fr: "Vous semblez être hors ligne. Veuillez vérifier votre connexion internet.",
          })
        : t({
            en: "Connection to server lost. Some features may be unavailable.",
            fr: "Connexion au serveur perdue. Certaines fonctionnalités peuvent être indisponibles.",
          });
          
      toast.error(message);
    } else if (
      showToasts &&
      status.isConnected &&
      connectionStatus &&
      !connectionStatus.isConnected
    ) {
      toast.success(
        t({
          en: "Connection to server restored!",
          fr: "Connexion au serveur rétablie!",
        }),
      );
    }

    return status;
  }, [onStatusChange, showToasts, connectionStatus, t]);

  // Handle online/offline browser events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // When we come back online, check the connection to backend
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkConnection]);

  // Initial connection check and monitoring setup
  useEffect(() => {
    // Perform initial connection check
    checkConnection();

    // Set up periodic monitoring if enabled
    if (enableMonitoring) {
      const stopMonitoring = monitorConnection(checkInterval, (status) => {
        setConnectionStatus(status);
        setLatency(status.latency || null);

        if (onStatusChange) {
          onStatusChange(status);
        }
      });

      // Clean up monitoring on unmount
      return () => {
        stopMonitoring();
      };
    }
  }, [checkInterval, enableMonitoring, onStatusChange, checkConnection]);

  return {
    isOnline,
    isConnected: connectionStatus?.isConnected || isOnline,
    connectionStatus,
    latency,
    checkConnection,
  };
}
