import { useState, useEffect } from 'react';
import { auctionService } from '../services/auctionService';
import { AuctionSlot, Product } from '../types/auctions';

/**
 * Hook to fetch products for a seller
 */
export const useSellerProducts = (sellerId: string | undefined) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSellerProducts = async () => {
      if (!sellerId) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await auctionService.getProductsBySellerId(sellerId);
        setProducts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error fetching seller products'));
        console.error('Error fetching seller products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProducts();
  }, [sellerId]);

  return { products, loading, error };
};

/**
 * Hook to fetch auction slots for a seller
 */
export const useSellerAuctionSlots = (sellerId: string | undefined) => {
  const [auctionSlots, setAuctionSlots] = useState<AuctionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSellerAuctionSlots = async () => {
      if (!sellerId) {
        setAuctionSlots([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await auctionService.getAuctionSlotsBySellerId(sellerId);
        setAuctionSlots(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error fetching seller auction slots'));
        console.error('Error fetching seller auction slots:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerAuctionSlots();
  }, [sellerId]);

  return { auctionSlots, loading, error };
};

/**
 * Hook to fetch a specific auction slot by ID
 */
export const useAuctionSlotById = (id: number | undefined) => {
  const [auctionSlot, setAuctionSlot] = useState<AuctionSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAuctionSlot = async () => {
      if (!id) {
        setAuctionSlot(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await auctionService.getAuctionSlotById(id);
        setAuctionSlot(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error fetching auction slot'));
        console.error('Error fetching auction slot:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionSlot();
  }, [id]);

  return { auctionSlot, loading, error };
};

/**
 * Hook to fetch auction slots with pagination
 */
export const useAuctionSlots = (limit: number = 25, offset: number = 0) => {
  const [auctionSlots, setAuctionSlots] = useState<AuctionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAuctionSlots = async () => {
      try {
        setLoading(true);
        const data = await auctionService.getAuctionSlots(limit, offset);
        setAuctionSlots(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error fetching auction slots'));
        console.error('Error fetching auction slots:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionSlots();
  }, [limit, offset]);

  return { auctionSlots, loading, error };
};

/**
 * Hook to fetch featured auction slots
 */
export const useFeaturedAuctionSlots = (limit: number = 3) => {
  const [featuredSlots, setFeaturedSlots] = useState<AuctionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFeaturedSlots = async () => {
      try {
        setLoading(true);
        const data = await auctionService.getFeaturedSlots(limit);
        setFeaturedSlots(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error fetching featured slots'));
        console.error('Error fetching featured slots:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedSlots();
  }, [limit]);

  return { featuredSlots, loading, error };
}; 