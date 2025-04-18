import { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '../api/supabase';
import logger from '../utils/logger';

interface AdminDashboardStats {
  total_users: number;
  buyer_count: number;
  seller_count: number;
  admin_count: number;
  active_auctions: number;
  completed_auctions: number;
  scheduled_auctions: number;
  featured_auctions: number;
  total_revenue: number;
  transaction_volume: number;
  pending_transactions: number;
  completed_transactions: number;
  total_products: number;
  last_updated: string;
}

interface CachedStats {
  data: AdminDashboardStats;
  timestamp: number;
}

// Caching configuration
const CACHE_KEY = 'admin_dashboard_stats';
const CACHE_TTL = 60 * 1000; // 1 minute in milliseconds

// Determine if we're in production
const isProduction = import.meta.env.PROD === true;

/**
 * Hook to fetch admin dashboard statistics
 * Uses the admin_dashboard_stats view for optimized performance with client-side caching
 */
export const useAdminDashboardStats = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetched, setLastFetched] = useState<number>(0);
  
  const log = logger.child('useAdminDashboardStats');

  /**
   * Get stats from cache if they exist and are still valid
   */
  const getStatsFromCache = useCallback((): AdminDashboardStats | null => {
    try {
      const cachedStatsJson = localStorage.getItem(CACHE_KEY);
      if (!cachedStatsJson) return null;
      
      const cachedStats: CachedStats = JSON.parse(cachedStatsJson);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - cachedStats.timestamp < CACHE_TTL) {
        log.debug('Using cached stats', { age: now - cachedStats.timestamp });
        return cachedStats.data;
      } else {
        log.debug('Cache expired', { age: now - cachedStats.timestamp, ttl: CACHE_TTL });
        return null;
      }
    } catch (err) {
      log.warn('Error reading stats from cache', { error: err });
      return null;
    }
  }, []);

  /**
   * Save stats to cache
   */
  const saveStatsToCache = useCallback((data: AdminDashboardStats) => {
    try {
      const cacheData: CachedStats = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      log.debug('Stats saved to cache');
    } catch (err) {
      log.warn('Error saving stats to cache', { error: err });
    }
  }, []);

  const fetchStats = useCallback(async (skipCache = false) => {
    log.debug('Fetching stats', { skipCache });
    setLoading(true);
    
    try {
      // Try to get from cache first unless skipCache is true
      if (!skipCache) {
        const cachedStats = getStatsFromCache();
        if (cachedStats) {
          setStats(cachedStats);
          setError(null);
          setLoading(false);
          return;
        }
      }
      
      // Cache miss or skip cache, fetch from server
      log.info('Fetching stats from server');
      
      // Fetch from the admin_dashboard_stats view using a raw query
      // This avoids TypeScript errors with the view not being in the generated types
      const { data, error: statsError } = await supabaseClient
        .rpc('pgsql', { query: 'SELECT * FROM public.admin_dashboard_stats LIMIT 1' } as any);
      
      if (statsError) throw statsError;
      
      // Parse the first row of the result
      const statsData = data && data.length > 0 ? data[0] : null;
      
      if (statsData) {
        const parsedStats: AdminDashboardStats = {
          total_users: parseInt(statsData.total_users) || 0,
          buyer_count: parseInt(statsData.buyer_count) || 0,
          seller_count: parseInt(statsData.seller_count) || 0,
          admin_count: parseInt(statsData.admin_count) || 0,
          active_auctions: parseInt(statsData.active_auctions) || 0,
          completed_auctions: parseInt(statsData.completed_auctions) || 0,
          scheduled_auctions: parseInt(statsData.scheduled_auctions) || 0,
          featured_auctions: parseInt(statsData.featured_auctions) || 0,
          total_revenue: parseFloat(statsData.total_revenue) || 0,
          transaction_volume: parseFloat(statsData.transaction_volume) || 0,
          pending_transactions: parseInt(statsData.pending_transactions) || 0,
          completed_transactions: parseInt(statsData.completed_transactions) || 0,
          total_products: parseInt(statsData.total_products) || 0,
          last_updated: statsData.last_updated || new Date().toISOString()
        };
        
        setStats(parsedStats);
        setLastFetched(Date.now());
        saveStatsToCache(parsedStats);
      }
      
      setError(null);
    } catch (err) {
      log.error('Error fetching stats from server', { error: err });
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      
      // Fallback to direct queries only in development
      if (!isProduction) {
        log.info('Attempting fallback stats calculation in development');
        
        try {
          // Fetch stats directly using count queries
          const [
            { count: totalUsers },
            { count: buyerCount },
            { count: sellerCount },
            { count: adminCount },
            { count: activeAuctions },
            { count: completedAuctions },
            { count: scheduledAuctions },
            { count: featuredAuctions },
            transactionData,
            { count: totalProducts }
          ] = await Promise.all([
            supabaseClient.from('users').select('*', { count: 'exact', head: true }),
            supabaseClient.from('users').select('*', { count: 'exact', head: true }).eq('role', 'buyer'),
            supabaseClient.from('users').select('*', { count: 'exact', head: true }).eq('role', 'seller'),
            supabaseClient.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
            supabaseClient.from('auction_slots').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabaseClient.from('auction_slots').select('*', { count: 'exact', head: true }).eq('auction_state', 'completed'),
            supabaseClient.from('auction_slots').select('*', { count: 'exact', head: true }).eq('auction_state', 'scheduled'),
            supabaseClient.from('auction_slots').select('*', { count: 'exact', head: true }).eq('featured', true),
            supabaseClient.from('transactions').select('amount, commission_amount, status'),
            supabaseClient.from('products').select('*', { count: 'exact', head: true })
          ]);
          
          // Calculate revenue and transaction volume
          const totalRevenue = transactionData.data?.reduce((sum, tx) => sum + (tx.commission_amount || 0), 0) || 0;
          const transactionVolume = transactionData.data?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
          const pendingTransactions = transactionData.data?.filter(tx => 
            tx.status && ['payment_pending', 'shipping_pending'].includes(tx.status)
          ).length || 0;
          const completedTransactions = transactionData.data?.filter(tx => tx.status === 'completed').length || 0;
          
          // Set fallback stats
          const fallbackStats: AdminDashboardStats = {
            total_users: totalUsers || 0,
            buyer_count: buyerCount || 0,
            seller_count: sellerCount || 0,
            admin_count: adminCount || 0,
            active_auctions: activeAuctions || 0,
            completed_auctions: completedAuctions || 0,
            scheduled_auctions: scheduledAuctions || 0,
            featured_auctions: featuredAuctions || 0,
            total_revenue: totalRevenue,
            transaction_volume: transactionVolume,
            pending_transactions: pendingTransactions,
            completed_transactions: completedTransactions,
            total_products: totalProducts || 0,
            last_updated: new Date().toISOString()
          };
          
          setStats(fallbackStats);
          setLastFetched(Date.now());
          // Don't cache fallback stats to ensure we try the main method next time
          
          log.info('Using fallback stats calculation in development');
        } catch (fallbackErr) {
          log.error('Fallback stats calculation also failed', { error: fallbackErr });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [getStatsFromCache, saveStatsToCache]);

  useEffect(() => {
    fetchStats();
    
    // Set up periodic refresh if needed
    const refreshInterval = setInterval(() => {
      // Only refresh if cache has expired
      if (Date.now() - lastFetched > CACHE_TTL) {
        log.debug('Refreshing stats on interval');
        fetchStats();
      }
    }, CACHE_TTL / 2); // Refresh at half the cache TTL to ensure fresh data
    
    return () => clearInterval(refreshInterval);
  }, [fetchStats, lastFetched]);

  return { 
    stats, 
    loading, 
    error, 
    refetch: (skipCache = true) => fetchStats(skipCache),
    lastFetched: new Date(lastFetched)
  };
};

export default useAdminDashboardStats; 