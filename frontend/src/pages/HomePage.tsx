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
import { Helmet } from 'react-helmet-async';

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
  
  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Fetch slots with their associated products
  const { slots, loading: slotsLoading, error: slotsError } = useSlots();
  
  // Fetch categories
  const { categories } = useCategories();
  
  // Text content with bilingual support
  const text = {
    welcome: { 
      en: 'Welcome to SokoClick', 
      fr: 'Bienvenue à SokoClick' 
    },
    tagline: { 
      en: 'Connect with sellers through WhatsApp and discover products that match your needs.',
      fr: 'Connectez-vous avec des vendeurs via WhatsApp et découvrez des produits qui répondent à vos besoins.'
    },
    productGridHeading: {
      en: 'Current Listings',
      fr: 'Annonces Actuelles'
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
        return category?.id === filterCategory;
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
    return Array.from({ length: 25 }, (_, index) => {
      const slotNumber = index + 1;
      const slot = filteredSlots.find(s => s.id === slotNumber);
      
      if (slot?.product && 
          slot.status === SlotStatus.OCCUPIED && 
          (isAdmin || slot.product.status === 'approved')) {
        return {
          type: 'product',
          slotNumber,
          product: slot.product
        };
      } else {
        return {
          type: 'empty',
          slotNumber,
          status: slot?.status || SlotStatus.AVAILABLE
        };
      }
    });
  }, [slots, filterCategory, sortCriteria, isAdmin]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{t(text.welcome)}</title>
        <meta name="description" content={t(text.tagline)} />
      </Helmet>

      {/* Header Section */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t(text.welcome)}</h1>
        <p className="text-lg text-gray-600">{t(text.tagline)}</p>
      </header>

      {/* Filters Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <CategoryFilter
          categories={categories || []}
          selectedCategory={filterCategory}
          onCategoryChange={handleCategoryChange}
        />
        <SortingSelector
          value={sortCriteria}
          onChange={handleSortChange}
        />
      </div>

      {/* Product Grid */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">{t(text.productGridHeading)}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {slotsLoading ? (
            // Skeleton loading state
            Array.from({ length: 25 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="relative h-full">
                <Skeleton
                  variant="productCard"
                  className="w-full h-full"
                  animation={prefersReducedMotion ? 'none' : 'pulse'}
                />
              </div>
            ))
          ) : slotsError ? (
            // Error state
            <div className="col-span-full text-center py-12">
              <p className="text-red-600 mb-4">{t(text.errorMessage)}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
              >
                {t(text.retryButton)}
              </button>
            </div>
          ) : (
            // Product grid
            gridItems.map(item => (
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
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default memo(HomePage);
