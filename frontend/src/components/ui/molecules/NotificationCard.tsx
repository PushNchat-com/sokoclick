import React from "react";
import { cn } from "../../../utils/cn";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";

export interface NotificationCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  variant?: "info" | "success" | "warning" | "error" | "neutral";
  icon?: boolean | React.ReactNode;
  onClose?: () => void;
  actions?: React.ReactNode;
  dismissible?: boolean;
  compact?: boolean;
  toast?: boolean;
  autoClose?: boolean | number;
  isVisible?: boolean;
  animateExit?: boolean;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  title,
  description,
  variant = "info",
  icon = true,
  onClose,
  actions,
  dismissible = true,
  compact = false,
  toast = false,
  autoClose = false,
  isVisible = true,
  animateExit = true,
  className,
  children,
  ...props
}) => {
  const [visible, setVisible] = React.useState(isVisible);
  const [exiting, setExiting] = React.useState(false);

  // Handle auto close
  React.useEffect(() => {
    if (autoClose && visible) {
      const timeout = setTimeout(
        () => {
          if (animateExit) {
            setExiting(true);
            setTimeout(() => {
              setVisible(false);
              if (onClose) onClose();
            }, 300); // Animation duration
          } else {
            setVisible(false);
            if (onClose) onClose();
          }
        },
        typeof autoClose === "number" ? autoClose : 5000,
      );

      return () => clearTimeout(timeout);
    }
  }, [autoClose, visible, animateExit, onClose]);

  // Handle dismiss
  const handleDismiss = () => {
    if (animateExit) {
      setExiting(true);
      setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, 300); // Animation duration
    } else {
      setVisible(false);
      if (onClose) onClose();
    }
  };

  // Return null if not visible
  if (!visible) return null;

  // Variant styles
  const variantStyles = {
    info: {
      bgColor: "bg-blue-50",
      borderColor: "border-blue-300",
      textColor: "text-blue-700",
      iconColor: "text-blue-400",
      iconName: "info",
      role: "status",
    },
    success: {
      bgColor: "bg-green-50",
      borderColor: "border-green-300",
      textColor: "text-green-700",
      iconColor: "text-green-400",
      iconName: "check",
      role: "status",
    },
    warning: {
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-300",
      textColor: "text-yellow-700",
      iconColor: "text-yellow-400",
      iconName: "warning",
      role: "alert",
    },
    error: {
      bgColor: "bg-red-50",
      borderColor: "border-red-300",
      textColor: "text-red-700",
      iconColor: "text-red-400",
      iconName: "error",
      role: "alert",
    },
    neutral: {
      bgColor: "bg-gray-50",
      borderColor: "border-gray-300",
      textColor: "text-gray-700",
      iconColor: "text-gray-400",
      iconName: "info",
      role: "status",
    },
  };

  const variantStyle = variantStyles[variant];

  return (
    <div
      className={cn(
        "p-4 rounded-md border",
        variantStyle.bgColor,
        variantStyle.borderColor,
        "transition-all duration-300 ease-in-out",
        exiting && "opacity-0 transform translate-y-2 scale-95",
        toast && "shadow-lg max-w-md w-full",
        className,
      )}
      role={variantStyle.role}
      aria-live={
        variant === "error" || variant === "warning" ? "assertive" : "polite"
      }
      {...props}
    >
      <div className="flex">
        {icon && typeof icon === "boolean" && (
          <div className={cn("flex-shrink-0 mr-3", variantStyle.iconColor)}>
            <Icon name={variantStyle.iconName} size="md" aria-hidden="true" />
          </div>
        )}

        {icon && typeof icon !== "boolean" && (
          <div className="flex-shrink-0 mr-3">{icon}</div>
        )}

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              {title && (
                <h3
                  className={cn(
                    "text-sm font-medium",
                    variantStyle.textColor,
                    compact ? "mb-0" : "mb-1",
                  )}
                >
                  {title}
                </h3>
              )}

              {description && (
                <div
                  className={cn(
                    "text-sm",
                    variantStyle.textColor,
                    "opacity-90",
                  )}
                >
                  {description}
                </div>
              )}

              {children}
            </div>

            {dismissible && (
              <div className="ml-3 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  aria-label="Dismiss"
                >
                  <Icon name="x" size="sm" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>

          {actions && (
            <div
              className={cn("flex space-x-2 mt-3", compact ? "mt-1" : "mt-3")}
            >
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
