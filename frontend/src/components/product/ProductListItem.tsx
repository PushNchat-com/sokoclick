import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../store/LanguageContext';
import { Product } from '../../services/products';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { toast } from '../../utils/toast';
import { supabase } from '../../services/supabase';

interface ProductListItemProps {
  product: Product;
  onDeleteSuccess: () => void;
}

// Define a more specific product status type to match actual values
type ProductStatus = 'pending' | 'approved' | 'rejected' | 'inactive' | 'active' | 'sold' | 'expired';

interface ExtendedProduct extends Omit<Product, 'status'> {
  status?: ProductStatus;
}

// Props for the openConfirmDialog function (omitting isOpen which is handled by the hook)
type OpenConfirmDialogProps = Omit<Parameters<ReturnType<typeof useConfirmDialog>['openConfirmDialog']>[0], 'isOpen'>;

const ProductListItem: React.FC<ProductListItemProps> = ({
  product,
  onDeleteSuccess
}) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { openConfirmDialog } = useConfirmDialog();
  const [isDeleting, setIsDeleting] = useState(false);

  // Cast the product to our extended type to handle the status field
  const extendedProduct = product as unknown as ExtendedProduct;

  const mainImage = product.image_urls[0] || '/placeholder-product.jpg';
  const title = language === 'en' ? product.name_en : product.name_fr;
  const description = language === 'en' ? product.description_en : product.description_fr;
  
  // Text content
  const text = {
    edit: {
      en: 'Edit',
      fr: 'Modifier'
    },
    delete: {
      en: 'Delete',
      fr: 'Supprimer'
    },
    confirmDelete: {
      en: 'Delete Product',
      fr: 'Supprimer le Produit'
    },
    confirmDeleteMessage: {
      en: 'Are you sure you want to delete this product? This action cannot be undone.',
      fr: 'Êtes-vous sûr de vouloir supprimer ce produit? Cette action ne peut pas être annulée.'
    },
    deleteSuccess: {
      en: 'Product deleted successfully',
      fr: 'Produit supprimé avec succès'
    },
    deleteError: {
      en: 'Failed to delete product',
      fr: 'Échec de la suppression du produit'
    }
  };

  // Handle edit button click
  const handleEdit = () => {
    navigate(`/dashboard/product/edit/${product.id}`);
  };

  // Handle delete button click
  const handleDelete = () => {
    // Using the dialog as shown in the example without isOpen prop
    (openConfirmDialog as (props: OpenConfirmDialogProps) => void)({
      title: t(text.confirmDelete),
      message: t(text.confirmDeleteMessage),
      confirmText: t(text.delete),
      confirmVariant: 'primary',
      icon: (
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onConfirm: async () => {
        if (product.id) {
          await deleteProduct(product.id);
        }
      }
    });
  };

  // Delete product
  const deleteProduct = async (productId: string) => {
    try {
      setIsDeleting(true);
      
      // Delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      // Show success toast
      toast.success(text.deleteSuccess);
      
      // Call callback to refresh products list
      onDeleteSuccess();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(text.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="product-list-item bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-shadow hover:shadow-md flex flex-col md:flex-row">
      {/* Product image */}
      <div className="relative w-full md:w-48 h-48 md:h-auto">
        <img
          src={mainImage}
          alt={title}
          className="object-cover w-full h-full"
          loading="lazy"
        />
        {extendedProduct.status === 'active' && (
          <div className="absolute top-2 right-2">
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {t({
                en: 'Active',
                fr: 'Actif'
              })}
            </span>
          </div>
        )}
      </div>
      
      {/* Product details */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{description}</p>
        <div className="mt-auto flex items-center justify-between">
          <div className="text-lg font-bold text-primary-600">
            {product.price.toLocaleString()} {product.currency}
          </div>
          
          {/* Status badge */}
          {extendedProduct.status && (
            <div className="mr-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                ${extendedProduct.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${extendedProduct.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                ${extendedProduct.status === 'sold' ? 'bg-blue-100 text-blue-800' : ''}
                ${extendedProduct.status === 'expired' ? 'bg-gray-100 text-gray-800' : ''}
              `}>
                {extendedProduct.status.charAt(0).toUpperCase() + extendedProduct.status.slice(1)}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="border-t md:border-t-0 md:border-l border-gray-200 p-4 flex md:flex-col justify-around items-center gap-2">
        <button
          onClick={handleEdit}
          className="flex items-center justify-center w-full px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {t(text.edit)}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center justify-center w-full px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {t(text.delete)}
        </button>
      </div>
    </div>
  );
};

export default ProductListItem; 