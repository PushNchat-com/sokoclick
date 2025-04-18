import { useState, useEffect } from 'react';
import { AuctionSlot, Product, Profile } from '../types/supabase';
import { supabaseClient, supabaseHelper, applyMigrations } from '../api/supabase';
import { AUCTION_STATES } from '../services/mockData'; // We'll still use the states enum for type safety

/**
 * Hook to fetch auction slots from Supabase
 */
export const useAuctionSlots = (limit: number = 25, offset: number = 0, filter: string = '') => {
  const [slots, setSlots] = useState<AuctionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [migrationRun, setMigrationRun] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Check if we need to run migrations first
        if (!migrationRun) {
          console.log('Checking if database migrations are needed...');
          const migrationResult = await applyMigrations();
          console.log('Migration check result:', migrationResult);
          setMigrationRun(true);
        }

        // Get auction slots from Supabase using the helper function
        const data = await supabaseHelper.auctionSlots.getAuctionSlots(limit, filter);
        
        // Check if there are more slots available
        setHasMore(data.length === limit);
        
        // Set the slots in state
        setSlots(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching auction slots:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [limit, offset, filter, migrationRun]);

  // Function to refetch data
  const refetch = async () => {
    setLoading(true);
    try {
      // Check if migrations are needed before refetching
      if (!migrationRun) {
        const migrationResult = await applyMigrations();
        console.log('Migration check result on refetch:', migrationResult);
        setMigrationRun(true);
      }

      const data = await supabaseHelper.auctionSlots.getAuctionSlots(limit, filter);
      
      // Check if there are more slots available
      setHasMore(data.length === limit);
      
      // Set the slots in state
      setSlots(data);
      setError(null);
    } catch (err) {
      console.error('Error refetching auction slots:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return { slots, loading, error, hasMore, refetch };
};

/**
 * Hook to fetch a single auction slot by ID
 */
export const useAuctionSlotById = (id: number) => {
  const [slot, setSlot] = useState<AuctionSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get auction slot from Supabase
        const data = await supabaseHelper.auctionSlots.getAuctionSlotById(id);
        setSlot(data);
        setError(null);
        
        // Increment view count if a valid slot was found
        if (data && data.id) {
          // Update view count
          const { error: updateError } = await supabaseClient
            .from('auction_slots')
            .update({ view_count: (data.view_count || 0) + 1 })
            .eq('id', data.id);
          
          if (updateError) console.error('Error updating view count:', updateError);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  return { slot, loading, error };
};

/**
 * Hook to fetch featured auction slots
 */
export const useFeaturedSlots = (limit: number = 3) => {
  const [featuredSlots, setFeaturedSlots] = useState<AuctionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get featured auction slots using auction_state
        const data = await supabaseHelper.auctionSlots.getAuctionSlots(limit, 'featured');
        
        // Filter for active only
        const activeSlots = data.filter(slot => slot.auction_state === 'active');
        
        setFeaturedSlots(activeSlots);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [limit]);
  
  return { featuredSlots, loading, error };
};

/**
 * Hook to fetch a product by ID
 */
export const useProductById = (productId: string | null) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Get product from Supabase
        const productData = await supabaseHelper.products.getProductById(productId);
        setProduct(productData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  return { product, loading, error };
};

/**
 * Hook to fetch a seller by ID
 */
export const useSellerById = (sellerId: string | null) => {
  const [seller, setSeller] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sellerId) {
      setSeller(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Get seller profile from Supabase
        const sellerData = await supabaseHelper.users.getUser(sellerId);
        setSeller(sellerData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sellerId]);

  return { seller, loading, error };
};

/**
 * Admin hook to fetch all auction slots
 */
export const useAdminAuctionSlots = (includeAll = false) => {
  const [slots, setSlots] = useState<AuctionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get all slots without filtering
        const { data: slotsData, error } = await supabaseClient
          .from('auction_slots')
          .select(`
            *,
            product:products(*)
          `)
          .order('id', { ascending: false });
        
        if (error) throw error;
        
        setSlots(slotsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [includeAll]);

  // Function to refetch data
  const refetch = async () => {
    setLoading(true);
    try {
      const { data: slotsData, error } = await supabaseClient
        .from('auction_slots')
        .select(`
          *,
          product:products(*)
        `)
        .order('id', { ascending: false });
      
      if (error) throw error;
      
      setSlots(slotsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return { slots, loading, error, refetch };
};

/**
 * Admin hook for slot management actions
 */
export const useAdminSlotActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const assignProductToSlot = async (slotId: number, productId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { data, error } = await supabaseClient
        .from('auction_slots')
        .update({ product_id: productId })
        .eq('id', slotId)
        .select();
      
      if (error) throw error;
      
      setSuccess(`Product successfully assigned to slot #${slotId}`);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const removeProductFromSlot = async (slotId: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { data, error } = await supabaseClient
        .from('auction_slots')
        .update({ product_id: null })
        .eq('id', slotId)
        .select();
      
      if (error) throw error;
      
      setSuccess(`Product successfully removed from slot #${slotId}`);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const updateSlotDetails = async (slotId: number, details: Partial<AuctionSlot>) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { data, error } = await supabaseClient
        .from('auction_slots')
        .update(details)
        .eq('id', slotId)
        .select();
      
      if (error) throw error;
      
      setSuccess(`Slot #${slotId} details updated successfully`);
      return data[0];
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { 
    assignProductToSlot, 
    removeProductFromSlot, 
    updateSlotDetails,
    loading, 
    error, 
    success 
  };
};

/**
 * Admin hook to fetch all products
 */
export const useAdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: productsData, error } = await supabaseClient
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setProducts(productsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to refetch data
  const refetch = async () => {
    setLoading(true);
    try {
      const { data: productsData, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setProducts(productsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error, refetch };
};

/**
 * Hook to fetch products for a specific seller
 */
export const useSellerProducts = (sellerId: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSellerProducts = async () => {
      try {
        setLoading(true);
        const { data: sellerProducts, error } = await supabaseClient
          .from('products')
          .select('*')
          .eq('seller_id', sellerId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setProducts(sellerProducts);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProducts();
  }, [sellerId]);

  // Function to refetch data
  const refetch = async () => {
    setLoading(true);
    try {
      const { data: sellerProducts, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setProducts(sellerProducts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error, refetch };
};

/**
 * Hook to fetch auction slots for a specific seller
 */
export const useSellerAuctions = (sellerId: string) => {
  const [auctions, setAuctions] = useState<AuctionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSellerAuctions = async () => {
      try {
        setLoading(true);
        // Using the helper function to get seller's auctions
        const sellerAuctions = await supabaseHelper.auctionSlots.getSellerAuctions(sellerId);
        
        setAuctions(sellerAuctions);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchSellerAuctions();
  }, [sellerId]);

  // Function to refetch data
  const refetch = async () => {
    setLoading(true);
    try {
      const sellerAuctions = await supabaseHelper.auctionSlots.getSellerAuctions(sellerId);
      
      setAuctions(sellerAuctions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return { auctions, loading, error, refetch };
}; 