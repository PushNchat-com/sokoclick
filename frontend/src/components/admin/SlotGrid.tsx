import React, { memo, useCallback } from "react";
import { useLanguage } from "../../store/LanguageContext";
import { Slot } from "../../services/slots";
import Badge from "../ui/Badge";
import { Button } from "../ui/Button";
import {
  SettingsIcon,
  CalendarIcon,
  CheckIcon,
  XIcon,
  TrashIcon,
} from "../ui/Icons";
import Skeleton from "../ui/Skeleton";

interface SlotGridProps {
  slots?: Slot[];
  loading?: boolean;
  compact?: boolean;
  viewMode?: "grid" | "table";
  selectedSlot?: number | null;
  filterStatus?: Slot["slot_status"] | undefined;
  searchTerm?: string;
  onReserveSlot?: (slotId: number) => void;
  onCancelReservation?: (slotId: number) => void;
  onToggleMaintenance?: (slotId: number, currentStatus: boolean) => void;
  onRemoveProduct?: (slotId: number) => void;
  onSlotSelect?: (slotId: number) => void;
  onError?: (error: Error) => void;
}

// Memoized slot item component
const SlotItem = memo(
  ({
    slot,
    onToggleMaintenance,
    onRemoveProduct,
    onSlotSelect,
    selectedSlot,
    getStatusBadge,
    formatTimeLeft,
    t,
    language,
  }: {
    slot: Slot;
    onToggleMaintenance?: (
      slotId: number,
      targetMaintenanceState: boolean,
    ) => void;
    onRemoveProduct?: (slotId: number) => void;
    onSlotSelect?: (slotId: number) => void;
    selectedSlot?: number | null;
    getStatusBadge: (status: Slot["slot_status"]) => React.ReactNode;
    formatTimeLeft: (slot: Slot) => string;
    t: (text: { en: string; fr: string }) => string;
    language: "en" | "fr";
  }) => {
    const handleToggleMaintenance = useCallback(() => {
      const currentMaintenanceState = slot.slot_status === "maintenance";
      const targetMaintenanceState = !currentMaintenanceState;
      onToggleMaintenance?.(slot.id, targetMaintenanceState);
    }, [slot.id, slot.slot_status, onToggleMaintenance]);

    const handleRemoveProduct = useCallback(
      () => onRemoveProduct?.(slot.id),
      [slot.id, onRemoveProduct],
    );
    const handleSelectSlot = useCallback(
      () => onSlotSelect?.(slot.id),
      [slot.id, onSlotSelect],
    );

    const isSelected = selectedSlot === slot.id;
    const isMaintenance = slot.slot_status === "maintenance";
    const isLive = slot.slot_status === "live";
    const isEmpty = slot.slot_status === "empty";

    const liveProductName =
      language === "en" ? slot.live_product_name_en : slot.live_product_name_fr;

    return (
      <div
        className={`
        bg-white p-4 rounded-lg shadow border cursor-pointer flex flex-col h-full
        ${isMaintenance ? "border-red-200 bg-red-50/50" : "border-gray-200"} 
        ${isSelected ? "ring-2 ring-indigo-500" : ""}
      `}
        onClick={handleSelectSlot}
        aria-selected={isSelected}
        role="button"
        tabIndex={0}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900">
            {t({
              en: `Slot #${slot.id}`,
              fr: `Emplacement #${slot.id}`,
            })}
          </h3>
          {getStatusBadge(slot.slot_status)}
        </div>

        {isLive && liveProductName && (
          <p
            className="text-sm font-medium text-indigo-700 mb-1 truncate"
            title={liveProductName}
          >
            {liveProductName}
          </p>
        )}

        {isLive && slot.end_time && (
          <p className="text-xs text-gray-500 mb-2">{formatTimeLeft(slot)}</p>
        )}

        <div className="flex-grow"></div>

        <div className="mt-4 space-y-2">
          {isLive && onRemoveProduct && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-600 hover:bg-red-50 border-red-300 hover:border-red-400"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveProduct();
              }}
              aria-label={t({
                en: `Remove product from slot ${slot.id}`,
                fr: `Retirer le produit de l'emplacement ${slot.id}`,
              })}
            >
              <TrashIcon className="w-4 h-4 mr-1" />
              {t({
                en: "Remove Product",
                fr: "Retirer le produit",
              })}
            </Button>
          )}

          {onToggleMaintenance && (
            <Button
              variant={isMaintenance ? "secondary" : "outline"}
              size="sm"
              className={`w-full ${isMaintenance ? "text-green-700 hover:bg-green-100" : "text-gray-700 hover:bg-gray-50"}`}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleMaintenance();
              }}
              aria-label={t({
                en: isMaintenance
                  ? `Disable maintenance for slot ${slot.id}`
                  : `Enable maintenance for slot ${slot.id}`,
                fr: isMaintenance
                  ? `Désactiver la maintenance pour l'emplacement ${slot.id}`
                  : `Activer la maintenance pour l'emplacement ${slot.id}`,
              })}
            >
              {isMaintenance ? (
                <>
                  <CheckIcon className="w-4 h-4 mr-1 text-green-600" />
                  {t({
                    en: "Clear Maintenance",
                    fr: "Terminer la maintenance",
                  })}
                </>
              ) : (
                <>
                  <SettingsIcon className="w-4 h-4 mr-1" />
                  {t({
                    en: "Set Maintenance",
                    fr: "Mettre en maintenance",
                  })}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  },
);

