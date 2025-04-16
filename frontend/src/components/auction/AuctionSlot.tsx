import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AuctionSlot as AuctionSlotType } from '../../types/supabase';
import LazyImage from '../LazyImage';
import Card, { CardBody, CardFooter } from '../ui/Card';
import { H3, Text } from '../ui/Typography';
import Button from '../ui/Button';
import EmptySlotCard from '../EmptySlotCard';

const CountdownTimer = lazy(() => import('../CountdownTimer'));

// Loading placeholder for lazy-loaded components
const LazyLoadingPlaceholder = () => (
  <div className="animate-pulse bg-gray-200 h-10 rounded"></div>
);

interface AuctionSlotProps {
  slot: AuctionSlotType;
  variant?: 'card' | 'compact' | 'grid';
  className?: string;
  showEditOptions?: boolean;
  onEditClick?: (slotId: number) => void;
  onAssignProductClick?: (slotId: number) => void;
  onRemoveProductClick?: (slotId: number) => void;
}

/**
 * AuctionSlot component for displaying auction slots
 * Uses the SokoClick design system
 */
const AuctionSlot: React.FC<AuctionSlotProps> = ({ 
  slot, 
  variant = 'card',
  className = '',
  showEditOptions = false,
  onEditClick,
  onAssignProductClick,
  onRemoveProductClick
}) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  
  // Empty slot check
  const isEmpty = !slot.product;
  
  // If slot is empty, render the EmptySlotCard component with additional options
  if (isEmpty) {
    if (showEditOptions) {
      return (
        <Card variant="hover" className={`h-full transition-all duration-300 ${className}`}>
          <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-t-lg overflow-hidden">
            <div className="flex items-center justify-center h-full">
              <svg 
                className="w-12 h-12 text-gray-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
          </div>
          
          <CardBody>
            <H3>{t('emptySlot')}</H3>
            <Text variant="body-sm" className="text-gray-600 mt-2">
              {t('emptySlotMessage', { id: slot.id })}
            </Text>
          </CardBody>
          
          <CardFooter>
            <div className="w-full">
              <Button 
                variant="primary" 
                fullWidth 
                onClick={() => onAssignProductClick?.(slot.id)}
              >
                {t('admin.assignProduct', { id: slot.id })}
              </Button>
              <Button 
                variant="ghost" 
                fullWidth 
                onClick={() => onEditClick?.(slot.id)}
                className="mt-2"
              >
                {t('admin.editSlot', { id: slot.id })}
              </Button>
            </div>
          </CardFooter>
        </Card>
      );
    }
    return <EmptySlotCard slotId={slot.id} className={className} />;
  }
  
  // Get the product name based on current language
  const productName = currentLanguage === 'fr'
    ? slot.product?.name_fr || t('missingName')
    : slot.product?.name_en || t('missingName');
  
  // Get the first image URL if available
  const imageUrl = slot.product?.image_urls?.[0] || '';

  if (variant === 'compact') {
    return (
      <div className={`flex items-center p-3 border rounded ${className}`}>
        <div className="w-12 h-12 mr-3 bg-gray-100 rounded overflow-hidden">
          {imageUrl ? (
            <LazyImage
              src={imageUrl}
              alt={productName}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="font-medium truncate">{productName}</div>
          <div className="text-sm text-gray-500">
            {slot.product?.starting_price.toLocaleString()} {slot.product?.currency}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          {showEditOptions ? (
            <div className="flex space-x-2">
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => onEditClick?.(slot.id)}
                title={t('admin.editSlot')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button 
                className="text-red-500 hover:text-red-700"
                onClick={() => onRemoveProductClick?.(slot.id)}
                title={t('admin.removeProduct')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ) : (
            <Link to={`/sc/${slot.id}`} className="text-primary-600 hover:text-primary-800">
              <span className="sr-only">{t('viewDetails')}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card 
      variant="hover" 
      className={`overflow-hidden h-full transition-all duration-300 ${
        slot.featured ? 'ring-2 ring-accent-600' : ''
      } ${className}`}
    >
      <Link to={showEditOptions ? '#' : `/sc/${slot.id}`} className="block h-full">
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 relative overflow-hidden">
          {/* Featured badge */}
          {slot.featured && (
            <div className="absolute top-2 left-2 z-10">
              <span className="bg-accent-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                {t('featured')}
              </span>
            </div>
          )}
          
          {/* View count badge */}
          {slot.view_count > 0 && (
            <div className="absolute top-2 right-2 z-10">
              <span className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {slot.view_count}
              </span>
            </div>
          )}
          
          <div className="w-full h-full transform transition-transform duration-500 hover:scale-110">
            <LazyImage
              src={imageUrl}
              alt={productName}
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </div>
        
        <CardBody>
          <H3 className="mb-1 truncate">{productName}</H3>
          
          {slot.product && (
            <>
              <div className="flex items-center justify-between">
                <Text variant="body-lg" className="text-primary-600 font-bold">
                  {slot.product.starting_price.toLocaleString()} {slot.product.currency}
                </Text>
                
                {slot.product.condition && (
                  <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                    {slot.product.condition}
                  </span>
                )}
              </div>
              
              {slot.is_active && slot.end_time && (
                <div className="mt-2 text-sm text-gray-600">
                  <Suspense fallback={<LazyLoadingPlaceholder />}>
                    <CountdownTimer 
                      endTime={slot.end_time} 
                    />
                  </Suspense>
                </div>
              )}
            </>
          )}
        </CardBody>
        
        <CardFooter>
          {showEditOptions ? (
            <div className="flex flex-col space-y-2 w-full">
              <Button 
                variant="outline" 
                fullWidth 
                onClick={(e) => {
                  e.preventDefault();
                  onEditClick?.(slot.id);
                }}
              >
                {t('admin.editSlot', { id: slot.id })}
              </Button>
              <Button 
                variant="danger" 
                fullWidth 
                onClick={(e) => {
                  e.preventDefault();
                  onRemoveProductClick?.(slot.id);
                }}
              >
                {t('admin.removeProduct')}
              </Button>
            </div>
          ) : (
            <Button 
              variant="primary" 
              fullWidth
            >
              {t('viewDetails')}
            </Button>
          )}
        </CardFooter>
      </Link>
    </Card>
  );
};

export default AuctionSlot; 