import { supabase } from '../supabase';
import { ErrorMonitoring, ErrorSeverity } from './ErrorMonitoring';
import { logAdminAction, AuditAction, AuditResource } from '../auditLog';

export interface PerformanceMetric {
  id?: string;
  operationName: string;
  component: string;
  duration: number;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Cache configuration
export interface CacheConfig {
  maxSize: number;            // Maximum number of items in the cache
  ttl: number;                // Time to live in milliseconds
  storageMethod: 'memory' | 'localStorage' | 'sessionStorage'; // Where to store the cache
}

interface CacheItem<T> {
  data: T;
  expires: number;
}

interface CacheStorage {
  [key: string]: CacheItem<any>;
}

// Singleton cache instances
const inMemoryCache: CacheStorage = {};
let performanceMetricsBuffer: PerformanceMetric[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

// Default cache configuration
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 100,
  ttl: 5 * 60 * 1000, // 5 minutes
  storageMethod: 'memory'
};

// Performance measurement
export function measurePerformance<T>(
  operationName: string,
  operation: () => Promise<T>,
  component: string,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = performance.now();
  
  return operation().then(result => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Record performance metric
    recordPerformanceMetric({
      operationName,
      component,
      duration,
      timestamp: new Date().toISOString(),
      metadata
    });
    
    return result;
  }).catch(error => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Record performance metric with error flag
    recordPerformanceMetric({
      operationName,
      component,
      duration,
      timestamp: new Date().toISOString(),
      metadata: { ...metadata, error: true, message: error.message }
    });
    
    throw error;
  });
}

// Record a performance metric into the buffer
export function recordPerformanceMetric(metric: Omit<PerformanceMetric, 'id'>): void {
  try {
    performanceMetricsBuffer.push(metric as PerformanceMetric);
    
    // Schedule flush or flush immediately if buffer is large
    if (performanceMetricsBuffer.length >= 20) {
      if (flushTimeout) {
        clearTimeout(flushTimeout);
        flushTimeout = null;
      }
      flushPerformanceMetrics();
    } else if (!flushTimeout) {
      flushTimeout = setTimeout(() => flushPerformanceMetrics(), 10000); // Flush every 10 seconds
    }
  } catch (error) {
    console.error('Error recording performance metric:', error);
  }
}

// Flush performance metrics to the database
async function flushPerformanceMetrics(): Promise<void> {
  if (performanceMetricsBuffer.length === 0) return;
  
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  
  try {
    const metricsToSend = [...performanceMetricsBuffer];
    performanceMetricsBuffer = [];
    
    // If development mode, just log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance Metrics]', metricsToSend);
      return;
    }
    
    // In production, send to database
    const { error } = await supabase
      .from('performance_metrics')
      .insert(metricsToSend);
    
    if (error) {
      console.error('Failed to save performance metrics:', error);
      // If failed, add important ones back to buffer
      const criticalMetrics = metricsToSend.filter(m => 
        m.duration > 1000 || 
        (m.metadata && m.metadata.error) || 
        m.operationName.includes('critical')
      );
      if (criticalMetrics.length > 0) {
        performanceMetricsBuffer.push(...criticalMetrics);
      }
    }
  } catch (error) {
    ErrorMonitoring.logSystemError(
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'PerformanceMonitor',
        severity: ErrorSeverity.WARNING
      }
    );
  }
}

// Get slow operations (for admin dashboard)
export async function getSlowOperations(
  threshold: number = 1000,
  limit: number = 10
): Promise<PerformanceMetric[]> {
  try {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .gt('duration', threshold)
      .order('duration', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching slow operations:', error);
    ErrorMonitoring.logSystemError(
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'PerformanceMonitor',
        severity: ErrorSeverity.WARNING
      }
    );
    return [];
  }
}

// Cache management
export class CacheManager {
  private config: CacheConfig;
  private prefix: string;
  
  constructor(prefix: string, config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.prefix = prefix;
  }
  