SlotItem.displayName = "SlotItem";

const SlotGrid: React.FC<SlotGridProps> = memo(
  ({
    slots = [],
    loading = false,
    compact = false,
    viewMode = "grid",
    selectedSlot = null,
    onToggleMaintenance,
    onRemoveProduct,
    onSlotSelect,
    onError,
  }) => {
    const { t, language } = useLanguage();

    const getStatusBadge = useCallback(
      (status: Slot["slot_status"]) => {
        switch (status) {
          case "empty":
            return (
              <Badge variant="success">
                {t({
                  en: "Empty",
                  fr: "Vide",
                })}
              </Badge>
            );
          case "live":
            return (
              <Badge variant="primary">
                {t({
                  en: "Live",
                  fr: "En Ligne",
                })}
              </Badge>
            );
          case "maintenance":
            return (
              <Badge variant="error">
                {t({
                  en: "Maintenance",
                  fr: "Maintenance",
                })}
              </Badge>
            );
          default:
            console.warn(`Unknown slot status encountered: ${status}`);
            return (
              <Badge variant="secondary">
                {t({ en: "Unknown", fr: "Inconnu" })}
              </Badge>
            );
        }
      },
      [t],
    );

    const formatTimeLeft = useCallback(
      (slot: Slot): string => {
        if (!slot.end_time) return "";

        const now = new Date();
        const endTime = new Date(slot.end_time);
        const diffMs = endTime.getTime() - now.getTime();

        if (diffMs <= 0)
          return t({
            en: "Ended",
            fr: "Terminé",
          });

        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(
          (diffMs % (1000 * 60 * 60)) / (1000 * 60),
        );

        if (diffHours >= 24) {
          const diffDays = Math.floor(diffHours / 24);
          return t({
            en: `${diffDays}d left`,
            fr: `${diffDays}j restant`,
          });
        }
        if (diffHours > 0) {
          return t({
            en: `${diffHours}h ${diffMinutes}m left`,
            fr: `${diffHours}h ${diffMinutes}m restant`,
          });
        }
        return t({
          en: `${diffMinutes}m left`,
          fr: `${diffMinutes}m restant`,
        });
      },
      [t],
    );

    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 25 }).map((_, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg shadow border border-gray-200 h-48"
            >
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (slots.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            {t({
              en: "No slots available",
              fr: "Aucun emplacement disponible",
            })}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t({
              en: "Get started by creating new slots",
              fr: "Commencez par créer de nouveaux emplacements",
            })}
          </p>
        </div>
      );
    }

    if (viewMode === "table") {
      // Table view implementation
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t({ en: "Slot ID", fr: "ID Emplacement" })}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t({ en: "Status", fr: "Statut" })}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t({ en: "Product", fr: "Produit" })}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t({ en: "Actions", fr: "Actions" })}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {slots.map((slot) => {
                const isMaintenance = slot.slot_status === "maintenance";
                const isLive = slot.slot_status === "live";
                const liveProductName =
                  language === "en"
                    ? slot.live_product_name_en
                    : slot.live_product_name_fr;
                return (
                  <tr
                    key={slot.id}
                    className={`${selectedSlot === slot.id ? "bg-indigo-50" : "hover:bg-gray-50 cursor-pointer"}`}
                    onClick={() => onSlotSelect?.(slot.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {slot.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(slot.slot_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {isLive ? liveProductName : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {isLive ? formatTimeLeft(slot) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {isLive && onRemoveProduct && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 border-red-300 hover:border-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveProduct(slot.id);
                            }}
                            aria-label={t({
                              en: `Remove product from slot ${slot.id}`,
                              fr: `Retirer le produit de l'emplacement ${slot.id}`,
                            })}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        )}
                        {onToggleMaintenance && (
                          <Button
                            variant={isMaintenance ? "secondary" : "outline"}
                            size="sm"
                            className={
                              isMaintenance
                                ? "text-green-700 hover:bg-green-100"
                                : "text-gray-700 hover:bg-gray-50"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              const targetState = !isMaintenance;
                              onToggleMaintenance(slot.id, targetState);
                            }}
                            aria-label={t({
                              en: isMaintenance
                                ? `Disable maintenance for slot ${slot.id}`
                                : `Enable maintenance for slot ${slot.id}`,
                              fr: isMaintenance
                                ? `Désactiver la maintenance pour l'emplacement ${slot.id}`
                                : `Activer la maintenance pour l'emplacement ${slot.id}`,
                            })}
                          >
                            {isMaintenance ? (
                              <CheckIcon className="w-4 h-4 text-green-600" />
                            ) : (
                              <SettingsIcon className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // Default grid view
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 ${compact ? "lg:grid-cols-4" : ""}`}
      >
        {slots.map((slot) => (
          <SlotItem
            key={slot.id}
            slot={slot}
            onToggleMaintenance={onToggleMaintenance}
            onRemoveProduct={onRemoveProduct}
            onSlotSelect={onSlotSelect}
            selectedSlot={selectedSlot}
            getStatusBadge={getStatusBadge}
            formatTimeLeft={formatTimeLeft}
            t={t}
            language={language}
          />
        ))}
      </div>
    );
  },
);

SlotGrid.displayName = "SlotGrid";

export default SlotGrid;
