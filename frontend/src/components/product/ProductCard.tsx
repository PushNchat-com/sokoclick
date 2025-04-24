import React from 'react';
import { useLanguage } from '../../store/LanguageContext';
import { Product } from '../../services/products';

interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  className?: string;
  currentLanguage?: 'en' | 'fr';
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isAdmin = false,
  className = '',
  currentLanguage
}) => {
  const { language: contextLanguage, t } = useLanguage();
  const language = currentLanguage || contextLanguage;

  const mainImage = product.image_urls[0] || '/placeholder-product.jpg';
  const title = language === 'en' ? product.name_en : product.name_fr;
  const description = language === 'en' ? product.description_en : product.description_fr;

  // Format end date
  const formatTimeRemaining = () => {
    if (!product.end_date) return '';
    
    const now = new Date();
    const endDate = new Date(product.end_date);
    const diffMs = endDate.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return t({
        en: 'Ended',
        fr: 'Terminé'
      });
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return t({
        en: `${diffHours}h ${diffMinutes}m left`,
        fr: `${diffHours}h ${diffMinutes}m restant`
      });
    }
    return t({
      en: `${diffMinutes}m left`,
      fr: `${diffMinutes}m restant`
    });
  };

  return (
    <div 
      className={`
        product-card relative flex flex-col
        bg-white rounded-lg shadow-sm border border-gray-200
        overflow-hidden transition-shadow hover:shadow-md
        ${className}
      `}
    >
      <div className="relative aspect-w-4 aspect-h-3">
        <img
          src={mainImage}
          alt={title}
          className="object-cover w-full h-full"
          loading="lazy"
        />
        {product.is_featured && (
          <div className="absolute top-2 right-2">
            <span className="bg-secondary-500 text-white px-2 py-1 rounded-md text-sm font-medium">
              {t({
                en: 'Featured',
                fr: 'En vedette'
              })}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {description}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-primary-600">
            {product.price.toLocaleString()} {product.currency}
          </div>
          {product.seller && (
            <div className="text-sm text-gray-500">
              {product.seller.location}
            </div>
          )}
        </div>
        {product.end_date && (
          <div className="mt-2 text-sm text-gray-500">
            {formatTimeRemaining()}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="absolute top-2 left-2">
          <button
            className="bg-primary-500 text-white p-1 rounded-full shadow-sm hover:bg-primary-600"
            aria-label={t({
              en: 'Edit Product',
              fr: 'Modifier le Produit'
            })}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
