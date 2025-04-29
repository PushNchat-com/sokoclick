import React from "react";
import Skeleton from "./Skeleton";

export interface SkeletonLoaderProps {
  /**
   * Type of skeleton loader
   */
  type:
    | "card"
    | "list-item"
    | "table-row"
    | "form-field"
    | "stats"
    | "detail"
    | "grid";

  /**
   * Number of skeleton items to display
   */
  count?: number;

  /**
   * Layout of grid items (only for 'grid' type)
   */
  gridCols?: 1 | 2 | 3 | 4;

  /**
   * Aspect ratio for card skeletons
   */
  cardAspect?: "square" | "video" | "portrait" | "landscape";

  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Component that renders skeleton loaders for different UI elements
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type,
  count = 1,
  gridCols = 3,
  cardAspect = "landscape",
  className = "",
}) => {
  // Card skeleton
  const CardSkeleton = () => {
    const aspectRatioClass = {
      square: "aspect-w-1 aspect-h-1",
      video: "aspect-w-16 aspect-h-9",
      portrait: "aspect-w-2 aspect-h-3",
      landscape: "aspect-w-3 aspect-h-2",
    }[cardAspect];

    return (
      <div
        className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}
      >
        <div className={aspectRatioClass}>
          <Skeleton className="w-full h-full" />
        </div>
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    );
  };

  // List item skeleton
  const ListItemSkeleton = () => (
    <div
      className={`flex items-center space-x-4 p-3 rounded-md border border-gray-100 ${className}`}
    >
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  );

  // Table row skeleton
  const TableRowSkeleton = () => (
    <div className={`w-full ${className}`}>
      <div className="flex items-center border-b border-gray-200 py-3">
        <Skeleton className="h-4 w-8 mx-3" />
        <Skeleton className="h-4 w-1/4 mx-3" />
        <Skeleton className="h-4 w-1/5 mx-3" />
        <Skeleton className="h-4 w-1/5 mx-3" />
        <Skeleton className="h-4 w-1/5 mx-3" />
        <Skeleton className="h-4 w-24 mx-3" />
      </div>
    </div>
  );

  // Form field skeleton
  const FormFieldSkeleton = () => (
    <div className={`mb-4 ${className}`}>
      <Skeleton className="h-4 w-1/4 mb-2" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );

  // Stats skeleton
  const StatsSkeleton = () => (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <Skeleton className="h-4 w-1/3 mb-3" />
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );

  // Detail skeleton
  const DetailSkeleton = () => (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-48 w-full sm:w-1/3 rounded-md" />
        <div className="space-y-4 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <div className="flex space-x-3 pt-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-1/4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>
    </div>
  );

  // Grid skeleton
  const GridSkeleton = () => (
    <div
      className={`grid grid-cols-1 sm:grid-cols-${gridCols} gap-4 ${className}`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );

  // Generate multiple skeleton items
  const renderSkeletons = () => {
    const SkeletonComponent = {
      card: CardSkeleton,
      "list-item": ListItemSkeleton,
      "table-row": TableRowSkeleton,
      "form-field": FormFieldSkeleton,
      stats: StatsSkeleton,
      detail: DetailSkeleton,
      grid: GridSkeleton,
    }[type];

    if (type === "grid") {
      return <GridSkeleton />;
    }

    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonComponent key={index} />
        ))}
      </div>
    );
  };

  return renderSkeletons();
};

export default SkeletonLoader;
