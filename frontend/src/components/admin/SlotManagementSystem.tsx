import React, {
  useState,
  useCallback,
  useMemo,
  Suspense,
  lazy,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../store/LanguageContext";
import { useUnifiedAuth } from "../../contexts/UnifiedAuthContext";
import { SlotStatus, Slot } from "../../services/slots";
import { toast } from "../../utils/toast";
import { PerformanceMonitor } from "../../services/core/PerformanceMonitor";
import {
  ErrorMonitoring,
  ErrorSeverity,
} from "../../services/core/ErrorMonitoring";

// Static imports for core components
import SlotControls from "./slot-management/SlotControls";
import SlotFilters from "./slot-management/SlotFilters";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/Tabs";
import { SkeletonLoader } from "../ui/SkeletonLoader";
import Dialog from "../ui/Dialog";
import { Notification, NotificationCenter } from "../ui/NotificationCenter";

// Icons (using inline SVGs instead of heroicons)
const InformationCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ExclamationCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-12 w-12 text-yellow-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// Lazy loaded components
const SlotGrid = lazy(() => import("./SlotGrid"));
const SlotImagePanel = lazy(() => import("./slot-management/SlotImagePanel"));
const SlotProductPanel = lazy(
  () => import("./slot-management/SlotProductPanel"),
);
// Create placeholder components until the real ones are implemented
const SlotAnalyticsPanel = lazy(() =>
  Promise.resolve({
    default: (props: { slotId: number }) => (
      <div className="bg-white rounded-lg shadow p-8">
        <h3 className="text-lg font-medium">
          Analytics for Slot {props.slotId}
        </h3>
        <p className="text-gray-500 mt-2">
          Analytics functionality is coming soon.
        </p>
      </div>
    ),
  }),
);
const SlotSettingsPanel = lazy(() =>
  Promise.resolve({
    default: (props: { slotId: number }) => (
      <div className="bg-white rounded-lg shadow p-8">
        <h3 className="text-lg font-medium">
          Settings for Slot {props.slotId}
        </h3>
        <p className="text-gray-500 mt-2">
          Settings functionality is coming soon.
        </p>
      </div>
    ),
  }),
);
const SystemHealthMonitor = lazy(() => import("./SystemHealthMonitor"));

// Loading fallback component
const LoadingFallback = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex items-center justify-center h-32 bg-white rounded-lg shadow p-4">
    <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mr-3"></div>
    <p className="text-gray-600">{message}</p>
  </div>
);

// Help tooltip component
interface HelpTooltipProps {
  title: string;
  content: React.ReactNode;
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center p-1 rounded-full text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        aria-label="Show help"
      >
        <InformationCircleIcon />
      </button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        size="md"
      >
        <div className="prose max-w-none">{content}</div>
      </Dialog>
    </>
  );
};

/**
 * SlotManagementSystem is the central component for the entire slot management workflow.
 * It unifies slot display, filtering, product management, and image management.
 */
