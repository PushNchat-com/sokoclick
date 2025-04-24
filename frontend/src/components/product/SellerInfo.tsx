import React from 'react';
import Badge from '../ui/Badge';
import ResponsiveImage from '../ui/ResponsiveImage';

export interface SellerInfoProps {
  name: string;
  registeredSince: Date | string;
  isVerified: boolean;
  avatarUrl?: string;
  rating?: number;
  totalSales?: number;
  className?: string;
}

const SellerInfo: React.FC<SellerInfoProps> = ({
  name,
  registeredSince,
  isVerified,
  avatarUrl,
  rating,
  totalSales,
  className = '',
}) => {
  // Format the registered date
  const formattedDate = typeof registeredSince === 'string' 
    ? new Date(registeredSince).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    : registeredSince.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

  return (
    <div className={`p-4 rounded-lg border bg-white ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Seller Information</h3>
      
      <div className="flex items-center gap-3">
        {/* Seller Avatar */}
        <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-200">
          {avatarUrl ? (
            <ResponsiveImage
              src={avatarUrl}
              alt={`${name}'s profile`}
              className="w-full h-full"
              objectFit="cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Seller Details */}
        <div className="flex-1">
          <div className="flex items-center">
            <h4 className="font-semibold mr-2">{name}</h4>
            {isVerified && (
              <Badge variant="success" className="h-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Verified
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">Registered: {formattedDate}</p>
          
          {/* Rating and Sales */}
          <div className="flex gap-3 mt-2">
            {rating !== undefined && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              </div>
            )}
            
            {totalSales !== undefined && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="text-sm font-medium">{totalSales} sales</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerInfo; 