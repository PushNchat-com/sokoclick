import { useState, useCallback, useEffect } from "react";

interface TourPreferences {
  completedTours: string[];
  dismissedFeatureSpotlights: string[];
  hideAllTours: boolean;
}

const STORAGE_KEY = "sokoclick_tour_preferences";

/**
 * Hook for managing tour preferences
 * Tracks which tours and feature spotlights have been completed/dismissed
 */
export const useTourPreferences = () => {
  const [preferences, setPreferences] = useState<TourPreferences>(() => {
    // Initialize from localStorage if available
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored
        ? JSON.parse(stored)
        : {
            completedTours: [],
            dismissedFeatureSpotlights: [],
            hideAllTours: false,
          };
    } catch (error) {
      console.error("Failed to parse tour preferences:", error);
      return {
        completedTours: [],
        dismissedFeatureSpotlights: [],
        hideAllTours: false,
      };
    }
  });

  // Save to localStorage whenever preferences change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("Failed to save tour preferences:", error);
    }
  }, [preferences]);

  // Check if a tour has been completed
  const isTourCompleted = useCallback(
    (tourId: string) => {
      return preferences.completedTours.includes(tourId);
    },
    [preferences.completedTours],
  );

  // Mark a tour as completed
  const markTourCompleted = useCallback((tourId: string) => {
    setPreferences((prev) => ({
      ...prev,
      completedTours: [...prev.completedTours, tourId],
    }));
  }, []);

  // Reset a specific tour (mark as not completed)
  const resetTour = useCallback((tourId: string) => {
    setPreferences((prev) => ({
      ...prev,
      completedTours: prev.completedTours.filter((id) => id !== tourId),
    }));
  }, []);

  // Check if a feature spotlight has been dismissed
  const isFeatureSpotlightDismissed = useCallback(
    (spotlightId: string) => {
      return preferences.dismissedFeatureSpotlights.includes(spotlightId);
    },
    [preferences.dismissedFeatureSpotlights],
  );

  // Mark a feature spotlight as dismissed
  const dismissFeatureSpotlight = useCallback((spotlightId: string) => {
    setPreferences((prev) => ({
      ...prev,
      dismissedFeatureSpotlights: [
        ...prev.dismissedFeatureSpotlights,
        spotlightId,
      ],
    }));
  }, []);

  // Reset all tours and spotlights
  const resetAllPreferences = useCallback(() => {
    setPreferences({
      completedTours: [],
      dismissedFeatureSpotlights: [],
      hideAllTours: false,
    });
  }, []);

  // Toggle the global setting to hide all tours
  const toggleHideAllTours = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      hideAllTours: !prev.hideAllTours,
    }));
  }, []);

  return {
    preferences,
    isTourCompleted,
    markTourCompleted,
    resetTour,
    isFeatureSpotlightDismissed,
    dismissFeatureSpotlight,
    resetAllPreferences,
    toggleHideAllTours,
    hideAllTours: preferences.hideAllTours,
  };
};