const SlotManagementSystem: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, isAdmin } = useUnifiedAuth();

  // Create a cache manager for slot data
  const slotCache = useMemo(
    () =>
      new PerformanceMonitor.CacheManager("slot-management", {
        ttl: 5 * 60 * 1000, // 5 minutes
        maxSize: 100,
        storageMethod: "sessionStorage",
      }),
    [],
  );

  // Core state
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<SlotStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [showHealthMonitor, setShowHealthMonitor] = useState(false);
  const [healthAlerts, setHealthAlerts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  // Notification center
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initialize loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200); // Simulate initial data loading
    return () => clearTimeout(timer);
  }, []);

  // Add a notification
  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: Math.random().toString(36).substring(2, 11),
        timestamp: Date.now(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);
      return newNotification.id;
    },
    [],
  );

  // Mark a notification as read
  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }, []);

  // Dismiss a notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Text content
  const text = {
    title: {
      en: "Slot Management System",
      fr: "Système de Gestion des Emplacements",
    },
    description: {
      en: "Manage product slots, assign products, and handle slot images in one unified workflow.",
      fr: "Gérez les emplacements de produits, assignez des produits et gérez les images dans un flux de travail unifié.",
    },
    noSelection: {
      en: "Select a slot to manage its images and products",
      fr: "Sélectionnez un emplacement pour gérer ses images et produits",
    },
    loading: {
      en: "Loading component...",
      fr: "Chargement du composant...",
    },
    systemHealth: {
      en: "System Health",
      fr: "Santé du Système",
    },
    showHealth: {
      en: "Show System Health",
      fr: "Afficher la Santé du Système",
    },
    hideHealth: {
      en: "Hide System Health",
      fr: "Masquer la Santé du Système",
    },
    tabs: {
      overview: { en: "Overview", fr: "Aperçu" },
      products: { en: "Products", fr: "Produits" },
      images: { en: "Images", fr: "Images" },
      analytics: { en: "Analytics", fr: "Analytique" },
      settings: { en: "Settings", fr: "Paramètres" },
    },
    help: {
      title: {
        en: "Slot Management Help",
        fr: "Aide à la Gestion des Emplacements",
      },
      content: {
        en: `
          <h3>How to use Slot Management</h3>
          <p>The Slot Management System allows you to manage all aspects of product slots:</p>
          <ul>
            <li><strong>Overview</strong>: View all slots and their status</li>
            <li><strong>Products</strong>: Assign products to slots</li>
            <li><strong>Images</strong>: Manage images for slots</li>
            <li><strong>Analytics</strong>: View performance metrics</li>
            <li><strong>Settings</strong>: Configure slot parameters</li>
          </ul>
          <p>Select a slot from the grid to work with it across all tabs.</p>
        `,
        fr: `
          <h3>Comment utiliser la Gestion des Emplacements</h3>
          <p>Le Système de Gestion des Emplacements vous permet de gérer tous les aspects des emplacements de produits:</p>
          <ul>
            <li><strong>Aperçu</strong>: Voir tous les emplacements et leur statut</li>
            <li><strong>Produits</strong>: Assigner des produits aux emplacements</li>
            <li><strong>Images</strong>: Gérer les images des emplacements</li>
            <li><strong>Analytique</strong>: Voir les métriques de performance</li>
            <li><strong>Paramètres</strong>: Configurer les paramètres des emplacements</li>
          </ul>
          <p>Sélectionnez un emplacement dans la grille pour travailler avec lui à travers tous les onglets.</p>
        `,
      },
    },
  };

  // Handle slot selection with performance tracking
  const handleSlotSelect = useCallback(
    (slotId: number) => {
      PerformanceMonitor.recordPerformanceMetric({
        operationName: "slotSelect",
        component: "SlotManagementSystem",
        duration: 0, // No measurable duration for this action
        timestamp: new Date().toISOString(),
        metadata: { slotId },
      });

      setSelectedSlot(slotId);

      // Cache the selection for potential recovery
      try {
        slotCache.set("lastSelectedSlot", slotId);
      } catch (error) {
        // Non-critical error, just log
        console.warn("Failed to cache slot selection:", error);
      }

      // Add notification for slot selection
      addNotification({
        type: "info",
        title: {
          en: "Slot Selected",
          fr: "Emplacement Sélectionné",
        },
        message: {
          en: `Slot #${slotId} has been selected. You can now manage it across all tabs.`,
          fr: `L'emplacement #${slotId} a été sélectionné. Vous pouvez maintenant le gérer à travers tous les onglets.`,
        },
        autoClose: 3000, // Auto close after 3 seconds
      });

      toast.success(
        t({
          en: `Slot #${slotId} selected`,
          fr: `Emplacement #${slotId} sélectionné`,
        }),
      );
    },
    [t, slotCache, addNotification],
  );

  // Handle filter changes
  const handleFilterChange = useCallback(
    (status: SlotStatus | "all") => {
      setFilterStatus(status);

      // Cache filter preference
      try {
        slotCache.set("filterStatus", status);
      } catch (error) {
        // Non-critical
        console.warn("Failed to cache filter preference:", error);
      }
    },
    [slotCache],
  );

  // Handle search term changes with debounce logic built in
  const handleSearchChange = useCallback((term: string) => {
    // We don't need to add debounce here since the child component would
    // ideally handle debouncing internally
    setSearchTerm(term);
  }, []);

  // Handle tab changes
  const handleTabChange = useCallback(
    (tab: string) => {
      PerformanceMonitor.recordPerformanceMetric({
        operationName: "tabChange",
        component: "SlotManagementSystem",
        duration: 0,
        timestamp: new Date().toISOString(),
        metadata: { tab, previousTab: activeTab },
      });

      setActiveTab(tab);
    },
    [activeTab],
  );

  // Handle errors from child components
  const handleComponentError = useCallback(
    (error: Error, componentName: string) => {
      ErrorMonitoring.logSystemError(error, {
        component: `SlotManagementSystem:${componentName}`,
        severity: ErrorSeverity.ERROR,
        userId: user?.id,
        metadata: {
          url: window.location.href,
          selectedSlot,
          filterStatus,
          searchTerm,
        },
      });

      // Add error notification
      addNotification({
        type: "error",
        title: {
          en: "Component Error",
          fr: "Erreur de Composant",
        },
        message: {
          en: `An error occurred in ${componentName}. Our team has been notified.`,
          fr: `Une erreur s'est produite dans ${componentName}. Notre équipe a été notifiée.`,
        },
        actions: [
          {
            label: { en: "Refresh", fr: "Rafraîchir" },
            onClick: () => window.location.reload(),
          },
        ],
      });

      toast.error(
        t({
          en: `An error occurred in ${componentName}. Our team has been notified.`,
          fr: `Une erreur s'est produite dans ${componentName}. Notre équipe a été notifiée.`,
        }),
      );
    },
    [selectedSlot, filterStatus, searchTerm, user?.id, t, addNotification],
  );

  // Handle health monitoring alerts
  const handleHealthAlerts = useCallback(
    (count: number) => {
      setHealthAlerts(count);

      if (count > 0) {
        // Add health alert notification
        addNotification({
          type: "warning",
          title: {
            en: "System Health Issues",
            fr: "Problèmes de Santé du Système",
          },
          message: {
            en: `${count} system health ${count === 1 ? "issue" : "issues"} detected. Check the health monitor for details.`,
            fr: `${count} problème${count > 1 ? "s" : ""} de santé du système détecté${count > 1 ? "s" : ""}. Consultez le moniteur de santé pour plus de détails.`,
          },
          actions: [
            {
              label: {
                en: "Show Health Monitor",
                fr: "Afficher le Moniteur de Santé",
              },
              onClick: () => setShowHealthMonitor(true),
            },
          ],
        });

        toast.warning(
          t({
            en: `${count} system health ${count === 1 ? "issue" : "issues"} detected`,
            fr: `${count} problème${count > 1 ? "s" : ""} de santé du système détecté${count > 1 ? "s" : ""}`,
          }),
        );
      }
    },
    [t, addNotification],
  );

  // Render the appropriate panel based on active tab and selected slot
  const renderTabContent = () => {
    if (isLoading) {
      return <SkeletonLoader type="detail" className="mt-4" />;
    }

    if (!selectedSlot && activeTab !== "overview") {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center mt-4">
          <ExclamationCircleIcon />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {t(text.noSelection)}
          </h3>
          <p className="mt-2 text-gray-500">
            {t({
              en: "Please select a slot from the overview tab to manage its details.",
              fr: "Veuillez sélectionner un emplacement dans l'onglet aperçu pour gérer ses détails.",
            })}
          </p>
          <button
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setActiveTab("overview")}
          >
            {t(text.tabs.overview)}
          </button>
        </div>
      );
    }

    // Use Suspense for lazy-loaded components
    return (
      <Suspense
        fallback={
          <SkeletonLoader
            type={activeTab === "overview" ? "grid" : "detail"}
            className="mt-4"
          />
        }
      >
        {activeTab === "overview" && (
          <SlotGrid
            filterStatus={filterStatus === "all" ? undefined : filterStatus}
            searchTerm={searchTerm}
            viewMode={viewMode}
            selectedSlot={selectedSlot}
            onSlotSelect={handleSlotSelect}
            onError={(error) => handleComponentError(error, "SlotGrid")}
          />
        )}
        {activeTab === "products" && selectedSlot && (
          <SlotProductPanel slotId={selectedSlot} />
        )}
        {activeTab === "images" && selectedSlot && (
          <SlotImagePanel slotId={selectedSlot} />
        )}
        {activeTab === "analytics" && selectedSlot && (
          <SlotAnalyticsPanel slotId={selectedSlot} />
        )}
        {activeTab === "settings" && selectedSlot && (
          <SlotSettingsPanel slotId={selectedSlot} />
        )}
      </Suspense>
    );
  };

  // Memoize the rendered filters component for performance
  const renderedFilters = useMemo(
    () => (
      <SlotFilters
        filterStatus={filterStatus}
        searchTerm={searchTerm}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
      />
    ),
    [filterStatus, searchTerm, handleFilterChange, handleSearchChange],
  );

  // Memoize the rendered controls component for performance
  const renderedControls = useMemo(
    () => (
      <SlotControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedSlot={selectedSlot}
        onCreateProduct={() => navigate("/admin/products/create")}
        activePanel="none"
        onPanelChange={() => {}}
      />
    ),
    [viewMode, selectedSlot, navigate],
  );

  return (
    <div className="slot-management-system">
      {/* Header section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t(text.title)}
              </h1>
              <p className="text-gray-600 mt-1">{t(text.description)}</p>
            </div>
            <HelpTooltip
              title={t(text.help.title)}
              content={
                <div
                  dangerouslySetInnerHTML={{ __html: t(text.help.content) }}
                />
              }
            />
          </div>

          <div className="flex mt-3 sm:mt-0 space-x-2">
            <button
              onClick={() => setShowHealthMonitor(!showHealthMonitor)}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md
                ${
                  healthAlerts > 0
                    ? "text-white bg-red-600 hover:bg-red-700"
                    : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {healthAlerts > 0 && (
                <span className="flex items-center justify-center w-5 h-5 mr-2 text-xs text-white bg-red-800 rounded-full">
                  {healthAlerts}
                </span>
              )}
              {t(showHealthMonitor ? text.hideHealth : text.showHealth)}
            </button>

            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 relative"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {t({
                en: "Notifications",
                fr: "Notifications",
              })}
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* System Health Monitor */}
      {showHealthMonitor && (
        <Suspense
          fallback={<SkeletonLoader type="stats" count={3} className="mb-6" />}
        >
          <div className="mb-6">
            <SystemHealthMonitor
              onErrorsDetected={handleHealthAlerts}
              refreshInterval={120000} // 2 minutes
            />
          </div>
        </Suspense>
      )}

      {/* Filters and controls section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          {activeTab === "overview" && renderedFilters}
          {activeTab === "overview" && renderedControls}
        </div>
      </div>

      {/* Tabs navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            {t(text.tabs.overview)}
          </TabsTrigger>
          <TabsTrigger value="products">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            {t(text.tabs.products)}
          </TabsTrigger>
          <TabsTrigger value="images">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {t(text.tabs.images)}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            {t(text.tabs.analytics)}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {t(text.tabs.settings)}
          </TabsTrigger>
        </TabsList>

        {/* Tab content area */}
        <div className="mt-2">{renderTabContent()}</div>
      </Tabs>

      {/* Notification Center */}
      <NotificationCenter
        notifications={notifications}
        isExpanded={showNotifications}
        onExpandChange={setShowNotifications}
        onMarkAsRead={markNotificationAsRead}
        onDismiss={dismissNotification}
        onClearAll={clearAllNotifications}
        position="top-right"
      />
    </div>
  );
};

// Wrap the component with error boundary and performance tracking
export default function OptimizedSlotManagementSystem() {
  return (
    <ErrorBoundary>
      <SlotManagementSystem />
    </ErrorBoundary>
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    ErrorMonitoring.logSystemError(error, {
      component: "SlotManagementSystem",
      severity: ErrorSeverity.ERROR,
      metadata: { errorInfo: errorInfo.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                An error occurred in the Slot Management System
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Please try refreshing the page. If the problem persists,
                  contact support.
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Refresh page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
