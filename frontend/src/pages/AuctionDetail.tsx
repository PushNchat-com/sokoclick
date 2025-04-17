import { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import LazyImage from '../components/LazyImage';
import ErrorBoundary from '../components/ErrorBoundary';
import EmptySlotCard from '../components/EmptySlotCard';
import Container from '../components/ui/Container';
import { H1, H2, Text } from '../components/ui/Typography';
import Button from '../components/ui/Button';
import { useAuctionSlotById } from '../hooks/useSupabaseData';
import { useWhatsApp } from '../context/WhatsAppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../providers/ToastProvider';
const CountdownTimer = lazy(() => import('../components/CountdownTimer'));

// Loading placeholder for lazy-loaded components
const LazyLoadingPlaceholder = () => (
  <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
);

// WhatsApp modal component
const WhatsAppModal = ({ isOpen, onClose, sellerNumber, productName, productId, productImage, offerAmount, currency }) => {
  const { t } = useTranslation();
  const { initiateConversation } = useWhatsApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  if (!isOpen) return null;

  const handleWhatsAppIntegration = async () => {
    setIsLoading(true);
    
    if (!user) {
      // Redirect to login if not logged in
      toast.warning(t('errors.loginRequired'));
      navigate('/login', { state: { from: `/sc/${productId}` } });
      return;
    }
    
    try {
      // Format initial message with offer details
      const initialMessage = `${t('whatsappMessage')}\n\n` +
        `${t('myOffer')}: ${offerAmount} ${currency}`;
      
      // Initiate conversation through our WhatsApp context
      const conversationId = await initiateConversation(
        productId,
        sellerNumber, // This should be the seller ID in a real app
        productName,
        productImage
      );
      
      if (conversationId) {
        // Navigate to WhatsApp conversation
        navigate('/messages');
        toast.success(t('whatsapp.conversationStarted'));
      } else {
        // Fallback to direct WhatsApp link if conversation creation fails
        handleDirectWhatsApp();
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      // Fallback to direct WhatsApp
      handleDirectWhatsApp();
    } finally {
      setIsLoading(false);
      onClose();
    }
  };
  
  const handleDirectWhatsApp = () => {
    // Format WhatsApp link with offer details as fallback
    const message = encodeURIComponent(
      `${t('whatsappMessage')}\n\n` +
      `${t('productName')}: ${productName}\n` +
      `${t('myOffer')}: ${offerAmount} ${currency}\n\n` +
      `${t('fromSokoClick')}`
    );
    
    window.open(`https://wa.me/${sellerNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4">{t('contactViaTwhatsApp')}</h3>
        <p className="mb-6">{t('whatsapp.startConversation')}</p>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="mb-2">
            <span className="font-medium">{t('productName')}:</span> {productName}
          </div>
          <div>
            <span className="font-medium">{t('myOffer')}:</span> {offerAmount} {currency}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t('cancel')}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleWhatsAppIntegration}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.722 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411"/>
                </svg>
                {t('contactViaTwhatsApp')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const AuctionDetail = () => {
  const { slotId } = useParams<{ slotId: string }>();
  const { t, i18n } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Use real data hook instead of mock
  const { slot: auctionDetail, loading, error } = useAuctionSlotById(Number(slotId));
  
  useEffect(() => {
    // Set the first image as selected image when data loads
    if (auctionDetail?.product?.image_urls && auctionDetail.product.image_urls.length > 0) {
      setSelectedImage(auctionDetail.product.image_urls[0]);
    }
    
    // Set initial offer amount based on starting price
    if (auctionDetail?.product?.starting_price) {
      setOfferAmount(auctionDetail.product.starting_price.toString());
    }
  }, [auctionDetail]);

  const currentLanguage = i18n.language;
  
  const handleContactSeller = () => {
    // If not logged in, redirect to login page
    if (!user) {
      navigate('/login', { state: { from: `/sc/${slotId}` } });
      return;
    }
    
    setShowWhatsAppModal(true);
  };

  // Extract product info with proper fallbacks
  const productName = auctionDetail?.product 
    ? (currentLanguage === 'fr' 
      ? auctionDetail.product.name_fr 
      : auctionDetail.product.name_en)
    : t('emptySlot');

  const productDescription = auctionDetail?.product
    ? (currentLanguage === 'fr'
      ? auctionDetail.product.description_fr
      : auctionDetail.product.description_en)
    : '';
    
  const parseAndFormatPrice = (price: string) => {
    const numericValue = parseFloat(price.replace(/[^0-9.-]+/g, ''));
    return !isNaN(numericValue) ? numericValue.toLocaleString() : '';
  };
  
  // Get the seller's WhatsApp number, either directly from product or from seller
  const sellerWhatsApp = auctionDetail?.product?.seller_whatsapp || 
                        (auctionDetail?.product?.seller?.whatsapp_number || '');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-12 bg-gray-50">
        <ErrorBoundary>
          <div className="max-container">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-full max-w-3xl">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg mb-6"></div>
                    <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
                    <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">{t('errorOccurred')}</h3>
                <p className="text-red-600 mb-4">{error instanceof Error ? error.message : String(error)}</p>
                <Button variant="primary" onClick={() => window.location.reload()}>
                  {t('tryAgain')}
                </Button>
              </div>
            ) : !auctionDetail?.product ? (
              <Container size="small">
                <EmptySlotCard slotId={Number(slotId)} />
              </Container>
            ) : (
              <>
                <div className="mb-6">
                  <a href="/" className="text-primary-600 hover:text-primary-700 flex items-center">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {t('backToAuctions')}
                  </a>
                </div>
                
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                  <div className="md:flex">
                    <div className="md:w-1/2 p-6">
                      <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg mb-4 relative overflow-hidden">
                        {selectedImage && (
                          <LazyImage
                            src={selectedImage}
                            alt={productName}
                            className="object-contain"
                          />
                        )}
                        
                        {/* Featured badge */}
                        {auctionDetail.featured && (
                          <div className="absolute top-4 left-4 z-10">
                            <span className="bg-accent-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                              {t('featured')}
                            </span>
                          </div>
                        )}
                        
                        {/* View count */}
                        <div className="absolute top-4 right-4 z-10">
                          <span className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {auctionDetail.view_count}
                          </span>
                        </div>
                      </div>
                      
                      {/* Thumbnail gallery */}
                      {auctionDetail.product.image_urls && auctionDetail.product.image_urls.length > 1 && (
                        <div className="grid grid-cols-5 gap-2">
                          {auctionDetail.product.image_urls.map((image, index) => (
                            <button
                              key={index}
                              className={`
                                aspect-w-1 aspect-h-1 bg-gray-100 rounded overflow-hidden
                                ${selectedImage === image ? 'ring-2 ring-primary-600' : ''}
                              `}
                              onClick={() => setSelectedImage(image)}
                            >
                              <LazyImage
                                src={image}
                                alt={`${productName} - Image ${index + 1}`}
                                className="object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="md:w-1/2 p-6">
                      {auctionDetail.featured && (
                        <div className="inline-block bg-accent-100 text-accent-800 text-xs px-2 py-1 rounded-full mb-2">
                          {t('featured')}
                        </div>
                      )}
                      
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {productName}
                      </h1>
                      
                      <div className="flex items-center mb-6">
                        <span className="text-2xl font-bold text-primary-600">
                          {auctionDetail.product.starting_price.toLocaleString()} {auctionDetail.product.currency}
                        </span>
                        <span className="ml-2 text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {auctionDetail.product.condition}
                        </span>
                      </div>
                      
                      {auctionDetail.is_active && auctionDetail.end_time && (
                        <div className="mb-6 p-3 bg-primary-50 border border-primary-100 rounded-md">
                          <h3 className="text-sm font-medium text-primary-800 mb-1">{t('timeRemaining')}</h3>
                          <Suspense fallback={<LazyLoadingPlaceholder />}>
                            <CountdownTimer 
                              endTime={auctionDetail.end_time} 
                              className="text-xl font-bold text-primary-600"
                            />
                          </Suspense>
                        </div>
                      )}
                      
                      <div className="mb-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-2">{t('description')}</h2>
                        <p className="text-gray-600 whitespace-pre-line">
                          {productDescription}
                        </p>
                      </div>
                      
                      <div className="mb-8">
                        <div className="mb-4">
                          <label htmlFor="offer" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('yourOffer')}
                          </label>
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">
                                {auctionDetail.product.currency}
                              </span>
                            </div>
                            <input
                              type="text"
                              name="offer"
                              id="offer"
                              className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 pr-12 py-3 sm:text-sm border-gray-300 rounded-md"
                              placeholder="0.00"
                              value={offerAmount}
                              onChange={(e) => setOfferAmount(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        {sellerWhatsApp ? (
                          <Button 
                            variant="primary" 
                            fullWidth 
                            onClick={handleContactSeller}
                          >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.722 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411"/>
                            </svg>
                            {t('contactViaTwhatsApp')}
                          </Button>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-md text-sm text-yellow-800">
                            {t('sellerContactUnavailable')}
                          </div>
                        )}
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">{t('productDetails')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">{t('condition')}</p>
                            <p className="text-gray-900">{auctionDetail.product.condition}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{t('productId')}</p>
                            <p className="text-gray-900">{auctionDetail.product.id}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{t('slotNumber')}</p>
                            <p className="text-gray-900">#{auctionDetail.id}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{t('views')}</p>
                            <p className="text-gray-900">{auctionDetail.view_count}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </ErrorBoundary>
      </main>
      
      {showWhatsAppModal && (
        <WhatsAppModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          sellerNumber={sellerWhatsApp}
          productName={productName}
          productId={slotId}
          productImage={selectedImage}
          offerAmount={offerAmount}
          currency={auctionDetail?.product?.currency || 'XAF'}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default AuctionDetail; 