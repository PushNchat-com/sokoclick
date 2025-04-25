import { supabase } from '../supabase';
import { logAdminAction, AuditAction, AuditResource } from '../auditLog';
import { ServiceResponse, ServiceErrorType, createSuccessResponse, createErrorResponse } from './ServiceResponse';

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface SystemError {
  id?: string;
  message: string;
  stackTrace?: string;
  component?: string;
  severity: ErrorSeverity;
  userId?: string;
  metadata?: Record<string, any>;
  status: 'new' | 'acknowledged' | 'resolved';
  resolution?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    name: string;
    status: 'up' | 'down' | 'degraded';
    latency?: number;
    lastChecked: string;
  }[];
  criticalErrorCount: number;
  warningCount: number;
}

// Create in-memory buffer for errors to prevent excessive database writes
const errorBuffer: SystemError[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
const FLUSH_INTERVAL = 10000; // 10 seconds
const MAX_BUFFER_SIZE = 20;

/**
 * Log a system error
 */
export async function logSystemError(
  error: Error | string,
  options: {
    component?: string;
    severity?: ErrorSeverity;
    userId?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  try {
    const { component, severity = ErrorSeverity.ERROR, userId, metadata } = options;
    
    const errorObj: SystemError = {
      message: typeof error === 'string' ? error : error.message,
      stackTrace: typeof error === 'string' ? undefined : error.stack,
      component,
      severity,
      userId,
      metadata,
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add to buffer
    errorBuffer.push(errorObj);
    
    // For critical errors, flush immediately
    if (severity === ErrorSeverity.CRITICAL) {
      await flushErrorBuffer();
      
      // Log critical errors to audit log as well
      if (userId) {
        await logAdminAction(
          AuditAction.CREATE,
          AuditResource.SETTING,
          'error-log',
          { 
            errorMessage: errorObj.message,
            component: errorObj.component,
            severity: errorObj.severity
          }
        );
      }
    } else if (errorBuffer.length >= MAX_BUFFER_SIZE) {
      // Flush if buffer is full
      await flushErrorBuffer();
    } else if (!flushTimeout) {
      // Schedule flush if not already scheduled
      flushTimeout = setTimeout(() => flushErrorBuffer(), FLUSH_INTERVAL);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[SystemError]', component, errorObj.message);
      if (errorObj.stackTrace) {
        console.error(errorObj.stackTrace);
      }
      if (metadata) {
        console.error('Metadata:', metadata);
      }
    }
  } catch (e) {
    // Fallback to console if error logging fails
    console.error('Error in logSystemError:', e);
    console.error('Original error:', error);
  }
}

/**
 * Flush the error buffer to database
 */
async function flushErrorBuffer(): Promise<void> {
  if (errorBuffer.length === 0) return;
  
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  
  try {
    const errorsToInsert = [...errorBuffer];
    errorBuffer.length = 0; // Clear buffer
    
    const { error } = await supabase
      .from('system_errors')
      .insert(errorsToInsert);
    
    if (error) {
      console.error('Failed to flush error buffer:', error);
      // Put errors back in buffer for retry
      errorBuffer.push(...errorsToInsert);
    }
  } catch (e) {
    console.error('Error flushing error buffer:', e);
  }
}

/**
 * Get system errors with filtering
 */
export async function getSystemErrors(
  options: {
    page?: number;
    pageSize?: number;
    severity?: ErrorSeverity;
    status?: 'new' | 'acknowledged' | 'resolved';
    startDate?: string;
    endDate?: string;
    component?: string;
  } = {}
): Promise<ServiceResponse<{ errors: SystemError[]; count: number }>> {
  try {
    const {
      page = 1,
      pageSize = 20,
      severity,
      status,
      startDate,
      endDate,
      component
    } = options;
    
    // Calculate pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    
    // Build query
    let query = supabase
      .from('system_errors')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (severity) {
      query = query.eq('severity', severity);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (component) {
      query = query.eq('component', component);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    // Apply pagination and order
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(start, end);
    
    if (error) {
      return createErrorResponse(
        ServiceErrorType.DATABASE_ERROR,
        'Failed to fetch system errors',
        error
      );
    }
    
    return createSuccessResponse({
      errors: data || [],
      count: count || 0
    });
  } catch (error) {
    return createErrorResponse(
      ServiceErrorType.UNKNOWN_ERROR,
      'An unexpected error occurred while fetching system errors',
      error
    );
  }
}

/**
 * Get system health status
 */
export async function getSystemHealth(): Promise<ServiceResponse<SystemHealth>> {
  try {
    // Check database connectivity
    const dbStart = Date.now();
    const dbResult = await supabase.from('system_health').select('last_check').limit(1);
    const dbLatency = Date.now() - dbStart;
    
    // Check for critical errors in the last hour
    const criticalErrorsQuery = await supabase
      .from('system_errors')
      .select('id', { count: 'exact' })
      .eq('severity', ErrorSeverity.CRITICAL)
      .eq('status', 'new')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());
    
    // Check for warnings in the last hour
    const warningsQuery = await supabase
      .from('system_errors')
      .select('id', { count: 'exact' })
      .eq('severity', ErrorSeverity.WARNING)
      .eq('status', 'new')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());
    
    // Get overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (dbResult.error || criticalErrorsQuery.count !== null && criticalErrorsQuery.count > 0) {
      overallStatus = 'unhealthy';
    } else if (warningsQuery.count !== null && warningsQuery.count > 0 || dbLatency > 500) {
      overallStatus = 'degraded';
    }
    
    // Update the health check timestamp
    await supabase.from('system_health').upsert({ 
      id: 'last-check',
      last_check: new Date().toISOString(),
      status: overallStatus
    });
    
    return createSuccessResponse({
      status: overallStatus,
      services: [
        {
          name: 'database',
          status: dbResult.error ? 'down' : dbLatency > 500 ? 'degraded' : 'up',
          latency: dbLatency,
          lastChecked: new Date().toISOString()
        }
      ],
      criticalErrorCount: criticalErrorsQuery.count || 0,
      warningCount: warningsQuery.count || 0
    });
  } catch (error) {
    return createErrorResponse(
      ServiceErrorType.UNKNOWN_ERROR,
      'Failed to check system health',
      error
    );
  }
}

/**
 * Update error status
 */
export async function updateErrorStatus(
  errorId: string,
  status: 'acknowledged' | 'resolved',
  resolution?: string
): Promise<ServiceResponse<SystemError>> {
  try {
    const { data, error } = await supabase
      .from('system_errors')
      .update({
        status,
        resolution,
        updated_at: new Date().toISOString()
      })
      .eq('id', errorId)
      .select()
      .single();
    
    if (error) {
      return createErrorResponse(
        ServiceErrorType.DATABASE_ERROR,
        'Failed to update error status',
        error
      );
    }
    
    // Log the action to audit log
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        await logAdminAction(
          AuditAction.UPDATE,
          AuditResource.SETTING,
          `error-${errorId}`,
          { status, resolution }
        );
      }
    } catch (err) {
      // Don't fail if audit logging fails
      console.warn('Failed to log audit event for error status update:', err);
    }
    
    return createSuccessResponse(data as SystemError);
  } catch (error) {
    return createErrorResponse(
      ServiceErrorType.UNKNOWN_ERROR,
      'An unexpected error occurred while updating error status',
      error
    );
  }
}

