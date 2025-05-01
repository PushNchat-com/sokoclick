import React, { useCallback, useRef, useEffect, memo } from "react";
import { useLanguage } from "@/store/LanguageContext";
import { Slot, slotService } from "@/services/slots";
import { Button } from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import SlotItem from "./slot-management/SlotItem";
import { formatTimeLeft, getSlotStatusBadge } from "@/utils/slotUtils";
import { SettingsIcon, TrashIcon } from "@/components/ui/Icons";

interface SlotGridProps {
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

const SlotGrid: React.FC<SlotGridProps> = memo(
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

    if (loading) {
      const skeletonCount = viewMode === 'table' ? 5 : 25;
      return (
        <div className={className}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <Skeleton key={index} className={viewMode === 'grid' ? "h-48" : "h-12 mb-2"} />
          ))}
        </div>
      );
    }

    if (!slots || slots.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <p className="mt-1 text-sm text-gray-500">
            {t({ en: "No slots found.", fr: "Aucun emplacement trouvé." })}
          </p>
        </div>
      );
    }

    if (viewMode === "table") {
      return (
        <div className="overflow-x-auto rounded-lg shadow" role="region">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ends In</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {slots.map((slot) => {
                const productName = language === 'en' ? slot.live_product_name_en : slot.live_product_name_fr;
                return (
                  <tr 
                    key={slot.id} 
                    className={selectedSlot === slot.id ? "bg-indigo-50" : "hover:bg-gray-50"}
                    onClick={() => onSlotSelect?.(slot.id)}
                    style={{ cursor: onSlotSelect ? 'pointer' : 'default' }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{slot.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getSlotStatusBadge(slot.slot_status, t)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 truncate" title={productName || ''}>{productName || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTimeLeft(slot.end_time, t, language) || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      {enableActions && (
                        <div className="flex justify-end space-x-2">
                          {onToggleMaintenance && slot.slot_status !== 'maintenance' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleMaintenance(slot.id, true);
                              }}
                              aria-label={t({ 
                                en: `Set slot ${slot.id} to maintenance`, 
                                fr: `Mettre l'emplacement ${slot.id} en maintenance` 
                              })}
                            >
                              <SettingsIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {onToggleMaintenance && slot.slot_status === 'maintenance' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleMaintenance(slot.id, false);
                              }}
                              aria-label={t({ 
                                en: `Clear maintenance for slot ${slot.id}`, 
                                fr: `Lever la maintenance pour l'emplacement ${slot.id}` 
                              })}
                            >
                              <SettingsIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {onRemoveProduct && slot.slot_status === 'live' && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveProduct(slot.id);
                              }}
                              aria-label={t({ 
                                en: `Remove product from slot ${slot.id}`, 
                                fr: `Retirer le produit de l'emplacement ${slot.id}` 
                              })}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div
        ref={gridRef}
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 ${className}`}
        role="grid"
      >
        {slots.map((slot) => (
          <SlotItem
            key={slot.id}
            slot={slot}
            isSelected={selectedSlot === slot.id}
            enableActions={enableActions}
            onToggleMaintenance={onToggleMaintenance}
            onRemoveProduct={onRemoveProduct}
            onSlotSelect={onSlotSelect ? () => onSlotSelect(slot.id) : undefined}
            getStatusBadge={(status) => getSlotStatusBadge(status, t)}
            formatTimeLeft={(endTime) => formatTimeLeft(endTime, t, language)}
            t={t}
          />
        ))}
      </div>
    );
  },
);

SlotGrid.displayName = "SlotGrid";
export default SlotGrid;
