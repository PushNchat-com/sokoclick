import React, { forwardRef, useRef, useState } from "react";
import { useLanguage } from "../../store/LanguageContext";
import { createAriaLabel } from "./design-system/accessibility";
import SearchSuggestions, { SearchSuggestion } from "./SearchSuggestions";
import {
  monitorPerformance,
  withPerformanceMonitoring,
} from "../../utils/performance";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * Value of the search input
   */
  value: string;

  /**
   * Callback when the input value changes
   */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /**
   * Callback when the search form is submitted
   */
  onSubmit?: (e: React.FormEvent) => void;

  /**
   * Callback when the search is cleared
   */
  onClear?: () => void;

  /**
   * Callback when a suggestion is selected
   */
  onSelectSuggestion?: (suggestion: string) => void;

  /**
   * Whether the search is currently in progress
   */
  isSearching?: boolean;

  /**
   * List of search history items
   */
  searchHistory?: string[];

  /**
   * List of autocomplete suggestions
   */
  suggestions?: SearchSuggestion[];

  /**
   * Callback to remove an item from history
   */
  onRemoveHistoryItem?: (item: string) => void;

  /**
   * Callback to clear all history
   */
  onClearHistory?: () => void;

  /**
   * Whether to show suggestions
   */
  showSuggestions?: boolean;

  /**
   * Callback when suggestions visibility changes
   */
  onShowSuggestionsChange?: (showSuggestions: boolean) => void;

  /**
   * Placeholder text for the search input
   */
  placeholder?: string;

  /**
   * Additional className for the input
   */
  className?: string;

  /**
   * Additional className for the wrapper
   */
  wrapperClassName?: string;

  /**
   * Whether the input should have rounded corners
   */
  rounded?: boolean;

  /**
   * Size of the search input
   */
  size?: "sm" | "md" | "lg";
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      onClear,
      onSelectSuggestion,
      isSearching = false,
      searchHistory = [],
      suggestions = [],
      onRemoveHistoryItem,
      onClearHistory,
      showSuggestions = false,
      onShowSuggestionsChange,
      placeholder,
      className = "",
      wrapperClassName = "",
      rounded = true,
      size = "md",
      id,
      ...props
    },
    ref,
  ) => {
    const { t } = useLanguage();
    const [internalShowSuggestions, setInternalShowSuggestions] =
      useState(showSuggestions);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const inputId = id || React.useId();
    const searchStartTimeRef = useRef<number | null>(null);

    // Text content with bilingual support
    const text = {
      searchPlaceholder: {
        en: placeholder || "Search...",
        fr: placeholder || "Rechercher...",
      },
      searching: {
        en: "Searching...",
        fr: "Recherche en cours...",
      },
      searchButton: {
        en: "Search",
        fr: "Rechercher",
      },
      clearSearch: {
        en: "Clear search",
        fr: "Effacer la recherche",
      },
    };

    // Focus styles for keyboard navigation
    const focusStyles = {
      keyboard: {
        outlineOffset: "2px",
      },
    };

    // Determine if we're controlling suggestions visibility externally
    const isControlled = onShowSuggestionsChange !== undefined;
    const displaySuggestions = isControlled
      ? showSuggestions
      : internalShowSuggestions;

    // Toggle suggestions visibility
    const toggleSuggestions = (show: boolean) => {
      if (isControlled) {
        onShowSuggestionsChange(show);
      } else {
        setInternalShowSuggestions(show);
      }
    };

    // Handle suggestion selection
    const handleSelectSuggestion = (suggestion: string) => {
      if (onSelectSuggestion) {
        onSelectSuggestion(suggestion);
      }
      toggleSuggestions(false);
    };

    // Handle form submission with performance monitoring
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (onSubmit) {
        // Monitor search performance
        monitorPerformance(
          async () => {
            // Record performance start time
            searchStartTimeRef.current = performance.now();

            // Call the original onSubmit
            onSubmit(e);

            // Create a promise to simulate the async nature of the search
            return new Promise<void>((resolve) => {
              // We use setTimeout with 0ms to ensure this executes after the search completes
              setTimeout(() => resolve(), 0);
            });
          },
          "search",
          {
            query: value,
            queryLength: value.length,
            hasSuggestions: suggestions.length > 0,
          },
        ).catch((error) => {
          console.error("Error during search operation:", error);
        });
      }
      toggleSuggestions(false);
    };

    // Handle input focus
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      toggleSuggestions(value.trim().length > 0);
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    // Size classes
    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs pr-8",
      md: "px-4 py-2 text-sm pr-12",
      lg: "px-5 py-2.5 text-base pr-14",
    };

    // Button size classes
    const buttonSizeClasses = {
      sm: "right-1 top-1 p-1",
      md: "right-2 top-1.5 p-1.5",
      lg: "right-3 top-2 p-2",
    };

    // Clear button size classes
    const clearButtonSizeClasses = {
      sm: "right-8 top-1.5",
      md: "right-12 top-2",
      lg: "right-14 top-2.5",
    };

    // Icon size classes
    const iconSizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    return (
      <div ref={searchContainerRef} className={`relative ${wrapperClassName}`}>
        <form
          onSubmit={handleSubmit}
          className="relative"
          role="search"
          aria-label={t(text.searchPlaceholder)}
        >
          <input
            type="search"
            ref={ref}
            placeholder={t(text.searchPlaceholder)}
            value={value}
            onChange={onChange}
            className={`w-full border-0 focus:ring-2 focus:ring-indigo-400 focus:outline-none text-gray-600 shadow-sm ${
              rounded ? "rounded-full" : "rounded-md"
            } ${sizeClasses[size]} ${className}`}
            disabled={isSearching}
            aria-label={t(text.searchPlaceholder)}
            style={focusStyles.keyboard}
            onFocus={handleFocus}
            id={inputId as string}
            autoComplete="off"
            {...props}
          />

          {value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className={`absolute text-gray-400 hover:text-gray-600 transition ${clearButtonSizeClasses[size]}`}
              {...createAriaLabel(t(text.clearSearch))}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={iconSizeClasses[size]}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : null}

          <button
            type="submit"
            className={`absolute bg-indigo-700 text-white rounded-full hover:bg-indigo-800 transition duration-150 disabled:opacity-70 ${buttonSizeClasses[size]}`}
            disabled={isSearching || !value.trim()}
            {...createAriaLabel(
              t(isSearching ? text.searching : text.searchButton),
            )}
            style={focusStyles.keyboard}
          >
            {isSearching ? (
              <svg
                className={`animate-spin ${iconSizeClasses[size]}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={iconSizeClasses[size]}
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
          </button>
        </form>

        {/* Search suggestions */}
        <SearchSuggestions
          inputValue={value}
          isVisible={displaySuggestions && !isSearching}
          searchHistory={searchHistory}
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
          onRemoveHistoryItem={onRemoveHistoryItem}
          onClearHistory={onClearHistory}
          inputId={inputId as string}
        />
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";

// Export the component with performance monitoring
export default withPerformanceMonitoring(SearchInput, "SearchInput");
