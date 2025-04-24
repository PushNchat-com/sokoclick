import React from 'react';
import { useLanguage } from '../../store/LanguageContext';
import { Product } from '../../services/products';
import ProductListItem from './ProductListItem';

interface ProductListProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  onDeleteSuccess: () => void;
  emptyMessage?: { en: string; fr: string };
  errorMessage?: { en: string; fr: string };
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  loading,
  error,
  onDeleteSuccess,
  emptyMessage,
  errorMessage,
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}) => {
  const { t } = useLanguage();

  // Default text content
  const text = {
    noProducts: emptyMessage || {
      en: 'No products found',
      fr: 'Aucun produit trouvé'
    },
    error: errorMessage || {
      en: 'Error loading products',
      fr: 'Erreur lors du chargement des produits'
    },
    retry: {
      en: 'Retry',
      fr: 'Réessayer'
    },
    pagination: {
      previous: {
        en: 'Previous',
        fr: 'Précédent'
      },
      next: {
        en: 'Next',
        fr: 'Suivant'
      },
      page: {
        en: 'Page',
        fr: 'Page'
      },
      of: {
        en: 'of',
        fr: 'sur'
      }
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // If total pages is less than max to show, display all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination with ellipsis
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  // Render skeleton loading UI
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <div key={`skeleton-${index}`} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row animate-pulse">
        {/* Skeleton image */}
        <div className="w-full md:w-48 h-48 md:h-auto bg-gray-200"></div>
        
        {/* Skeleton content */}
        <div className="p-4 flex-grow">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3 mt-auto"></div>
        </div>
        
        {/* Skeleton actions */}
        <div className="border-t md:border-t-0 md:border-l border-gray-200 p-4 flex md:flex-col justify-around items-center gap-2">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    ));
  };

  // Render pagination
  const renderPagination = () => {
    if (!showPagination || totalPages <= 1) return null;
    
    const pageNumbers = getPageNumbers();
    
    return (
      <div className="flex items-center justify-center mt-6 space-x-1">
        {/* Previous button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-1 rounded-md border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t(text.pagination.previous)}
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Page numbers */}
        {pageNumbers.map((page, index) => (
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-1">
              ...
            </span>
          ) : (
            <button
              key={`page-${page}`}
              onClick={() => handlePageChange(page as number)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                page === currentPage
                  ? 'bg-primary-600 text-white'
                  : 'border text-gray-700 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          )
        ))}
        
        {/* Next button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 rounded-md border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t(text.pagination.next)}
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="product-list-container space-y-4">
      {/* Error state */}
      {error && (
        <div className="p-6 text-center">
          <div className="text-red-500 mb-2">{t(text.error)}</div>
          <button
            onClick={onDeleteSuccess} // Use the callback as a refresh function
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            {t(text.retry)}
          </button>
        </div>
      )}
      
      {/* Loading state */}
      {loading && renderSkeletons()}
      
      {/* Empty state */}
      {!loading && !error && products.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          {t(text.noProducts)}
        </div>
      )}
      
      {/* Product list */}
      {!loading && !error && products.length > 0 && (
        <div className="space-y-4">
          {products.map(product => (
            <ProductListItem
              key={product.id}
              product={product}
              onDeleteSuccess={onDeleteSuccess}
            />
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default ProductList; 