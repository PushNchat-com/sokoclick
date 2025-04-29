import React from "react";
import { useLanguage } from "../../../store/LanguageContext";
import { ActionMenu, ActionItem } from "../../ui/ActionMenu";
import { SlotStatus } from "../../../services/slots";

export interface SlotActionsProps {
  /**
   * The ID of the slot
   */
  slotId: number;

  /**
   * Current status of the slot
   */
  status: SlotStatus;

  /**
   * ID of the product (if present)
   */
  productId?: string | number;

  /**
   * Whether the slot is in maintenance mode
   */
  maintenance?: boolean;

  /**
   * Handler for reserving a slot
   */
  onReserve?: (slotId: number) => void;

  /**
   * Handler for canceling a reservation
   */
  onCancelReservation?: (slotId: number) => void;

  /**
   * Handler for toggling maintenance mode
   */
  onToggleMaintenance?: (slotId: number, currentStatus: boolean) => void;

  /**
   * Handler for removing a product
   */
  onRemoveProduct?: (slotId: number) => void;

  /**
   * Handler for viewing a product
   */
  onViewProduct?: (productId: string | number) => void;

  /**
   * Handler for editing a slot
   */
  onEditSlot?: (slotId: number) => void;

  /**
   * Handler for extending a slot's time
   */
  onExtendTime?: (slotId: number) => void;

  /**
   * Optional class name for styling
   */
  className?: string;

  /**
   * Size of the action menu button
   */
  size?: "sm" | "md";

  /**
   * Show the actions as a row of buttons instead of dropdown
   */
  asButtons?: boolean;
}

/**
 * Reusable component for slot-related actions
 * Can be displayed as either a dropdown menu or a row of buttons
 */
const SlotActions: React.FC<SlotActionsProps> = ({
  slotId,
  status,
  productId,
  maintenance = false,
  onReserve,
  onCancelReservation,
  onToggleMaintenance,
  onRemoveProduct,
  onViewProduct,
  onEditSlot,
  onExtendTime,
  className,
  size = "sm",
  asButtons = false,
}) => {
  const { t } = useLanguage();

  // Generate the list of actions based on slot status and props
  const getActions = (): ActionItem[] => {
    const actions: ActionItem[] = [];

    // View product (if there is a product)
    if (productId && onViewProduct) {
      actions.push({
        label: { en: "View Product", fr: "Voir le produit" },
        onClick: () => onViewProduct(productId),
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
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

    // Edit slot
    if (onEditSlot) {
      actions.push({
        label: { en: "Edit Slot", fr: "Modifier l'emplacement" },
        onClick: () => onEditSlot(slotId),
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
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

    // Reserve slot (only for available slots)
    if (status === SlotStatus.AVAILABLE && onReserve) {
      actions.push({
        label: { en: "Reserve Slot", fr: "Réserver l'emplacement" },
        onClick: () => onReserve(slotId),
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
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

    // Cancel reservation (for reserved slots)
    if (status === SlotStatus.RESERVED && onCancelReservation) {
      actions.push({
        label: { en: "Cancel Reservation", fr: "Annuler la réservation" },
        onClick: () => onCancelReservation(slotId),
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ),
      });
    }

    // Extend time (for occupied slots)
    if (status === SlotStatus.OCCUPIED && onExtendTime) {
      actions.push({
        label: { en: "Extend Time", fr: "Prolonger la durée" },
        onClick: () => onExtendTime(slotId),
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
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

    // Toggle maintenance
    if (onToggleMaintenance) {
      actions.push({
        label: maintenance
          ? { en: "Clear Maintenance", fr: "Terminer maintenance" }
          : { en: "Set Maintenance", fr: "Mettre en maintenance" },
        onClick: () => onToggleMaintenance(slotId, maintenance),
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        ),
      });
    }

    // Remove product (for occupied slots)
    if (status === SlotStatus.OCCUPIED && onRemoveProduct) {
      actions.push({
        label: { en: "Remove Product", fr: "Retirer le produit" },
        onClick: () => onRemoveProduct(slotId),
        variant: "destructive",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        ),
        hasDividerAfter: true,
      });
    }

    return actions;
  };

  // Generate actions
  const actions = getActions();

  // If no actions are available, return null
  if (actions.length === 0) {
    return null;
  }

  return (
    <ActionMenu
      actions={actions}
      buttonLabel={undefined}
      buttonSize={size}
      width={180}
      className={className}
    />
  );
};

export default SlotActions;
