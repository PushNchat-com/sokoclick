import { supabase } from './supabase';
import { handleServiceError, ServiceResponse, withRetry } from './serviceUtils';

// Enums for consistent audit logging
export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  ASSIGN = 'assign',
  UNASSIGN = 'unassign',
  LOGIN = 'login',
  LOGOUT = 'logout',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  VIEW = 'view'
}

export enum AuditResource {
  PRODUCT = 'product',
  SLOT = 'slot',
  DELIVERY_OPTION = 'delivery_option',
  USER = 'user',
  IMAGE = 'image',
  ORDER = 'order',
  SETTING = 'setting',
  CUSTOMER = 'customer',
  ADMIN = 'admin'
}

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  created_at?: string;
}

/**
 * Fetches audit logs with pagination and filtering options
 */
export async function fetchAuditLogs(options: {
  page?: number;
  pageSize?: number;
  resource?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ServiceResponse<{ logs: AuditLogEntry[]; count: number }>> {
  try {
    const {
      page = 1,
      pageSize = 20,
      resource,
      action,
      userId,
      startDate,
      endDate
    } = options;

    // Calculate pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    // Start building the query
    let query = supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (resource) {
      query = query.eq('resource', resource);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination and order
    query = query
      .order('created_at', { ascending: false })
      .range(start, end);

    // Execute the query with retry
    const result = await withRetry(() => {
      return Promise.resolve(query).then((response) => {
        return {
          data: response.data as AuditLogEntry[] | null,
          error: response.error,
          count: response.count
        };
      });
    });

    if (result.error) {
      return handleServiceError(result.error, 'fetchAuditLogs');
    }

    return {
      success: true,
      data: {
        logs: result.data || [],
        count: result.count || 0
      }
    };
  } catch (error) {
    return handleServiceError(error, 'fetchAuditLogs');
  }
}

/**
 * Log an admin action with fallback to prevent recursion errors
 */
export const logAdminAction = async (
  action: string,
  resource: string = AuditResource.ADMIN, // Default resource to ADMIN to prevent null
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      console.warn('Cannot log admin action: User not authenticated');
      return;
    }

    // Ensure resource is never undefined/null by using a fallback value
    const safeResource = resource || AuditResource.ADMIN;
    
    const logEntry: AuditLogEntry = {
      user_id: userId,
      action,
      resource: safeResource,
      resource_id: resourceId,
      details,
      created_at: new Date().toISOString()
    };

    // Just directly insert into the table instead of using RPC
    // This is simpler and avoids the 404 error when the RPC doesn't exist
    const { error } = await supabase
      .from('admin_audit_logs')
      .insert(logEntry);
    
    if (error) {
      // Log any errors but don't block the UI
      console.warn('Error logging admin action:', error);
      
      // If the table exists but we can't insert due to RLS, 
      // log the information for debugging but don't break the app
      console.info('Admin Audit Log (not saved):', logEntry);
      
      // Silence the error for the UI - audit logging should not block functionality
    }
  } catch (error) {
    // Log error but don't block UI functionality
    console.warn('Error in audit logging:', error);
  }
};

/**
 * Get audit logs for admin dashboard
 */
export const getAuditLogs = async (
  limit: number = 50,
  offset: number = 0
): Promise<{
  logs: AuditLogEntry[];
  error: string | null;
}> => {
  try {
    // Try to fetch logs directly
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return { logs: data || [], error: null };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return {
      logs: [],
      error: error instanceof Error ? error.message : 'Failed to fetch audit logs'
    };
  }
};

export default {
  logAdminAction,
  getAuditLogs,
  fetchAuditLogs
}; 