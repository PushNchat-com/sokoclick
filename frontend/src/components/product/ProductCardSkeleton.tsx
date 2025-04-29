import React from "react";
import { twMerge } from "tailwind-merge";
import { Skeleton } from "../ui/Skeleton";

interface ProductCardSkeletonProps {
  className?: string;
}

/**
 * Skeleton loading state for ProductCard component
 */
const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({
  className,
}) => {
  return (
    <div
      className={twMerge(
        "bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] w-full">
        <Skeleton className="w-full h-full rounded-none" />

        {/* Badge placeholder */}
        <div className="absolute top-2 left-2">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      {/* Content area */}
      <div className="p-3">
        {/* Title */}
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-3/4 mb-3" />

        {/* Price */}
        <div className="flex justify-between items-center mb-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>

        {/* Seller info */}
        <div className="flex items-center mb-3">
          <Skeleton className="h-6 w-6 mr-2 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Time remaining */}
        <div className="flex items-center mb-3">
          <Skeleton className="h-4 w-4 mr-2 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>

        {/* Button */}
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
};

/**
 * Grid of ProductCardSkeleton components
 */
export const ProductCardGridSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 8, className }) => {
  return (
    <div
      className={twMerge(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default ProductCardSkeleton;
