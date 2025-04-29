import React from "react";
import { cn } from "../../../utils/cn";

// Icon sizes with their corresponding classes
const iconSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
  "2xl": "w-10 h-10",
};

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: keyof typeof iconSizes | string;
  className?: string;
  color?: string;
  label?: string;
  labelPosition?: "before" | "after";
  wrapperClassName?: string;
}

// A mapping of icon names to their SVG paths
const iconPaths: Record<string, { path: string; viewBox?: string }> = {
  check: {
    path: "M5 13l4 4L19 7",
    viewBox: "0 0 24 24",
  },
  "chevron-down": {
    path: "M19 9l-7 7-7-7",
    viewBox: "0 0 24 24",
  },
  "chevron-up": {
    path: "M5 15l7-7 7 7",
    viewBox: "0 0 24 24",
  },
  "chevron-left": {
    path: "M15 19l-7-7 7-7",
    viewBox: "0 0 24 24",
  },
  "chevron-right": {
    path: "M9 5l7 7-7 7",
    viewBox: "0 0 24 24",
  },
  x: {
    path: "M6 18L18 6M6 6l12 12",
    viewBox: "0 0 24 24",
  },
  trash: {
    path: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    viewBox: "0 0 24 24",
  },
  edit: {
    path: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    viewBox: "0 0 24 24",
  },
  eye: {
    path: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    viewBox: "0 0 24 24",
  },
  spinner: {
    path: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z",
    viewBox: "0 0 24 24",
  },
  "dots-vertical": {
    path: "M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z",
    viewBox: "0 0 24 24",
  },
  calendar: {
    path: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    viewBox: "0 0 24 24",
  },
  clock: {
    path: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    viewBox: "0 0 24 24",
  },
  info: {
    path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    viewBox: "0 0 24 24",
  },
  warning: {
    path: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    viewBox: "0 0 24 24",
  },
  error: {
    path: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    viewBox: "0 0 24 24",
  },
  plus: {
    path: "M12 4v16m8-8H4",
    viewBox: "0 0 24 24",
  },
  minus: {
    path: "M20 12H4",
    viewBox: "0 0 24 24",
  },
  search: {
    path: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    viewBox: "0 0 24 24",
  },
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = "md",
  className,
  color,
  label,
  labelPosition = "after",
  wrapperClassName,
  ...props
}) => {
  // Determine if we're using a predefined size or a custom one
  const sizeClass =
    size in iconSizes
      ? iconSizes[size as keyof typeof iconSizes]
      : typeof size === "string"
        ? `w-${size} h-${size}`
        : "";

  // Style to apply if color is provided
  const colorStyle = color ? { color } : {};

  // Import the appropriate icon based on the name
  // This assumes you're using an icon library that can be dynamically imported
  // You may need to adjust this based on your actual icon implementation

  // For this example, we'll use a placeholder implementation
  // that returns an SVG element with the icon name as text
  const renderIcon = () => {
    return (
      <svg
        className={cn(sizeClass, className)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        style={colorStyle}
        aria-hidden={!label}
        role={label ? "img" : undefined}
        aria-label={label}
        {...props}
      >
        {/* 
          This is a placeholder pattern. In a real implementation, 
          you would replace this with actual icon paths or a library import.
          
          For example, with Heroicons:
          const IconComponent = heroicons[name];
          return <IconComponent className={cn(sizeClass, className)} aria-hidden={!label} {...props} />;
        */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="8"
          fill="currentColor"
        >
          {name}
        </text>
      </svg>
    );
  };

  // If there's a label, wrap the icon with a span that includes the label
  if (label) {
    return (
      <span className={cn("inline-flex items-center gap-1", wrapperClassName)}>
        {labelPosition === "before" && <span>{label}</span>}
        {renderIcon()}
        {labelPosition === "after" && <span>{label}</span>}
      </span>
    );
  }

  // Otherwise, just return the icon
  return renderIcon();
};

export default Icon;
