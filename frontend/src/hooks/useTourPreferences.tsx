import { useState, useEffect } from "react";

// Define the tour types we support
export type TourType = "main" | "dashboard" | "settings" | "inventory";

// Custom hook to manage tour preferences
export const useTourPreferences = () => {
  const [completedTours, setCompletedTours] = useState<TourType[]>([]);
  const [disabledTours, setDisabledTours] = useState<TourType[]>([]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedCompletedTours = localStorage.getItem("completedTours");
      const savedDisabledTours = localStorage.getItem("disabledTours");

      if (savedCompletedTours) {
        setCompletedTours(JSON.parse(savedCompletedTours));
      }

      if (savedDisabledTours) {
        setDisabledTours(JSON.parse(savedDisabledTours));
      }
    } catch (error) {
      console.error("Failed to load tour preferences:", error);
    }
  }, []);

  // Save to localStorage whenever preferences change
  useEffect(() => {
    try {
      localStorage.setItem("completedTours", JSON.stringify(completedTours));
      localStorage.setItem("disabledTours", JSON.stringify(disabledTours));
    } catch (error) {
      console.error("Failed to save tour preferences:", error);
    }
  }, [completedTours, disabledTours]);

  // Mark a tour as completed
  const completeTour = (tourType: TourType) => {
    if (!completedTours.includes(tourType)) {
      setCompletedTours([...completedTours, tourType]);
    }
  };

  // Disable a tour
  const disableTour = (tourType: TourType) => {
    if (!disabledTours.includes(tourType)) {
      setDisabledTours([...disabledTours, tourType]);
    }
  };

  // Enable a previously disabled tour
  const enableTour = (tourType: TourType) => {
    setDisabledTours(disabledTours.filter((t) => t !== tourType));
  };

  // Reset a completed tour to mark it as not completed
  const resetTour = (tourType: TourType) => {
    setCompletedTours(completedTours.filter((t) => t !== tourType));
  };

  // Reset all tours (both completed and disabled)
  const resetAllTours = () => {
    setCompletedTours([]);
    setDisabledTours([]);
  };

  // Check if a tour should be shown (not completed and not disabled)
  const shouldShowTour = (tourType: TourType) => {
    return (
      !completedTours.includes(tourType) && !disabledTours.includes(tourType)
    );
  };

  return {
    completedTours,
    disabledTours,
    completeTour,
    disableTour,
    enableTour,
    resetTour,
    resetAllTours,
    shouldShowTour,
  };
};

export default useTourPreferences;
