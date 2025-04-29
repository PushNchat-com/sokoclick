import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline:
          "text-foreground border border-input hover:bg-accent hover:text-accent-foreground",
        success:
          "bg-green-100 text-green-800 hover:bg-green-200 border border-green-200",
        warning:
          "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200",
        error: "bg-red-100 text-red-800 hover:bg-red-200 border border-red-200",
        payment:
          "bg-payment-100 text-payment-800 hover:bg-payment-200 border border-payment-200",
        primary: "bg-primary-500 text-white hover:bg-primary-600",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[0.6rem]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  color?: "green" | "red" | "blue" | "yellow" | "gray" | "purple";
  interactive?: boolean;
}

export function Badge({
  className,
  variant,
  size,
  icon,
  children,
  color,
  interactive = false,
  ...props
}: BadgeProps) {
  // Map colors to variants
  const colorToVariant = {
    green: "success",
    red: "error",
    blue: "primary",
    yellow: "warning",
    gray: "secondary",
    purple: "default",
  } as const;

  // If color is provided, override variant
  const finalVariant = color ? colorToVariant[color] : variant;

  if (interactive) {
    return (
      <button
        type="button"
        className={cn(
          badgeVariants({ variant: finalVariant, size }),
          className,
        )}
        role="status"
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {icon && (
          <span className="mr-1" aria-hidden="true">
            {icon}
          </span>
        )}
        {children}
      </button>
    );
  }

  return (
    <div
      className={cn(badgeVariants({ variant: finalVariant, size }), className)}
      role="status"
      {...props}
    >
      {icon && (
        <span className="mr-1" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </div>
  );
}

export default Badge;
