import supabase from './supabase';
import { UserProfile } from '../types/auth';

export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  APPROVE = 'approve',
  REJECT = 'reject'
}

export enum AuditResource {
  ADMIN = 'admin',
  USER = 'user',
  PRODUCT = 'product',
  SLOT = 'slot',
  SETTING = 'setting'
}

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: Record<string, any>;
  created_at?: string;
}

/**
 * Log an admin action with fallback to prevent recursion errors
 */
export const logAdminAction = async (
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      console.warn('Cannot log admin action: User not authenticated');
      return;
    }

    const logEntry: AuditLogEntry = {
      user_id: userId,
      action,
      resource,
      resource_id: resourceId,
      details,
      created_at: new Date().toISOString()
    };

    // To avoid recursion issues, we use the RPC method instead of direct table access
    // This bypasses the problematic RLS policy
    const { error } = await supabase.rpc('log_admin_action', {
      log_entry: logEntry
    });

    if (error) {
      // Fallback: If RPC method doesn't exist or fails, try direct insert with additional param to break recursion
      const fallbackResult = await supabase
        .from('admin_audit_logs')
        .insert({ ...logEntry, skip_rls_check: true });
      
      if (fallbackResult.error) {
        // If we still get an error, log it but don't block the UI
        console.warn('Error logging admin action:', fallbackResult.error);
        console.info('Admin Audit Log (not saved):', logEntry);
      }
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
  getAuditLogs
}; 