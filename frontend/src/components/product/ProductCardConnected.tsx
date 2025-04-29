import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import ErrorMessage from "../ui/ErrorMessage";
import { useProduct } from "../../services/products";

interface ProductCardConnectedProps {
  productId: string;
  slotNumber: number;
  isAdmin?: boolean;
  className?: string;
}

/**
 * Connected version of ProductCard that handles data fetching, loading states, and error handling
 */
const ProductCardConnected: React.FC<ProductCardConnectedProps> = ({
  productId,
  slotNumber,
  isAdmin = false,
  className,
}) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language.startsWith("fr") ? "fr" : "en";

  // Fetch product data from the service
  const { product, loading, error, refetch } = useProduct(productId);

  // Track component mounting state to avoid state updates on unmounted component
  const [isMounted, setIsMounted] = useState(true);

  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Show loading state
  if (loading) {
    return <ProductCardSkeleton className={className} />;
  }

  // Show error state with retry button
  if (error) {
    return (
      <ErrorMessage
        message={error}
        variant="block"
        title="Failed to load product"
        className={className}
        onRetry={() => {
          if (isMounted) {
            refetch();
          }
        }}
      />
    );
  }

  // Handle case where product is not found
  if (!product) {
    return (
      <div
        className={`bg-gray-50 border border-gray-200 rounded-lg p-4 text-center ${className}`}
      >
        <p className="text-gray-500">Product not available</p>
      </div>
    );
  }

  // Transform the product data to match the ProductCard props format
  const productData = {
    id: product.id,
    slotNumber: slotNumber,
    title: {
      en: product.name_en,
      fr: product.name_fr,
    },
    price: product.price,
    currency: product.currency,
    mainImage: product.image_urls[0],
    additionalImages: product.image_urls.slice(1),
    listingTime: {
      startTime: product.created_at,
      endTime: product.end_date,
    },
    seller: {
      name: product.seller?.name || "Unknown",
      whatsappNumber: product.seller?.whatsapp_number || "",
      location: product.seller?.location || "",
      isVerified: product.seller?.is_verified || false,
    },
    category: product.category?.name || "",
    deliveryOptions: product.delivery_info
      ? {
          availableAreas: product.delivery_info.available_areas || [],
          estimatedDays: product.delivery_info.estimated_days || 1,
          hasFee: product.delivery_info.has_fee || false,
          feeAmount: product.delivery_info.fee_amount,
        }
      : undefined,
  };

  return (
    <ProductCard
      product={productData}
      currentLanguage={currentLanguage}
      isAdmin={isAdmin}
      className={className}
    />
  );
};

export default ProductCardConnected;
