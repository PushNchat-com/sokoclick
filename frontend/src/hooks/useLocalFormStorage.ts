import { useState, useEffect } from "react";
import { ProductFormData } from "../types/product";
import { ImageFile } from "../types/image";
import { DeliveryOptionInternal } from "../types/delivery";

const STORAGE_KEY_PREFIX = "sokoclick_product_form";

interface StoredFormState {
  formData: ProductFormData;
  imageFiles: ImageFile[];
  deliveryOptions: DeliveryOptionInternal[];
  currentStep: number;
  lastUpdated: number;
}

interface UseLocalFormStorageProps {
  formId: string;
  isEditing: boolean;
  expirationHours?: number;
}

export const useLocalFormStorage = ({
  formId,
  isEditing,
  expirationHours = 24,
}: UseLocalFormStorageProps) => {
  const storageKey = `${STORAGE_KEY_PREFIX}_${formId}`;
  const [initialized, setInitialized] = useState(false);

  // Load stored form state
  const loadStoredState = (): StoredFormState | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const parsedState = JSON.parse(stored) as StoredFormState;

      // Check if stored state has expired
      const now = Date.now();
      const expirationTime = expirationHours * 60 * 60 * 1000; // Convert hours to milliseconds
      if (now - parsedState.lastUpdated > expirationTime) {
        localStorage.removeItem(storageKey);
        return null;
      }

      // Ensure imageFiles is always an array
      if (!Array.isArray(parsedState.imageFiles)) {
        parsedState.imageFiles = [
          {
            file: null,
            preview: undefined,
            url: undefined,
            progress: 0,
            error: null,
          },
        ];
      }

      return parsedState;
    } catch (error) {
      console.error("Error loading stored form state:", error);
      return null;
    }
  };

  // Save current form state
  const saveFormState = (state: Omit<StoredFormState, "lastUpdated">) => {
    try {
      const stateToStore: StoredFormState = {
        ...state,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToStore));
    } catch (error) {
      console.error("Error saving form state:", error);
    }
  };

  // Clear stored form state
  const clearStoredState = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error clearing stored form state:", error);
    }
  };

  // Check for existing form state on mount
  const checkStoredState = (): StoredFormState | null => {
    // Don't restore state for editing existing products
    if (isEditing) return null;

    return loadStoredState();
  };

  // Cleanup expired form states
  useEffect(() => {
    const cleanupExpiredStates = () => {
      try {
        const now = Date.now();
        const expirationTime = expirationHours * 60 * 60 * 1000;

        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith(STORAGE_KEY_PREFIX)) {
            try {
              const stored = localStorage.getItem(key);
              if (stored) {
                const state = JSON.parse(stored) as StoredFormState;
                if (now - state.lastUpdated > expirationTime) {
                  localStorage.removeItem(key);
                }
              }
            } catch (e) {
              // If we can't parse the state, remove it
              localStorage.removeItem(key);
            }
          }
        });
      } catch (error) {
        console.error("Error cleaning up expired states:", error);
      }
    };

    cleanupExpiredStates();
  }, [expirationHours]);

  return {
    saveFormState,
    clearStoredState,
    checkStoredState,
    initialized,
    setInitialized,
  };
};
