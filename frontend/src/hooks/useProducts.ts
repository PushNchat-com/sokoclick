import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { queryKeys } from "../services/queryClient";
import { toast } from "../utils/toast";
import { useLanguage } from "../store/LanguageContext";

export interface ProductFilters {
  status?: string;
  sellerId?: string | number;
  categoryId?: string | number;
  isApproved?: boolean;
  isFeatured?: boolean;
  searchTerm?: string;
  pageSize?: number;
  page?: number;
}

interface UseProductsOptions extends ProductFilters {
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook to fetch products with React Query
 * This implements a stale-while-revalidate strategy for better UX
 */
export const useProducts = (options: UseProductsOptions = {}) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const fetchProducts = async () => {
    // Start building query
    let query = supabase.from("products").select("*", { count: "exact" });

    // Filter by status if provided, otherwise use default filter for public viewing
    if (options.status) {
      query = query.eq("status", options.status);
    } else if (!options.sellerId) {
      // Default to approved products for public viewing, not for seller's own products
      query = query.eq("status", "approved");
    }

    // Apply seller ID filter
    if (options.sellerId) {
      query = query.eq("seller_id", options.sellerId);
    }

    // Get category data separately to avoid relationship errors
    if (options.categoryId) {
      query = query.eq("category_id", options.categoryId);
    }

    // Apply additional filters
    if (options.isApproved !== undefined) {
      query = query.eq("is_approved", options.isApproved);
    }

    if (options.isFeatured !== undefined) {
      query = query.eq("is_featured", options.isFeatured);
    }

    if (options.searchTerm) {
      const term = options.searchTerm.trim();
      query = query.or(
        `name_en.ilike.%${term}%,name_fr.ilike.%${term}%,description_en.ilike.%${term}%,description_fr.ilike.%${term}%`,
      );
    }

    // Pagination
    const pageSize = options.pageSize || 20;
    const page = options.page || 1;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    query = query.range(start, end);

    // Execute query
    const { data, error, count } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      products: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  };

  const queryKey = queryKeys.products.list(options);

  const result = useQuery({
    queryKey,
    queryFn: fetchProducts,
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onSuccess: options.onSuccess,
    onError: (error: Error) => {
      console.error("Error fetching products:", error);
      toast.error(
        t({
          en: "Failed to load products",
          fr: "Échec du chargement des produits",
        }),
      );

      if (options.onError) {
        options.onError(error);
      }
    },
  });

  // Mutation for adding a product
  const addProductMutation = useMutation({
    mutationFn: async (newProduct: any) => {
      const { data, error } = await supabase
        .from("products")
        .insert(newProduct)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      // Invalidate products list query to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });

      toast.success(
        t({
          en: "Product added successfully",
          fr: "Produit ajouté avec succès",
        }),
      );
    },
    onError: (error: Error) => {
      toast.error(
        `${t({
          en: "Failed to add product",
          fr: "Échec de l'ajout du produit",
        })}: ${error.message}`,
      );
    },
  });

  return {
    ...result,
    products: result.data?.products || [],
    total: result.data?.total || 0,
    page: result.data?.page || 1,
    pageSize: result.data?.pageSize || 20,
    totalPages: result.data?.totalPages || 0,
    addProduct: addProductMutation.mutate,
    isAddingProduct: addProductMutation.isPending,
  };
};
