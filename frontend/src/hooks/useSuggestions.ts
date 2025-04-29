import { useState, useEffect, useMemo } from "react";
import { useCategories } from "../services/categories";
import { useDebounce } from "./useDebounce";
import { SearchSuggestion } from "../components/ui/SearchSuggestions";

// Types for configuring the hook
export interface UseSuggestionsProps {
  // The current input value to generate suggestions for
  inputValue: string;

  // Minimum number of characters before generating suggestions
  minChars?: number;

  // Product data to generate suggestions from
  products?: Array<{
    id?: string;
    name_en?: string;
    name_fr?: string;
    description_en?: string;
    description_fr?: string;
    category_id?: string;
    [key: string]: any;
  }>;

  // Debounce delay in milliseconds
  debounceDelay?: number;

  // Current language (en/fr)
  language?: "en" | "fr";

  // Include categories in suggestions
  includeCategories?: boolean;
}

export interface UseSuggestionsReturn {
  // List of generated suggestions
  suggestions: SearchSuggestion[];

  // Whether suggestions are currently being loaded
  loading: boolean;

  // Any error that occurred
  error: string | null;
}

/**
 * Hook for generating search suggestions based on product data and user input
 */
export function useSuggestions({
  inputValue,
  minChars = 2,
  products = [],
  debounceDelay = 300,
  language = "en",
  includeCategories = true,
}: UseSuggestionsProps): UseSuggestionsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  // Get categories if needed
  const { categories, loading: categoriesLoading } = useCategories();

  // Debounce the input value to prevent excessive processing
  const debouncedInputValue = useDebounce(inputValue, debounceDelay);

  // Create a map of category IDs to names for quick lookup
  const categoryMap = useMemo(() => {
    if (!categories) return new Map();

    const map = new Map();
    categories.forEach((category) => {
      map.set(
        category.id.toString(),
        language === "en" ? category.name_en : category.name_fr,
      );
    });
    return map;
  }, [categories, language]);

  // Generate suggestions when debounced input changes
  useEffect(() => {
    // Skip if input is too short
    if (!debouncedInputValue || debouncedInputValue.length < minChars) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results: SearchSuggestion[] = [];
      const normalizedInput = debouncedInputValue.toLowerCase();
      const seenTexts = new Set<string>();

      // Add product title suggestions
      products.forEach((product) => {
        const name = language === "en" ? product.name_en : product.name_fr;

        if (name && name.toLowerCase().includes(normalizedInput)) {
          // Don't add duplicate suggestions
          if (!seenTexts.has(name.toLowerCase())) {
            seenTexts.add(name.toLowerCase());
            results.push({
              id: `product-${product.id || Math.random().toString(36).substring(2)}`,
              text: name,
              type: "suggestion",
              metadata: { productId: product.id },
            });
          }
        }
      });

      // Add category suggestions if enabled
      if (includeCategories && categories && !categoriesLoading) {
        categories.forEach((category) => {
          const categoryName =
            language === "en" ? category.name_en : category.name_fr;

          if (
            categoryName &&
            categoryName.toLowerCase().includes(normalizedInput)
          ) {
            // Don't add duplicate suggestions
            if (!seenTexts.has(categoryName.toLowerCase())) {
              seenTexts.add(categoryName.toLowerCase());
              results.push({
                id: `category-${category.id}`,
                text: categoryName,
                type: "category",
                metadata: { categoryId: category.id },
              });
            }
          }
        });
      }

      // Sort suggestions by relevance (starts with > contains)
      results.sort((a, b) => {
        const aStartsWith = a.text.toLowerCase().startsWith(normalizedInput);
        const bStartsWith = b.text.toLowerCase().startsWith(normalizedInput);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        // If both start with or both don't start with, sort alphabetically
        return a.text.localeCompare(b.text);
      });

      setSuggestions(results);
    } catch (err) {
      console.error("Error generating suggestions:", err);
      setError("Failed to generate suggestions");
    } finally {
      setLoading(false);
    }
  }, [
    debouncedInputValue,
    minChars,
    products,
    language,
    includeCategories,
    categories,
    categoriesLoading,
    categoryMap,
  ]);

  return { suggestions, loading, error };
}
