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

interface AuditLogEntry {
  user_id: string;
  action: AuditAction;
  resource: AuditResource;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export const logAdminAction = async (
  user: UserProfile,
  action: AuditAction,
  resource: AuditResource,
  resourceId?: string,
  details?: Record<string, any>
) => {
  try {
    const entry: AuditLogEntry = {
      user_id: user.id,
      action,
      resource,
      resource_id: resourceId,
      details,
      ip_address: await fetchIpAddress(),
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('admin_audit_logs')
      .insert(entry);

    if (error) {
      console.error('Error logging admin action:', error);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Admin Audit Log:', {
        ...entry,
        user_email: user.email,
        user_role: user.role
      });
    }
  } catch (error) {
    console.error('Error in audit logging:', error);
  }
};

// Helper function to get client IP address
const fetchIpAddress = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching IP address:', error);
    return 'unknown';
  }
}; 