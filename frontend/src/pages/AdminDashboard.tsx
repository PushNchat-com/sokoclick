import { FC } from "react";
import { Tab } from "@headlessui/react";
import { useLanguage } from "../store/LanguageContext";
// import { useUnifiedAuth } from '../contexts/UnifiedAuthContext'; // Keep if needed for permissions
// import { useSlotStats } from '../services/slots';
// import { analyticsService, Activity, AnalyticsUpdate } from '../services/analytics';
import ErrorMessage from "../components/ui/ErrorMessage";
import LoadingSpinner from "../components/ui/LoadingSpinner";
// import { toast } from 'react-hot-toast'; // Moved to hook

// Import the new hook
import { useAdminDashboardData } from "../hooks/useAdminDashboardData";

// Import the tab components
import OverviewTab from "../components/admin/tabs/OverviewTab";
import ApprovalsTab from "../components/admin/tabs/ApprovalsTab";
import AnalyticsTab from "../components/admin/tabs/AnalyticsTab";
import ProductsTab from "../components/admin/tabs/ProductsTab";

// Remove imports handled by child components
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs'; // Unused custom tabs
// import DashboardMetrics from '../components/admin/DashboardMetrics'; // Moved to OverviewTab
// import SlotGridConnected from '../components/admin/SlotGridConnected'; // Likely belongs in ProductsTab?
// import ProductApprovalWorkflow from '../components/admin/ProductApprovalWorkflow'; // Now using SlotManagement in ApprovalsTab
// import StorageInitializer from '../components/admin/StorageInitializer'; // Where should this go? Maybe ProductsTab or a dedicated Settings tab?
// import SlotImageUploader from '../components/admin/SlotImageUploader'; // Likely belongs in ProductsTab?

// Lazy loaded components - moved to AnalyticsTab
// const AnalyticsComponent = lazyWithSpinner(() => import('../components/admin/AnalyticsComponent'));

// Translation strings
const translations = {
  title: {
    en: "Admin Dashboard",
    fr: "Tableau de Bord Admin",
  },
  tabs: {
    overview: {
      en: "Overview",
      fr: "Aperçu",
    },
    approvals: {
      en: "Approvals",
      fr: "Approbations",
    },
    analytics: {
      en: "Analytics",
      fr: "Analytique",
    },
    products: {
      en: "Products",
      fr: "Produits",
    },
  },
  // Removed errors.fetchFailed as errors handled within hook
};

const AdminDashboard: FC = () => {
  const { t } = useLanguage();
  // const { user } = useUnifiedAuth(); // Keep if needed for permissions

  // Use the custom hook to get all data and states
  const {
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
    refreshActivities, // Added refresh handlers
    refreshDetailedAnalytics,
    refreshPendingCount,
    setDateRange, // Added date range setter
  } = useAdminDashboardData();

  if (error) {
    // Potentially add a refresh button that calls refreshStats?
    return <ErrorMessage message={error} />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">{t(translations.title)}</h1>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          <Tab className="tab-button">{t(translations.tabs.overview)}</Tab>
          <Tab className="tab-button">{t(translations.tabs.approvals)}</Tab>
          <Tab className="tab-button">{t(translations.tabs.analytics)}</Tab>
          <Tab className="tab-button">{t(translations.tabs.products)}</Tab>
        </Tab.List>

        <Tab.Panels className="mt-4">
          {/* Overview Panel */}
          <Tab.Panel>
            {/* Pass activities, stats, metrics, and pending count */}
            <OverviewTab
              activities={activities}
              stats={stats}
              metrics={metrics}
              pendingApprovalsCount={pendingApprovalsCount}
            />
          </Tab.Panel>

          {/* Approvals Panel */}
          <Tab.Panel>
            {/* Pass stats and pending count for potential display/filtering */}
            {/* Refresh handlers might be useful if actions trigger counts */}
            <ApprovalsTab
              stats={stats}
              pendingApprovalsCount={pendingApprovalsCount}
              refreshPendingCount={refreshPendingCount}
              refreshStats={refreshStats}
            />
          </Tab.Panel>

          {/* Analytics Panel */}
          <Tab.Panel>
            {/* Pass detailed analytics, date range state, and setter */}
            <AnalyticsTab
              analyticsData={detailedAnalytics}
              startDate={startDate}
              endDate={endDate}
              setDateRange={setDateRange}
              refreshAnalytics={refreshDetailedAnalytics}
            />
          </Tab.Panel>

          {/* Products Panel */}
          <Tab.Panel>
            {/* Pass stats and refreshStats for general slot info */}
            <ProductsTab stats={stats} refreshStats={refreshStats} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default AdminDashboard;
