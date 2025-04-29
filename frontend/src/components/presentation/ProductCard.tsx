import React from "react";
import { Link } from "react-router-dom";
import { Product, ProductStatus } from "../../services/products/ProductService";
import { useLanguage } from "../../store/LanguageContext";

interface ProductCardProps {
  product: Product;
  className?: string;
  isAdmin?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: ProductStatus) => void;
  onSlotChange?: (id: string) => void;
}

/**
 * A presentational component for displaying product information
 * Follows the component composition pattern where this component
 * only handles presentation and delegates data fetching to parent components
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className = "",
  isAdmin = false,
  onEdit,
  onDelete,
  onStatusChange,
  onSlotChange,
}) => {
  const { t, language } = useLanguage();

  // Text content
  const text = {
    edit: { en: "Edit", fr: "Modifier" },
    delete: { en: "Delete", fr: "Supprimer" },
    viewDetails: { en: "View Details", fr: "Voir les détails" },
    pending: { en: "Pending", fr: "En attente" },
    approved: { en: "Approved", fr: "Approuvé" },
    rejected: { en: "Rejected", fr: "Rejeté" },
    inactive: { en: "Inactive", fr: "Inactif" },
    changeStatus: { en: "Change Status", fr: "Changer le statut" },
    assignSlot: { en: "Assign Slot", fr: "Assigner un emplacement" },
    changeSlot: { en: "Change Slot", fr: "Changer d'emplacement" },
    noSlot: { en: "No Slot", fr: "Pas d'emplacement" },
    contactSeller: { en: "Contact Seller", fr: "Contacter le vendeur" },
    slotNumber: { en: "Slot", fr: "Emplacement" },
    verified: { en: "Verified", fr: "Vérifié" },
  };

  // Handlers
  const handleEdit = () => {
    if (onEdit) {
      onEdit(product.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(product.id);
    }
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (onStatusChange) {
      onStatusChange(product.id, event.target.value as ProductStatus);
    }
  };

  const handleSlotChange = () => {
    if (onSlotChange) {
      onSlotChange(product.id);
    }
  };

  // Calculate display values
  const productName = language === "en" ? product.name_en : product.name_fr;
  const productDescription =
    language === "en" ? product.description_en : product.description_fr;
  const categoryName = product.category
    ? language === "en"
      ? product.category.name_en
      : product.category.name_fr
    : "";
  const formattedPrice = new Intl.NumberFormat(
    language === "en" ? "en-US" : "fr-FR",
    {
      style: "currency",
      currency: product.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
  ).format(product.price);

  // Status color
  const getStatusColor = () => {
    switch (product.status) {
      case ProductStatus.APPROVED:
        return "bg-green-100 text-green-800";
      case ProductStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case ProductStatus.REJECTED:
        return "bg-red-100 text-red-800";
      case ProductStatus.INACTIVE:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Status label
  const getStatusLabel = () => {
    switch (product.status) {
      case ProductStatus.APPROVED:
        return t(text.approved);
      case ProductStatus.PENDING:
        return t(text.pending);
      case ProductStatus.REJECTED:
        return t(text.rejected);
      case ProductStatus.INACTIVE:
        return t(text.inactive);
      default:
        return product.status;
    }
  };

  return (
    <div
      className={`product-card border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      {/* Product image */}
      <div className="aspect-square bg-gray-100 relative">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Status badge */}
        {isAdmin && (
          <div
            className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}
          >
            {getStatusLabel()}
          </div>
        )}

        {/* Slot number badge */}
        {product.auction_slot_id && (
          <div className="absolute top-2 left-2 bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
            {t(text.slotNumber)} {product.auction_slot_id}
          </div>
        )}

        {/* Seller verified badge */}
        {product.seller?.is_verified && (
          <div className="absolute bottom-2 left-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {t(text.verified)}
          </div>
        )}
      </div>

      {/* Product content */}
      <div className="p-4">
        <div className="flex justify-between">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {productName}
          </h3>
          <p className="text-lg font-bold text-indigo-600">{formattedPrice}</p>
        </div>

        {categoryName && (
          <p className="text-sm text-gray-500 mt-1">{categoryName}</p>
        )}

        {productDescription && (
          <p className="text-sm text-gray-700 mt-2 line-clamp-2">
            {productDescription}
          </p>
        )}

        {/* Seller info */}
        {product.seller && (
          <div className="mt-3 text-sm text-gray-600">
            {product.seller.name}
          </div>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <div className="mt-4 border-t pt-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleEdit}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                {t(text.edit)}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                {t(text.delete)}
              </button>

              <button
                type="button"
                onClick={handleSlotChange}
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
              >
                {product.auction_slot_id
                  ? t(text.changeSlot)
                  : t(text.assignSlot)}
              </button>

              <select
                value={product.status}
                onChange={handleStatusChange}
                className="px-3 py-1 bg-white border border-gray-300 text-sm rounded"
              >
                <option value={ProductStatus.PENDING}>{t(text.pending)}</option>
                <option value={ProductStatus.APPROVED}>
                  {t(text.approved)}
                </option>
                <option value={ProductStatus.REJECTED}>
                  {t(text.rejected)}
                </option>
                <option value={ProductStatus.INACTIVE}>
                  {t(text.inactive)}
                </option>
              </select>
            </div>
          </div>
        )}

        {/* Public view actions */}
        {!isAdmin && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to={`/product/${product.id}`}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 inline-flex items-center"
            >
              {t(text.viewDetails)}
            </Link>

            {product.seller?.whatsapp_number && (
              <a
                href={`https://wa.me/${product.seller.whatsapp_number}?text=${encodeURIComponent(`Hello, I am interested in ${productName}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 inline-flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path
                    d="M12 1.5C6.477 1.5 2 5.977 2 11.5c0 1.8.472 3.485 1.302 4.949L2 21.5l5.184-1.36A9.96 9.96 0 0012 21.5c5.523 0 10-4.477 10-10S17.523 1.5 12 1.5zm0 18a8 8 0 01-4.099-1.125l-.293-.174-3.048.796.813-2.964-.183-.311A7.967 7.967 0 014 11.5a8 8 0 118 8z"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  />
                </svg>
                {t(text.contactSeller)}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
