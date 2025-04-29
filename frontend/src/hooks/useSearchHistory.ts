import { useState, useEffect, useCallback } from "react";

// Maximum number of search history items to keep
const MAX_HISTORY_ITEMS = 10;
const STORAGE_KEY = "sokoclick_search_history";

export interface UseSearchHistoryProps {
  // Optional namespace for different search contexts
  namespace?: string;
}

export interface UseSearchHistoryReturn {
  // List of search history items
  searchHistory: string[];

  // Add a search query to history
  addToHistory: (query: string) => void;

  // Remove a specific search query from history
  removeFromHistory: (query: string) => void;

  // Clear all search history
  clearHistory: () => void;
}

/**
 * Hook for managing search history using local storage
 */
export function useSearchHistory({
  namespace = "default",
}: UseSearchHistoryProps = {}): UseSearchHistoryReturn {
  // Create a unique storage key with optional namespace
  const storageKey = `${STORAGE_KEY}_${namespace}`;

  // Initialize state from local storage
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const storedHistory = localStorage.getItem(storageKey);
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
      console.error("Failed to parse search history from localStorage:", error);
      return [];
    }
  });

  // Save to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(searchHistory));
    } catch (error) {
      console.error("Failed to save search history to localStorage:", error);
    }
  }, [searchHistory, storageKey]);

  // Add a search query to history
  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    setSearchHistory((prev) => {
      // Create new array without the current query (if it exists)
      const filteredHistory = prev.filter(
        (item) => item.toLowerCase() !== query.toLowerCase(),
      );

      // Add the new query to the beginning
      const newHistory = [query, ...filteredHistory];

      // Limit to max items
      return newHistory.slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  // Remove a specific query from history
  const removeFromHistory = useCallback((query: string) => {
    setSearchHistory((prev) =>
      prev.filter((item) => item.toLowerCase() !== query.toLowerCase()),
    );
  }, []);

  // Clear all search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
