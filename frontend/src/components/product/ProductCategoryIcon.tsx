import React, { useMemo } from "react";
import { colors } from "../ui/design-system/tokens";

export interface ProductCategoryIconProps {
  /**
   * Category ID
   */
  categoryId: string | number;

  /**
   * Category name for accessibility
   */
  categoryName?: string;

  /**
   * Size of the icon
   */
  size?: "sm" | "md" | "lg";

  /**
   * Whether to show the category name as a label
   */
  showLabel?: boolean;

  /**
   * Custom class name
   */
  className?: string;
}

// Predefined color mapping for categories
// Each category gets a consistent color based on its ID
const CATEGORY_COLORS = [
  colors.primary[500], // Primary color
  colors.secondary[500], // Secondary color
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6366F1", // Indigo
];

/**
 * Component for displaying category icons with consistent colors based on category ID
 */
const ProductCategoryIcon: React.FC<ProductCategoryIconProps> = ({
  categoryId,
  categoryName = "Category",
  size = "md",
  showLabel = false,
  className = "",
}) => {
  // Determine color based on category ID
  const categoryColor = useMemo(() => {
    // Convert ID to number for consistency
    const idNum =
      typeof categoryId === "string"
        ? parseInt(categoryId, 10) || 0
        : categoryId;

    // Use modulo to ensure we stay within the color array bounds
    return CATEGORY_COLORS[idNum % CATEGORY_COLORS.length];
  }, [categoryId]);

  // Determine icon size based on prop
  const sizeClasses = {
    sm: "w-3 h-3 text-xs",
    md: "w-4 h-4 text-sm",
    lg: "w-5 h-5 text-base",
  };

  // Generate initials from category name
  const initials = useMemo(() => {
    return categoryName
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [categoryName]);

  return (
    <div
      className={`inline-flex items-center ${className}`}
      title={categoryName}
    >
      <div
        className={`flex items-center justify-center rounded-full ${sizeClasses[size]}`}
        style={{
          backgroundColor: categoryColor,
          color: "white",
          width: size === "sm" ? "1.25rem" : size === "md" ? "1.5rem" : "2rem",
          height: size === "sm" ? "1.25rem" : size === "md" ? "1.5rem" : "2rem",
        }}
        aria-hidden="true"
      >
        {/* Show first letter of category */}
        {initials.charAt(0)}
      </div>

      {showLabel && (
        <span
          className={`ml-1 font-medium ${
            size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
          }`}
        >
          {categoryName}
        </span>
      )}

      {/* Visually hidden text for screen readers */}
      <span className="sr-only">Category: {categoryName}</span>
    </div>
  );
};

export default ProductCategoryIcon;
