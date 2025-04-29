import React from "react";
import { cn } from "../../utils/cn";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";
export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      icon: Icon,
      children,
      ...props
    },
    ref,
  ) => {
    const baseClasses = "inline-flex items-center font-medium";

    const variantClasses = {
      default: "bg-gray-100 text-gray-800",
      primary: "bg-blue-100 text-blue-800",
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      danger: "bg-red-100 text-red-800",
      info: "bg-purple-100 text-purple-800",
    };

    const sizeClasses = {
      sm: "text-xs px-2 py-0.5",
      md: "text-sm px-2.5 py-0.5",
    };

    const roundedClasses = props.rounded ? "rounded-full" : "rounded";

    const badgeClasses = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      roundedClasses,
      className,
    );

    return (
      <span className={badgeClasses} ref={ref}>
        {children}
      </span>
    );
  },
);

export default Badge;
