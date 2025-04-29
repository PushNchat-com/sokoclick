import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/services/supabase";
import type { PostgrestError } from "@supabase/postgrest-js";

export interface Category {
  id: string;
  name: string;
  name_en: string;
  name_fr: string;
  slug: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

// Add type guard for PostgrestError
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "details" in error
  );
}

/**
 * Hook for fetching categories
 */
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .order("name_en", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setCategories(data as Category[]);
    } catch (err) {
      console.error("Error:", err);
      setError(isPostgrestError(err) ? err.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
};

export default {
  useCategories,
};
