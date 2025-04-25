import React, { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react';
import { useLanguage } from '../store/LanguageContext';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
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
import { toast } from '../utils/toast';

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
  const { isAdmin } = useUnifiedAuth();
  const { language, t } = useLanguage();
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>(SortCriteria.NEWEST);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
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
  const { slots, loading: slotsLoading, error: slotsError, refresh: refreshSlots } = debugMode ? debugSlots : normalSlots;
  
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
    },
    searchPlaceholder: {
      en: "What are you looking for today?",
      fr: "Que cherchez-vous aujourd'hui?"
    },
    searchButton: {
      en: "Search",
      fr: "Rechercher"
    },
    searching: {
      en: "Searching...",
      fr: "Recherche en cours..."
    },
    searchResults: {
      en: "Search Results",
      fr: "Résultats de recherche"
    },
    clearSearch: {
      en: "Clear Search",
      fr: "Effacer la recherche"
    }
  };

  // Make handlers use useCallback
  const handleCategoryChange = useCallback((category: string | null) => {
    setFilterCategory(category);
  }, []);

  const handleSortChange = useCallback((newSortCriteria: SortCriteria) => {
    setSortCriteria(newSortCriteria);
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Handle search form submission
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      
      // Simulate search loading for better UX
      setTimeout(() => {
        setIsSearching(false);
      }, 500);
    }
  }, [searchQuery]);

  // Handle clearing search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearching(false);
    
    // Focus the search input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
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
    
    // Apply search filter when search query exists and not in searching state
    if (searchQuery.trim() && !isSearching) {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      
      filteredSlots = filteredSlots.filter(slot => {
        if (!slot.product) return false;
        
        // Fields to search in
        const nameEn = slot.product.name_en?.toLowerCase() || '';
        const nameFr = slot.product.name_fr?.toLowerCase() || '';
        const descEn = slot.product.description_en?.toLowerCase() || '';
        const descFr = slot.product.description_fr?.toLowerCase() || '';
        
        // Safely access properties that might not be in the Product interface
        const productAny = slot.product as any;
        const locationLower = typeof productAny.location === 'string' 
          ? productAny.location.toLowerCase() 
          : '';
        
        // Handle tags which could be array or string
        let tagsLower = '';
        if (productAny.tags) {
          if (Array.isArray(productAny.tags)) {
            tagsLower = productAny.tags.join(' ').toLowerCase();
          } else if (typeof productAny.tags === 'string') {
            tagsLower = productAny.tags.toLowerCase();
          }
        }
        
        // Check if any field matches the search query
        return (
          nameEn.includes(normalizedQuery) ||
          nameFr.includes(normalizedQuery) ||
          descEn.includes(normalizedQuery) ||
          descFr.includes(normalizedQuery) ||
          locationLower.includes(normalizedQuery) ||
          tagsLower.includes(normalizedQuery)
        );
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
      
      // Log search filter results 
      if (searchQuery.trim()) {
        console.log(`[Admin] Search results for "${searchQuery}": ${productCount} matches`);
      }
    }
    
    return items;
  }, [slots, filterCategory, sortCriteria, isAdmin, debugMode, searchQuery, isSearching]);

  // Get only products from grid items for display
  const productItems = useMemo(() => {
    return gridItems.filter(item => item.type === 'product');
  }, [gridItems]);

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
              
              {/* Search bar - now fully functional */}
              <form onSubmit={handleSearchSubmit} className="relative max-w-lg mx-auto">
                <input
                  type="text"
                  ref={searchInputRef}
                  placeholder={t(text.searchPlaceholder)}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full px-6 py-4 pr-16 rounded-full shadow-md border-0 focus:ring-2 focus:ring-indigo-400 focus:outline-none text-gray-600"
                  disabled={isSearching}
                />
                {searchQuery ? (
                  <button 
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-14 top-3 text-gray-400 hover:text-gray-600 transition"
                    aria-label={t(text.clearSearch)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : null}
                <button 
                  type="submit"
                  className="absolute right-2 top-2 bg-indigo-700 text-white p-2 rounded-full hover:bg-indigo-800 transition duration-150 disabled:opacity-70"
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? (
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </form>
              
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

      {/* Search Results Label */}
      {searchQuery.trim() && !isSearching && (
        <div className="mb-6">
          <h2 className="text-xl font-medium text-gray-700">
            {t(text.searchResults)}: "{searchQuery}"
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({productItems.length} {productItems.length === 1 
                ? t({en: 'result', fr: 'résultat'}) 
                : t({en: 'results', fr: 'résultats'})})
            </span>
          </h2>
        </div>
      )}

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
              onClick={() => refreshSlots()}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md"
            >
              Refresh Slots
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">
          {searchQuery.trim() && !isSearching 
            ? t(text.searchResults) 
            : t(text.productGridHeading)}
        </h2>
        
        {slotsLoading || isSearching ? (
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
              onClick={() => refreshSlots()}
              className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
            >
              {t(text.retryButton)}
            </button>
          </div>
        ) : (
          // Product grid or empty state
          productItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {productItems.map(item => (
                <MemoizedProductCard
                  key={`product-${item.slotNumber}`}
                  product={item.product!}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          ) : (
            // No products found state
            <div className="text-center py-16 border border-gray-200 rounded-lg">
              <p className="text-gray-600 mb-4">{t(text.noProductsFound)}</p>
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
                >
                  {t(text.clearSearch)}
                </button>
              )}
            </div>
          )
        )}
      </section>
    </div>
  );
};

export default memo(HomePage);
