import React, { useCallback, useRef, useEffect, memo } from "react";
import { useLanguage } from "@/store/LanguageContext";
import { Slot, slotService } from "@/services/slots";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  SettingsIcon,
  CalendarIcon,
  CheckIcon,
  XIcon,
  TrashIcon,
  ExclamationIcon,
  EyeIcon,
} from "@/components/ui/Icons";
import Skeleton from "@/components/ui/Skeleton";
import { withPerformanceMonitoring } from "@/utils/performance";
import { formatDistanceToNowStrict } from "date-fns";
import { enUS, fr } from "date-fns/locale";

interface SlotGridAccessibleProps {
  slots?: Slot[];
  loading?: boolean;
  className?: string;
  viewMode?: "grid" | "table";
  selectedSlot?: number | null;
  enableActions?: boolean;
  onToggleMaintenance?: (slotId: number, currentStatus: boolean) => void;
  onRemoveProduct?: (slotId: number) => void;
  onSlotSelect?: (slotId: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Individual slot item component for the grid view
 */
interface SlotItemProps {
  slot: Slot;
  isSelected: boolean;
  enableActions?: boolean;
  onToggleMaintenance?: (slotId: number, currentStatus: boolean) => void;
  onRemoveProduct?: (slotId: number) => void;
  onSlotSelect?: (slotId: number) => void;
  getStatusBadge: (status: Slot["slot_status"]) => JSX.Element;
  formatTimeLeft: (endTime: string | null | undefined) => string | null;
  t: (key: any) => string;
}

const SlotItem: React.FC<SlotItemProps> = memo(
  ({
    slot,
    isSelected,
    enableActions,
    onToggleMaintenance,
    onRemoveProduct,
    onSlotSelect,
    getStatusBadge,
    formatTimeLeft,
    t,
  }) => {
    const { language } = useLanguage();

    // Access data using live_product_* fields
    const title =
      language === "fr" ? slot.live_product_name_fr : slot.live_product_name_en;
    const description =
      language === "fr"
        ? slot.live_product_description_fr
        : slot.live_product_description_en;
    const mainImage = slot.live_product_image_urls?.[0];
    const timeLeft = formatTimeLeft(slot.end_time);

    // Handle action clicks safely
    const handleOperation = useCallback((operation?: () => void) => {
      if (!operation) return;
      try {
        operation();
      } catch (error) {
        console.error("Slot operation failed:", error);
        // onError callback could be invoked here if passed down
      }
    }, []);

    // Determine current status and if actions are possible
    const isMaintenance = slot.slot_status === "maintenance";
    const isLive = slot.slot_status === "live";
    const isEmpty = slot.slot_status === "empty";

    // Define CSS classes based on the correct status
    const statusClasses = {
      empty: "bg-gray-50 border-gray-200 hover:border-gray-300",
      live: "bg-blue-50 border-blue-200 hover:border-blue-300",
      maintenance: "bg-yellow-50 border-yellow-200 hover:border-yellow-300", // Use yellow for maintenance?
    };
    const selectionClasses = isSelected
      ? "ring-2 ring-indigo-500 border-indigo-400"
      : "hover:shadow-md";
    const baseClasses = `
    h-full p-4 border rounded-lg shadow-sm transition-all duration-200 ease-in-out 
    flex flex-col 
    ${statusClasses[slot.slot_status]} 
    ${selectionClasses}
  `;

    return (
      <div
        className={baseClasses}
        role="gridcell"
        tabIndex={0}
        aria-selected={isSelected}
        onClick={() => onSlotSelect?.(slot.id)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && onSlotSelect) {
            e.preventDefault();
            onSlotSelect(slot.id);
          }
        }}
        aria-labelledby={`slot-heading-${slot.id}`}
        aria-describedby={`slot-desc-${slot.id}`}
      >
        {/* Header: Slot ID and Status Badge */}
        <div className="flex justify-between items-start mb-2">
          <div className="font-bold text-lg" id={`slot-heading-${slot.id}`}>
            #{slot.id}
          </div>
          <div id={`slot-status-desc-${slot.id}`}>
            {getStatusBadge(slot.slot_status)}
          </div>
        </div>

        {/* Body: Image and Product Info/Draft Info */}
        <div className="flex-grow mb-3">
          <div className="relative mb-3 h-24 bg-gray-100 rounded-md overflow-hidden">
            {isLive && mainImage ? (
              <img
                src={mainImage}
                alt={title || "Product image"}
                className="w-full h-full object-cover"
                aria-hidden="true"
                loading="lazy"
              />
            ) : isLive ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <span aria-hidden="true">
                  {t({ en: "No image", fr: "Pas d'image" })}
                </span>
              </div>
            ) : isEmpty ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <span aria-hidden="true">
                  {t({ en: "Empty Slot", fr: "Emplacement Vide" })}
                </span>
              </div>
            ) : isMaintenance ? (
              <div className="flex items-center justify-center h-full text-yellow-500">
                <ExclamationIcon className="w-8 h-8" />
              </div>
            ) : null}
          </div>

