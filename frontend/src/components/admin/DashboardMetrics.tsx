import React from "react";
import { useLanguage } from "../../store/LanguageContext";
import { toast } from "../../utils/toast";
import { cn } from "../../utils/cn";
import { useAdminDashboardData } from "../../hooks/useAdminDashboardData";

interface DashboardMetricsProps {
  stats: ReturnType<typeof useAdminDashboardData>["stats"];
  metrics: ReturnType<typeof useAdminDashboardData>["metrics"];
  pendingApprovalsCount: number;
  className?: string;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  stats,
  metrics,
  pendingApprovalsCount,
  className = "",
}) => {
  const { t } = useLanguage();

  // Text content
  const text = {
    activeSlots: { en: "Active Slots", fr: "Emplacements actifs" },
    totalProducts: { en: "Total Products", fr: "Total des produits" },
    pendingApprovals: {
      en: "Pending Approvals",
      fr: "Approbations en attente",
    },
    usersCount: { en: "Registered Users", fr: "Utilisateurs enregistrés" },
    totalViews: { en: "Total Views", fr: "Vues totales" },
    whatsappClicks: { en: "WhatsApp Clicks", fr: "Clics WhatsApp" },
    slotCapacity: { en: "Slot Capacity", fr: "Capacité d'emplacement" },
    ofSlots: { en: "of 25 slots", fr: "sur 25 emplacements" },
    error: {
      en: "Error loading metrics",
      fr: "Erreur lors du chargement des métriques",
    },
    loading: {
      en: "Loading dashboard metrics...",
      fr: "Chargement des métriques du tableau de bord...",
    },
  };

  // Function to render a metric card with loading state
  const renderMetricCard = (
    title: { en: string; fr: string },
    value: string | number,
    subtitle?: { en: string; fr: string },
    colorClass: string = "text-blue-600",
  ) => {
    return (
      <div
        className="bg-white overflow-hidden shadow rounded-lg"
        role="region"
        aria-label={t(title)}
      >
        <div className="px-4 py-5 sm:p-6">
          <>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {t(title)}
            </dt>
            <dd className={cn("mt-1 text-3xl font-semibold", colorClass)}>
              {value ?? "-"}
            </dd>
            {subtitle && (
              <dd className="mt-1 text-sm text-gray-500">{t(subtitle)}</dd>
            )}
          </>
        </div>
      </div>
    );
  };

  const activeSlots = stats?.live ?? 0;
  const totalViews = metrics?.totalViews ?? 0;
  const whatsappClicks = metrics?.whatsappClicks ?? 0;

  // Determine total products - This info isn't directly available from stats/metrics props yet.
  // Need to decide if this metric is still needed or how to derive it.
  // For now, displaying '-'
  const totalProductsDisplay = "-"; // Placeholder

  // User count isn't available from the current props either.
  const usersCountDisplay = "-"; // Placeholder

  return (
    <div className={cn("metrics-grid", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Slots */}
        {renderMetricCard(
          text.activeSlots,
          stats ? `${stats.live}/25` : "-",
          text.slotCapacity,
          stats && stats.live > 20 ? "text-green-600" : "text-blue-600",
        )}

        {/* Total Products */}
        {renderMetricCard(text.totalProducts, totalProductsDisplay)}

        {/* Pending Approvals */}
        {renderMetricCard(
          text.pendingApprovals,
          pendingApprovalsCount ?? "-",
          undefined,
          pendingApprovalsCount > 0 ? "text-yellow-600" : "text-green-600",
        )}

        {/* User Count */}
        {renderMetricCard(text.usersCount, usersCountDisplay)}

        {/* Total Views */}
        {renderMetricCard(
          text.totalViews,
          metrics ? totalViews.toLocaleString() : "-",
        )}

        {/* WhatsApp Conversion */}
        {renderMetricCard(
          text.whatsappClicks,
          // Ensure totalViews is not zero before dividing
          metrics && totalViews > 0
            ? `${whatsappClicks.toLocaleString()} (${((whatsappClicks / totalViews) * 100).toFixed(1)}%)`
            : metrics
              ? whatsappClicks.toLocaleString()
              : "-",
          undefined,
          "text-whatsapp-green",
        )}
      </div>
    </div>
  );
};

export default DashboardMetrics;
