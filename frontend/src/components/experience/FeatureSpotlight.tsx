import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export type SpotlightFeature = {
  id: string;
  title: string;
  description: string;
  elementId?: string;
  position?: "top" | "right" | "bottom" | "left";
  image?: string;
  dismissable?: boolean;
};

export const FEATURE_SPOTLIGHTS: Record<string, SpotlightFeature> = {
  // New features will be added here
  newInventorySystem: {
    id: "newInventorySystem",
    title: "Enhanced Inventory System",
    description:
      "We've updated our inventory system with new filtering options and bulk actions.",
    elementId: "inventory-panel",
    position: "bottom",
    dismissable: true,
  },
  quickSearch: {
    id: "quickSearch",
    title: "Quick Search",
    description: 'Press "/" to quickly search across the entire application.',
    elementId: "search-icon",
    position: "bottom",
    image: "/assets/quick-search.png",
    dismissable: true,
  },
  // Add more features as needed
};

interface FeatureSpotlightProps {
  spotlightId: string;
  onDismiss?: (id: string) => void;
  onComplete?: (id: string) => void;
  autoShow?: boolean;
  delayMs?: number;
}

export const FeatureSpotlight: React.FC<FeatureSpotlightProps> = ({
  spotlightId,
  onDismiss,
  onComplete,
  autoShow = true,
  delayMs = 1000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const spotlight = FEATURE_SPOTLIGHTS[spotlightId];

  // Check if this spotlight has been seen before
  useEffect(() => {
    const checkSpotlightStatus = () => {
      const seenFeatures = JSON.parse(
        localStorage.getItem("seenFeatures") || "{}",
      );
      if (!seenFeatures[spotlightId] && autoShow) {
        setTimeout(() => {
          setIsVisible(true);
          updatePosition();
        }, delayMs);
      }
    };

    checkSpotlightStatus();
  }, [spotlightId, autoShow, delayMs]);

  // Update position when window resizes
  useEffect(() => {
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

  const updatePosition = () => {
    if (!spotlight.elementId) return;

    const element = document.getElementById(spotlight.elementId);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const spotlightWidth = 320; // Max width of spotlight
    const offset = 20; // Distance from element

    // Add highlight class to target element
    element.classList.add("tour-highlight");

    // Calculate position based on specified direction
    let top = 0;
    let left = 0;

    switch (spotlight.position) {
      case "top":
        top = rect.top - offset - 150; // Height of spotlight + offset
        left = rect.left + rect.width / 2 - spotlightWidth / 2;
        break;
      case "right":
        top = rect.top + rect.height / 2 - 75;
        left = rect.right + offset;
        break;
      case "bottom":
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2 - spotlightWidth / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - 75;
        left = rect.left - spotlightWidth - offset;
        break;
      default:
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2 - spotlightWidth / 2;
    }

    // Keep spotlight within viewport
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (left < 20) left = 20;
    if (left + spotlightWidth > windowWidth - 20)
      left = windowWidth - spotlightWidth - 20;
    if (top < 20) top = 20;
    if (top + 150 > windowHeight - 20) top = windowHeight - 150 - 20;

    setPosition({ top, left });
  };

  const handleDismiss = () => {
    if (!spotlight) return;

    setIsVisible(false);

    // Remove highlight from target element
    if (spotlight.elementId) {
      const element = document.getElementById(spotlight.elementId);
      if (element) {
        element.classList.remove("tour-highlight");
      }
    }

    // Store in localStorage to prevent showing again
    const seenFeatures = JSON.parse(
      localStorage.getItem("seenFeatures") || "{}",
    );
    seenFeatures[spotlightId] = true;
    localStorage.setItem("seenFeatures", JSON.stringify(seenFeatures));

    if (onDismiss) onDismiss(spotlightId);
  };

  const handleComplete = () => {
    handleDismiss();
    if (onComplete) onComplete(spotlightId);
  };

  if (!spotlight || !isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-transparent pointer-events-none">
      <div
        className="tour-tooltip absolute pointer-events-auto bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: "320px",
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg">{spotlight.title}</h3>
          {spotlight.dismissable && (
            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-3">
          {spotlight.description}
        </p>

        {spotlight.image && (
          <div className="mb-3">
            <img
              src={spotlight.image}
              alt={spotlight.title}
              className="w-full rounded-md"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={handleComplete}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default FeatureSpotlight;
