import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../../store/LanguageContext";
import { toast } from "../../../utils/toast";
import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/Button";
import { PerformanceMonitor } from "../../../services/core/PerformanceMonitor";
import { useSlot, slotService } from "../../../services/slots";
import { Product, useProducts, SortCriteria } from "../../../services/products";
import { CalendarIcon, EditIcon, TrashIcon, RefreshIcon } from "../../ui/Icons";

interface SlotProductPanelProps {
  slotId: number;
}

const SlotProductPanel: React.FC<SlotProductPanelProps> = ({ slotId }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch slot information
  const {
    slot,
    loading: slotLoading,
    error: slotError,
    refresh: refreshSlot,
  } = useSlot(slotId);

  // Fetch available products
  const {
    products,
    loading: productsLoading,
    error: productsError,
    refetch: refreshProducts,
  } = useProducts({
    sortBy: SortCriteria.NEWEST,
    status: "approved",
    searchTerm,
  });

  // Text content
  const text = {
    title: {
      en: "Slot Product Management",
      fr: "Gestion des produits de l'emplacement",
    },
    slotInfo: { en: "Slot Information", fr: "Informations sur l'emplacement" },
    currentProduct: { en: "Current Product", fr: "Produit actuel" },
    noProduct: { en: "No product assigned", fr: "Aucun produit assigné" },
    assignProduct: { en: "Assign Product", fr: "Assigner un produit" },
    searchProducts: {
      en: "Search products...",
      fr: "Rechercher des produits...",
    },
    productList: { en: "Available Products", fr: "Produits disponibles" },
    noProductsFound: { en: "No products found", fr: "Aucun produit trouvé" },
    loading: { en: "Loading...", fr: "Chargement..." },
    error: {
      en: "Error loading data",
      fr: "Erreur lors du chargement des données",
    },
    productName: { en: "Product Name", fr: "Nom du produit" },
    price: { en: "Price", fr: "Prix" },
    category: { en: "Category", fr: "Catégorie" },
    select: { en: "Select", fr: "Sélectionner" },
    days: { en: "days", fr: "jours" },
    removeProduct: { en: "Remove Product", fr: "Retirer le produit" },
    editProduct: { en: "Edit Product", fr: "Modifier le produit" },
    assignFor: { en: "Assign for", fr: "Assigner pour" },
    refresh: { en: "Refresh", fr: "Actualiser" },
    statusOccupied: { en: "Occupied", fr: "Occupé" },
    statusAvailable: { en: "Available", fr: "Disponible" },
    statusReserved: { en: "Reserved", fr: "Réservé" },
    statusMaintenance: { en: "Maintenance", fr: "Maintenance" },
  };

  // Reset selected product when slot changes
  useEffect(() => {
    setSelectedProductId(null);
  }, [slotId]);

  // Handle product assignment
  const handleAssignProduct = async (days = 7) => {
    if (!selectedProductId) return;

    setLoading(true);

    try {
      const result = await slotService.assignProductToSlot(
        slotId,
        selectedProductId,
        days,
      );

      if (result.success) {
        toast.success(
          t({
            en: `Product assigned to slot ${slotId} for ${days} days`,
            fr: `Produit assigné à l'emplacement ${slotId} pour ${days} jours`,
          }),
        );
        refreshSlot();
        setSelectedProductId(null);
      } else {
        toast.error(
          t({
            en: `Failed to assign product: ${result.error}`,
            fr: `Échec de l'assignation du produit: ${result.error}`,
          }),
        );
      }
    } catch (error) {
      console.error("Error assigning product:", error);
      toast.error(
        t({
          en: "An unexpected error occurred",
          fr: "Une erreur inattendue s'est produite",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle product removal
  const handleRemoveProduct = async () => {
    setLoading(true);

    try {
      const result = await slotService.removeProductFromSlot(slotId);

      if (result.success) {
        toast.success(
          t({
            en: `Product removed from slot ${slotId}`,
            fr: `Produit retiré de l'emplacement ${slotId}`,
          }),
        );
        refreshSlot();
      } else {
        toast.error(
          t({
            en: `Failed to remove product: ${result.error}`,
            fr: `Échec du retrait du produit: ${result.error}`,
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
      setLoading(false);
    }
  };

  // Handle edit product
  const handleEditProduct = (productId: string) => {
    navigate(`/admin/products/${productId}/edit`);
  };

  // Handle search change with debounce
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [],
  );

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const locale = language === "fr" ? "fr-FR" : "en-US";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Display product name based on language
  const getProductName = (product: Product): string => {
    return language === "en" ? product.name_en : product.name_fr;
  };

  // Get the category name based on language
  const getCategoryName = (product: Product): string => {
    if (!product.category) return "";

    if (typeof product.category === "string") {
      return product.category;
    }

    return language === "en"
      ? product.category.name_en || product.category.name || ""
      : product.category.name_fr || product.category.name || "";
  };

  // Get status text based on slot status
  const getStatusText = (slotStatus?: string) => {
    if (!slotStatus) return t(text.statusAvailable);

    switch (slotStatus.toUpperCase()) {
      case "OCCUPIED":
        return t(text.statusOccupied);
      case "RESERVED":
        return t(text.statusReserved);
      case "MAINTENANCE":
        return t(text.statusMaintenance);
      default:
        return t(text.statusAvailable);
    }
  };

  // If loading, show spinner
  if (slotLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-64">
        <div className="animate-spin mr-3 h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
        <span>{t(text.loading)}</span>
      </div>
    );
  }

  // If error, show error message
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{t(text.title)}</h2>

      {/* Slot information */}
      <div className="mb-6 border-b pb-4">
        <h3 className="text-lg font-medium mb-2">{t(text.slotInfo)}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">ID:</div>
          <div>{slot?.id}</div>

          <div className="font-medium">
            {t({ en: "Status", fr: "Statut" })}:
          </div>
          <div>{getStatusText(slot?.status)}</div>

          {slot?.end_time && (
            <>
              <div className="font-medium">
                {t({ en: "Ends", fr: "Termine" })}:
              </div>
              <div>{formatDate(slot.end_time)}</div>
            </>
          )}
        </div>
      </div>

      {/* Current product section */}
      {slot?.product_id && slot.product ? (
        <div className="mb-6 border-b pb-4">
          <h3 className="text-lg font-medium mb-2">{t(text.currentProduct)}</h3>
          <div className="flex items-start gap-4 mb-4">
            {slot.product.image_urls && slot.product.image_urls.length > 0 ? (
              <img
                src={slot.product.image_urls[0]}
                alt={getProductName(slot.product)}
                className="w-16 h-16 object-cover rounded-md"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                <span className="text-gray-400 text-xs">No image</span>
              </div>
            )}

            <div className="flex-1">
              <h4 className="font-medium">{getProductName(slot.product)}</h4>
              <p className="text-sm text-gray-600">
                {slot.product.price.toLocaleString()} {slot.product.currency}
              </p>
              {slot.product.category && (
                <p className="text-xs text-gray-500">
                  {getCategoryName(slot.product)}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditProduct(slot.product_id!)}
              disabled={loading}
            >
              <EditIcon className="w-4 h-4 mr-1" />
              {t(text.editProduct)}
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={handleRemoveProduct}
              disabled={loading}
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

      {/* Assign product section */}
      <div>
        <h3 className="text-lg font-medium mb-2">{t(text.assignProduct)}</h3>

        {/* Search input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={t(text.searchProducts)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {/* Product list */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">{t(text.productList)}</h4>

          {productsLoading ? (
            <div className="py-4 text-center">
              <div className="animate-spin inline-block h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
              <span className="ml-2">{t(text.loading)}</span>
            </div>
          ) : productsError ? (
            <div className="text-red-500 py-4 text-center">
              {t(text.error)}: {productsError}
            </div>
          ) : products.length === 0 ? (
            <div className="text-gray-500 py-4 text-center">
              {t(text.noProductsFound)}
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-[1fr,auto] gap-2 bg-gray-50 p-2 text-xs font-medium text-gray-500">
                <div>{t(text.productName)}</div>
                <div>{t({ en: "Action", fr: "Action" })}</div>
              </div>

              <div className="divide-y">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`grid grid-cols-[1fr,auto] gap-2 p-2 items-center ${
                      selectedProductId === product.id ? "bg-indigo-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {product.image_urls && product.image_urls.length > 0 ? (
                        <img
                          src={product.image_urls[0]}
                          alt={getProductName(product)}
                          className="w-10 h-10 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-gray-400 text-xs">
                            No image
                          </span>
                        </div>
                      )}

                      <div>
                        <div className="font-medium text-sm">
                          {getProductName(product)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {product.price.toLocaleString()} {product.currency}
                          {product.category && ` • ${getCategoryName(product)}`}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant={
                        selectedProductId === product.id ? "primary" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setSelectedProductId(
                          selectedProductId === product.id ? null : product.id,
                        )
                      }
                    >
                      {t(text.select)}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Assignment options */}
        {selectedProductId && (
          <div className="mt-4">
            <div className="text-sm mb-2">{t(text.assignFor)}</div>
            <div className="flex gap-2">
              {[3, 7, 14, 30].map((days) => (
                <Button
                  key={days}
                  size="sm"
                  variant="outline"
                  onClick={() => handleAssignProduct(days)}
                  disabled={loading}
                >
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {days} {t(text.days)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotProductPanel;
