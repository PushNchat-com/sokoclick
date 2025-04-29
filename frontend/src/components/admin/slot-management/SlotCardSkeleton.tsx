import React from "react";
import { cn } from "../../../utils/cn";
import { Skeleton } from "../../ui/Skeleton";

interface SlotCardSkeletonProps {
  className?: string;
}

/**
 * Skeleton loader for SlotCard while data is being fetched
 */
export const SlotCardSkeleton: React.FC<SlotCardSkeletonProps> = ({
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-shadow",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
      role="region"
      aria-label="Loading slot information"
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="w-2/3">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>

        <div className="mt-3">
          <div className="flex items-center">
            <Skeleton className="w-12 h-12 rounded mr-3" />
            <div className="w-full">
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotCardSkeleton;
