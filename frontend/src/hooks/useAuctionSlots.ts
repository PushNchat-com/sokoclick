import { useState, useEffect, useCallback } from 'react';
import * as auctionSlotService from '../services/auctionSlots';
import type { AuctionSlot } from '../types/supabase';

interface UseAuctionSlotsProps {
  limit?: number;
  offset?: number;
  filters?: {
    isActive?: boolean;
    featured?: boolean;
    status?: string;
  };
  autoFetch?: boolean;
}

interface UseAuctionSlotsReturn {
  slots: AuctionSlot[];
  loading: boolean;
  error: Error | null;
  totalCount: number;
  refetch: () => Promise<void>;
}

export const useAuctionSlots = ({
  limit = 20,
  offset = 0,
  filters,
  autoFetch = true,
}: UseAuctionSlotsProps = {}): UseAuctionSlotsReturn => {
  const [slots, setSlots] = useState<AuctionSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchAuctionSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, count } = await auctionSlotService.getAuctionSlots(limit, offset, filters);
      setSlots(data);
      setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [limit, offset, filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchAuctionSlots();
    }
  }, [autoFetch, fetchAuctionSlots]);

  return {
    slots,
    loading,
    error,
    totalCount,
    refetch: fetchAuctionSlots,
  };
};

interface UseAuctionSlotProps {
  id: number;
  autoFetch?: boolean;
}

interface UseAuctionSlotReturn {
  slot: AuctionSlot | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useAuctionSlot = ({ id, autoFetch = true }: UseAuctionSlotProps): UseAuctionSlotReturn => {
  const [slot, setSlot] = useState<AuctionSlot | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  const fetchAuctionSlot = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await auctionSlotService.getAuctionSlotById(id);
      setSlot(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (autoFetch && id) {
      fetchAuctionSlot();
    }
  }, [autoFetch, fetchAuctionSlot, id]);

  return {
    slot,
    loading,
    error,
    refetch: fetchAuctionSlot,
  };
};

interface UseAuctionSlotActionsReturn {
  assignProductToSlot: (slotId: number, productId: string) => Promise<AuctionSlot>;
  removeProductFromSlot: (slotId: number) => Promise<AuctionSlot>;
  updateAuctionSlot: (slotId: number, updates: Partial<AuctionSlot>) => Promise<AuctionSlot>;
  incrementViewCount: (slotId: number) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export const useAuctionSlotActions = (): UseAuctionSlotActionsReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const handleAction = async <T>(action: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await action();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignProductToSlot = async (slotId: number, productId: string): Promise<AuctionSlot> => {
    return handleAction(() => auctionSlotService.assignProductToSlot(slotId, productId));
  };

  const removeProductFromSlot = async (slotId: number): Promise<AuctionSlot> => {
    return handleAction(() => auctionSlotService.removeProductFromSlot(slotId));
  };

  const updateAuctionSlot = async (slotId: number, updates: Partial<AuctionSlot>): Promise<AuctionSlot> => {
    return handleAction(() => auctionSlotService.updateAuctionSlot(slotId, updates));
  };

  const incrementViewCount = async (slotId: number): Promise<void> => {
    return handleAction(() => auctionSlotService.incrementViewCount(slotId));
  };

  return {
    assignProductToSlot,
    removeProductFromSlot,
    updateAuctionSlot,
    incrementViewCount,
    loading,
    error,
  };
}; 