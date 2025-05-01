import React, { useState, useEffect } from "react";
import BackToDashboard from "./BackToDashboard";
import ConfirmDialogProvider from "../ui/ConfirmDialog";
import { useLanguage } from "../../store/LanguageContext";
import { Tab } from "@headlessui/react";
import Loading from "../ui/Loading";
import ErrorDisplay from "../ui/ErrorDisplay";
import { OverviewTab } from "./tabs/OverviewTab";
import ApprovalsTab from "./tabs/ApprovalsTab";
import ProductsTab from "./tabs/ProductsTab";
import { useAdminDashboardData } from "../../hooks/useAdminDashboardData";
import AnalyticsTab from "./tabs/AnalyticsTab";

// Tab interface
interface DashboardTab {
  key: string;
  titleKey: { en: string; fr: string };
  component: React.ReactNode;
}

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Use the dashboard data hook
  const { stats, pendingApprovalsCount, loading, error, refresh, refreshPendingCount, refreshStats } = useAdminDashboardData();

  // Define tabs with their components
  const tabs: DashboardTab[] = [
    {
      key: "overview",
      titleKey: { en: "Overview", fr: "Aperçu" },
      component: <OverviewTab stats={stats} pendingApprovalsCount={pendingApprovalsCount} />,
    },
    {
      key: "approvals",
      titleKey: { en: "Approvals", fr: "Approbations" },
      component: <ApprovalsTab 
        stats={stats}
        pendingApprovalsCount={pendingApprovalsCount}
        refreshPendingCount={refreshPendingCount}
        refreshStats={refreshStats}
      />,
    },
    {
      key: "analytics",
      titleKey: { en: "Analytics", fr: "Analytique" },
      component: <AnalyticsTab />,
    },
    {
      key: "products",
      titleKey: { en: "Products", fr: "Produits" },
      component: <ProductsTab />,
    },
  ];

  // If error, display error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={refresh} />;
  }

  return (
    <ConfirmDialogProvider>
      {/* 
        Note: We're wrapping the entire dashboard with ConfirmDialogProvider,
        but some tab components may also need their own providers to ensure
        proper context propagation through Headless UI components.
      */}
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t({ en: "Admin Dashboard", fr: "Tableau de Bord Admin" })}
        </h1>
        
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
            {tabs.map((tab) => (
              <Tab
                key={tab.key}
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                  ${
                    selected
                      ? "bg-white shadow text-indigo-700"
                      : "text-gray-700 hover:bg-white/[0.12] hover:text-gray-900"
                  }`
                }
              >
                {t(tab.titleKey)}
                {tab.key === "approvals" && pendingApprovalsCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {pendingApprovalsCount}
                  </span>
                )}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-2">
            {tabs.map((tab, idx) => (
              <Tab.Panel
                key={tab.key}
                className={`rounded-xl bg-white p-3
                  focus:outline-none focus:ring-2 ring-offset-2 ring-offset-indigo-400 ring-white ring-opacity-60`}
              >
                {loading && idx === selectedIndex ? (
                  <Loading text={t({ en: "Loading dashboard data...", fr: "Chargement des données..." })} />
                ) : (
                  tab.component
                )}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </ConfirmDialogProvider>
  );
};

export default AdminDashboard; 