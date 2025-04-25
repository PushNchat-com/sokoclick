import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../store/LanguageContext';
import { DashboardMetrics as Metrics, getAdminMetrics } from '../../services/adminMetrics';
import { toast } from '../../utils/toast';

interface DashboardMetricsProps {
  className?: string;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Text content
  const text = {
    activeSlots: { en: 'Active Slots', fr: 'Emplacements actifs' },
    totalProducts: { en: 'Total Products', fr: 'Total des produits' },
    pendingApprovals: { en: 'Pending Approvals', fr: 'Approbations en attente' },
    usersCount: { en: 'Registered Users', fr: 'Utilisateurs enregistrés' },
    totalViews: { en: 'Total Views', fr: 'Vues totales' },
    whatsappClicks: { en: 'WhatsApp Clicks', fr: 'Clics WhatsApp' },
    slotCapacity: { en: 'Slot Capacity', fr: 'Capacité d\'emplacement' },
    ofSlots: { en: 'of 25 slots', fr: 'sur 25 emplacements' },
    error: { en: 'Error loading metrics', fr: 'Erreur lors du chargement des métriques' }
  };

  // Fetch metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAdminMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError(t(text.error));
        toast.error(t(text.error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // Function to render a metric card with loading state
  const renderMetricCard = (
    title: { en: string; fr: string },
    value: string | number,
    subtitle?: { en: string; fr: string },
    colorClass: string = 'text-blue-600'
  ) => {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            </div>
          ) : (
            <>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {t(title)}
              </dt>
              <dd className={`mt-1 text-3xl font-semibold ${colorClass}`}>
                {value}
              </dd>
              {subtitle && (
                <dd className="mt-1 text-sm text-gray-500">
                  {t(subtitle)}
                </dd>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={`metrics-grid ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Slots */}
        {renderMetricCard(
          text.activeSlots,
          metrics ? `${metrics.activeSlots}/25` : '-',
          text.slotCapacity,
          metrics?.activeSlots > 20 ? 'text-green-600' : 'text-blue-600'
        )}
        
        {/* Total Products */}
        {renderMetricCard(
          text.totalProducts,
          metrics?.totalProducts || '-'
        )}
        
        {/* Pending Approvals */}
        {renderMetricCard(
          text.pendingApprovals,
          metrics?.pendingApprovals || '-',
          undefined,
          metrics?.pendingApprovals > 0 ? 'text-yellow-600' : 'text-green-600'
        )}
        
        {/* User Count */}
        {renderMetricCard(
          text.usersCount,
          metrics?.usersCount || '-'
        )}
        
        {/* Total Views */}
        {renderMetricCard(
          text.totalViews,
          metrics ? metrics.totalViews.toLocaleString() : '-'
        )}
        
        {/* WhatsApp Conversion */}
        {renderMetricCard(
          text.whatsappClicks,
          metrics ? `${metrics.whatsappClicks.toLocaleString()} (${((metrics.whatsappClicks / metrics.totalViews) * 100).toFixed(1)}%)` : '-',
          undefined,
          'text-whatsapp-green'
        )}
      </div>
    </div>
  );
};

export default DashboardMetrics;
