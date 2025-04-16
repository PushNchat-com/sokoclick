import { useEffect, useState, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { AuctionSlot } from '../types/supabase';
import AuctionCard from '../components/AuctionCard';
import AuctionSkeletonCard from '../components/AuctionSkeletonCard';
import ErrorBoundary from '../components/ErrorBoundary';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import CategoryFilter, { CATEGORIES } from '../components/CategoryFilter';
import { useMockAuctionSlots } from '../hooks/useMockData';

const Home = () => {
  const { t } = useTranslation();
  const [filteredSlots, setFilteredSlots] = useState<AuctionSlot[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const SLOTS_PER_PAGE = 15;
  
  const {
    page,
    loadMore,
    isLoading,
    observerRef,
    hasMore,
    setHasMore
  } = useInfiniteScroll();

  // Use the mock data hook instead of direct Supabase call
  const { slots, loading: initialLoading, error } = useMockAuctionSlots(SLOTS_PER_PAGE, (page - 1) * SLOTS_PER_PAGE);
  
  // Update hasMore based on received data length
  useEffect(() => {
    if (slots.length < SLOTS_PER_PAGE) {
      setHasMore(false);
    }
  }, [slots, setHasMore]);
  
  // Filter slots based on selected category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredSlots(slots);
    } else {
      // Filter based on category
      const filtered = slots.filter(slot => {
        if (!slot.product) return false;
        
        // For demonstration purposes only:
        // We're checking if the product name or description contains the category
        const nameEn = slot.product.name_en?.toLowerCase() || '';
        const descEn = slot.product.description_en?.toLowerCase() || '';
        return (
          nameEn.includes(selectedCategory.toLowerCase()) || 
          descEn.includes(selectedCategory.toLowerCase())
        );
      });
      
      setFilteredSlots(filtered);
    }
  }, [selectedCategory, slots]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <section className="hero-section">
          <div className="max-container text-center relative">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
              <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white"></div>
              <div className="absolute top-32 -right-16 w-40 h-40 rounded-full bg-white"></div>
            </div>
            
            <div className="relative">
              <h1 className="hero-title">
                {t('heroTitle')}
              </h1>
              <p className="hero-subtitle">
                {t('heroSubtitle')}
              </p>
              <div className="mt-10">
                <a
                  href="#auction-slots"
                  className="btn btn-primary bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg shadow-lg hover:shadow-xl transform transition hover:-translate-y-1"
                >
                  {t('viewAuctions')}
                </a>
              </div>
            </div>
          </div>
        </section>
        
        <section id="auction-slots" className="py-16 bg-gray-50">
          <div className="max-container">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-10 text-center">
              {t('currentAuctions')}
            </h2>
            
            {/* Add category filter */}
            <CategoryFilter 
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
            
            <ErrorBoundary>
              {initialLoading ? (
                <div className="auction-grid">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <AuctionSkeletonCard key={index} />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                  <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">{t('errorOccurred')}</h3>
                  <p className="text-red-600 mb-4">{error instanceof Error ? error.message : String(error)}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="btn btn-primary"
                  >
                    {t('tryAgain')}
                  </button>
                </div>
              ) : filteredSlots.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {selectedCategory === 'all' 
                      ? t('noAuctionsAvailable') 
                      : t('noAuctionsInCategory')}
                  </h3>
                  {selectedCategory !== 'all' && (
                    <button 
                      onClick={() => setSelectedCategory('all')}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                      {t('showAllCategories')}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="auction-grid">
                    {filteredSlots.map((slot) => (
                      <Suspense key={slot.id} fallback={<AuctionSkeletonCard />}>
                        <AuctionCard slot={slot} />
                      </Suspense>
                    ))}
                  </div>
                  
                  {/* Loader for infinite scrolling */}
                  {hasMore && selectedCategory === 'all' && (
                    <div 
                      ref={observerRef} 
                      className="flex justify-center mt-10"
                    >
                      {isLoading && (
                        <div className="auction-grid w-full">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <AuctionSkeletonCard key={index} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* No more items message */}
                  {!hasMore && filteredSlots.length > 0 && (
                    <div className="text-center py-8 text-gray-500 italic">
                      {t('noMoreAuctions')}
                    </div>
                  )}
                </>
              )}
            </ErrorBoundary>
          </div>
        </section>
        
        <section className="py-16 bg-white">
          <div className="max-container text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-12">
              {t('howItWorks')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 text-3xl font-bold mb-6">1</div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">{t('step1Title')}</h3>
                <p className="text-gray-600">{t('step1Description')}</p>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-100 text-accent-600 text-3xl font-bold mb-6">2</div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">{t('step2Title')}</h3>
                <p className="text-gray-600">{t('step2Description')}</p>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl font-bold mb-6">3</div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">{t('step3Title')}</h3>
                <p className="text-gray-600">{t('step3Description')}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home; 