import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { useLanguage } from '../store/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import ProductCard from '../components/product/ProductCard';
import EmptySlotCard from '../components/product/EmptySlotCard';
import SortingSelector from '../components/ui/SortingSelector';
import CategoryFilter from '../components/ui/CategoryFilter';
import LanguageToggle from '../components/ui/LanguageToggle';
import Skeleton from '../components/ui/Skeleton';
import { SortCriteria, useProducts, Product } from '../services/products';
import { useCategories, Category } from '../services/categories';
import { useSlots, SlotStatus, Slot } from '../services/slots';
import { useDebugSlots } from '../services/debugSlots';
import { Helmet } from 'react-helmet-async';
import SeoComponent from '../components/seo/SeoComponent';
import { generateWebsiteSchema } from '../utils/schemaMarkup';

interface HomePageProps {
  promotionalBanner?: {
    active: boolean;
    content: {
      en: string;
      fr: string;
    };
    link?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

interface GridItem {
  type: 'product' | 'empty';
  slotNumber: number;
  product?: Product;
  status?: SlotStatus;
}

// Memoized components
const MemoizedProductCard = memo(ProductCard);
const MemoizedEmptySlotCard = memo(EmptySlotCard);

const HomePage: React.FC<HomePageProps> = ({ promotionalBanner }) => {
  const { isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>(SortCriteria.NEWEST);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  
  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Fetch slots with their associated products - conditionally use the debug hook
  const normalSlots = useSlots();
  const debugSlots = useDebugSlots();
  
  // Use either normal or debug hook results
  const { slots, loading: slotsLoading, error: slotsError } = debugMode ? debugSlots : normalSlots;
  
  // Admin-only debug logging
  useEffect(() => {
    if (isAdmin && !slotsLoading && !slotsError) {
      console.log('[Admin] Slots fetched:', slots?.length || 0);
      console.log('[Admin] Slots with products:', slots?.filter(slot => slot.product_id).length || 0);
      
      // Log slot statuses
      const statusCounts = slots?.reduce((acc, slot) => {
        acc[slot.status] = (acc[slot.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      console.log('[Admin] Slot statuses:', statusCounts);
      
      // Log product statuses
      const productStatuses = slots?.filter(slot => slot.product)
        .reduce((acc, slot) => {
          const status = slot.product?.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
      
      console.log('[Admin] Product statuses:', productStatuses);
    }
  }, [slots, slotsLoading, slotsError, isAdmin]);
  
  // Fetch categories
  const { categories } = useCategories();
  
  // Text content with bilingual support
  const text = {
    welcome: { 
      en: 'Discover Today\'s Limited-Time Offers in Cameroon!', 
      fr: 'Découvrez les Offres à Durée Limitée d\'Aujourd\'hui au Cameroun!' 
    },
    tagline: { 
      en: 'Don\'t Miss Out! New Deals Drop Daily!',
      fr: 'Ne Manquez Pas! De Nouvelles Offres Tombent Chaque Jour!'
    },
    productGridHeading: {
      en: 'New Arrivals!',
      fr: 'Nouveautés!'
    },
    noProductsFound: {
      en: 'No products found',
      fr: 'Aucun produit trouvé'
    },
    errorMessage: {
      en: 'Failed to load products. Please try again.',
      fr: 'Échec du chargement des produits. Veuillez réessayer.'
    },
    retryButton: {
      en: 'Retry',
      fr: 'Réessayer'
    }
  };

  // Make handlers use useCallback
  const handleCategoryChange = useCallback((category: string | null) => {
    setFilterCategory(category);
  }, []);

  const handleSortChange = useCallback((newSortCriteria: SortCriteria) => {
    setSortCriteria(newSortCriteria);
  }, []);

  // Create grid items from slots
  const gridItems = useMemo<GridItem[]>(() => {
    // Filter and sort slots based on criteria
    let filteredSlots = [...(slots || [])];
    
    // Only show slots with approved products for non-admin users
    if (!isAdmin) {
      filteredSlots = filteredSlots.filter(slot => 
        slot.product?.status === 'approved' && 
        slot.status === SlotStatus.OCCUPIED &&
        slot.is_active
      );
    }
    
    // Apply category filter
    if (filterCategory) {
      filteredSlots = filteredSlots.filter(slot => {
        const category = slot.product?.category;
        return category && ('id' in category) && String(category.id) === String(filterCategory);
      });
    }
    
    // Apply sorting
    filteredSlots.sort((a, b) => {
      if (!a.product || !b.product) return 0;
      
      switch (sortCriteria) {
        case SortCriteria.NEWEST:
          const dateA = a.product.created_at ? new Date(a.product.created_at).getTime() : 0;
          const dateB = b.product.created_at ? new Date(b.product.created_at).getTime() : 0;
          return dateB - dateA;
        case SortCriteria.ENDING_SOON:
          const endA = a.end_time ? new Date(a.end_time).getTime() : Number.MAX_SAFE_INTEGER;
          const endB = b.end_time ? new Date(b.end_time).getTime() : Number.MAX_SAFE_INTEGER;
          return endA - endB;
        case SortCriteria.PRICE_HIGH:
          return (b.product.price || 0) - (a.product.price || 0);
        case SortCriteria.PRICE_LOW:
          return (a.product.price || 0) - (b.product.price || 0);
        default:
          return 0;
      }
    });
    
    // Create final grid items
    const items = Array.from({ length: 25 }, (_, index) => {
      const slotNumber = index + 1;
      const slot = filteredSlots.find(s => s.id === slotNumber);
      
      if (slot?.product && 
          slot.status === SlotStatus.OCCUPIED && 
          (isAdmin || slot.product.status === 'approved')) {
        return {
          type: 'product' as const,
          slotNumber,
          product: slot.product
        };
      } else {
        return {
          type: 'empty' as const,
          slotNumber,
          status: slot?.status || SlotStatus.AVAILABLE
        };
      }
    });
    
    if (isAdmin && debugMode) {
      const productCount = items.filter(item => item.type === 'product').length;
      console.log(`[Admin] Final grid items: ${productCount} products, ${items.length - productCount} empty slots`);
    }
    
    return items;
  }, [slots, filterCategory, sortCriteria, isAdmin, debugMode]);

  // Website schema for homepage
  const websiteSchema = useMemo(() => {
    return generateWebsiteSchema(['en', 'fr']);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <SeoComponent
        title={text.welcome}
        description={text.tagline}
        ogType="website"
        ogImage="/images/sokoclick-social-card.jpg"
        jsonLd={websiteSchema}
      />

      {/* Header Section */}
      <header className="mb-12 relative">
        {/* Hero section with background gradient */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <svg className="h-full w-full" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(300,300)">
                <path d="M125,-160.4C159.9,-146.7,184.6,-107.3,190.4,-67C196.2,-26.7,183.1,14.4,169.6,56.8C156.2,99.2,142.3,143,115.8,172C89.3,201.1,50.1,215.4,9.2,209.3C-31.7,203.2,-74.4,176.7,-104.3,147.7C-134.3,118.7,-151.5,87.1,-161.9,51.5C-172.3,15.9,-175.8,-23.7,-166.7,-61.7C-157.6,-99.7,-135.9,-136.2,-105.1,-153.9C-74.2,-171.6,-34.1,-170.6,5.7,-179C45.5,-187.4,90.1,-174.1,125,-160.4Z" fill="currentColor" />
              </g>
            </svg>
          </div>
          
          <div className="container mx-auto px-6 py-16 md:py-24 relative z-10">
            <div className="md:max-w-2xl text-center mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight">
                {t(text.welcome)}
              </h1>
              <p className="text-xl md:text-2xl font-medium text-indigo-100 mb-8">
                {t(text.tagline)}
              </p>
              
              {/* Search bar - styled but non-functional unless you want to implement search */}
              <div className="relative max-w-lg mx-auto">
                <input
                  type="text"
                  placeholder={t({ en: "What are you looking for today?", fr: "Que cherchez-vous aujourd'hui?" })}
                  className="w-full px-6 py-4 rounded-full shadow-md border-0 focus:ring-2 focus:ring-indigo-400 focus:outline-none text-gray-600"
                />
                <button className="absolute right-2 top-2 bg-indigo-700 text-white p-2 rounded-full hover:bg-indigo-800 transition duration-150">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              
              {/* Admin debug mode toggle - keeping it for admins */}
              {isAdmin && (
                <div className="mt-6">
                  <button
                    onClick={() => setDebugMode(!debugMode)}
                    className={`px-3 py-1 text-sm font-medium border rounded-md ${
                      debugMode 
                        ? 'bg-orange-100 border-orange-300 text-orange-600' 
                        : 'bg-white/80 border-white/30 text-white'
                    }`}
                  >
                    {debugMode ? '🔍 Debug Mode: ON' : '🔍 Debug Mode: OFF'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 md:h-16 text-gray-50">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V69.35C65.79,69.43,132.33,70.39,198,81.89,250,90.61,295.07,96.68,321.39,56.44Z" fill="currentColor"></path>
            </svg>
          </div>
        </div>
      </header>

      {/* Filters Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <CategoryFilter
          categories={categories || []}
          selectedCategory={filterCategory}
          onCategoryChange={handleCategoryChange}
        />
        <div className="flex items-center gap-4">
          <SortingSelector
            value={sortCriteria}
            onChange={handleSortChange}
          />
          <LanguageToggle compact />
        </div>
      </div>

      {/* Debug Info Section - Only visible to admins in debug mode */}
      {isAdmin && debugMode && !slotsLoading && !slotsError && (
        <div className="mb-8 p-4 border border-orange-300 bg-orange-50 rounded-lg">
          <h3 className="text-lg font-medium text-orange-800 mb-3">Debug Information</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-orange-700">Slots Summary:</p>
              <ul className="text-sm text-orange-600 mt-1 space-y-1">
                <li>Total Slots: {slots?.length || 0}</li>
                <li>With Product ID: {slots?.filter(s => s.product_id).length || 0}</li>
                <li>With Product Data: {slots?.filter(s => s.product).length || 0}</li>
                <li>Active Slots: {slots?.filter(s => s.is_active).length || 0}</li>
                <li>Occupied Status: {slots?.filter(s => s.status === SlotStatus.OCCUPIED).length || 0}</li>
              </ul>
            </div>
            
            <div>
              <p className="text-sm font-medium text-orange-700">Product Statuses:</p>
              <ul className="text-sm text-orange-600 mt-1 space-y-1">
                {Object.entries(
                  slots?.filter(slot => slot.product)
                    .reduce((acc, slot) => {
                      const status = slot.product?.status || 'unknown';
                      acc[status] = (acc[status] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>) || {}
                ).map(([status, count]) => (
                  <li key={status}>
                    {status}: {count}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">{t(text.productGridHeading)}</h2>
        
        {slotsLoading ? (
          // Skeleton loading state
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 25 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="relative h-full">
                <Skeleton
                  variant="productCard"
                  className="w-full h-full"
                  animation={prefersReducedMotion ? 'none' : 'pulse'}
                />
              </div>
            ))}
          </div>
        ) : slotsError ? (
          // Error state
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{t(text.errorMessage)}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
            >
              {t(text.retryButton)}
            </button>
          </div>
        ) : (
          // Product grid or empty state
          gridItems.filter(item => item.type === 'product').length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {gridItems.map(item => (
                item.type === 'product' && item.product ? (
                  <MemoizedProductCard
                    key={`product-${item.slotNumber}`}
                    product={item.product}
                    isAdmin={isAdmin}
                  />
                ) : (
                  <MemoizedEmptySlotCard
                    key={`empty-${item.slotNumber}`}
                    slotNumber={item.slotNumber}
                    isAdmin={isAdmin}
                  />
                )
              ))}
            </div>
          ) : (
            // No products found state
            <div className="text-center py-12">
              <p className="text-gray-600">{t(text.noProductsFound)}</p>
            </div>
          )
        )}
      </section>
    </div>
  );
};

export default memo(HomePage);
