import React from "react";
import { useLanguage } from "../../store/LanguageContext";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { toast } from "../../utils/toast";
import { AnalyticsMetrics } from "../../services/analytics";
import { Slot } from "../../services/slots";
import {
  formatDateTime,
} from "../../utils/formatters";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

interface AnalyticsComponentProps {
  analyticsData: AnalyticsMetrics | null;
  className?: string;
}

const AnalyticsComponent: React.FC<AnalyticsComponentProps> = ({
  analyticsData,
  className = "",
}) => {
  const { t } = useLanguage();

  // Text content
  const text = {
    analytics: { en: "Analytics", fr: "Analytique" },
    dateRanges: {
      last7Days: { en: "Last 7 Days", fr: "Les 7 derniers jours" },
      last30Days: { en: "Last 30 Days", fr: "Les 30 derniers jours" },
      last90Days: { en: "Last 90 Days", fr: "Les 90 derniers jours" },
      custom: { en: "Custom Range", fr: "Période personnalisée" },
    },
    metrics: {
      totalViews: { en: "Total Views", fr: "Vues totales" },
      uniqueVisitors: { en: "Unique Visitors", fr: "Visiteurs uniques" },
      whatsappClicks: { en: "WhatsApp Clicks", fr: "Clics WhatsApp" },
      conversionRate: { en: "Conversion Rate", fr: "Taux de conversion" },
    },
    charts: {
      viewsByDate: { en: "Views by Date", fr: "Vues par date" },
      clicksByDate: { en: "Clicks by Date", fr: "Clics par date" },
      viewsBySlot: { en: "Views by Slot", fr: "Vues par emplacement" },
      clicksBySlot: { en: "Clicks by Slot", fr: "Clics par emplacement" },
    },
    loading: {
      en: "Loading analytics data...",
      fr: "Chargement des données analytiques...",
    },
    errorLoading: {
      en: "Error loading analytics data",
      fr: "Erreur lors du chargement des données analytiques",
    },
    noData: {
      en: "No data available for the selected period",
      fr: "Aucune donnée disponible pour la période sélectionnée",
    },
    refresh: { en: "Refresh", fr: "Actualiser" },
    views: { en: "Views", fr: "Vues" },
    clicks: { en: "Clicks", fr: "Clics" },
    slot: { en: "Slot", fr: "Emplacement" },
  };

  // Prepare charts data
  const prepareViewsChartData = () => {
    if (!analyticsData?.viewsByDate) return null;

    const dates = Object.keys(analyticsData.viewsByDate).sort();
    const viewsData = dates.map((date) => analyticsData.viewsByDate[date] || 0);
    const clicksData = dates.map(
      (date) => analyticsData.clicksByDate?.[date] || 0,
    );

    return {
      labels: dates.map((date) => {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      }),
      datasets: [
        {
          label: t(text.views),
          data: viewsData,
          borderColor: "rgb(53, 162, 235)",
          backgroundColor: "rgba(53, 162, 235, 0.5)",
          tension: 0.1,
        },
        {
          label: t(text.clicks),
          data: clicksData,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          tension: 0.1,
        },
      ],
    };
  };

  const prepareSlotChartData = () => {
    if (!analyticsData) return null;

    const slotIds = Array.from(
      new Set([
        ...Object.keys(analyticsData.viewsBySlot || {}),
        ...Object.keys(analyticsData.clicksBySlot || {}),
      ]),
    )
      .map(Number)
      .sort((a, b) => a - b);

    const viewsData = slotIds.map((id) => analyticsData.viewsBySlot?.[id] || 0);
    const clicksData = slotIds.map(
      (id) => analyticsData.clicksBySlot?.[id] || 0,
    );

    return {
      labels: slotIds.map((id) => `${t(text.slot)} ${id}`),
      datasets: [
        {
          label: t(text.views),
          data: viewsData,
          backgroundColor: "rgba(53, 162, 235, 0.5)",
        },
        {
          label: t(text.clicks),
          data: clicksData,
          backgroundColor: "rgba(75, 192, 192, 0.5)",
        },
      ],
    };
  };

  // Get chart data based on props
  const viewsChartData = prepareViewsChartData();
  const slotChartData = prepareSlotChartData();

  // Render charts only if data is available
  if (!analyticsData || (!viewsChartData && !slotChartData)) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className}`}>
        {t(text.noData)}
      </div>
    );
  }

  return (
    <div className={`analytics-component ${className} space-y-8`}>
      {/* Views/Clicks by Date Chart */}
      {viewsChartData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            {t(text.charts.viewsByDate)}
          </h3>
          <div className="h-64 md:h-80">
            <Line
              data={viewsChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top" as const,
                  },
                  title: {
                    display: false,
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Views/Clicks by Slot Chart */}
      {slotChartData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            {t(text.charts.viewsBySlot)}
          </h3>
          <div className="h-64 md:h-80">
            <Bar
              data={slotChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top" as const,
                  },
                  title: {
                    display: false,
                  },
                },
                scales: {
                  x: {
                    stacked: true,
                  },
                  y: {
                    stacked: true,
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsComponent;
