import React, { memo, useCallback } from "react";
import { useLanguage } from "@/store/LanguageContext"; // Use alias
import { Slot } from "@/services/slots"; // Use alias
import { Button } from "@/components/ui/Button"; // Use alias
import {
  SettingsIcon,
  CalendarIcon,
  ExclamationIcon,
  TrashIcon,
  EyeIcon, // Keep if used in TODO example
} from "@/components/ui/Icons"; // Use alias

// Interface moved from SlotGridAccessible
export interface SlotItemProps {
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

// Component logic moved from SlotGridAccessible
export const SlotItem: React.FC<SlotItemProps> = memo(
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
      maintenance: "bg-yellow-50 border-yellow-200 hover:border-yellow-300",
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
                size="sm"
                variant={isMaintenance ? "secondary" : "outline"}
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
                size="sm"
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
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
             <Button size="sm" variant="secondary"> 
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

// Add default export
export default SlotItem; 