import React from "react";
import { Slot, SlotStatus } from "../../../services/slots";
import { useLanguage } from "../../../store/LanguageContext";
import { Button } from "../../ui/Button";
import { RefreshIcon, PlusIcon, PhotographIcon, CogIcon } from "../../ui/Icons";

interface SlotControlsProps {
  selectedSlot: Slot | null;
  onRefresh: () => void;
  onViewProducts: () => void;
  onViewImages: () => void;
  onToggleMaintenance: (slotId: string) => void;
  onReserveSlot: (slotId: string) => void;
  onCancelReservation: (slotId: string) => void;
}

const SlotControls: React.FC<SlotControlsProps> = ({
  selectedSlot,
  onRefresh,
  onViewProducts,
  onViewImages,
  onToggleMaintenance,
  onReserveSlot,
  onCancelReservation,
}) => {
  const { t } = useLanguage();

  // Text content
  const text = {
    refresh: { en: "Refresh", fr: "Actualiser" },
    product: { en: "Product", fr: "Produit" },
    images: { en: "Images", fr: "Images" },
    maintenance: { en: "Toggle Maintenance", fr: "Mode Maintenance" },
    reserve: { en: "Reserve Slot", fr: "Réserver" },
    cancel: { en: "Cancel Reservation", fr: "Annuler" },
    noSlot: {
      en: "Select a slot to see actions",
      fr: "Sélectionnez un emplacement pour voir les actions",
    },
  };

  // No slot selected message
  if (!selectedSlot) {
    return (
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500 italic">{t(text.noSlot)}</p>
        <Button
          variant="secondary"
          onClick={onRefresh}
          icon={<RefreshIcon className="h-4 w-4" />}
        >
          {t(text.refresh)}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
      <Button
        variant="secondary"
        onClick={onRefresh}
        icon={<RefreshIcon className="h-4 w-4" />}
      >
        {t(text.refresh)}
      </Button>

      <Button
        variant="primary"
        onClick={onViewProducts}
        icon={<PlusIcon className="h-4 w-4" />}
      >
        {t(text.product)}
      </Button>

      <Button
        variant="secondary"
        onClick={onViewImages}
        icon={<PhotographIcon className="h-4 w-4" />}
      >
        {t(text.images)}
      </Button>

      <Button
        variant={
          selectedSlot.status === SlotStatus.MAINTENANCE ? "danger" : "warning"
        }
        onClick={() => onToggleMaintenance(selectedSlot.id)}
        icon={<CogIcon className="h-4 w-4" />}
      >
        {t(text.maintenance)}
      </Button>

      {selectedSlot.status === SlotStatus.AVAILABLE && (
        <Button
          variant="success"
          onClick={() => onReserveSlot(selectedSlot.id)}
        >
          {t(text.reserve)}
        </Button>
      )}

      {selectedSlot.status === SlotStatus.RESERVED && (
        <Button
          variant="danger"
          onClick={() => onCancelReservation(selectedSlot.id)}
        >
          {t(text.cancel)}
        </Button>
      )}
    </div>
  );
};

export default SlotControls;
