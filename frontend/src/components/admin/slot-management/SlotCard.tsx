import React from "react";
import { cn } from "../../../utils/cn";
import { useLanguage, TranslationObject } from "../../../store/LanguageContext";
import { formatDateTime } from "../../../utils/formatters";
import { Badge } from "../../ui/Badge";
import { ActionMenu, ActionItem } from "../../ui/ActionMenu";
import type { Database } from "../../../types/supabase-types";
import { SlotStatus } from "../../../types/supabase-types";
import { getSlotStatusVariant, getSlotStatusText } from "@/utils/slotUtils";
import {
  ImageIcon,
  TrashIcon,
  SettingsIcon,
} from "@/components/ui/Icons";

type Slot = Database['public']['Tables']['auction_slots']['Row'];

export interface SlotCardProps {
  slot: Slot;
  handleRemoveProduct?: (slotId: number) => void;
  handleToggleMaintenance?: (slotId: number, targetState: boolean) => void;
  className?: string;
  compact?: boolean;
}

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  handleRemoveProduct,
  handleToggleMaintenance,
  className,
  compact = false,
}) => {
  const { t, language } = useLanguage();

  const getProductName = () => {
    return language === 'fr'
      ? slot.live_product_name_fr || slot.live_product_name_en || ""
      : slot.live_product_name_en || "";
  };
  
  const getImageUrl = () => {
    return slot.live_product_image_urls?.[0];
  };

  const getSlotActions = (): ActionItem[] => {
    const actions: ActionItem[] = [];
    const iconClass = "w-4 h-4 mr-2";

    if (slot.slot_status === SlotStatus.Live && handleRemoveProduct) {
      const removeAction: ActionItem = {
        label: { en: "Remove Product", fr: "Retirer Produit" },
        icon: <TrashIcon className={`${iconClass} text-red-600`} />,
        onClick: () => handleRemoveProduct(slot.id),
        variant: "destructive",
      };
      actions.push(removeAction);
    }

    if (slot.slot_status !== SlotStatus.Live && handleToggleMaintenance) {
      const isCurrentlyMaintenance = slot.slot_status === SlotStatus.Maintenance;
      const toggleMaintenanceAction: ActionItem = {
        label: isCurrentlyMaintenance
          ? { en: "Clear Maintenance", fr: "Terminer Maintenance" }
          : { en: "Set Maintenance", fr: "Mettre en Maintenance" },
        icon: <SettingsIcon className={iconClass} />,
        onClick: () => handleToggleMaintenance(slot.id, !isCurrentlyMaintenance),
      };
      actions.push(toggleMaintenanceAction);
    }

    return actions;
  };

  const actions = getSlotActions();

  const formattedEndDate = slot.slot_status === 'live' && slot.end_time
    ? formatDateTime(new Date(slot.end_time), "relative")
    : null;
    
  const productName = getProductName();
  const imageUrl = getImageUrl();
  const status = slot.slot_status;
  const statusVariant = getSlotStatusVariant(status);
  const statusText = getSlotStatusText(status);

  return (
    <div
      className={cn(
        "flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-shadow hover:shadow focus-within:ring-2 focus-within:ring-primary-500",
        className,
        compact ? "h-48" : "h-full"
      )}
      role="region"
      aria-label={t({
        en: `Slot #${slot.id} details`,
        fr: `Détails de l'emplacement #${slot.id}`,
      })}
    >
      {!compact && imageUrl && slot.slot_status === 'live' && (
        <div className="aspect-w-16 aspect-h-9">
          <img 
            src={imageUrl} 
            alt={productName || t({ en: "Product Image", fr: "Image Produit" })}
            className="object-cover w-full h-full"
            onError={(e) => { (e.currentTarget.style.display = 'none'); }}
          />
        </div>
      )}
      {!compact && !imageUrl && slot.slot_status === 'live' && (
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-gray-400" />
        </div>
      )}
      {!compact && slot.slot_status !== 'live' && (
        <div className="aspect-w-16 aspect-h-9 bg-gray-50 flex items-center justify-center">
          <span className="text-gray-400 text-sm italic">
            {status === 'empty' ? t({ en: "Empty Slot", fr: "Emplacement Vide" }) : t({ en: "Maintenance", fr: "Maintenance" })}
          </span>
        </div>
      )}

      <div className={`p-4 flex-grow flex flex-col ${compact ? 'justify-between' : ''}`}>
        <div className={`flex justify-between items-start ${compact ? '' : 'mb-2'}`}>
          <div>
            <h3
              className={`font-medium text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}
              id={`slot-title-${slot.id}`}
            >
              {t({
                en: `Slot #${slot.id}`,
                fr: `Emplacement #${slot.id}`,
              })}
            </h3>
            <Badge
              variant={statusVariant}
              aria-label={t({
                en: `Status: ${statusText.en}`,
                fr: `Statut: ${statusText.fr}`,
              })}
              className={compact ? "text-xs px-1.5 py-0.5" : ""}
            >
              {t(statusText)}
            </Badge>
          </div>
          {actions.length > 0 && (
            <ActionMenu
              actions={actions}
              buttonLabel={{
                en: `Actions for slot #${slot.id}`,
                fr: `Actions pour l'emplacement #${slot.id}`,
              }}
              buttonIcon={<SettingsIcon className="w-5 h-5" />}
              buttonVariant="ghost"
              align="right"
            />
          )}
        </div>

        {slot.slot_status === 'live' && (
          <div className={`mt-1 ${compact ? '' : 'flex-grow'}`}>
            <p className={`text-gray-700 ${compact ? 'text-sm truncate' : 'font-medium'}`}>
              {productName || t({ en: "Unnamed Product", fr: "Produit sans nom" })}
            </p>
          </div>
        )}
        
        <div className="mt-auto pt-2 text-xs text-gray-500">
          {formattedEndDate && (
            <p>{t({ en: "Ends:", fr: "Finit:" })} {formattedEndDate}</p>
          )}
        </div>
      </div>
    </div>
  );
};
