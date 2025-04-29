import React from "react";
import { cn } from "../../../utils/cn";
import SlotCardSkeleton from "./SlotCardSkeleton";

interface SlotGridSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * A grid of skeleton loaders for slot listings
 */
export const SlotGridSkeleton: React.FC<SlotGridSkeletonProps> = ({
  count = 10,
  className,
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, index) => (
        <SlotCardSkeleton key={`slot-skeleton-${index}`} />
      ))}
    </div>
  );
};

export default SlotGridSkeleton;