/**
 * Automatic error recovery - attempt to recover from common error scenarios
 */
export async function attemptErrorRecovery(
  errorId: string
): Promise<ServiceResponse<{ recovered: boolean; message: string }>> {
  try {
    // Get the error details
    const { data: errorData, error: fetchError } = await supabase
      .from('system_errors')
      .select('*')
      .eq('id', errorId)
      .single();
    
    if (fetchError || !errorData) {
      return createErrorResponse(
        ServiceErrorType.NOT_FOUND,
        'Error not found',
        fetchError
      );
    }
    
    const error = errorData as SystemError;
    
    // Check if already resolved
    if (error.status === 'resolved') {
      return createSuccessResponse({
        recovered: true,
        message: 'Error was already resolved'
      });
    }
    
    // Try to recover based on component and error message
    let recovered = false;
    let message = 'No automatic recovery available for this error type';
    
    if (error.component === 'SlotService' && error.message.includes('database connection')) {
      // For database connection issues, we can try reconnecting
      try {
        await supabase.rpc('ping_database');
        recovered = true;
        message = 'Successfully reconnected to database';
      } catch (e) {
        message = 'Failed to recover: database still unreachable';
      }
    } else if (error.component === 'ImageUpload' && error.message.includes('storage')) {
      // For storage issues, we can try clearing temp files
      try {
        await supabase.rpc('clear_temp_storage');
        recovered = true;
        message = 'Successfully cleared temporary storage';
      } catch (e) {
        message = 'Failed to recover: could not clear temporary storage';
      }
    } else if (error.component?.includes('Cache') && error.message.includes('cache')) {
      // For cache issues, we can try clearing the cache
      localStorage.removeItem('app_cache');
      recovered = true;
      message = 'Successfully cleared local cache';
    }
    
    // Update error status if recovered
    if (recovered) {
      await supabase
        .from('system_errors')
        .update({
          status: 'resolved',
          resolution: `Automatic recovery: ${message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', errorId);
    }
    
    return createSuccessResponse({ recovered, message });
  } catch (error) {
    return createErrorResponse(
      ServiceErrorType.UNKNOWN_ERROR,
      'Failed to attempt error recovery',
      error
    );
  }
}

// Export a singleton instance
export const ErrorMonitoring = {
  logSystemError,
  getSystemErrors,
  getSystemHealth,
  updateErrorStatus,
  attemptErrorRecovery,
  ErrorSeverity
};

export default ErrorMonitoring; 