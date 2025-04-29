import React, { useMemo, useState, useEffect, useRef } from "react";
import { useLanguage } from "../../store/LanguageContext";
import { createAriaLabel } from "../ui/design-system/accessibility";

export interface SearchSuggestion {
  id: string;
  text: string;
  type: "history" | "suggestion" | "category";
  // Optional metadata for more advanced suggestions
  metadata?: Record<string, any>;
}

export interface SearchSuggestionsProps {
  /**
   * Current input value
   */
  inputValue: string;

  /**
   * Whether the suggestions are visible
   */
  isVisible: boolean;

  /**
   * List of search history items
   */
  searchHistory?: string[];

  /**
   * List of autocomplete suggestions
   */
  suggestions?: SearchSuggestion[];

  /**
   * Callback when a suggestion is selected
   */
  onSelectSuggestion: (suggestion: string) => void;

  /**
   * Callback to remove an item from history
   */
  onRemoveHistoryItem?: (item: string) => void;

  /**
   * Callback to clear all history
   */
  onClearHistory?: () => void;

  /**
   * Element ID of the input field for aria-controls
   */
  inputId: string;

  /**
   * Maximum number of suggestions to show
   */
  maxSuggestions?: number;

  /**
   * Additional CSS class name
   */
  className?: string;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  inputValue,
  isVisible,
  searchHistory = [],
  suggestions = [],
  onSelectSuggestion,
  onRemoveHistoryItem,
  onClearHistory,
  inputId,
  maxSuggestions = 7,
  className = "",
}) => {
  const { t } = useLanguage();
  const suggestionListRef = useRef<HTMLUListElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Text content with bilingual support
  const text = {
    recentSearches: {
      en: "Recent Searches",
      fr: "Recherches récentes",
    },
    suggestions: {
      en: "Suggestions",
      fr: "Suggestions",
    },
    clearAll: {
      en: "Clear all",
      fr: "Tout effacer",
    },
    noRecentSearches: {
      en: "No recent searches",
      fr: "Aucune recherche récente",
    },
    noSuggestions: {
      en: "No suggestions",
      fr: "Aucune suggestion",
    },
    categories: {
      en: "Categories",
      fr: "Catégories",
    },
    remove: {
      en: "Remove",
      fr: "Supprimer",
    },
  };

  // Filter and prepare history items
  const historyItems = useMemo(() => {
    if (!searchHistory.length) return [];

    return searchHistory
      .filter((item) => item.toLowerCase().includes(inputValue.toLowerCase()))
      .slice(0, maxSuggestions)
      .map((item) => ({
        id: `history-${item}`,
        text: item,
        type: "history" as const,
      }));
  }, [searchHistory, inputValue, maxSuggestions]);

  // Filter and limit suggestions
  const filteredSuggestions = useMemo(() => {
    if (!suggestions.length) return [];

    const filtered = suggestions.filter((suggestion) =>
      suggestion.text.toLowerCase().includes(inputValue.toLowerCase()),
    );

    // Calculate how many suggestions we can show based on history items
    const remainingSlots = maxSuggestions - historyItems.length;

    return remainingSlots > 0 ? filtered.slice(0, remainingSlots) : [];
  }, [suggestions, inputValue, historyItems.length, maxSuggestions]);

  // Combine history and suggestions
  const allItems = useMemo(() => {
    return [...historyItems, ...filteredSuggestions];
  }, [historyItems, filteredSuggestions]);

  // Reset focused index when visibility changes or input value changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [isVisible, inputValue]);

  // Methods for keyboard navigation
  const handleKeyNavigation = (event: React.KeyboardEvent) => {
    // Only handle navigation when suggestions are visible
    if (!isVisible || allItems.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0));
        break;

      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
        break;

      case "Enter":
        if (focusedIndex >= 0 && focusedIndex < allItems.length) {
          event.preventDefault();
          onSelectSuggestion(allItems[focusedIndex].text);
        }
        break;

      case "Escape":
        event.preventDefault();
        // Hide suggestions (should be handled by parent component)
        break;

      default:
        break;
    }
  };

  // If not visible, don't render
  if (!isVisible) return null;

  return (
    <div
      className={`absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden ${className}`}
      role="listbox"
      aria-labelledby={inputId}
    >
      {/* History section */}
      {historyItems.length > 0 && (
        <div className="p-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-500">
              {t(text.recentSearches)}
            </h3>
            {onClearHistory && (
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-gray-700"
                onClick={onClearHistory}
                {...createAriaLabel(t(text.clearAll))}
              >
                {t(text.clearAll)}
              </button>
            )}
          </div>

          <ul
            ref={suggestionListRef}
            className="space-y-1"
            onKeyDown={handleKeyNavigation}
          >
            {historyItems.map((item, index) => (
              <li
                key={item.id}
                className={`flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                  focusedIndex === index ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
                role="option"
                aria-selected={focusedIndex === index}
                onClick={() => onSelectSuggestion(item.text)}
              >
                <span>{item.text}</span>
                {onRemoveHistoryItem && (
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveHistoryItem(item.text);
                    }}
                    {...createAriaLabel(t(text.remove))}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Show divider if we have both history and suggestions */}
      {historyItems.length > 0 && filteredSuggestions.length > 0 && (
        <div className="border-t border-gray-100"></div>
      )}

      {/* Suggestions section */}
      {filteredSuggestions.length > 0 && (
        <div className="p-2">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {t(text.suggestions)}
          </h3>

          <ul className="space-y-1">
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                className={`flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                  focusedIndex === historyItems.length + index
                    ? "bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                role="option"
                aria-selected={focusedIndex === historyItems.length + index}
                onClick={() => onSelectSuggestion(suggestion.text)}
              >
                {/* Show different icon based on suggestion type */}
                {suggestion.type === "suggestion" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                )}
                {suggestion.type === "category" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                )}
                <span>{suggestion.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state when no suggestions or history */}
      {allItems.length === 0 && inputValue && (
        <div className="p-4 text-center text-sm text-gray-500">
          {t(text.noSuggestions)}
        </div>
      )}
      {allItems.length === 0 && !inputValue && historyItems.length === 0 && (
        <div className="p-4 text-center text-sm text-gray-500">
          {t(text.noRecentSearches)}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
