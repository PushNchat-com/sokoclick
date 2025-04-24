import React from 'react';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'rectangular' | 'circular' | 'text' | 'productCard';
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton component for loading states
 */
const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width, 
  height, 
  variant = 'rectangular',
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-200';
  
  // Determine animation classes
  const animationClasses = animation === 'pulse' 
    ? 'animate-pulse'
    : animation === 'wave'
      ? 'animate-shimmer'
      : '';
  
  // Determine shape classes based on variant
  const variantClasses = variant === 'circular' 
    ? 'rounded-full' 
    : variant === 'text'
      ? 'rounded h-4 w-3/4 mb-2'
      : variant === 'productCard'
        ? 'rounded-card overflow-hidden flex flex-col border border-gray-200'
        : 'rounded';
  
  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  if (variant === 'productCard') {
    return (
      <div className={twMerge(
        `product-card relative flex flex-col overflow-hidden rounded-card border border-ui-border bg-ui-card`,
        `${baseClasses} ${animationClasses} w-full md:w-card-md lg:w-card-lg shadow-card`,
        className
      )}>
        {/* Image placeholder */}
        <div className="h-48 bg-gray-300"></div>
        
        {/* Product info */}
        <div className="p-3 flex-1 flex flex-col">
          {/* Title */}
          <div className="h-5 bg-gray-300 rounded w-4/5 mb-1"></div>
          
          {/* Location */}
          <div className="flex items-center space-x-1 mb-1">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
          
          {/* Time remaining */}
          <div className="flex items-center space-x-1 mb-1">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="h-3 bg-gray-300 rounded w-1/3"></div>
          </div>
          
          {/* Price tag */}
          <div className="absolute top-2 right-2 w-16 h-6 bg-gray-300 rounded-md"></div>
          
          {/* Badges */}
          <div className="mt-auto pt-2 space-y-1.5">
            <div className="h-5 bg-gray-300 rounded-full w-40"></div>
            <div className="h-5 bg-gray-300 rounded-full w-36"></div>
          </div>
        </div>
        
        {/* WhatsApp button */}
        <div className="absolute bottom-0 right-0">
          <div className="h-[44px] w-[100px] bg-gray-300 rounded-tl-btn"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={twMerge(
        `${baseClasses} ${variantClasses} ${animationClasses}`,
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
};

/**
 * SkeletonText component for displaying loading text with multiple lines
 */
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}> = ({ lines = 3, className = '', animation = 'pulse' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          width={i === lines - 1 && lines > 1 ? '70%' : '100%'}
          animation={animation}
        />
      ))}
    </div>
  );
};

/**
 * SkeletonCard component for displaying a loading card with image and text
 */
export const SkeletonCard: React.FC<{
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
  hasImage?: boolean;
  hasFooter?: boolean;
}> = ({ 
  className = '', 
  animation = 'pulse',
  hasImage = true,
  hasFooter = true
}) => {
  return (
    <div className={`border rounded-lg overflow-hidden shadow-sm ${className}`}>
      {hasImage && (
        <Skeleton
          variant="rectangular"
          height="160px"
          animation={animation}
          className="w-full"
        />
      )}
      <div className="p-4">
        <Skeleton
          variant="text"
          height="24px"
          animation={animation}
          className="mb-3"
        />
        <SkeletonText lines={2} animation={animation} />
      </div>
      {hasFooter && (
        <div className="border-t p-4">
          <div className="flex justify-between">
            <Skeleton
              variant="text"
              width="40%"
              animation={animation}
            />
            <Skeleton
              variant="text"
              width="20%"
              animation={animation}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Skeleton;
