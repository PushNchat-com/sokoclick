import { useEffect, useState, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { AuctionSlot } from '../types/supabase';
import AuctionCard from '../components/AuctionCard';
import AuctionSkeletonCard from '../components/AuctionSkeletonCard';
import ErrorBoundary from '../components/ErrorBoundary';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import { useAuctionSlots, useFeaturedSlots } from '../hooks/useSupabaseData';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const Home = () => {
  const { t } = useTranslation();
  const [debugMode, setDebugMode] = useState(false);
  
  const SLOTS_PER_PAGE = 25; // Always show 25 slots on the home page
  
  const {
    page,
    loadMore,
    isLoading,
    observerRef,
    hasMore,
    setHasMore
  } = useInfiniteScroll();

  // Use the real Supabase data hook instead of mock data
  const { slots, loading: initialLoading, error } = useAuctionSlots(SLOTS_PER_PAGE, 0);
  
  // Featured slots for showcasing on empty results
  const { featuredSlots } = useFeaturedSlots(3);
  
  // Update hasMore based on received data length
  useEffect(() => {
    // No more slots to load - we always display exactly 25
    setHasMore(false);
  }, [slots, setHasMore]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Modern Hero Section with Gradient Background */}
        <section className="bg-gradient-to-r from-blue-600 to-orange-500 text-white py-16 md:py-20">
          <div className="max-container relative overflow-hidden px-4">
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
              <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-2xl"></div>
              <div className="absolute top-32 -right-16 w-64 h-64 rounded-full bg-white blur-xl"></div>
            </div>
            
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
                {t('heroTitle', 'Exclusive Auctions, Limited Slots')}
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl mb-8 md:mb-10 text-white/90">
                {t('heroSubtitle', 'Discover our curated selection of 25 exclusive products available for auction right now.')}
              </p>
              <Link to="#auction-slots" className="inline-block px-6 py-3 md:px-8 md:py-4 bg-white text-primary-600 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl hover:bg-gray-100 transition transform hover:-translate-y-1">
                {t('viewAuctions', 'View Auctions')}
              </Link>
              <Link to="/supabase-test" className="ml-4 inline-block px-6 py-3 md:px-8 md:py-4 bg-accent-600 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl hover:bg-accent-700 transition transform hover:-translate-y-1">
                Supabase Test
              </Link>
            </div>
          </div>
        </section>
        
        <section id="auction-slots" className="py-12 md:py-16 bg-gray-50">
          <div className="max-container px-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8 md:mb-10 text-center">
              {t('currentAuctions')}
            </h2>
            
            <ErrorBoundary>
              {initialLoading ? (
                <div className="auction-grid mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <AuctionSkeletonCard key={index} />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-10 md:py-16 bg-white rounded-lg shadow-sm">
                  <svg className="w-12 h-12 md:w-16 md:h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                  
                  {/* Debug button */}
                  <button
                    onClick={() => setDebugMode(!debugMode)}
                    className="ml-4 mt-2 text-xs text-gray-500 underline"
                  >
                    {debugMode ? 'Hide Debug Info' : 'Show Debug Info'}
                  </button>
                  
                  {debugMode && (
                    <div className="mt-4 text-left p-4 bg-gray-100 rounded overflow-auto max-h-64 text-xs">
                      <pre>Slots count: {slots.length}</pre>
                      <pre>Error: {error.toString()}</pre>
                    </div>
                  )}
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-10 md:py-12 bg-white rounded-lg shadow-sm">
                  <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {t('noAuctionsAvailable')}
                  </h3>
                  
                  <p className="text-gray-600 mt-2">
                    {t('checkBackLater', 'Check back later for new auctions or try refreshing the page.')}
                  </p>
                  
                  {/* Debugging button for development */}
                  <button
                    onClick={() => setDebugMode(!debugMode)}
                    className="block mx-auto mt-4 text-xs text-gray-500 underline"
                  >
                    {debugMode ? 'Hide Debug Info' : 'Show Debug Info'}
                  </button>
                  
                  {debugMode && (
                    <div className="mt-4 text-left p-4 bg-gray-100 rounded overflow-auto max-h-64 text-xs">
                      <pre>Raw slots: {JSON.stringify(slots, null, 2)}</pre>
                    </div>
                  )}
                  
                  {/* If no slots but we have featured slots, show them */}
                  {featuredSlots.length > 0 && (
                    <div className="mt-12">
                      <h3 className="text-xl font-medium text-gray-900 mb-6">
                        {t('featuredItems', 'Featured Items You Might Like')}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {featuredSlots.map((slot) => (
                          <Suspense key={slot.id} fallback={<AuctionSkeletonCard />}>
                            <AuctionCard slot={slot} />
                          </Suspense>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="auction-grid mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
                    {slots.map((slot) => (
                      <Suspense key={slot.id} fallback={<AuctionSkeletonCard />}>
                        <AuctionCard slot={slot} />
                      </Suspense>
                    ))}
                  </div>
                </>
              )}
            </ErrorBoundary>
          </div>
        </section>
        
        <section className="py-12 md:py-16 bg-white">
          <div className="max-container text-center px-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8 md:mb-12">
              {t('howItWorks')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
              <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 text-3xl font-bold mb-6">1</div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">{t('step1Title', 'Browse Products')}</h3>
                <p className="text-gray-600">{t('step1Description', 'Browse through our exclusive selection of 25 auction slots featuring premium products.')}</p>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-100 text-accent-600 text-3xl font-bold mb-6">2</div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">{t('step2Title', 'Contact Seller')}</h3>
                <p className="text-gray-600">{t('step2Description', 'Contact the seller directly via WhatsApp to discuss the product and make an offer.')}</p>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl font-bold mb-6">3</div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">{t('step3Title', 'Secure Your Purchase')}</h3>
                <p className="text-gray-600">{t('step3Description', 'Complete your transaction securely using regional payment methods.')}</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Game Promotion Section */}
        <section className="py-12 md:py-16 bg-gradient-to-r from-accent-500 to-accent-700 text-white">
          <div className="max-container px-4">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <h2 className="text-2xl md:text-3xl font-extrabold mb-4">{t('game.title')}</h2>
                <p className="text-lg mb-6">{t('game.description')}</p>
                <Link to="/game">
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="bg-white text-accent-600 hover:bg-gray-100"
                  >
                    {t('game.startGame')}
                  </Button>
                </Link>
              </div>
              <div className="md:w-1/2 md:pl-8">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded overflow-hidden">
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <div className="grid grid-cols-5 grid-rows-5 gap-1 mb-4">
                        {Array.from({ length: 25 }).map((_, index) => (
                          <div 
                            key={index}
                            className={`w-full h-6 rounded-sm ${
                              // Add some variety to the demo grid with different cell types
                              index === 7 || index === 11 || index === 17 ? 'bg-blue-500' : // player cells
                              index === 6 || index === 12 ? 'bg-green-500' : // target cells
                              index === 8 || index === 18 ? 'bg-amber-700' : // box cells
                              index === 0 || index === 4 || index === 20 || index === 24 || 
                              index === 5 || index === 9 || index === 15 || index === 19 ? 'bg-gray-800' : // wall cells
                              'bg-gray-100' // empty cells
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
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