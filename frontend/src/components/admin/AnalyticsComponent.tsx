import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../store/LanguageContext';
import { AnalyticsMetrics, getAnalyticsMetrics } from '../../services/adminMetrics';
import { Line, Bar } from 'react-chartjs-2';
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
} from 'chart.js';
import { toast } from '../../utils/toast';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsComponentProps {
  dateRange?: { startDate: Date; endDate: Date };
  className?: string;
}

const AnalyticsComponent: React.FC<AnalyticsComponentProps> = ({ 
  dateRange,
  className = ''
}) => {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  
  // Text content
  const text = {
    analytics: { en: 'Analytics', fr: 'Analytique' },
    dateRanges: {
      last7Days: { en: 'Last 7 Days', fr: 'Les 7 derniers jours' },
      last30Days: { en: 'Last 30 Days', fr: 'Les 30 derniers jours' },
      last90Days: { en: 'Last 90 Days', fr: 'Les 90 derniers jours' },
      custom: { en: 'Custom Range', fr: 'Période personnalisée' }
    },
    metrics: {
      totalViews: { en: 'Total Views', fr: 'Vues totales' },
      uniqueVisitors: { en: 'Unique Visitors', fr: 'Visiteurs uniques' },
      whatsappClicks: { en: 'WhatsApp Clicks', fr: 'Clics WhatsApp' },
      conversionRate: { en: 'Conversion Rate', fr: 'Taux de conversion' }
    },
    charts: {
      viewsByDate: { en: 'Views by Date', fr: 'Vues par date' },
      clicksByDate: { en: 'Clicks by Date', fr: 'Clics par date' },
      viewsBySlot: { en: 'Views by Slot', fr: 'Vues par emplacement' },
      clicksBySlot: { en: 'Clicks by Slot', fr: 'Clics par emplacement' }
    },
    loading: { en: 'Loading analytics data...', fr: 'Chargement des données analytiques...' },
    errorLoading: { en: 'Error loading analytics data', fr: 'Erreur lors du chargement des données analytiques' },
    noData: { en: 'No data available for the selected period', fr: 'Aucune donnée disponible pour la période sélectionnée' },
    refresh: { en: 'Refresh', fr: 'Actualiser' },
    views: { en: 'Views', fr: 'Vues' },
    clicks: { en: 'Clicks', fr: 'Clics' },
    slot: { en: 'Slot', fr: 'Emplacement' }
  };

  // Calculate date range based on selection
  const getDateRangeFromSelection = (): { startDate: Date; endDate: Date } => {
    const endDate = new Date();
    let startDate: Date;
    
    switch (selectedDateRange) {
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        return dateRange || {
          startDate: new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000),
          endDate
        };
      case '30d':
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return { startDate, endDate };
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentDateRange = getDateRangeFromSelection();
      const data = await getAnalyticsMetrics(currentDateRange);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching analytics:', err);
      toast.error(t(text.errorLoading));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedDateRange, dateRange]);

  const handleRefresh = () => {
    fetchAnalytics();
  };

  const handleDateRangeChange = (range: '7d' | '30d' | '90d' | 'custom') => {
    setSelectedDateRange(range);
  };

  // Prepare charts data
  const prepareViewsChartData = () => {
    if (!metrics) return null;
    
    const dates = Object.keys(metrics.viewsByDate).sort();
    const viewsData = dates.map(date => metrics.viewsByDate[date] || 0);
    const clicksData = dates.map(date => metrics.clicksByDate[date] || 0);
    
    return {
      labels: dates.map(date => {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      }),
      datasets: [
        {
          label: t(text.views),
          data: viewsData,
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          tension: 0.1
        },
        {
          label: t(text.clicks),
          data: clicksData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1
        }
      ]
    };
  };

  const prepareSlotChartData = () => {
    if (!metrics) return null;
    
    const slotIds = Array.from(
      new Set([
        ...Object.keys(metrics.viewsBySlot),
        ...Object.keys(metrics.clicksBySlot)
      ])
    ).map(Number).sort((a, b) => a - b);
    
    const viewsData = slotIds.map(id => metrics.viewsBySlot[id] || 0);
    const clicksData = slotIds.map(id => metrics.clicksBySlot[id] || 0);
    
    return {
      labels: slotIds.map(id => `${t(text.slot)} ${id}`),
      datasets: [
        {
          label: t(text.views),
          data: viewsData,
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: t(text.clicks),
          data: clicksData,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        }
      ]
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">{t(text.loading)}</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <ErrorMessage
          title={t(text.errorLoading)}
          message={error}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  // No data state
  if (!metrics) {
    return (
      <div className={`p-4 ${className}`}>
        <ErrorMessage
          title={t(text.noData)}
          message=""
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  const viewsChartData = prepareViewsChartData();
  const slotChartData = prepareSlotChartData();

  return (
    <div className={`analytics-component ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 md:mb-0">
          {t(text.analytics)}
        </h2>
        
        {/* Date range selector */}
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              className={`px-3 py-1 text-sm font-medium rounded ${
                selectedDateRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } transition-colors`}
              onClick={() => handleDateRangeChange(range)}
            >
              {t(text.dateRanges[
                range === '7d' ? 'last7Days' : 
                range === '30d' ? 'last30Days' : 'last90Days'
              ])}
            </button>
          ))}
          {dateRange && (
            <button
              className={`px-3 py-1 text-sm font-medium rounded ${
                selectedDateRange === 'custom'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } transition-colors`}
              onClick={() => handleDateRangeChange('custom')}
            >
              {t(text.dateRanges.custom)}
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            aria-label={t(text.refresh)}
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">{t(text.metrics.totalViews)}</div>
          <div className="text-2xl font-semibold">{metrics.totalViews.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">{t(text.metrics.uniqueVisitors)}</div>
          <div className="text-2xl font-semibold">{metrics.uniqueVisitors.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">{t(text.metrics.whatsappClicks)}</div>
          <div className="text-2xl font-semibold">{metrics.whatsappClicks.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">{t(text.metrics.conversionRate)}</div>
          <div className="text-2xl font-semibold">{metrics.conversionRate.toFixed(1)}%</div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="space-y-6">
        {/* Views by date chart */}
        {viewsChartData && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              {t(text.charts.viewsByDate)}
            </h3>
            <div className="h-64">
              <Line
                data={viewsChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
        
        {/* Views by slot chart */}
        {slotChartData && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              {t(text.charts.viewsBySlot)}
            </h3>
            <div className="h-64">
              <Bar
                data={slotChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsComponent; 