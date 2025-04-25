import { supabase } from './supabase';
import { AuditLogEntry } from './auditLog';

/**
 * Database RPC functions service
 * Used to bypass RLS policies that might cause recursion issues
 */
const rpcFunctions = {
  /**
   * Log an admin action using RPC to avoid recursion
   */
  logAdminAction: async (logEntry: AuditLogEntry): Promise<{ success: boolean; error: string | null }> => {
    try {
      // Try the RPC method first
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'log_admin_action',
        { log_entry: logEntry }
      );

      // If RPC exists and works, return success
      if (!rpcError) {
        return { success: true, error: null };
      }

      // If RPC doesn't exist or fails, try the fallback direct insert with bypass flag
      const { error } = await supabase
        .from('admin_audit_logs')
        .insert({ ...logEntry, skip_rls_check: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('Error in RPC log admin action:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Get available slots using RPC to avoid recursion
   */
  getAvailableSlots: async (): Promise<{ slots: number[]; error: string | null }> => {
    try {
      const { data, error } = await supabase.rpc('get_available_slots');

      if (error) {
        throw error;
      }

      return { slots: data || [], error: null };
    } catch (err) {
      console.error('Error getting available slots via RPC:', err);
      return { 
        slots: [], 
        error: err instanceof Error ? err.message : 'Failed to get available slots' 
      };
    }
  },

  /**
   * Get admin users using RPC to avoid recursion
   */
  getAdminUsers: async (): Promise<{ 
    users: any[]; 
    error: string | null 
  }> => {
    try {
      const { data, error } = await supabase.rpc('get_admin_users');

      if (error) {
        throw error;
      }

      return { users: data || [], error: null };
    } catch (err) {
      console.error('Error getting admin users via RPC:', err);
      return { 
        users: [], 
        error: err instanceof Error ? err.message : 'Failed to get admin users' 
      };
    }
  },

  /**
   * Fix admin users table recursion issues
   * This should be called by a super admin
   */
  fixAdminUsersRecursion: async (): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase.rpc('fix_admin_users_recursion');

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('Error fixing admin users recursion:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to fix recursion issues' 
      };
    }
  }
};

export default rpcFunctions; 