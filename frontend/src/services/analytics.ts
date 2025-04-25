import { supabase } from './supabase';

export type AnalyticsEvent = {
  id: string;
  event_type: string;
  slot_id?: number;
  product_id?: string;
  whatsapp_contact: boolean;
  language?: 'en' | 'fr';
  device_type?: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  additional_data?: Record<string, any>;
  created_at: string;
};

export type AnalyticsMetrics = {
  totalViews: number;
  uniqueVisitors: number;
  whatsappClicks: number;
  conversionRate: number;
  viewsBySlot: Record<number, number>;
  clicksBySlot: Record<number, number>;
  viewsByDate: Record<string, number>;
  clicksByDate: Record<string, number>;
};

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

const DEFAULT_RANGE = {
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  endDate: new Date()
};

export const analyticsService = {
  /**
   * Record a product view event
   */
  recordProductView: async (
    slotId: number,
    productId: string,
    language: 'en' | 'fr' = 'en',
    deviceInfo?: {
      deviceType?: string;
      userAgent?: string;
      ipAddress?: string;
      referrer?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.rpc('log_product_view', {
        p_slot_id: slotId,
        p_product_id: productId,
        p_language: language,
        p_device_type: deviceInfo?.deviceType || null,
        p_user_agent: deviceInfo?.userAgent || null,
        p_ip_address: deviceInfo?.ipAddress || null,
        p_referrer: deviceInfo?.referrer || null
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error recording product view:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error recording view' 
      };
    }
  },

  /**
   * Record a WhatsApp click event
   */
  recordWhatsappClick: async (
    slotId: number,
    productId: string,
    language: 'en' | 'fr' = 'en'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: 'whatsapp_click',
          slot_id: slotId,
          product_id: productId,
          whatsapp_contact: true,
          language,
          device_type: navigator.userAgent.indexOf('Mobile') !== -1 ? 'mobile' : 'desktop',
          user_agent: navigator.userAgent,
          referrer: document.referrer
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error recording WhatsApp click:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error recording click' 
      };
    }
  },

  /**
   * Get analytics metrics for the admin dashboard
   */
  getMetrics: async (dateRange: DateRange = DEFAULT_RANGE): Promise<AnalyticsMetrics> => {
    try {
      // Format dates for SQL query
      const startDate = dateRange.startDate.toISOString();
      const endDate = dateRange.endDate.toISOString();

      // Get total views and clicks
      const { data: viewsData, error: viewsError } = await supabase
        .from('analytics_events')
        .select('count(*)')
        .eq('event_type', 'product_view')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .single();

      if (viewsError) throw viewsError;

      const { data: clicksData, error: clicksError } = await supabase
        .from('analytics_events')
        .select('count(*)')
        .eq('event_type', 'whatsapp_click')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .single();

      if (clicksError) throw clicksError;

      // Get unique visitors count
      const { data: visitorsData, error: visitorsError } = await supabase.rpc(
        'get_unique_visitors_count',
        { start_date: startDate, end_date: endDate }
      );

      if (visitorsError) throw visitorsError;

      // Get views and clicks by slot
      const { data: slotMetrics, error: slotError } = await supabase.rpc(
        'get_slot_metrics',
        { start_date: startDate, end_date: endDate }
      );

      if (slotError) throw slotError;

      // Get views and clicks by date
      const { data: dateMetrics, error: dateError } = await supabase.rpc(
        'get_date_metrics',
        { start_date: startDate, end_date: endDate }
      );

      if (dateError) throw dateError;

      // Process metrics
      const totalViews = viewsData?.count || 0;
      const whatsappClicks = clicksData?.count || 0;
      const uniqueVisitors = visitorsData || 0;
      const conversionRate = totalViews > 0 ? (whatsappClicks / totalViews) * 100 : 0;

      // Process slot metrics
      const viewsBySlot: Record<number, number> = {};
      const clicksBySlot: Record<number, number> = {};

      (slotMetrics || []).forEach((metric: any) => {
        viewsBySlot[metric.slot_id] = metric.views || 0;
        clicksBySlot[metric.slot_id] = metric.clicks || 0;
      });

      // Process date metrics
      const viewsByDate: Record<string, number> = {};
      const clicksByDate: Record<string, number> = {};

      (dateMetrics || []).forEach((metric: any) => {
        const dateStr = new Date(metric.date).toISOString().split('T')[0];
        viewsByDate[dateStr] = metric.views || 0;
        clicksByDate[dateStr] = metric.clicks || 0;
      });

      return {
        totalViews,
        uniqueVisitors,
        whatsappClicks,
        conversionRate,
        viewsBySlot,
        clicksBySlot,
        viewsByDate,
        clicksByDate
      };
    } catch (error) {
      console.error('Error fetching analytics metrics:', error);
      return {
        totalViews: 0,
        uniqueVisitors: 0,
        whatsappClicks: 0,
        conversionRate: 0,
        viewsBySlot: {},
        clicksBySlot: {},
        viewsByDate: {},
        clicksByDate: {}
      };
    }
  }
};

export default analyticsService;
