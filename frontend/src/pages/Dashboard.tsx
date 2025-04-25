import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { useLanguage } from '../store/LanguageContext';
import { Navigate } from 'react-router-dom';
import ProductForm from '../components/seller/ProductForm';
import { useProducts } from '../services/products';
import ProductList from '../components/product/ProductList';
import { toast } from '../utils/toast';
import { Modal } from '../components/ui/Modal';

const PRODUCTS_PER_PAGE = 6; // Number of products to show per page

const Dashboard: React.FC = () => {
  const { user, session } = useUnifiedAuth();
  const isAuthenticated = !!session && !!user;
  const { t } = useLanguage();
  const [showProductForm, setShowProductForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Fetch user's products with a safeguard for missing user ID
  const { products, loading, error, refetch, count } = useProducts({
    sellerId: user?.id || '',
    limit: PRODUCTS_PER_PAGE,
    offset: (currentPage - 1) * PRODUCTS_PER_PAGE
  });

  // Show empty state if no user ID yet but auth is loading
  const [forceEmpty, setForceEmpty] = useState(false);

  // Handle case where we're authenticated but have no user ID yet
  useEffect(() => {
    if (isAuthenticated && !user?.id) {
      console.warn('Authenticated but no user ID available');
      setForceEmpty(true);
    } else {
      setForceEmpty(false);
    }
  }, [isAuthenticated, user]);

  // Track retry attempts
  const [retryCount, setRetryCount] = useState(0);

  // Handle retry with exponential backoff
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    refetch();
  };

  // Effect to automatically retry on server errors with exponential backoff
  useEffect(() => {
    if (error) {
      // Add detailed error logging
      console.error('Dashboard error details:', {
        error,
        userId: user?.id,
        retryCount
      });
    }
    
    if (error && error.includes('500') && retryCount < 3) {
      const timeout = setTimeout(() => {
        console.log(`Automatic retry attempt ${retryCount + 1}`);
        handleRetry();
      }, Math.min(1000 * Math.pow(2, retryCount), 8000)); // Exponential backoff: 2s, 4s, 8s
      
      return () => clearTimeout(timeout);
    }
  }, [error, retryCount, user]);

  // Total pages calculation
  const totalPages = Math.ceil((count || 0) / PRODUCTS_PER_PAGE);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Text content
  const text = {
    welcome: {
      en: 'Welcome back',
      fr: 'Bon retour'
    },
    yourProducts: {
      en: 'Your Products',
      fr: 'Vos Produits'
    },
    addProduct: {
      en: 'Add Product',
      fr: 'Ajouter un Produit'
    },
    noProducts: {
      en: 'You have no products listed yet',
      fr: "Vous n'avez pas encore de produits listés"
    },
    getStarted: {
      en: 'Get started by adding your first product',
      fr: 'Commencez par ajouter votre premier produit'
    },
    closeModal: {
      en: 'Close',
      fr: 'Fermer'
    },
    newProduct: {
      en: 'New Product',
      fr: 'Nouveau Produit'
    },
    errorLoading: {
      en: 'There was an error loading your products',
      fr: 'Une erreur est survenue lors du chargement de vos produits'
    },
    productAddSuccess: {
      en: 'Product added successfully',
      fr: 'Produit ajouté avec succès'
    }
  };
  
  const handleAddProductSuccess = () => {
    setShowProductForm(false);
    toast.success(text.productAddSuccess);
    refetch();
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    // Scroll to top on page change
    window.scrollTo(0, 0);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {t(text.welcome)}, {user?.name || user?.firstName || ''}
          </h1>
          <h2 className="text-xl font-semibold mt-4 mb-1">
            {t(text.yourProducts)}
          </h2>
        </div>
        
        <button
          onClick={() => setShowProductForm(true)}
          className="mt-4 md:mt-0 w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t(text.addProduct)}
        </button>
      </div>
      
      {/* Product list component */}
      <ProductList
        products={forceEmpty ? [] : products}
        loading={loading && !forceEmpty}
        error={error}
        onDeleteSuccess={refetch}
        emptyMessage={text.noProducts}
        errorMessage={text.errorLoading}
        showPagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
      
      {/* Empty state CTA */}
      {!loading && !error && products.length === 0 && (
        <div className="mt-4 text-center">
          <p className="text-gray-600 mb-4">{t(text.getStarted)}</p>
          <button
            onClick={() => setShowProductForm(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md transition-colors inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t(text.addProduct)}
          </button>
        </div>
      )}
      
      {/* Product form modal */}
      <Modal 
        isOpen={showProductForm} 
        onClose={() => setShowProductForm(false)}
        className="max-w-4xl w-full"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t(text.newProduct)}</h2>
            <button
              onClick={() => setShowProductForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <ProductForm onSuccess={handleAddProductSuccess} />
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard; 