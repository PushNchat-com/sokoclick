import React, { useState, useCallback, useMemo, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../store/LanguageContext';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import { SlotStatus } from '../../services/slots';
import { toast } from '../../utils/toast';
import { PerformanceMonitor } from '../../services/core/PerformanceMonitor';
import { ErrorMonitoring, ErrorSeverity } from '../../services/core/ErrorMonitoring';

// Static imports for core components
import SlotControls from './slot-management/SlotControls';
import SlotFilters from './slot-management/SlotFilters';

// Lazy loaded components
const SlotGrid = lazy(() => import('./SlotGrid'));
const SlotImagePanel = lazy(() => import('./slot-management/SlotImagePanel'));
const SlotProductPanel = lazy(() => import('./slot-management/SlotProductPanel'));
const SystemHealthMonitor = lazy(() => import('./SystemHealthMonitor'));

// Loading fallback component
const LoadingFallback = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex items-center justify-center h-32 bg-white rounded-lg shadow p-4">
    <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mr-3"></div>
    <p className="text-gray-600">{message}</p>
  </div>
);

/**
 * SlotManagementSystem is the central component for the entire slot management workflow.
 * It unifies slot display, filtering, product management, and image management.
 */
const SlotManagementSystem: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, isAdmin } = useUnifiedAuth();
  
  // Create a cache manager for slot data
  const slotCache = useMemo(() => 
    new PerformanceMonitor.CacheManager('slot-management', {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      storageMethod: 'sessionStorage'
    }), 
  []);
  
  // Core state
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<SlotStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activePanel, setActivePanel] = useState<'none' | 'product' | 'image'>('none');
  const [showHealthMonitor, setShowHealthMonitor] = useState(false);
  const [healthAlerts, setHealthAlerts] = useState(0);
  
  // Text content
  const text = {
    title: { en: 'Slot Management System', fr: 'Système de Gestion des Emplacements' },
    description: { 
      en: 'Manage product slots, assign products, and handle slot images in one unified workflow.',
      fr: 'Gérez les emplacements de produits, assignez des produits et gérez les images dans un flux de travail unifié.'
    },
    noSelection: {
      en: 'Select a slot to manage its images and products',
      fr: 'Sélectionnez un emplacement pour gérer ses images et produits'
    },
    loading: {
      en: 'Loading component...',
      fr: 'Chargement du composant...'
    },
    systemHealth: {
      en: 'System Health',
      fr: 'Santé du Système'
    },
    showHealth: {
      en: 'Show System Health',
      fr: 'Afficher la Santé du Système'
    },
    hideHealth: {
      en: 'Hide System Health',
      fr: 'Masquer la Santé du Système'
    }
  };
  
  // Handle slot selection with performance tracking
  const handleSlotSelect = useCallback((slotId: number) => {
    PerformanceMonitor.recordPerformanceMetric({
      operationName: 'slotSelect',
      component: 'SlotManagementSystem',
      duration: 0, // No measurable duration for this action
      timestamp: new Date().toISOString(),
      metadata: { slotId }
    });
    
    setSelectedSlot(slotId);
    setActivePanel('product'); // Default to product panel when slot is selected
    
    // Cache the selection for potential recovery
    try {
      slotCache.set('lastSelectedSlot', slotId);
    } catch (error) {
      // Non-critical error, just log
      console.warn('Failed to cache slot selection:', error);
    }
    
    toast.success(t({
      en: `Slot #${slotId} selected`,
      fr: `Emplacement #${slotId} sélectionné`
    }));
  }, [t, slotCache]);
  
  // Handle filter changes
  const handleFilterChange = useCallback((status: SlotStatus | 'all') => {
    setFilterStatus(status);
    
    // Cache filter preference
    try {
      slotCache.set('filterStatus', status);
    } catch (error) {
      // Non-critical
      console.warn('Failed to cache filter preference:', error);
    }
  }, [slotCache]);
  
  // Handle search term changes with debounce logic built in
  const handleSearchChange = useCallback((term: string) => {
    // We don't need to add debounce here since the child component would 
    // ideally handle debouncing internally
    setSearchTerm(term);
  }, []);
  
  // Handle switching between panels
  const handlePanelChange = useCallback((panel: 'none' | 'product' | 'image') => {
    PerformanceMonitor.recordPerformanceMetric({
      operationName: 'panelChange',
      component: 'SlotManagementSystem',
      duration: 0,
      timestamp: new Date().toISOString(),
      metadata: { panel, previousPanel: activePanel }
    });
    
    setActivePanel(panel);
  }, [activePanel]);
  
  // Handle errors from child components
  const handleComponentError = useCallback((error: Error, componentName: string) => {
    ErrorMonitoring.logSystemError(error, {
      component: `SlotManagementSystem:${componentName}`,
      severity: ErrorSeverity.ERROR,
      userId: user?.id,
      metadata: {
        url: window.location.href,
        selectedSlot,
        filterStatus,
        searchTerm
      }
    });
    
    toast.error(t({
      en: `An error occurred in ${componentName}. Our team has been notified.`,
      fr: `Une erreur s'est produite dans ${componentName}. Notre équipe a été notifiée.`
    }));
  }, [selectedSlot, filterStatus, searchTerm, user?.id, t]);
  
  // Handle health monitoring alerts
  const handleHealthAlerts = useCallback((count: number) => {
    setHealthAlerts(count);
    
    if (count > 0) {
      toast.warning(t({
        en: `${count} system health ${count === 1 ? 'issue' : 'issues'} detected`,
        fr: `${count} problème${count > 1 ? 's' : ''} de santé du système détecté${count > 1 ? 's' : ''}`
      }));
    }
  }, [t]);
  
  // Render the appropriate panel based on active panel state
  const renderActivePanel = () => {
    if (!selectedSlot) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-500">{t(text.noSelection)}</h3>
        </div>
      );
    }
    
    // Use Suspense for lazy-loaded components
    return (
      <Suspense fallback={<LoadingFallback message={t(text.loading)} />}>
        {activePanel === 'product' && <SlotProductPanel slotId={selectedSlot} />}
        {activePanel === 'image' && <SlotImagePanel slotId={selectedSlot} />}
      </Suspense>
    );
  };
  
  // Memoize the rendered components for performance
  const renderedFilters = useMemo(() => (
    <SlotFilters 
      filterStatus={filterStatus} 
      searchTerm={searchTerm}
      onFilterChange={handleFilterChange}
      onSearchChange={handleSearchChange}
    />
  ), [filterStatus, searchTerm, handleFilterChange, handleSearchChange]);
  
  const renderedControls = useMemo(() => (
    <SlotControls 
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      selectedSlot={selectedSlot}
      onCreateProduct={() => navigate('/admin/products/create')}
      activePanel={activePanel}
      onPanelChange={handlePanelChange}
    />
  ), [viewMode, selectedSlot, activePanel, handlePanelChange, navigate]);
  
  return (
    <div className="slot-management-system">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t(text.title)}</h1>
            <p className="text-gray-600 mt-1">{t(text.description)}</p>
          </div>
          
          <button
            onClick={() => setShowHealthMonitor(!showHealthMonitor)}
            className={`mt-3 sm:mt-0 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md
              ${healthAlerts > 0 
                ? 'text-white bg-red-600 hover:bg-red-700' 
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {healthAlerts > 0 && (
              <span className="flex items-center justify-center w-5 h-5 mr-2 text-xs text-white bg-red-800 rounded-full">
                {healthAlerts}
              </span>
            )}
            {t(showHealthMonitor ? text.hideHealth : text.showHealth)}
          </button>
        </div>
      </div>
      
      {/* System Health Monitor */}
      {showHealthMonitor && (
        <Suspense fallback={<LoadingFallback message={t(text.loading)} />}>
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
          {renderedFilters}
          {renderedControls}
        </div>
      </div>
      
      {/* Main content area with slot grid and active panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slot grid takes 2/3 of the space */}
        <div className="lg:col-span-2">
          <Suspense fallback={<LoadingFallback message={t(text.loading)} />}>
            <SlotGrid 
              filterStatus={filterStatus === 'all' ? undefined : filterStatus}
              searchTerm={searchTerm}
              viewMode={viewMode}
              selectedSlot={selectedSlot}
              onSlotSelect={handleSlotSelect}
              onError={(error) => handleComponentError(error, 'SlotGrid')}
            />
          </Suspense>
        </div>
        
        {/* Active panel takes 1/3 of the space */}
        <div className="lg:col-span-1">
          {renderActivePanel()}
        </div>
      </div>
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
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    ErrorMonitoring.logSystemError(error, {
      component: 'SlotManagementSystem',
      severity: ErrorSeverity.ERROR,
      metadata: { errorInfo: errorInfo.componentStack }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                An error occurred in the Slot Management System
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Please try refreshing the page. If the problem persists, contact support.
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