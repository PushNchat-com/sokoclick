import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../../utils/cn";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";

export interface ActionItem {
  label: string | React.ReactNode;
  onClick: () => void;
  icon?: string;
  disabled?: boolean;
  destructive?: boolean;
  selected?: boolean;
  tooltip?: string;
  divider?: boolean;
  type?: "button" | "link";
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
}

export interface ActionGroup {
  label?: string;
  items: ActionItem[];
}

export interface ActionMenuProps {
  actions: ActionItem[] | ActionGroup[];
  label?: string;
  icon?: string;
  iconOnly?: boolean;
  triggerClassName?: string;
  menuClassName?: string;
  buttonVariant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "link"
    | "destructive";
  buttonSize?: "sm" | "md" | "lg" | "icon";
  position?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  minWidth?: number | string;
  maxWidth?: number | string;
  disableTrigger?: boolean;
  customTrigger?: React.ReactNode;
  menuAriaLabel?: string;
  closeOnClick?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  actions,
  label = "Actions",
  icon = "dots-vertical",
  iconOnly = false,
  triggerClassName,
  menuClassName,
  buttonVariant = "ghost",
  buttonSize = "icon",
  position = "bottom-right",
  minWidth = 200,
  maxWidth,
  disableTrigger = false,
  customTrigger,
  menuAriaLabel,
  closeOnClick = true,
  defaultOpen = false,
  onOpenChange,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Determine if actions array contains groups
  const hasGroups = actions.length > 0 && "items" in actions[0];
  const actionGroups = hasGroups
    ? (actions as ActionGroup[])
    : [{ items: actions as ActionItem[] }];

  // Toggle menu open/closed
  const toggleMenu = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  // Close menu
  const closeMenu = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  // Handle item click
  const handleItemClick = (item: ActionItem) => {
    if (item.disabled) return;

    item.onClick();

    if (closeOnClick) {
      closeMenu();
    }
  };

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Position classes based on position prop
  const positionClasses = {
    "bottom-left": "top-full left-0 mt-1",
    "bottom-right": "top-full right-0 mt-1",
    "top-left": "bottom-full left-0 mb-1",
    "top-right": "bottom-full right-0 mb-1",
  };

  // Style object for the menu
  const menuStyle = {
    minWidth: minWidth,
    maxWidth: maxWidth,
  };

  // Default trigger button
  const triggerButton = (
    <Button
      ref={triggerRef}
      variant={buttonVariant}
      size={buttonSize}
      className={cn("relative", isOpen && "bg-gray-100", triggerClassName)}
      onClick={toggleMenu}
      disabled={disableTrigger}
      aria-expanded={isOpen}
      aria-haspopup="true"
      aria-controls={isOpen ? "action-menu" : undefined}
    >
      {!iconOnly && <span>{label}</span>}
      <Icon name={icon} size="sm" />
    </Button>
  );

  return (
    <div className="relative inline-block text-left">
      {customTrigger ? (
        <div
          onClick={toggleMenu}
          ref={triggerRef as React.RefObject<HTMLDivElement>}
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-controls={isOpen ? "action-menu" : undefined}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleMenu();
            }
          }}
          className={cn(isOpen && "relative z-10")}
        >
          {customTrigger}
        </div>
      ) : (
        triggerButton
      )}

      {isOpen && (
        <div
          ref={menuRef}
          id="action-menu"
          className={cn(
            "absolute z-20 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
            positionClasses[position],
            menuClassName,
          )}
          style={menuStyle}
          role="menu"
          aria-orientation="vertical"
          aria-label={menuAriaLabel || label}
          tabIndex={-1}
        >
          {actionGroups.map((group, groupIndex) => (
            <div key={`group-${groupIndex}`} className="py-1">
              {group.label && (
                <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {group.label}
                </div>
              )}

              {group.items.map((item, itemIndex) => {
                if (item.divider) {
                  return (
                    <div
                      key={`divider-${itemIndex}`}
                      className="border-t border-gray-100 my-1"
                    />
                  );
                }

                const itemContent = (
                  <>
                    {item.icon && (
                      <Icon
                        name={item.icon}
                        size="sm"
                        className={cn(
                          "mr-3 h-5 w-5",
                          item.destructive ? "text-red-500" : "text-gray-400",
                          item.selected && "text-primary-500",
                        )}
                        aria-hidden="true"
                      />
                    )}
                    <span className="flex-grow truncate">{item.label}</span>
                    {item.selected && (
                      <Icon
                        name="check"
                        size="sm"
                        className="ml-3 text-primary-500"
                        aria-hidden="true"
                      />
                    )}
                  </>
                );

                if (item.type === "link" && item.href) {
                  return (
                    <a
                      key={`item-${groupIndex}-${itemIndex}`}
                      href={item.href}
                      target={item.target}
                      className={cn(
                        "group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                        item.destructive &&
                          "text-red-600 hover:text-red-700 hover:bg-red-50",
                        item.disabled && "opacity-50 cursor-not-allowed",
                        item.selected && "bg-gray-100",
                      )}
                      role="menuitem"
                      tabIndex={-1}
                      aria-disabled={item.disabled}
                      title={item.tooltip}
                      onClick={(e) => {
                        if (item.disabled) {
                          e.preventDefault();
                          return;
                        }
                        item.onClick();
                        if (closeOnClick) closeMenu();
                      }}
                    >
                      {itemContent}
                    </a>
                  );
                }

                return (
                  <button
                    key={`item-${groupIndex}-${itemIndex}`}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "w-full text-left group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                      item.destructive &&
                        "text-red-600 hover:text-red-700 hover:bg-red-50",
                      item.disabled && "opacity-50 cursor-not-allowed",
                      item.selected && "bg-gray-100",
                    )}
                    role="menuitem"
                    disabled={item.disabled}
                    title={item.tooltip}
                  >
                    {itemContent}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