          <div className="text-sm" id={`slot-desc-${slot.id}`}>
            {isLive ? (
              <>
                <p className="font-medium line-clamp-1">
                  {title || t({ en: "[No Title]", fr: "[Sans Titre]" })}
                </p>
                <p className="text-gray-500 line-clamp-2 h-10">
                  {description || ""}
                </p>
              </>
            ) : isEmpty ? (
              <p className="text-gray-500 italic">
                {t({ en: "Slot is available", fr: "Emplacement disponible" })}
              </p>
            ) : isMaintenance ? (
              <p className="text-yellow-700 font-medium">
                {t({ en: "Under Maintenance", fr: "En Maintenance" })}
              </p>
            ) : null}
          </div>

          {isLive && timeLeft && (
            <div className="mt-2 text-xs text-gray-600 flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>{timeLeft}</span>
            </div>
          )}
          {/* TODO: Add display for draft status/info if needed */}
        </div>

        {/* Footer: Actions */}
        {enableActions && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-gray-200/50">
            {/* Toggle Maintenance Button */}
            {onToggleMaintenance && (
              <Button
                size="xs"
                variant={isMaintenance ? "success" : "warning"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOperation(() =>
                    onToggleMaintenance(slot.id, isMaintenance),
                  );
                }}
                aria-label={
                  isMaintenance
                    ? t({
                        en: `Clear maintenance for slot ${slot.id}`,
                        fr: `Lever la maintenance pour l'emplacement ${slot.id}`,
                      })
                    : t({
                        en: `Set slot ${slot.id} to maintenance`,
                        fr: `Mettre l'emplacement ${slot.id} en maintenance`,
                      })
                }
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
            )}

            {/* Remove Product Button (Only if slot is live) */}
            {isLive && onRemoveProduct && (
              <Button
                size="xs"
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  // Optional: Add confirmation dialog here
                  handleOperation(() => onRemoveProduct(slot.id));
                }}
                aria-label={t({
                  en: `Remove product from slot ${slot.id}`,
                  fr: `Retirer le produit de l'emplacement ${slot.id}`,
                })}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}

            {/* TODO: Add buttons for View/Edit Draft, Publish Draft? */}
            {/* Example: 
           {!isLive && slot.draft_status !== 'empty' && (
             <Button size="xs" variant="secondary">
               <EyeIcon className="h-4 w-4" /> View Draft
             </Button>
           )}
          */}
          </div>
        )}
      </div>
    );
  },
);

SlotItem.displayName = "SlotItem";

/**
 * SlotGridAccessible component combines modern UI with accessibility features
 */
