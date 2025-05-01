import React, { useState, useEffect } from "react";
import { useLanguage } from "../../../store/LanguageContext";
import { toast } from "../../../utils/toast";
import { Button } from "../../ui/Button";
import { AuctionSlot, slotService } from "../../../services/slots/SlotService";
import type { SlotStatus } from "../../../types/supabase-types";
import { TrashIcon, RefreshIcon } from "../../ui/Icons";

interface SlotProductPanelProps {
  slotId: number;
  slot: AuctionSlot | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const SlotProductPanel: React.FC<SlotProductPanelProps> = ({
  slotId,
  slot,
  isLoading,
  error: slotError,
  onRefresh: refreshSlot,
}) => {
  const { t, language } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);

  const text = {
    title: {
      en: "Live Product Details",
      fr: "Détails du Produit Actif",
    },
    slotInfo: { en: "Slot Information", fr: "Informations sur l'emplacement" },
    currentProduct: { en: "Live Product", fr: "Produit Actif" },
    noProduct: {
      en: "No product currently live in this slot",
      fr: "Aucun produit actif dans cet emplacement",
    },
    loading: { en: "Loading...", fr: "Chargement..." },
    error: {
      en: "Error loading slot data",
      fr: "Erreur lors du chargement des données de l'emplacement",
    },
    removeProduct: { en: "Remove Live Product", fr: "Retirer le Produit Actif" },
    refresh: { en: "Refresh", fr: "Actualiser" },
    statusLive: { en: "Live", fr: "Actif" },
    statusEmpty: { en: "Empty", fr: "Vide" },
    statusMaintenance: { en: "Maintenance", fr: "Maintenance" },
  };

  const handleRemoveProduct = async () => {
    if (!slot) return;
    setIsProcessing(true);

    try {
      const result = await slotService.clearLiveProduct(slotId);

      if (result.success) {
        toast.success(
          t({
            en: `Live product removed from slot ${slotId}`,
            fr: `Produit actif retiré de l'emplacement ${slotId}`,
          }),
        );
        refreshSlot();
      } else {
        toast.error(
          result.error?.message ||
            t({
              en: `Failed to remove product`,
              fr: `Échec du retrait du produit`,
            }),
        );
      }
    } catch (error) {
      console.error("Error removing product:", error);
      toast.error(
        t({
          en: "An unexpected error occurred",
          fr: "Une erreur inattendue s'est produite",
        }),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date string passed to formatDate:", dateString);
        return "Invalid Date";
      }
      const locale = language === "fr" ? "fr-FR" : "en-US";
      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Date Error";
    }
  };

  const getProductName = (): string => {
    if (!slot || slot.slot_status !== 'live') return "-";
    return language === "en"
      ? slot.live_product_name_en || ""
      : slot.live_product_name_fr || slot.live_product_name_en || "";
  };

  const getCategoryDisplay = (): string => {
    if (!slot || !slot.live_product_categories || slot.live_product_categories.length === 0) return "-";
    return slot.live_product_categories.join(', ');
  };

  const getStatusText = (slotStatus?: SlotStatus | null): string => {
    if (!slotStatus) return t(text.statusEmpty);

    switch (slotStatus) {
      case 'live':
        return t(text.statusLive);
      case 'maintenance':
        return t(text.statusMaintenance);
      case 'empty':
      default:
        return t(text.statusEmpty);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-64">
        <div className="animate-spin mr-3 h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
        <span>{t(text.loading)}</span>
      </div>
    );
  }

  if (slotError) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-500 mb-4">
          {t(text.error)}: {slotError}
        </div>
        <Button onClick={refreshSlot}>
          <RefreshIcon className="w-4 h-4 mr-2" />
          {t(text.refresh)}
        </Button>
      </div>
    );
  }

  if (!slot) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Slot data not available. Please refresh or select a slot.
      </div>
    );
  }

  const isLive = slot.slot_status === 'live';
  const imageUrl = isLive ? slot.live_product_image_urls?.[0] : null;
  const productName = getProductName();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{t(text.title)}</h2>

      <div className="mb-6 border-b pb-4">
        <h3 className="text-lg font-medium mb-2">{t(text.slotInfo)}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">ID:</div>
          <div>{slot.id}</div>

          <div className="font-medium">
            {t({ en: "Status", fr: "Statut" })}:
          </div>
          <div>{getStatusText(slot.slot_status)}</div>

          {slot.end_time && isLive && (
            <>
              <div className="font-medium">
                {t({ en: "Ends", fr: "Termine" })}:
              </div>
              <div>{formatDate(slot.end_time)}</div>
            </>
          )}
        </div>
      </div>

      {isLive ? (
        <div className="mb-6 border-b pb-4">
          <h3 className="text-lg font-medium mb-2">{t(text.currentProduct)}</h3>
          <div className="flex items-start gap-4 mb-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={productName}
                className="w-16 h-16 object-cover rounded-md"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                <span className="text-gray-400 text-xs">No image</span>
              </div>
            )}

            <div className="flex-1">
              <h4 className="font-medium">{productName}</h4>
              {slot.live_product_price && (
                 <p className="text-sm text-gray-600">
                    {slot.live_product_price.toLocaleString()} {slot.live_product_currency}
                 </p>
              )}
               <p className="text-xs text-gray-500">
                 {getCategoryDisplay()}
               </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={handleRemoveProduct}
              disabled={isProcessing}
            >
              <TrashIcon className="w-4 h-4 mr-1" />
              {t(text.removeProduct)}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 border-b pb-4">
          <h3 className="text-lg font-medium mb-2">{t(text.currentProduct)}</h3>
          <p className="text-gray-500 mb-2">{t(text.noProduct)}</p>
        </div>
      )}
    </div>
  );
};

export default SlotProductPanel;
