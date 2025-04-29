import React from "react";
import { cn } from "../../../utils/cn";

export interface LoaderProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  color?: string;
  thickness?: number;
  className?: string;
  label?: string;
  variant?: "spinner" | "dots" | "pulse";
  fullScreen?: boolean;
  overlay?: boolean;
}

const sizeMap = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

export const Loader: React.FC<LoaderProps> = ({
  size = "md",
  color,
  thickness = 2,
  className,
  label = "Loading...",
  variant = "spinner",
  fullScreen = false,
  overlay = false,
}) => {
  // Calculate size
  let sizeValue: number;
  if (typeof size === "number") {
    sizeValue = size;
  } else {
    sizeValue = sizeMap[size] || sizeMap.md;
  }

  let loaderElement: React.ReactElement;

  switch (variant) {
    case "dots":
      loaderElement = (
        <div
          className={cn("flex space-x-2", className)}
          role="status"
          aria-label={label}
        >
          <div
            className={cn(
              "animate-pulse bg-current rounded-full",
              color ? `text-${color}` : "text-primary-500",
            )}
            style={{
              width: sizeValue / 3,
              height: sizeValue / 3,
            }}
          />
          <div
            className={cn(
              "animate-pulse bg-current rounded-full animation-delay-200",
              color ? `text-${color}` : "text-primary-500",
            )}
            style={{
              width: sizeValue / 3,
              height: sizeValue / 3,
            }}
          />
          <div
            className={cn(
              "animate-pulse bg-current rounded-full animation-delay-400",
              color ? `text-${color}` : "text-primary-500",
            )}
            style={{
              width: sizeValue / 3,
              height: sizeValue / 3,
            }}
          />
          <span className="sr-only">{label}</span>
        </div>
      );
      break;

    case "pulse":
      loaderElement = (
        <div
          className={cn(
            "animate-pulse rounded-full",
            color ? `bg-${color}` : "bg-primary-500",
            className,
          )}
          style={{
            width: sizeValue,
            height: sizeValue / 4,
          }}
          role="status"
          aria-label={label}
        >
          <span className="sr-only">{label}</span>
        </div>
      );
      break;

    case "spinner":
    default:
      loaderElement = (
        <svg
          className={cn(
            "animate-spin",
            color ? `text-${color}` : "text-primary-500",
            className,
          )}
          width={sizeValue}
          height={sizeValue}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="status"
          aria-label={label}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth={thickness}
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
          <span className="sr-only">{label}</span>
        </svg>
      );
  }

  // Handle fullScreen or overlay mode
  if (fullScreen || overlay) {
    return (
      <div
        className={cn(
          "fixed inset-0 flex items-center justify-center z-50",
          overlay && "bg-black bg-opacity-50",
        )}
      >
        {loaderElement}
      </div>
    );
  }

  return loaderElement;
};

export const LoaderSkeleton: React.FC<{
  width?: string | number;
  height?: string | number;
  rounded?: boolean | string;
  className?: string;
}> = ({ width = "100%", height = "20px", rounded = "md", className }) => {
  const roundedClass =
    typeof rounded === "string"
      ? `rounded-${rounded}`
      : rounded === true
        ? "rounded-md"
        : "";

  return (
    <div
      className={cn("animate-pulse bg-gray-200", roundedClass, className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loader;
