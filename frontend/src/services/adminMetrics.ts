import { supabase } from '../lib/supabaseClient';

export interface DashboardMetrics {
  activeSlots: number;
  totalProducts: number;
  pendingApprovals: number;
  usersCount: number;
  totalViews: number;
  whatsappClicks: number;
}

export interface AnalyticsMetrics {
  viewsByDate: Record<string, number>;
  clicksByDate: Record<string, number>;
  viewsBySlot: Record<number, number>;
  clicksBySlot: Record<number, number>;
  totalViews: number;
  uniqueVisitors: number;
  whatsappClicks: number;
  conversionRate: number;
}

export const getAdminMetrics = async (): Promise<DashboardMetrics> => {
  try {
    // Get active slots count
    const { count: activeSlots } = await supabase
      .from('auction_slots')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get total products count
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get pending approvals count
    const { count: pendingApprovals } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get users count
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get analytics totals
    const { data: analytics } = await supabase
      .from('analytics_events')
      .select('event_type')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const totalViews = analytics?.filter(event => event.event_type === 'product_view').length || 0;
    const whatsappClicks = analytics?.filter(event => event.event_type === 'whatsapp_contact').length || 0;

    return {
      activeSlots: activeSlots || 0,
      totalProducts: totalProducts || 0,
      pendingApprovals: pendingApprovals || 0,
      usersCount: usersCount || 0,
      totalViews,
      whatsappClicks
    };
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    throw error;
  }
};

export const getAnalyticsMetrics = async (dateRange?: { startDate: Date; endDate: Date }): Promise<AnalyticsMetrics> => {
  try {
    const startDate = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.endDate || new Date();

    // Get analytics events within date range
    const { data: events } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (!events) {
      throw new Error('No analytics data found');
    }

    // Process events into metrics
    const viewsByDate: Record<string, number> = {};
    const clicksByDate: Record<string, number> = {};
    const viewsBySlot: Record<number, number> = {};
    const clicksBySlot: Record<number, number> = {};
    const uniqueVisitors = new Set();

    events.forEach(event => {
      const date = event.created_at.split('T')[0];
      const isView = event.event_type === 'product_view';
      const isClick = event.event_type === 'whatsapp_contact';

      if (isView) {
        viewsByDate[date] = (viewsByDate[date] || 0) + 1;
        if (event.slot_id) {
          viewsBySlot[event.slot_id] = (viewsBySlot[event.slot_id] || 0) + 1;
        }
        if (event.ip_address) {
          uniqueVisitors.add(event.ip_address);
        }
      }

      if (isClick) {
        clicksByDate[date] = (clicksByDate[date] || 0) + 1;
        if (event.slot_id) {
          clicksBySlot[event.slot_id] = (clicksBySlot[event.slot_id] || 0) + 1;
        }
      }
    });

    const totalViews = Object.values(viewsByDate).reduce((a, b) => a + b, 0);
    const totalClicks = Object.values(clicksByDate).reduce((a, b) => a + b, 0);
    const conversionRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    return {
      viewsByDate,
      clicksByDate,
      viewsBySlot,
      clicksBySlot,
      totalViews,
      uniqueVisitors: uniqueVisitors.size,
      whatsappClicks: totalClicks,
      conversionRate
    };
  } catch (error) {
    console.error('Error fetching analytics metrics:', error);
    throw error;
  }
};

export const getAdminAuditLogs = async (limit = 10) => {
  try {
    const { data: logs } = await supabase
      .from('admin_audit_logs')
      .select(`
        id,
        user_id,
        action,
        resource,
        resource_id,
        details,
        created_at,
        admin:admin_users(email, name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    return logs || [];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}; 