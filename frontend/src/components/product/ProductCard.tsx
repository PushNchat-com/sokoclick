import React from "react";
import { useLanguage } from "@/store/LanguageContext";
import { Slot } from "@/services/slots";
import { focusStyles } from "@/components/ui/design-system/accessibility";
import ProductCategoryIcon from "./ProductCategoryIcon";
import { ClockIcon, LocationIcon } from "@/components/ui/Icons";
import { formatDistanceToNowStrict } from "date-fns";
import { enUS, fr } from "date-fns/locale";

interface ProductCardProps {
  slot: Slot;
  isAdmin?: boolean;
  className?: string;
  currentLanguage?: "en" | "fr";
}

const ProductCard: React.FC<ProductCardProps> = ({
  slot,
  isAdmin = false,
  className = "",
  currentLanguage,
}) => {
  const { language: contextLanguage, t } = useLanguage();
  const language = currentLanguage || contextLanguage;

  const mainImage =
    slot.live_product_image_urls?.[0] || "/placeholder-product.jpg";
  const title =
    language === "en" ? slot.live_product_name_en : slot.live_product_name_fr;
  const description =
    language === "en"
      ? slot.live_product_description_en
      : slot.live_product_description_fr;
  const categoryName = slot.live_product_categories?.[0] || "";
  const categoryIdForIcon = categoryName;

  const formatTimeRemaining = () => {
    if (!slot.end_time) return "";

    const now = new Date();
    const endDate = new Date(slot.end_time);
    const diffMs = endDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return t({
        en: "Ended",
        fr: "Terminé",
      });
    }

    try {
      return formatDistanceToNowStrict(endDate, {
        addSuffix: true,
        locale: language === "fr" ? fr : enUS,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Edit slot:", slot.id);
  };

  const handleCardKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      console.log("Navigate to slot detail:", slot.id);
    }
  };

  const sellerName =
    slot.live_product_seller?.name ||
    t({ en: "Unknown Seller", fr: "Vendeur Inconnu" });

  return (
    <div
      className={`
        product-card relative flex flex-col h-full
        bg-white rounded-lg shadow-sm border border-gray-200
        overflow-hidden transition-shadow hover:shadow-md
        focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${className}
      `}
      tabIndex={0}
      role="article"
      aria-label={title || "Product Card"}
      onKeyDown={handleCardKeyPress}
      style={focusStyles.keyboard}
    >
      {categoryName && (
        <div className="absolute top-2 left-2 z-10">
          <ProductCategoryIcon
            categoryId={categoryIdForIcon}
            categoryName={categoryName}
            size="sm"
          />
        </div>
      )}

      <div className="relative aspect-w-4 aspect-h-3 flex-shrink-0">
        <img
          src={mainImage}
          alt={
            title ||
            t({
              en: "Product image",
              fr: "Image du produit",
            })
          }
          className="object-cover w-full h-full"
          loading="lazy"
        />
        {slot.featured && (
          <div className="absolute top-2 right-2">
            <span
              className="bg-secondary-500 text-white px-2 py-1 rounded-md text-sm font-medium"
              aria-label={t({
                en: "Featured product",
                fr: "Produit en vedette",
              })}
            >
              {t({
                en: "Featured",
                fr: "En vedette",
              })}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
            {title || t({ en: "[No Title]", fr: "[Sans Titre]" })}
          </h3>

          {isAdmin && (
            <button
              className="ml-auto flex-shrink-0 bg-primary-500 text-white p-1 rounded-full shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label={t({
                en: "Edit Product",
                fr: "Modifier le Produit",
              })}
              onClick={handleEditClick}
              style={focusStyles.keyboard}
            >
              <ClockIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-2">
          {t({ en: "By", fr: "Par" })} {sellerName}
        </p>

        <div className="flex-grow"></div>

        <div className="mt-auto pt-2">
          <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
            <div className="text-base font-bold text-primary-600">
              {slot.live_product_price?.toLocaleString() || "N/A"}{" "}
              {slot.live_product_currency || ""}
            </div>
          </div>

          {slot.end_time && (
            <div
              className="mt-1 text-xs font-medium flex items-center"
              style={{
                color:
                  new Date(slot.end_time).getTime() - new Date().getTime() <
                  24 * 60 * 60 * 1000
                    ? "#EF4444"
                    : "#6B7280",
              }}
              aria-label={t({
                en: `Time remaining: ${formatTimeRemaining()}`,
                fr: `Temps restant: ${formatTimeRemaining()}`,
              })}
            >
              <ClockIcon className="w-3 h-3 mr-1" />
              {formatTimeRemaining()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
