import { useState, useEffect } from 'react';
import { AuctionSlot } from '../types/supabase';
import { 
  mockAuctionService, 
  MOCK_PRODUCTS, 
  MOCK_SELLERS,
  AUCTION_STATES,
  AuctionState
} from '../services/mockData';

export const useMockAuctionSlots = (limit: number = 25, offset: number = 0, category?: string) => {
  const [slots, setSlots] = useState<AuctionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await mockAuctionService.getAuctionSlots(limit, offset);
        
        // Filter by category if provided
        let filteredData = data;
        if (category && category !== 'all') {
          filteredData = data.filter(slot => {
            if (!slot.product) return false;
            return slot.product.category === category;
          });
        }
        
        // Only show active and scheduled slots in the main listing
        const activeSlots = filteredData.filter(slot => 
          slot.auction_state === AUCTION_STATES.ACTIVE || 
          slot.auction_state === AUCTION_STATES.SCHEDULED
        );
        
        setSlots(activeSlots);
        setHasMore(activeSlots.length === limit);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [limit, offset, category]);

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