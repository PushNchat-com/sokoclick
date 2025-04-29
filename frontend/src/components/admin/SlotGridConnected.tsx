import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../../store/LanguageContext";
import { toast } from "../../utils/toast";
import SlotGridAccessible from "./SlotGridAccessible";
import {
  useSlots,
  useSlotStats,
  Slot,
  slotService,
} from "../../services/slots";
import ErrorMessage from "../ui/ErrorMessage";
import { Button } from "../ui/Button";
import { RefreshIcon } from "../ui/Icons";
import { withErrorBoundary } from "../common/ErrorBoundary";
import { useConnectionMonitoring } from "../../hooks/useConnectionMonitoring";
import { withPerformanceMonitoring } from "../../utils/performance";

interface SlotGridConnectedProps {
  /**
   * Optional status filter to show only slots with specific status
   */
  filterStatus?: Slot["slot_status"];

  /**
   * Whether admin actions should be enabled
   */
  enableActions?: boolean;

  /**
   * Optional classname for styling
   */
  className?: string;

  /**
   * Optional search term to filter slots
   */
  searchTerm?: string;
}

/**
 * SlotGridConnected provides a data-connected wrapper around the SlotGrid component.
 * It handles data fetching, error states, and provides actions that interact with the API.
 */
const SlotGridConnected: React.FC<SlotGridConnectedProps> = ({
  filterStatus,
  enableActions = true,
  className = "",
  searchTerm = "",
}) => {
  const { t } = useLanguage();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Use connection monitoring hook
  const { isOnline, connectionStatus, latency } = useConnectionMonitoring();

  // Get slots data with the useSlots hook
  const { slots, loading, error, refresh } = useSlots(filterStatus);

  // Get slot statistics
  const { stats, loading: statsLoading } = useSlotStats();

  // Filter slots by search term if provided
  const filteredSlots = useMemo(() => {
    if (!searchTerm) return slots;

    const normalizedSearch = searchTerm.toLowerCase().trim();
    if (!slots) return [];

    return slots.filter((slot) => {
      // Search by slot ID
      if (slot.id.toString().includes(normalizedSearch)) return true;

      // Search live product fields
      const nameEn = slot.live_product_name_en?.toLowerCase() || "";
      const nameFr = slot.live_product_name_fr?.toLowerCase() || "";
      const descEn = slot.live_product_description_en?.toLowerCase() || "";
      const descFr = slot.live_product_description_fr?.toLowerCase() || "";
      const tags = (slot.live_product_tags || []).join(" ").toLowerCase();
      const categories = (slot.live_product_categories || [])
        .join(" ")
        .toLowerCase();

      return (
        nameEn.includes(normalizedSearch) ||
        nameFr.includes(normalizedSearch) ||
        descEn.includes(normalizedSearch) ||
        descFr.includes(normalizedSearch) ||
        tags.includes(normalizedSearch) ||
        categories.includes(normalizedSearch)
      );
    });
  }, [slots, searchTerm]);

  // Handle connection status changes
  useEffect(() => {
    if (!isOnline) {
      toast.error(
        t({
          en: "Connection lost. Please check your internet connection.",
          fr: "Connexion perdue. Veuillez vérifier votre connexion internet.",
        }),
      );
    } else if (connectionStatus) {
      if (connectionStatus.isConnected) {
        // Connection restored
        toast.success(
          t({
            en: "Connection restored",
            fr: "Connexion rétablie",
          }),
        );
        // Refresh data when connection is restored
        refresh();
      }
    }
  }, [isOnline, connectionStatus, t, refresh]);

  // Error handler for slot operations
  const handleError = (error: Error, operationName: string) => {
    console.error(`Slot operation error [${operationName}]:`, error);
    toast.error(
      t({
        en: `Failed to ${operationName}: ${error.message}`,
        fr: `Échec de ${operationName}: ${error.message}`,
      }),
    );
  };

  // Actions with error handling
  const handleToggleMaintenance = async (
    slotId: number,
    targetMaintenanceState: boolean,
  ) => {
    const operationName = targetMaintenanceState
      ? "set maintenance"
      : "clear maintenance";
    try {
      // Call service directly
      const response = await slotService.setSlotMaintenance(
        slotId,
        targetMaintenanceState,
      );
      if (response.success) {
        toast.success(
          targetMaintenanceState
            ? t({
                en: `Slot #${slotId} set to maintenance mode`,
                fr: `Emplacement #${slotId} mis en mode maintenance`,
              })
            : t({
                en: `Slot #${slotId} set to available`,
                fr: `Emplacement #${slotId} défini comme disponible`,
              }),
        );
        refresh(); // Refresh after action
      } else {
        throw new Error(
          response.error?.message || `Failed to ${operationName}`,
        );
      }
    } catch (error) {
      handleError(error as Error, operationName);
    }
  };

  const handleRemoveProduct = async (slotId: number) => {
    const operationName = "remove product";
    // Optional: Add confirmation dialog here
    // if (!confirm(t({ en: `Are you sure you want to remove the product from slot ${slotId}?`, fr: `Êtes-vous sûr de vouloir retirer le produit de l'emplacement ${slotId}?` }))) { return; }

    try {
      // Call service directly
      const response = await slotService.removeProductFromSlot(slotId);
      if (response.success) {
        toast.success(
          t({
            en: `Product removed from slot #${slotId}`,
            fr: `Produit retiré de l'emplacement #${slotId}`,
          }),
        );
        refresh(); // Refresh after action
      } else {
        throw new Error(
          response.error?.message || `Failed to ${operationName}`,
        );
      }
    } catch (error) {
      handleError(error as Error, operationName);
    }
  };

  // Wrapper for onError prop expected by SlotGrid/SlotGridAccessible
  const handleGridError = (error: Error) => {
    // We lose the operationName context here, but log it generally
    console.error("Error originating from SlotGridAccessible:", error);
    toast.error(
      t({
        en: `An unexpected grid error occurred: ${error.message}`,
        fr: `Une erreur de grille inattendue s'est produite: ${error.message}`,
      }),
    );
  };

  // Show connection status warning
  if (!isOnline) {
    return (
      <div className={`mb-4 ${className}`}>
        <ErrorMessage
          title={t({
            en: "Connection Lost",
            fr: "Connexion Perdue",
          })}
          message={t({
            en: "You are currently offline. Please check your internet connection.",
            fr: "Vous êtes actuellement hors ligne. Veuillez vérifier votre connexion internet.",
          })}
          variant="banner"
        />
      </div>
    );
  }

  // If there's an API error, show error message with retry
  if (error) {
    return (
      <div className={`mb-4 ${className}`}>
        <ErrorMessage
          title={t({
            en: "Failed to load slots",
            fr: "Échec du chargement des emplacements",
          })}
          message={error}
          variant="banner"
        />
        <Button onClick={refresh} variant="primary" size="sm" className="mt-2">
          <RefreshIcon className="h-4 w-4 mr-1" />
          {t({
            en: "Retry",
            fr: "Réessayer",
          })}
        </Button>
      </div>
    );
  }

  // Connection info banner for high latency
  const showLatencyInfo = latency && latency > 1000;

  return (
    <div className={className}>
      {showLatencyInfo && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
          <p className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {t({
              en: `Slow connection detected (${latency}ms). Some operations may be delayed.`,
              fr: `Connexion lente détectée (${latency}ms). Certaines opérations peuvent être retardées.`,
            })}
          </p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap justify-between items-center">
        <div className="mb-2 md:mb-0">
          {!statsLoading && stats && (
            <div className="text-sm text-gray-600">
              {t({
                en: `Total: ${stats.total} | Available: ${stats.available} | Live: ${stats.live} | Maintenance: ${stats.maintenance}`,
                fr: `Total: ${stats.total} | Disponible: ${stats.available} | En Ligne: ${stats.live} | Maintenance: ${stats.maintenance}`,
              })}
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={viewMode === "grid" ? "primary" : "secondary"}
            onClick={() => setViewMode("grid")}
            aria-label={t({
              en: "Grid View",
              fr: "Vue en grille",
            })}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </Button>
          <Button
            size="sm"
            variant={viewMode === "table" ? "primary" : "secondary"}
            onClick={() => setViewMode("table")}
            aria-label={t({
              en: "Table View",
              fr: "Vue en tableau",
            })}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={refresh}
            aria-label={t({
              en: "Refresh slots",
              fr: "Actualiser les emplacements",
            })}
          >
            <RefreshIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SlotGridAccessible
        slots={filteredSlots}
        loading={loading}
        viewMode={viewMode}
        selectedSlot={selectedSlot}
        onToggleMaintenance={
          enableActions ? handleToggleMaintenance : undefined
        }
        onRemoveProduct={enableActions ? handleRemoveProduct : undefined}
        onSlotSelect={setSelectedSlot}
        onError={handleGridError}
      />
    </div>
  );
};

// Apply performance monitoring
const MonitoredComponent = withPerformanceMonitoring(
  SlotGridConnected,
  "SlotGridConnected",
);

// Apply error boundary and export
export default withErrorBoundary(MonitoredComponent, {
  componentName: "SlotGridConnected",
  fallback: (error, errorInfo) => (
    <div className="bg-red-50 border border-red-200 rounded-md p-6">
      <h3 className="text-lg font-medium text-red-800 mb-2">Slot Grid Error</h3>
      <p className="text-sm text-red-700 mb-4">
        {error.message || "Failed to load slot management interface."}
      </p>
      <details className="text-xs text-red-600 mt-2">
        <summary>Technical Details</summary>
        <pre className="mt-2 whitespace-pre-wrap">
          {errorInfo.componentStack}
        </pre>
      </details>
      <div className="mt-4">
        <Button
          onClick={() => window.location.reload()}
          variant="primary"
          size="sm"
        >
          <RefreshIcon className="h-4 w-4 mr-1" />
          Refresh Page
        </Button>
      </div>
    </div>
  ),
});
