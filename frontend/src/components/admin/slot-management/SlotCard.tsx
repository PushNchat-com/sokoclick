import React from "react";
import { cn } from "../../../utils/cn";
import { useLanguage } from "../../../store/LanguageContext";
import { formatDateTime } from "../../../utils/formatters";
import { Badge } from "../../ui/Badge";
import { ActionMenu, ActionItem } from "../../ui/ActionMenu";

export interface SlotData {
  id: string;
  number: number;
  status: "available" | "reserved" | "active" | "expired";
  productId?: string;
  productName?: string;
  productImage?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  seller?: {
    id: string;
    name: string;
    isVerified: boolean;
  };
}

export interface SlotCardProps {
  slot: SlotData;
  onReserve?: (slotId: string) => void;
  onEdit?: (slotId: string) => void;
  onView?: (slotId: string) => void;
  onDelete?: (slotId: string) => void;
  onExtend?: (slotId: string) => void;
  className?: string;
  compact?: boolean;
}

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  onReserve,
  onEdit,
  onView,
  onDelete,
  onExtend,
  className,
  compact = false,
}) => {
  const { t } = useLanguage();

  // Status badge colors
  const statusColors = {
    available: "green",
    reserved: "yellow",
    active: "blue",
    expired: "gray",
  } as const;

  // Status text map
  const statusText = {
    available: { en: "Available", fr: "Disponible" },
    reserved: { en: "Reserved", fr: "Réservé" },
    active: { en: "Active", fr: "Actif" },
    expired: { en: "Expired", fr: "Expiré" },
  };

  // Actions based on slot status
  const getSlotActions = (): ActionItem[] => {
    const actions: ActionItem[] = [];

    // View action (always available if there's a product)
    if (onView && slot.productId) {
      actions.push({
        label: { en: "View Product", fr: "Voir le produit" },
        onClick: () => onView(slot.id),
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        ),
      });
    }

    // Reserve action (only for available slots)
    if (onReserve && slot.status === "available") {
      actions.push({
        label: { en: "Reserve Slot", fr: "Réserver l'emplacement" },
        onClick: () => onReserve(slot.id),
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        ),
      });
    }

    // Edit action (for all slots)
    if (onEdit) {
      actions.push({
        label: { en: "Edit Slot", fr: "Modifier l'emplacement" },
        onClick: () => onEdit(slot.id),
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        ),
      });
    }

    // Extend action (for active slots)
    if (onExtend && slot.status === "active") {
      actions.push({
        label: { en: "Extend Time", fr: "Prolonger la durée" },
        onClick: () => onExtend(slot.id),
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      });
    }

    // Delete action (for all slots)
    if (onDelete) {
      actions.push({
        label: { en: "Delete", fr: "Supprimer" },
        onClick: () => onDelete(slot.id),
        variant: "destructive",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        ),
      });
    }

    return actions;
  };

  const actions = getSlotActions();

  // Format dates
  const formattedStartDate = slot.startTime
    ? formatDateTime(new Date(slot.startTime))
    : null;
  const formattedEndDate = slot.endTime
    ? formatDateTime(new Date(slot.endTime))
    : null;

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-shadow hover:shadow focus-within:ring-2 focus-within:ring-primary-500",
        className,
      )}
      role="region"
      aria-label={t({
        en: `Slot #${slot.number} details`,
        fr: `Détails de l'emplacement #${slot.number}`,
      })}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3
              className="text-lg font-medium text-gray-900"
              id={`slot-title-${slot.id}`}
            >
              {t({
                en: `Slot #${slot.number}`,
                fr: `Emplacement #${slot.number}`,
              })}
            </h3>
            <Badge
              color={statusColors[slot.status]}
              aria-label={t({
                en: `Status: ${statusText[slot.status].en}`,
                fr: `Statut: ${statusText[slot.status].fr}`,
              })}
            >
              {t(statusText[slot.status])}
            </Badge>
          </div>
          {actions.length > 0 && (
            <ActionMenu
              actions={actions}
              buttonLabel={{
                en: `Actions for slot #${slot.number}`,
                fr: `Actions pour l'emplacement #${slot.number}`,
              }}
              buttonSize="sm"
              width={180}
              labelledBy={`slot-title-${slot.id}`}
            />
          )}
        </div>

        {slot.productId && slot.productName && (
          <div className="mt-3" aria-labelledby={`product-name-${slot.id}`}>
            <div className="flex items-center">
              {slot.productImage ? (
                <img
                  src={slot.productImage}
                  alt={t({
                    en: `Product image for ${slot.productName}`,
                    fr: `Image du produit ${slot.productName}`,
                  })}
                  className="w-12 h-12 object-cover rounded mr-3"
                />
              ) : (
                <div
                  className="w-12 h-12 bg-gray-200 rounded mr-3"
                  aria-hidden="true"
                ></div>
              )}
              <div>
                <p
                  className="text-sm font-medium text-gray-900"
                  id={`product-name-${slot.id}`}
                >
                  {slot.productName}
                </p>
                {slot.seller && (
                  <p className="text-xs text-gray-500 flex items-center">
                    {slot.seller.name}
                    {slot.seller.isVerified && (
                      <>
                        <svg
                          className="w-3 h-3 ml-1 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="sr-only">
                          {t({ en: "Verified seller", fr: "Vendeur vérifié" })}
                        </span>
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {(formattedStartDate || formattedEndDate) && !compact && (
          <div className="mt-3 text-sm text-gray-500">
            {formattedStartDate && (
              <div className="flex items-center mb-1">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  <span className="sr-only">
                    {t({ en: "Start time: ", fr: "Heure de début: " })}
                  </span>
                  {t({
                    en: `Start: ${formattedStartDate}`,
                    fr: `Début: ${formattedStartDate}`,
                  })}
                </span>
              </div>
            )}
            {formattedEndDate && (
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  <span className="sr-only">
                    {t({ en: "End time: ", fr: "Heure de fin: " })}
                  </span>
                  {t({
                    en: `End: ${formattedEndDate}`,
                    fr: `Fin: ${formattedEndDate}`,
                  })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
