import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../store/LanguageContext';
import { Product, getPendingProducts, approveProduct, rejectProduct } from '../../services/products';
import Button from '../ui/Button';
import { toast } from '../../utils/toast';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

interface ProductApprovalWorkflowProps {
  className?: string;
}

const ProductApprovalWorkflow: React.FC<ProductApprovalWorkflowProps> = ({ className = '' }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  // State for pending products
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Text content
  const text = {
    title: { en: 'Product Approval Queue', fr: 'File d\'approbation des produits' },
    noPendingProducts: { 
      en: 'No products pending approval', 
      fr: 'Aucun produit en attente d\'approbation' 
    },
    loading: { en: 'Loading pending products...', fr: 'Chargement des produits en attente...' },
    errorLoading: { 
      en: 'Error loading pending products', 
      fr: 'Erreur lors du chargement des produits en attente' 
    },
    refresh: { en: 'Refresh', fr: 'Actualiser' },
    productName: { en: 'Product Name', fr: 'Nom du produit' },
    seller: { en: 'Seller', fr: 'Vendeur' },
    price: { en: 'Price', fr: 'Prix' },
    createdAt: { en: 'Submitted', fr: 'Soumis le' },
    actions: { en: 'Actions', fr: 'Actions' },
    approve: { en: 'Approve', fr: 'Approuver' },
    reject: { en: 'Reject', fr: 'Rejeter' },
    view: { en: 'View Details', fr: 'Voir les détails' },
    approvalSuccess: { 
      en: 'Product approved successfully', 
      fr: 'Produit approuvé avec succès' 
    },
    rejectionSuccess: { 
      en: 'Product rejected', 
      fr: 'Produit rejeté' 
    },
    operationError: { 
      en: 'Error processing product', 
      fr: 'Erreur lors du traitement du produit' 
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Load pending products
  const loadPendingProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await getPendingProducts();
      if (error) throw new Error(error);
      
      setPendingProducts(data);
    } catch (err) {
      console.error('Error loading pending products:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load products on component mount
  useEffect(() => {
    loadPendingProducts();
  }, []);
  
  // Handle approval
  const handleApprove = async (productId: string) => {
    setProcessingId(productId);
    
    try {
      const { error } = await approveProduct(productId);
      if (error) throw new Error(error);
      
      toast.success(t(text.approvalSuccess));
      
      // Remove the approved product from the list
      setPendingProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Error approving product:', err);
      toast.error(t(text.operationError));
    } finally {
      setProcessingId(null);
    }
  };
  
  // Handle rejection
  const handleReject = async (productId: string) => {
    setProcessingId(productId);
    
    try {
      const { error } = await rejectProduct(productId);
      if (error) throw new Error(error);
      
      toast.success(t(text.rejectionSuccess));
      
      // Remove the rejected product from the list
      setPendingProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Error rejecting product:', err);
      toast.error(t(text.operationError));
    } finally {
      setProcessingId(null);
    }
  };
  
  // Handle view details
  const handleViewDetails = (productId: string) => {
    navigate(`/admin/products/${productId}`);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{t(text.title)}</h2>
        </div>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">{t(text.loading)}</span>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{t(text.title)}</h2>
          <Button
            variant="outline"
            onClick={loadPendingProducts}
            className="flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t(text.refresh)}
          </Button>
        </div>
        <ErrorMessage
          title={t(text.errorLoading)}
          message={error}
          onRetry={loadPendingProducts}
        />
      </div>
    );
  }
  
  return (
    <div className={`p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{t(text.title)}</h2>
        <Button
          variant="outline"
          onClick={loadPendingProducts}
          className="flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t(text.refresh)}
        </Button>
      </div>
      
      {pendingProducts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          {t(text.noPendingProducts)}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t(text.productName)}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t(text.seller)}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t(text.price)}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t(text.createdAt)}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t(text.actions)}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-md object-cover"
                            src={product.image_urls[0] || '/placeholder.png'}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {language === 'en' ? product.name_en : product.name_fr}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.seller?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{product.seller_whatsapp}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.price.toLocaleString()} {product.currency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(product.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(product.id)}
                        >
                          {t(text.view)}
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(product.id)}
                          disabled={processingId === product.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {processingId === product.id ? (
                            <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {t(text.approve)}
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleReject(product.id)}
                          disabled={processingId === product.id}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {processingId === product.id ? (
                            <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          {t(text.reject)}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductApprovalWorkflow; 