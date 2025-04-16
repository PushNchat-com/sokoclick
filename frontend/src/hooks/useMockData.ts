import { useState, useEffect } from 'react';
import { AuctionSlot, Product } from '../types/supabase';
import { 
  mockAuctionService, 
  MOCK_PRODUCTS, 
  MOCK_SELLERS,
  AUCTION_STATES,
  AuctionState
} from '../services/mockData';
import { generateMockAuctionSlots, getMockAuctionSlotById, getMockFeaturedSlots } from '../services/mockData';

export const useMockAuctionSlots = (limit: number = 25, offset: number = 0) => {
  const [slots, setSlots] = useState<AuctionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false); // Always 25 slots, so no more pagination

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Always get exactly 25 slots
        const data = await mockAuctionService.getAuctionSlots(25, 0);
        
        // Only show active and scheduled slots in the main listing
        const activeSlots = data.filter(slot => 
          slot.auction_state === AUCTION_STATES.ACTIVE || 
          slot.auction_state === AUCTION_STATES.SCHEDULED
        );
        
        // If we don't have 25 active slots, get some from other states to fill up
        let slotsToDisplay = activeSlots;
        if (activeSlots.length < 25) {
          const remainingSlots = data.filter(slot =>
            slot.auction_state !== AUCTION_STATES.ACTIVE && 
            slot.auction_state !== AUCTION_STATES.SCHEDULED
          ).slice(0, 25 - activeSlots.length);
          
          slotsToDisplay = [...activeSlots, ...remainingSlots];
        }
        
        // Ensure we always return exactly 25 slots or all available if less
        setSlots(slotsToDisplay.slice(0, 25));
        setHasMore(false); // No pagination needed
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { slots, loading, error, hasMore };
};

export const useMockAuctionSlotById = (id: number) => {
  const [slot, setSlot] = useState<AuctionSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await mockAuctionService.getAuctionSlotById(id);
        setSlot(data);
        setError(null);
        
        // Increment view count if a valid slot was found
        if (data && data.id) {
          await mockAuctionService.increaseViewCount(data.id);
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

export const useMockFeaturedSlots = (limit: number = 3) => {
  const [featuredSlots, setFeaturedSlots] = useState<AuctionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allSlots = await mockAuctionService.getAuctionSlots(25, 0);
        
        // Get featured slots that are active
        const featured = allSlots
          .filter(slot => slot.featured && slot.auction_state === AUCTION_STATES.ACTIVE)
          .slice(0, limit);
        
        setFeaturedSlots(featured);
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

export const useMockProductById = (productId: string | null) => {
  const [product, setProduct] = useState<typeof MOCK_PRODUCTS[0] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Simulate API call with timeout
    const timer = setTimeout(() => {
      try {
        const foundProduct = MOCK_PRODUCTS.find(p => p.id === productId) || null;
        setProduct(foundProduct);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [productId]);

  return { product, loading, error };
};

export const useMockSellerById = (sellerId: string | null) => {
  const [seller, setSeller] = useState<typeof MOCK_SELLERS[0] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sellerId) {
      setSeller(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Simulate API call with timeout
    const timer = setTimeout(() => {
      try {
        const foundSeller = MOCK_SELLERS.find(s => s.id === sellerId) || null;
        setSeller(foundSeller);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [sellerId]);

  return { seller, loading, error };
};

// New hooks for admin functionality
export const useAdminMockAuctionSlots = (includeAll = false) => {
  const [slots, setSlots] = useState<AuctionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await mockAuctionService.getAuctionSlots(25, 0);
        setSlots(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [includeAll]);

  return { slots, loading, error };
};

export const useAdminMockSlotActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const assignProductToSlot = async (slotId: number, productId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await mockAuctionService.assignProductToSlot(slotId, productId);
      setSuccess(`Product successfully assigned to slot #${slotId}`);
      return true;
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
      await mockAuctionService.removeProductFromSlot(slotId);
      setSuccess(`Product successfully removed from slot #${slotId}`);
      return true;
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
      await mockAuctionService.updateSlotDetails(slotId, details);
      setSuccess(`Slot #${slotId} details updated successfully`);
      return true;
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

// Add export to mockAuctionService type definition to include getMockProducts
export type MockAuctionService = {
  getAuctionSlots: (
    limit?: number,
    offset?: number,
    filterFn?: (slot: AuctionSlot) => boolean
  ) => Promise<AuctionSlot[]>;
  getAuctionSlotById: (id: string) => Promise<AuctionSlot | null>;
  getMockFeaturedSlots: (limit?: number) => Promise<AuctionSlot[]>;
  getMockProducts: () => Promise<any[]>;
  getAllProducts: () => Promise<Product[]>;
  getProductsBySellerId: (sellerId: string) => Promise<Product[]>;
  getAuctionSlotsBySellerId: (sellerId: string) => Promise<AuctionSlot[]>;
};

/**
 * Admin hook to fetch all mock products
 */
export const useAdminMockProducts = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    mockAuctionService
      .getMockProducts() // Using the existing method name to match the API
      .then((data: Product[]) => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setError(err as Error);
        setIsLoading(false);
      });
  }, []);

  return { isLoading, error, products };
};

// Hook for fetching products for a specific seller
export const useSellerMockProducts = (sellerId: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSellerProducts = async () => {
      try {
        setLoading(true);
        const data = await mockAuctionService.getProductsBySellerId(sellerId);
        setProducts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch seller products'));
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProducts();
  }, [sellerId]);

  return { products, loading, error };
};

// Hook for fetching auction slots for a specific seller
export const useSellerMockAuctions = (sellerId: string) => {
  const [auctions, setAuctions] = useState<AuctionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSellerAuctions = async () => {
      try {
        setLoading(true);
        const data = await mockAuctionService.getAuctionSlotsBySellerId(sellerId);
        setAuctions(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch seller auctions'));
      } finally {
        setLoading(false);
      }
    };

    fetchSellerAuctions();
  }, [sellerId]);

  return { auctions, loading, error };
};