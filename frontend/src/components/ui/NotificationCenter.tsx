import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../store/LanguageContext";
import { createAriaLabel, focusStyles } from "./design-system/accessibility";
import { NotificationCard } from "./molecules/NotificationCard";

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string | { en: string; fr: string };
  message: string | { en: string; fr: string };
  timestamp: number;
  read: boolean;
  actions?: {
    label: string | { en: string; fr: string };
    onClick: () => void;
  }[];
  autoClose?: boolean | number;
}

export interface NotificationCenterProps {
  /**
   * Array of notifications to display
   */
  notifications: Notification[];

  /**
   * Callback when a notification is read
   */
  onMarkAsRead?: (id: string) => void;

  /**
   * Callback when a notification is dismissed
   */
  onDismiss?: (id: string) => void;

  /**
   * Callback when all notifications are cleared
   */
  onClearAll?: () => void;

  /**
   * Maximum number of visible notifications
   */
  maxVisible?: number;

  /**
   * Whether the notification center is expanded
   */
  isExpanded: boolean;

  /**
   * Callback when expand state changes
   */
  onExpandChange: (isExpanded: boolean) => void;

  /**
   * Position of the notification center
   */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";

  /**
   * Additional class name
   */
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onDismiss,
  onClearAll,
  maxVisible = 5,
  isExpanded,
  onExpandChange,
  position = "top-right",
  className = "",
}) => {
  const { t } = useLanguage();
  const [animation, setAnimation] = useState<"enter" | "exit" | null>(null);
  const notificationCenterRef = useRef<HTMLDivElement>(null);

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Text content
  const text = {
    notificationCenter: {
      en: "Notification Center",
      fr: "Centre de Notifications",
    },
    clearAll: {
      en: "Clear All",
      fr: "Tout Effacer",
    },
    noNotifications: {
      en: "No notifications",
      fr: "Aucune notification",
    },
    markAllAsRead: {
      en: "Mark all as read",
      fr: "Marquer tout comme lu",
    },
    closeNotificationCenter: {
      en: "Close notification center",
      fr: "Fermer le centre de notifications",
    },
    openNotificationCenter: {
      en: "Open notification center",
      fr: "Ouvrir le centre de notifications",
    },
  };

  // Position styles
  const positionStyles = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isExpanded &&
        notificationCenterRef.current &&
        !notificationCenterRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isExpanded && event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  // Animate open/close
  useEffect(() => {
    if (isExpanded) {
      setAnimation("enter");
    } else if (animation !== null) {
      setAnimation("exit");
      const timer = setTimeout(() => {
        setAnimation(null);
      }, 300); // Duration of animation
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  // Handle close with animation
  const handleClose = () => {
    setAnimation("exit");
    const timer = setTimeout(() => {
      onExpandChange(false);
    }, 300); // Duration of animation
    return () => clearTimeout(timer);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    notifications.forEach((notification) => {
      if (!notification.read && onMarkAsRead) {
        onMarkAsRead(notification.id);
      }
    });
  };

  // If not expanded and no animation, only show the toggle button
  if (!isExpanded && animation === null) {
    return (
      <button
        className={`fixed ${positionStyles[position]} m-4 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 z-50 ${className}`}
        onClick={() => onExpandChange(true)}
        style={focusStyles.keyboard}
        {...createAriaLabel(t(text.openNotificationCenter))}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      ref={notificationCenterRef}
      className={`fixed ${positionStyles[position]} m-4 w-80 max-w-full bg-white rounded-lg shadow-xl z-50 overflow-hidden transform transition-all duration-300 ${
        animation === "enter"
          ? "translate-y-0 opacity-100 scale-100"
          : animation === "exit"
            ? "translate-y-2 opacity-0 scale-95"
            : ""
      } ${className}`}
      role="dialog"
      aria-labelledby="notification-center-title"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-indigo-600 text-white flex justify-between items-center">
        <h2 id="notification-center-title" className="text-lg font-semibold">
          {t(text.notificationCenter)}
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </h2>
        <div className="flex items-center space-x-2">
          {notifications.length > 0 && (
            <>
              <button
                className="text-white text-sm hover:underline"
                onClick={handleMarkAllAsRead}
                {...createAriaLabel(t(text.markAllAsRead))}
              >
                {t(text.markAllAsRead)}
              </button>
              <button
                className="text-white text-sm hover:underline"
                onClick={onClearAll}
                {...createAriaLabel(t(text.clearAll))}
              >
                {t(text.clearAll)}
              </button>
            </>
          )}
          <button
            className="text-white hover:text-gray-200"
            onClick={handleClose}
            {...createAriaLabel(t(text.closeNotificationCenter))}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-96 overflow-y-auto p-2 space-y-2">
        {notifications.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">
            {t(text.noNotifications)}
          </div>
        ) : (
          notifications.slice(0, maxVisible).map((notification) => (
            <NotificationCard
              key={notification.id}
              variant={notification.type}
              title={
                typeof notification.title === "string"
                  ? notification.title
                  : t(notification.title)
              }
              description={
                typeof notification.message === "string"
                  ? notification.message
                  : t(notification.message)
              }
              dismissible
              onClose={() => onDismiss && onDismiss(notification.id)}
              autoClose={notification.autoClose}
              className={`${notification.read ? "opacity-75" : ""}`}
              actions={
                notification.actions && (
                  <div className="flex space-x-2">
                    {notification.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          action.onClick();
                          if (onMarkAsRead) onMarkAsRead(notification.id);
                        }}
                        className="px-2 py-1 text-xs font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        {typeof action.label === "string"
                          ? action.label
                          : t(action.label)}
                      </button>
                    ))}
                  </div>
                )
              }
            />
          ))
        )}
        {notifications.length > maxVisible && (
          <div className="text-center text-sm text-gray-500 py-2">
            {t({
              en: `+ ${notifications.length - maxVisible} more notifications`,
              fr: `+ ${notifications.length - maxVisible} autres notifications`,
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
