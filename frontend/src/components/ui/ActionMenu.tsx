import React, { Fragment, useState, useEffect, useRef } from "react";
import { Menu, Transition } from "@headlessui/react";
import { cn } from "../../utils/cn";
import { useLanguage } from "../../store/LanguageContext";

export interface ActionItem {
  label: { en: string; fr: string };
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive";
  hasDividerAfter?: boolean;
  shortcut?: string;
  description?: { en: string; fr: string };
}

export interface ActionMenuProps {
  actions: ActionItem[];
  buttonLabel?: { en: string; fr: string } | undefined;
  buttonIcon?: React.ReactNode;
  buttonVariant?: "primary" | "secondary" | "outline" | "ghost";
  buttonSize?: "sm" | "md" | "lg";
  align?: "left" | "right";
  width?: number | string;
  className?: string;
  menuClassName?: string;
  labelledBy?: string;
}

// Function to detect if device supports hover
const useHoverSupport = () => {
  const [supportsHover, setSupportsHover] = useState(true);

  useEffect(() => {
    // Check if the device supports hover
    // This is a basic check and not 100% reliable, but it's good enough for most cases
    const mediaQuery = window.matchMedia("(hover: hover)");
    setSupportsHover(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setSupportsHover(e.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return supportsHover;
};

export const ActionMenu: React.FC<ActionMenuProps> = ({
  actions,
  buttonLabel = { en: "Actions", fr: "Actions" },
  buttonIcon = (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
      />
    </svg>
  ),
  buttonVariant = "outline",
  buttonSize = "md",
  align = "right",
  width = 200,
  className,
  menuClassName,
  labelledBy,
}) => {
  const { t } = useLanguage();
  const supportsHover = useHoverSupport();
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close the menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openAccordion === "main") {
        setOpenAccordion(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openAccordion]);

  // Handle clicking outside to close the menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        openAccordion === "main"
      ) {
        setOpenAccordion(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openAccordion]);

  const variantStyles = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
    secondary:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500",
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500",
  };

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base",
  };

  const alignmentStyles = {
    left: "left-0 origin-top-left",
    right: "right-0 origin-top-right",
  };

  const hasNonDisabledActions = actions.some((action) => !action.disabled);
  const menuId = `action-menu-${Math.random().toString(36).substr(2, 9)}`;

  // Accordion style for touch devices
  if (!supportsHover) {
    return (
      <div className={cn("relative", className)} ref={menuRef}>
        <button
          className={cn(
            "inline-flex w-full items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
            variantStyles[buttonVariant],
            sizeStyles[buttonSize],
            !hasNonDisabledActions && "opacity-50 cursor-not-allowed",
          )}
          disabled={!hasNonDisabledActions}
          onClick={() => setOpenAccordion((prev) => (prev ? null : "main"))}
          aria-expanded={openAccordion === "main"}
          aria-haspopup="menu"
          aria-controls={openAccordion === "main" ? menuId : undefined}
          aria-label={t(buttonLabel)}
          aria-labelledby={labelledBy}
        >
          {buttonLabel && <span className="mr-1">{t(buttonLabel)}</span>}
          {buttonIcon}
        </button>

        {openAccordion === "main" && (
          <div
            className={cn(
              "absolute z-50 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none py-1",
              alignmentStyles[align],
              menuClassName,
            )}
            style={{ width: typeof width === "number" ? `${width}px` : width }}
            role="menu"
            id={menuId}
            aria-labelledby={labelledBy}
          >
            {actions.map((action, index) => (
              <Fragment key={index}>
                <button
                  onClick={() => {
                    setOpenAccordion(null);
                    action.onClick();
                  }}
                  disabled={action.disabled}
                  className={cn(
                    "w-full text-left px-4 py-3 text-sm flex items-center space-x-2",
                    action.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
                    action.variant === "destructive"
                      ? "text-red-600"
                      : "text-gray-700",
                  )}
                  role="menuitem"
                  tabIndex={0}
                  aria-disabled={action.disabled}
                  title={action.description ? t(action.description) : undefined}
                >
                  {action.icon && (
                    <span className="flex-shrink-0" aria-hidden="true">
                      {action.icon}
                    </span>
                  )}
                  <span className="flex-1">{t(action.label)}</span>
                  {action.shortcut && (
                    <span
                      className="ml-auto text-xs text-gray-500"
                      aria-hidden="true"
                    >
                      {action.shortcut}
                    </span>
                  )}
                </button>
                {action.hasDividerAfter && (
                  <div
                    className="border-t border-gray-100 my-1"
                    role="separator"
                    aria-orientation="horizontal"
                  />
                )}
              </Fragment>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Original dropdown for devices with hover support
  return (
    <Menu as="div" className={cn("relative inline-block text-left", className)}>
      {({ open }) => (
        <>
          <div>
            <Menu.Button
              className={cn(
                "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
                variantStyles[buttonVariant],
                sizeStyles[buttonSize],
                !hasNonDisabledActions && "opacity-50 cursor-not-allowed",
              )}
              disabled={!hasNonDisabledActions}
              aria-label={t(buttonLabel)}
              aria-labelledby={labelledBy}
            >
              {buttonLabel && <span className="mr-1">{t(buttonLabel)}</span>}
              {buttonIcon}
            </Menu.Button>
          </div>

          <Transition
            as={Fragment}
            show={open}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items
              className={cn(
                "absolute z-50 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none py-1",
                alignmentStyles[align],
                menuClassName,
              )}
              style={{
                width: typeof width === "number" ? `${width}px` : width,
              }}
              aria-labelledby={labelledBy}
            >
              {actions.map((action, index) => (
                <Fragment key={index}>
                  <Menu.Item disabled={action.disabled}>
                    {({ active }) => (
                      <button
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm flex items-center space-x-2",
                          active && !action.disabled ? "bg-gray-100" : "",
                          action.disabled
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer",
                          action.variant === "destructive"
                            ? "text-red-600"
                            : "text-gray-700",
                        )}
                        role="menuitem"
                        aria-disabled={action.disabled}
                        title={
                          action.description ? t(action.description) : undefined
                        }
                      >
                        {action.icon && (
                          <span className="flex-shrink-0" aria-hidden="true">
                            {action.icon}
                          </span>
                        )}
                        <span className="flex-1">{t(action.label)}</span>
                        {action.shortcut && (
                          <span
                            className="ml-auto text-xs text-gray-500"
                            aria-hidden="true"
                          >
                            {action.shortcut}
                          </span>
                        )}
                      </button>
                    )}
                  </Menu.Item>
                  {action.hasDividerAfter && (
                    <div
                      className="border-t border-gray-100 my-1"
                      role="separator"
                      aria-orientation="horizontal"
                    />
                  )}
                </Fragment>
              ))}
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
};