const SlotGridAccessible: React.FC<SlotGridAccessibleProps> = memo(
  ({
    slots = [],
    loading = false,
    className = "",
    viewMode = "grid",
    selectedSlot,
    enableActions = true,
    onToggleMaintenance,
    onRemoveProduct,
    onSlotSelect,
    onError,
  }) => {
    const { t, language } = useLanguage();
    const gridRef = useRef<HTMLDivElement>(null);

    // Helper to format time left for reserved slots
    const formatTimeLeft = useCallback(
      (endTime: string | null | undefined): string | null => {
        if (!endTime) return null;

        try {
          const endDate = new Date(endTime);
          const now = new Date();
          if (endDate <= now)
            return t({
              en: "Ended",
              fr: "Terminé",
            });

          return formatDistanceToNowStrict(endDate, {
            addSuffix: true,
            locale: language === "fr" ? fr : enUS,
          });
        } catch (error) {
          if (onError) onError(new Error(`Failed to format time: ${error}`));
          return t({
            en: "Invalid date",
            fr: "Date invalide",
          });
        }
      },
      [t, language],
    );

    // Helper to get badge for slot status
    const getStatusBadge = useCallback(
      (status: Slot["slot_status"]): JSX.Element => {
        switch (status) {
          case "live":
            return (
              <Badge color="blue">{t({ en: "Live", fr: "En Ligne" })}</Badge>
            );
          case "maintenance":
            return (
              <Badge color="yellow">
                {t({ en: "Maintenance", fr: "Maintenance" })}
              </Badge>
            );
          case "empty":
          default:
            return <Badge color="gray">{t({ en: "Empty", fr: "Vide" })}</Badge>;
        }
      },
      [t],
    );

    // Handle keyboard navigation
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Only handle keyboard navigation if the grid has focus
        if (!gridRef.current?.contains(document.activeElement)) return;

        const focusedElement = document.activeElement as HTMLElement;
        const slotItems = Array.from(
          gridRef.current?.querySelectorAll('[role="gridcell"]') || [],
        );

        if (!slotItems.length) return;

        const focusedIndex = slotItems.indexOf(focusedElement);
        if (focusedIndex === -1) return;

        let newIndex = focusedIndex;
        const columns = viewMode === "grid" ? 5 : 1;

        switch (e.key) {
          case "ArrowRight":
            newIndex = Math.min(slotItems.length - 1, focusedIndex + 1);
            break;
          case "ArrowLeft":
            newIndex = Math.max(0, focusedIndex - 1);
            break;
          case "ArrowDown":
            newIndex = Math.min(slotItems.length - 1, focusedIndex + columns);
            break;
          case "ArrowUp":
            newIndex = Math.max(0, focusedIndex - columns);
            break;
          case "Home":
            newIndex = 0;
            break;
          case "End":
            newIndex = slotItems.length - 1;
            break;
          default:
            return;
        }

        if (newIndex !== focusedIndex) {
          e.preventDefault();
          (slotItems[newIndex] as HTMLElement).focus();
        }
      };

      const gridElement = gridRef.current;
      if (gridElement) {
        gridElement.addEventListener("keydown", handleKeyDown);
        return () => gridElement.removeEventListener("keydown", handleKeyDown);
      }
    }, [slots, viewMode]);

    // Loading state
    if (loading) {
      return (
        <div role="status" aria-live="polite" className={`w-full ${className}`}>
          <div className="sr-only">
            {t({
              en: "Loading slots...",
              fr: "Chargement des emplacements...",
            })}
          </div>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`}
          >
            {Array.from({ length: 12 }).map((_, index) => (
              <Skeleton
                key={`slot-skeleton-${index}`}
                className="h-64 rounded-lg"
              />
            ))}
          </div>
        </div>
      );
    }

    // No slots available
    if (slots.length === 0) {
      return (
        <div
          className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}
          aria-live="polite"
        >
          <p className="text-gray-600">
            {t({
              en: "No slots available.",
              fr: "Aucun emplacement disponible.",
            })}
          </p>
        </div>
      );
    }

    // Render as table
    if (viewMode === "table") {
      return (
        <div
          className="overflow-x-auto rounded-lg shadow"
          role="region"
          aria-label={t({
            en: "Slots Table",
            fr: "Tableau des emplacements",
          })}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t({
                    en: "Slot ID",
                    fr: "ID de l'emplacement",
                  })}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t({
                    en: "Status",
                    fr: "État",
                  })}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t({
                    en: "Product",
                    fr: "Produit",
                  })}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t({
                    en: "Actions",
                    fr: "Actions",
                  })}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {slots.map((slot) => (
                <tr
                  key={slot.id}
                  className={`${selectedSlot === slot.id ? "bg-indigo-50" : "hover:bg-gray-50"} cursor-pointer`}
                  onClick={() => onSlotSelect?.(slot.id)}
                  tabIndex={0}
                  role="row"
                  aria-selected={selectedSlot === slot.id}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSlotSelect?.(slot.id);
                    }
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{slot.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(slot.slot_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {slot.live_product_name_en}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {slot.slot_status === "live" && onToggleMaintenance && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleMaintenance(slot.id, false);
                          }}
                          aria-label={t({
                            en: `Set slot ${slot.id} to maintenance mode`,
                            fr: `Mettre l'emplacement ${slot.id} en mode maintenance`,
                          })}
                        >
                          <SettingsIcon className="h-3.5 w-3.5 mr-1" />
                          {t({
                            en: "Maintenance",
                            fr: "Maintenance",
                          })}
                        </Button>
                      )}

                      {slot.slot_status === "live" && onRemoveProduct && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveProduct(slot.id);
                          }}
                          aria-label={t({
                            en: `Remove product from slot ${slot.id}`,
                            fr: `Retirer le produit de l'emplacement ${slot.id}`,
                          })}
                        >
                          <TrashIcon className="h-3.5 w-3.5 mr-1" />
                          {t({
                            en: "Remove",
                            fr: "Retirer",
                          })}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Default grid view
    return (
      <div
        ref={gridRef}
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 ${className}`}
        role="grid"
        aria-rowcount={Math.ceil(slots.length / 5)}
        aria-colcount={5}
        aria-label={t({
          en: "Slots Grid",
          fr: "Grille des emplacements",
        })}
      >
        {slots.map((slot) => (
          <SlotItem
            key={slot.id}
            slot={slot}
            isSelected={selectedSlot === slot.id}
            enableActions={enableActions}
            onToggleMaintenance={onToggleMaintenance}
            onRemoveProduct={onRemoveProduct}
            onSlotSelect={onSlotSelect}
            getStatusBadge={getStatusBadge}
            formatTimeLeft={formatTimeLeft}
            t={t}
          />
        ))}
      </div>
    );
  },
);

SlotGridAccessible.displayName = "SlotGridAccessible";

// Export with performance monitoring
export default withPerformanceMonitoring(
  SlotGridAccessible,
  "SlotGridAccessible",
);
