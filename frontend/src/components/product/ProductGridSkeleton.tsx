import React from "react";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { twMerge } from "tailwind-merge";

interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * A grid of skeleton loaders for product listings
 */
const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({
  count = 8,
  className,
}) => {
  return (
    <div
      className={twMerge(
        "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={`product-skeleton-${index}`} />
      ))}
    </div>
  );
};

export default ProductGridSkeleton;
