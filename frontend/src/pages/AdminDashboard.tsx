import React, { useState, useEffect } from 'react';
import { useLanguage } from '../store/LanguageContext';
import DashboardMetrics from '../components/admin/DashboardMetrics';
import SlotGridConnected from '../components/admin/SlotGridConnected';
import ProductApprovalWorkflow from '../components/admin/ProductApprovalWorkflow';
import AnalyticsComponent from '../components/admin/AnalyticsComponent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { analyticsService } from '../services/analytics';
import { toast } from '../utils/toast';
import StorageInitializer from '../components/admin/StorageInitializer';
import SlotImageUploader from '../components/admin/SlotImageUploader';

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useUnifiedAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'analytics' | 'products'>('overview');
  
  // Mock data - to be replaced with actual data from Supabase
  const [metrics, setMetrics] = useState({
    activeSlots: 12,
    totalProducts: 45,
    pendingApprovals: 3,
    usersCount: 18,
    totalViews: 1243,
    whatsappClicks: 87
  });
  
  // Text content
  const text = {
    dashboardTitle: { en: 'Dashboard Overview', fr: 'Aperçu du tableau de bord' },
    welcome: { 
      en: 'Welcome to SokoClick Admin', 
      fr: 'Bienvenue sur SokoClick Admin' 
    },
    welcomeSubtitle: {
      en: 'Manage your marketplace from this central dashboard.',
      fr: 'Gérez votre marketplace depuis ce tableau de bord central.'
    },
    slotManagement: { en: 'Slot Management', fr: 'Gestion des emplacements' },
    quickActions: { en: 'Quick Actions', fr: 'Actions rapides' },
    newProduct: { en: 'New Product', fr: 'Nouveau produit' },
    manageUsers: { en: 'Manage Users', fr: 'Gérer les utilisateurs' },
    viewAnalytics: { en: 'View Analytics', fr: 'Voir les analyses' },
    recentActivity: { en: 'Recent Activity', fr: 'Activité récente' },
    noActivity: { 
      en: 'No recent activity to display', 
      fr: 'Aucune activité récente à afficher' 
    },
    tabs: {
      overview: { en: 'Overview', fr: 'Aperçu' },
      approvals: { en: 'Approvals', fr: 'Approbations' },
      analytics: { en: 'Analytics', fr: 'Analytique' },
      products: { en: 'Products', fr: 'Produits' }
    },
    error: {
      loadingMetrics: { en: 'Error loading metrics', fr: 'Erreur lors du chargement des métriques' }
    },
    adminTools: { en: 'Admin Tools', fr: 'Outils d\'administration' }
  };
  
  // Mock activity data
  const [activities, setActivities] = useState([
    {
      id: '1',
      type: 'product_created',
      title: { en: 'New product created', fr: 'Nouveau produit créé' },
      details: { en: 'Smartphone XYZ in slot #7', fr: 'Smartphone XYZ dans l\'emplacement #7' },
      timestamp: new Date(Date.now() - 30 * 60000), // 30 min ago
    },
    {
      id: '2',
      type: 'user_verified',
      title: { en: 'User verified', fr: 'Utilisateur vérifié' },
      details: { en: 'John Doe (+237612345678)', fr: 'John Doe (+237612345678)' },
      timestamp: new Date(Date.now() - 120 * 60000), // 2 hours ago
    },
    {
      id: '3',
      type: 'slot_updated',
      title: { en: 'Slot updated', fr: 'Emplacement mis à jour' },
      details: { en: 'Slot #3 end time extended', fr: 'Fin de l\'emplacement #3 prolongée' },
      timestamp: new Date(Date.now() - 180 * 60000), // 3 hours ago
    }
  ]);
  
  // Format timestamp relative to now
  const formatRelativeTime = (date: Date): {en: string, fr: string} => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMinutes < 1) {
      return { en: 'Just now', fr: 'À l\'instant' };
    }
    if (diffMinutes < 60) {
      return { 
        en: `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`, 
        fr: `Il y a ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}` 
      };
    }
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return { 
        en: `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`, 
        fr: `Il y a ${diffHours} heure${diffHours !== 1 ? 's' : ''}` 
      };
    }
    
    const diffDays = Math.floor(diffHours / 24);
    return { 
      en: `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`, 
      fr: `Il y a ${diffDays} jour${diffDays !== 1 ? 's' : ''}` 
    };
  };
  
  // Fetch real metrics data
  const fetchMetrics = async () => {
    try {
      // Get analytics metrics
      const analyticsMetrics = await analyticsService.getMetrics();
      
      // Update metrics with real data
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        totalViews: analyticsMetrics.totalViews,
        whatsappClicks: analyticsMetrics.whatsappClicks
      }));
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error(t(text.error.loadingMetrics));
    }
  };
  
  // Initialize loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      fetchMetrics();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="admin-dashboard">
      {/* Page header */}
      <div className="pb-5 border-b border-gray-200 mb-5">
        <h1 className="text-2xl font-bold text-gray-900">{t(text.dashboardTitle)}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {user ? `${t(text.welcome)}, ${user.firstName || user.email}` : t(text.welcomeSubtitle)}
        </p>
      </div>
      
      {/* Dashboard tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as any)}
        className="space-y-6"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="overview">{t(text.tabs.overview)}</TabsTrigger>
          <TabsTrigger value="approvals">{t(text.tabs.approvals)}</TabsTrigger>
          <TabsTrigger value="analytics">{t(text.tabs.analytics)}</TabsTrigger>
          <TabsTrigger value="products">{t(text.tabs.products)}</TabsTrigger>
        </TabsList>
        
        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key metrics */}
          <DashboardMetrics 
            metrics={metrics}
            isLoading={isLoading}
          />
          
          {/* Slot overview and quick actions */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Slot Grid */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow">
              <div className="px-4 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {t(text.slotManagement)}
                </h3>
              </div>
              <div className="p-4">
                <SlotGridConnected enableActions={true} className="w-full" />
              </div>
            </div>
            
            {/* Quick actions and recent activity */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {t(text.quickActions)}
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <a 
                    href="/admin/products/create" 
                    className="flex items-center px-4 py-3 text-base font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition"
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {t(text.newProduct)}
                  </a>
                  <a 
                    href="/admin/users" 
                    className="flex items-center px-4 py-3 text-base font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition"
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {t(text.manageUsers)}
                  </a>
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('analytics');
                    }}
                    className="flex items-center px-4 py-3 text-base font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition"
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {t(text.viewAnalytics)}
                  </a>
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {t(text.recentActivity)}
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {isLoading ? (
                    <div className="p-4">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ) : activities.length > 0 ? (
                    activities.map(activity => (
                      <div key={activity.id} className="p-4">
                        <h4 className="text-sm font-medium text-gray-900">{t(activity.title)}</h4>
                        <p className="text-sm text-gray-500">{t(activity.details)}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {t(formatRelativeTime(activity.timestamp))}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      {t(text.noActivity)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Approvals tab */}
        <TabsContent value="approvals">
          <ProductApprovalWorkflow />
        </TabsContent>
        
        {/* Analytics tab */}
        <TabsContent value="analytics">
          <AnalyticsComponent />
        </TabsContent>
        
        {/* Products tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {t(text.tabs.products)}
                </h3>
                <a 
                  href="/admin/products/create" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t(text.newProduct)}
                </a>
              </div>
            </div>
            <div className="p-4">
              <a 
                href="/admin/products" 
                className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {t({
                  en: 'Go to Product Management',
                  fr: 'Aller à la gestion des produits'
                })}
              </a>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Admin Tools Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">{t(text.adminTools)}</h2>
        
        {/* Storage Management Tool */}
        <StorageInitializer />
        
        {/* Slot Image Uploader */}
        <SlotImageUploader />
        
        {/* Other admin tools */}
        {/* ... */}
      </div>
    </div>
  );
};

export default AdminDashboard;
