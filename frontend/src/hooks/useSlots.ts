import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { queryKeys } from "../services/queryClient";
import { toast } from "../utils/toast";
import { useLanguage } from "../store/LanguageContext";
// Import the generated types
import type { definitions } from "../types/supabase-types";

// Define the type for AuctionSlot based on generated types
export type AuctionSlot = definitions["auction_slots"];

// Define the expected return type for the fetch function
interface FetchSlotsResponse {
  slots: AuctionSlot[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SlotFilters {
  // Update filter keys to match the new schema columns if needed
  status?: definitions["auction_slots"]["slot_status"]; // Use generated enum type if available, otherwise string
  sellerId?: string; // Refers to live_product_seller_id
  // Add other relevant filters based on auction_slots columns (e.g., featured, category)
  // productId is no longer a direct filter on the slots table
  pageSize?: number;
  page?: number;
}

interface UseSlotsOptions extends SlotFilters {
  enabled?: boolean;
}

/**
 * Custom hook to fetch auction slots with React Query
 * Aligned with the new auction_slots schema.
 */
export const useSlots = (
  options: UseSlotsOptions = {},
): UseQueryResult<FetchSlotsResponse, Error> & FetchSlotsResponse => {
  const { t } = useLanguage();

  // Define the async fetch function with explicit return type
  const fetchSlots = async (): Promise<FetchSlotsResponse> => {
    // Start building query from the 'auction_slots' table
    let query = supabase
      .from<AuctionSlot>("auction_slots") // Use the generated type
      .select(
        `
        *,
        seller:live_product_seller_id ( id, name, is_verified ) // Fetch related seller info if needed
      `,
        { count: "exact" },
      );

    // Filter by slot_status if provided
    if (options.status) {
      query = query.eq("slot_status", options.status);
    }

    // Filter by live_product_seller_id if provided
    if (options.sellerId) {
      query = query.eq("live_product_seller_id", options.sellerId);
    }

    // Add other filters as needed, e.g., filtering by category in live_product_categories
    // if (options.category) {
    //   query = query.contains('live_product_categories', [options.category]);
    // }

    // Pagination
    const pageSize = options.pageSize || 25; // Default to 25 as there are only 25 slots
    const page = options.page || 1;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    // Ensure range doesn't exceed total slots (0-24)
    query = query.range(Math.max(0, start), Math.min(24, end));

    // Execute query - Order by slot ID
    const { data, error, count } = await query.order("id", { ascending: true });

    if (error) {
      console.error("Error fetching auction_slots:", error);
      // Throwing the error will be caught by useQuery's error state
      throw new Error(error.message);
    }

    // No need for client-side search filtering here unless specifically required
    // Search should ideally be handled by backend/database query modifications if possible

    return {
      slots: data || [],
      total: count || 0, // Might always be 25 unless filtered
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  };

  // Explicitly define the query key using the correct table name
  const queryKey = ["auction_slots", "list", options] as const;

  // Use the generic UseQueryResult type
  const result = useQuery<
    FetchSlotsResponse,
    Error,
    FetchSlotsResponse,
    typeof queryKey
  >({
    queryKey,
    queryFn: fetchSlots,
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Removed onError callback - handle errors using result.error
  });

  // Handle error display using toast after the hook runs
  useEffect(() => {
    if (result.error) {
      toast.error(
        t({
          en: "Failed to load slots: " + result.error.message,
          fr: "Échec du chargement des emplacements: " + result.error.message,
        }),
      );
    }
  }, [result.error, t]);

  // Return both the useQuery result and the structured data for convenience
  return {
    ...result,
    // Provide default empty values when data is loading or undefined
    slots: result.data?.slots || [],
    total: result.data?.total || 0,
    page: result.data?.page || 1,
    pageSize: result.data?.pageSize || 25,
    totalPages: result.data?.totalPages || 0,
  };
};

// You might need to update queryKeys in ../services/queryClient.ts
// Example update:
// export const queryKeys = {
//   ...
//   auctionSlots: {
//     all: ['auctionSlots'] as const,
//     lists: () => [...queryKeys.auctionSlots.all, 'list'] as const,
//     list: (filters: object) => [...queryKeys.auctionSlots.lists(), filters] as const,
//     details: () => [...queryKeys.auctionSlots.all, 'detail'] as const,
//     detail: (id: number) => [...queryKeys.auctionSlots.details(), id] as const,
//   },
//   // Remove or comment out old 'slots' key
//   // slots: { ... },
//   ...
// };