  // Get cache key with prefix
  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }
  
  // Get data from cache
  get<T>(key: string): T | null {
    try {
      const cacheKey = this.getKey(key);
      let cacheItem: CacheItem<T> | undefined;
      
      // Get from appropriate storage
      if (this.config.storageMethod === 'localStorage') {
        const item = localStorage.getItem(cacheKey);
        cacheItem = item ? JSON.parse(item) : undefined;
      } else if (this.config.storageMethod === 'sessionStorage') {
        const item = sessionStorage.getItem(cacheKey);
        cacheItem = item ? JSON.parse(item) : undefined;
      } else {
        cacheItem = inMemoryCache[cacheKey] as CacheItem<T>;
      }
      
      // Return null if no cache item or expired
      if (!cacheItem || cacheItem.expires < Date.now()) {
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.warn('Error getting data from cache:', error);
      return null;
    }
  }
  
  // Set data in cache
  set<T>(key: string, data: T, customTtl?: number): void {
    try {
      const cacheKey = this.getKey(key);
      const ttl = customTtl || this.config.ttl;
      const cacheItem: CacheItem<T> = {
        data,
        expires: Date.now() + ttl
      };
      
      // Store in appropriate storage
      if (this.config.storageMethod === 'localStorage') {
        localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      } else if (this.config.storageMethod === 'sessionStorage') {
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      } else {
        // For in-memory cache, make sure we don't exceed max size
        if (Object.keys(inMemoryCache).length >= this.config.maxSize) {
          // Remove oldest item
          const oldestKey = this.findOldestCacheKey();
          if (oldestKey) {
            delete inMemoryCache[oldestKey];
          }
        }
        inMemoryCache[cacheKey] = cacheItem;
      }
    } catch (error) {
      console.warn('Error setting data in cache:', error);
    }
  }
  
  // Find the oldest cache key (for cleanup)
  private findOldestCacheKey(): string | null {
    try {
      const keys = Object.keys(inMemoryCache);
      if (keys.length === 0) return null;
      
      let oldestKey = keys[0];
      let oldestExpiry = inMemoryCache[oldestKey].expires;
      
      for (const key of keys) {
        if (inMemoryCache[key].expires < oldestExpiry) {
          oldestKey = key;
          oldestExpiry = inMemoryCache[key].expires;
        }
      }
      
      return oldestKey;
    } catch (error) {
      console.warn('Error finding oldest cache key:', error);
      return null;
    }
  }
  
  // Remove item from cache
  remove(key: string): void {
    try {
      const cacheKey = this.getKey(key);
      
      if (this.config.storageMethod === 'localStorage') {
        localStorage.removeItem(cacheKey);
      } else if (this.config.storageMethod === 'sessionStorage') {
        sessionStorage.removeItem(cacheKey);
      } else {
        delete inMemoryCache[cacheKey];
      }
    } catch (error) {
      console.warn('Error removing item from cache:', error);
    }
  }
  
  // Clear all items with this prefix
  clear(): void {
    try {
      if (this.config.storageMethod === 'localStorage') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            localStorage.removeItem(key);
          }
        }
      } else if (this.config.storageMethod === 'sessionStorage') {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            sessionStorage.removeItem(key);
          }
        }
      } else {
        // Clear in-memory cache for this prefix
        Object.keys(inMemoryCache).forEach(key => {
          if (key.startsWith(this.prefix)) {
            delete inMemoryCache[key];
          }
        });
      }
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }
}

// Automatically cached fetch function
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheOptions: {
    manager?: CacheManager;
    ttl?: number;
    enabled?: boolean;
    cacheKey?: string;
  } = {}
): Promise<T> {
  const {
    manager = new CacheManager('fetch-cache'),
    ttl,
    enabled = true,
    cacheKey = url
  } = cacheOptions;
  
  // Return from cache if enabled and available
  if (enabled) {
    const cachedData = manager.get<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  
  // Fetch fresh data
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json() as T;
  
  // Store in cache if enabled
  if (enabled) {
    manager.set(cacheKey, data, ttl);
  }
  
  return data;
}

// Export a singleton instance
export const PerformanceMonitor = {
  measurePerformance,
  recordPerformanceMetric,
  getSlowOperations,
  CacheManager,
  cachedFetch
};

export default PerformanceMonitor; 