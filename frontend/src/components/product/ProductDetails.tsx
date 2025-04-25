import React from 'react';
import CountdownTimer from './CountdownTimer';
import ImageGallery from './ImageGallery';

interface SellerInfo {
  id: string | number;
  name: string;
  isVerified: boolean;
  joinDate: string;
  avatar?: string;
  rating: number;
  totalSales: number;
}

interface DeliveryInfo {
  method: string;
  location: string;
  time: string;
}

export interface ProductDetailsProps {
  id: string | number;
  title: {
    en: string;
    ar?: string;
  };
  description: {
    en: string;
    ar?: string;
  };
  price: number;
  originalPrice?: number;
  currency: string;
  condition: string;
  images: Array<{
    id: string | number;
    url: string;
    alt: string;
  }>;
  seller: SellerInfo;
  delivery: DeliveryInfo;
  category: string;
  subcategory?: string;
  tags?: string[];
  whatsappNumber: string;
  endTime?: Date;
  locale?: 'en' | 'ar';
  className?: string;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({
  title,
  description,
  price,
  originalPrice,
  currency,
  condition,
  images,
  seller,
  delivery,
  category,
  subcategory,
  tags,
  whatsappNumber,
  endTime,
  locale = 'en',
  className = '',
}) => {
  const isRTL = locale === 'ar';
  const displayTitle = isRTL && title.ar ? title.ar : title.en;
  const displayDescription = isRTL && description.ar ? description.ar : description.en;
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  
  const handleWhatsAppClick = () => {
    // Format WhatsApp number (remove spaces, dashes, etc.)
    const formattedNumber = whatsappNumber.replace(/\D/g, '');
    
    // Create message template with product title
    const message = encodeURIComponent(`Hello, I'm interested in your product: ${title.en}`);
    
    // Open WhatsApp with the message
    window.open(`https://wa.me/${formattedNumber}?text=${message}`, '_blank');
  };

  return (
    <div className={`max-w-7xl mx-auto ${isRTL ? 'rtl' : 'ltr'} ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
        {/* Left column - Image Gallery */}
        <div>
          <ImageGallery images={images} />
        </div>
        
        {/* Right column - Product Information */}
        <div className="space-y-6">
          {/* Title and price section */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{displayTitle}</h1>
            
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold text-gray-900">{formatCurrency(price)}</span>
              {originalPrice && (
                <>
                  <span className="text-lg text-gray-500 line-through">{formatCurrency(originalPrice)}</span>
                  <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">
                    {discount}% {isRTL ? 'خصم' : 'OFF'}
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center text-sm text-gray-500 mt-2 gap-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                <span>{isRTL ? 'الحالة:' : 'Condition:'} {condition}</span>
              </div>
              
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                  <path fillRule="evenodd" d="M5.5 3A2.5 2.5 0 003 5.5v2.879a2.5 2.5 0 00.732 1.767l6.5 6.5a2.5 2.5 0 003.536 0l2.878-2.878a2.5 2.5 0 000-3.536l-6.5-6.5A2.5 2.5 0 008.38 3H5.5zM6 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>{isRTL ? 'الفئة:' : 'Category:'} {category}{subcategory ? ` / ${subcategory}` : ''}</span>
              </div>
            </div>
          </div>
          
          {/* Countdown timer if applicable */}
          {endTime && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">{isRTL ? 'ينتهي في:' : 'Ends in:'}</p>
              <CountdownTimer
                endTime={endTime}
                onComplete={() => console.log('Auction ended')}
                className="text-lg font-semibold"
              />
            </div>
          )}
          
          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold mb-2">{isRTL ? 'الوصف' : 'Description'}</h2>
            <p className="text-gray-700 whitespace-pre-line">{displayDescription}</p>
          </div>
          
          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Delivery Information */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">{isRTL ? 'معلومات التوصيل' : 'Delivery Information'}</h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500 mr-3 mt-0.5">
                  <path d="M6.5 3c-1.051 0-2.093.04-3.125.117A1.49 1.49 0 002 4.607V10.5h9V4.606c0-.771-.59-1.43-1.375-1.489A41.568 41.568 0 006.5 3zM2 12v2.5A1.5 1.5 0 003.5 16h.041a3 3 0 015.918 0h.791a.75.75 0 00.75-.75V12H2z" />
                  <path d="M6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM13.25 5a.75.75 0 00-.75.75v8.514a3.001 3.001 0 014.893 1.44c.37-.275.61-.719.595-1.227a24.905 24.905 0 00-1.784-8.549A1.486 1.486 0 0014.823 5H13.25zM14.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                <div>
                  <p className="font-medium">{isRTL ? 'طريقة التوصيل' : 'Delivery Method'}</p>
                  <p className="text-gray-600">{delivery.method}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500 mr-3 mt-0.5">
                  <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">{isRTL ? 'الموقع' : 'Location'}</p>
                  <p className="text-gray-600">{delivery.location}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500 mr-3 mt-0.5">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">{isRTL ? 'وقت التسليم' : 'Delivery Time'}</p>
                  <p className="text-gray-600">{delivery.time}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Seller Information */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">{isRTL ? 'معلومات البائع' : 'Seller Information'}</h2>
            <div className="flex items-center">
              <div className="relative">
                {seller.avatar ? (
                  <img 
                    src={seller.avatar} 
                    alt={seller.name} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 font-medium">
                      {seller.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {seller.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <p className="font-medium">{seller.name}</p>
                  {seller.isVerified && (
                    <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                      {isRTL ? 'موثق' : 'Verified'}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <div className="flex items-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-yellow-400 mr-1">
                      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                    </svg>
                    <span>{seller.rating.toFixed(1)}</span>
                  </div>
                  <div>
                    <span>{isRTL ? 'عضو منذ' : 'Member since'} {seller.joinDate}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">
                {isRTL ? `${seller.totalSales} عمليات بيع مكتملة` : `${seller.totalSales} completed sales`}
              </p>
              <button
                onClick={handleWhatsAppClick}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="mr-2">
                  <path fill="currentColor" d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.18 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {isRTL ? 'تواصل عبر الواتساب' : 'Contact via WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
