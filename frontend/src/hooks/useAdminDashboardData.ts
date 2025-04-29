import { useState, useEffect, useCallback } from "react";
import { useSlotStats } from "@/services/slots";
import {
  analyticsService,
  Activity,
  AnalyticsUpdate,
  DetailedAnalyticsData,
} from "@/services/analytics";
import { supabase } from "@/services/supabase";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/store/LanguageContext";
import { subDays } from "date-fns";

// Define a type for the metrics derived primarily from analytics updates
interface DashboardMetrics {
  totalViews: number;
  whatsappClicks: number;
}

// Define the return type of the hook
interface AdminDashboardData {
  activities: Activity[];
  stats: ReturnType<typeof useSlotStats>["stats"];
  metrics: DashboardMetrics;
  detailedAnalytics: DetailedAnalyticsData | null;
  pendingApprovalsCount: number;
  startDate: Date;
  endDate: Date;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => void;
  refreshActivities: () => void;
  refreshDetailedAnalytics: () => void;
  refreshPendingCount: () => void;
  setDateRange: (start: Date, end: Date) => void;
}

// Translation strings for the hook
const hookTranslations = {
  errors: {
    fetchActivitiesFailed: {
      en: "Failed to fetch recent activities",
      fr: "Échec du chargement des activités récentes",
    },
  },
};

export const useAdminDashboardData = (): AdminDashboardData => {
  const { t } = useLanguage();
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useSlotStats();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState<boolean>(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [activitiesRefreshTrigger, setActivitiesRefreshTrigger] = useState(0);

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalViews: 0,
    whatsappClicks: 0,
  });

  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const [detailedAnalytics, setDetailedAnalytics] =
    useState<DetailedAnalyticsData | null>(null);
  const [detailedAnalyticsLoading, setDetailedAnalyticsLoading] =
    useState<boolean>(true);
  const [detailedAnalyticsError, setDetailedAnalyticsError] = useState<
    string | null
  >(null);
  const [detailedAnalyticsRefreshTrigger, setDetailedAnalyticsRefreshTrigger] =
    useState(0);

  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [pendingCountLoading, setPendingCountLoading] = useState<boolean>(true);
  const [pendingCountError, setPendingCountError] = useState<string | null>(
    null,
  );
  const [pendingCountRefreshTrigger, setPendingCountRefreshTrigger] =
    useState(0);

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const recentActivities = await analyticsService.getRecentActivities();
      setActivities(recentActivities);
    } catch (err) {
      console.error("Fetch activities error:", err);
      const errorMsg = t(hookTranslations.errors.fetchActivitiesFailed);
      setActivitiesError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setActivitiesLoading(false);
    }
  }, [t]);

  const refreshActivities = useCallback(
    () => setActivitiesRefreshTrigger((t) => t + 1),
    [],
  );

  const fetchDetailedAnalytics = useCallback(async () => {
    setDetailedAnalyticsLoading(true);
    setDetailedAnalyticsError(null);
    try {
      const data = await analyticsService.getDetailedAnalytics(
        startDate,
        endDate,
      );
      setDetailedAnalytics(data);
    } catch (err) {
      console.error("Fetch detailed analytics error:", err);
      const errorMsg = t({
        en: "Failed to load detailed analytics",
        fr: "Échec du chargement des analyses détaillées",
      });
      setDetailedAnalyticsError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setDetailedAnalyticsLoading(false);
    }
  }, [startDate, endDate, t]);

  const refreshDetailedAnalytics = useCallback(
    () => setDetailedAnalyticsRefreshTrigger((t) => t + 1),
    [],
  );

  const fetchPendingCount = useCallback(async () => {
    setPendingCountLoading(true);
    setPendingCountError(null);
    try {
      const { count, error } = await supabase
        .from("auction_slots")
        .select("*", { count: "exact", head: true })
        .eq("draft_status", "ready_to_publish");

      if (error) throw error;
      setPendingApprovalsCount(count ?? 0);
    } catch (err) {
      console.error("Fetch pending count error:", err);
      const errorMsg = t({
        en: "Failed to load pending count",
        fr: "Échec du chargement du nombre d'approbations en attente",
      });
      setPendingCountError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setPendingCountLoading(false);
    }
  }, [t]);

  const refreshPendingCount = useCallback(
    () => setPendingCountRefreshTrigger((t) => t + 1),
    [],
  );

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities, activitiesRefreshTrigger]);

  useEffect(() => {
    fetchDetailedAnalytics();
  }, [fetchDetailedAnalytics, detailedAnalyticsRefreshTrigger]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount, pendingCountRefreshTrigger]);

  useEffect(() => {
    const subscription = analyticsService.subscribeToUpdates(
      (update: AnalyticsUpdate) => {
        setMetrics((current) => ({
          ...current,
          totalViews: update.totalViews ?? current.totalViews,
          whatsappClicks: update.whatsappClicks ?? current.whatsappClicks,
        }));
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setDateRange = useCallback((start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    setDetailedAnalyticsRefreshTrigger((t) => t + 1);
  }, []);

  const isLoading =
    statsLoading ||
    activitiesLoading ||
    detailedAnalyticsLoading ||
    pendingCountLoading;
  const error =
    statsError ||
    activitiesError ||
    detailedAnalyticsError ||
    pendingCountError;

  return {
    activities,
    stats,
    metrics,
    detailedAnalytics,
    pendingApprovalsCount,
    startDate,
    endDate,
    isLoading,
    error,
    refreshStats,
    refreshActivities,
    refreshDetailedAnalytics,
    refreshPendingCount,
    setDateRange,
  };
};
