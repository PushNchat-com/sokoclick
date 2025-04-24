import React, { useMemo } from 'react';
import { useProducts } from '../services/products';
import AdminProductList from '../components/admin/AdminProductList';
import { ProductStatus } from '../utils/productFormValidation';
import { toast } from '../utils/toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useLanguage } from '../store/LanguageContext';
import { supabase } from '../lib/supabaseClient';

const AdminProductsPage: React.FC = () => {
  const { t } = useLanguage();
  
  // Text content
  const text = {
    deleteSuccess: { en: 'Product deleted successfully', fr: 'Produit supprimé avec succès' },
    deleteError: { en: 'Failed to delete product', fr: 'Échec de la suppression du produit' },
    updateSuccess: { en: 'Product status updated successfully', fr: 'Statut du produit mis à jour avec succès' },
    updateError: { en: 'Failed to update product status', fr: 'Échec de la mise à jour du statut du produit' },
    loadingError: { 
      title: { en: 'Error loading products', fr: 'Erreur lors du chargement des produits' },
      message: { en: 'There was a problem loading the product list. Please try again later.', fr: 'Un problème est survenu lors du chargement de la liste des produits. Veuillez réessayer plus tard.' }
    }
  };

  // Memoize the options object to prevent unnecessary re-renders
  const productOptions = useMemo(() => ({
    // Override the default behavior to show all products
    status: undefined,
    // Add any additional filters needed for admin view
    orderBy: { column: 'created_at', order: 'desc' }
  }), []);

  const { products, loading, error, refetch } = useProducts(productOptions);

  const handleDeleteProduct = async (productId: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      // Delete associated images from storage
      await supabase.storage
        .from('product-images')
        .remove([`products/${productId}/*`]);
      
      toast.success(t(text.deleteSuccess));
      refetch(); // Refresh the products list
    } catch (error) {
      console.error('Delete product error:', error);
      toast.error(t(text.deleteError));
      throw error; // Re-throw to be handled by the UI
    }
  };

  const handleUpdateStatus = async (productId: string, status: ProductStatus) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('products')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;
      
      toast.success(t(text.updateSuccess));
      refetch(); // Refresh the products list
    } catch (error) {
      console.error('Update status error:', error);
      toast.error(t(text.updateError));
      throw error; // Re-throw to be handled by the UI
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorMessage
          title={t(text.loadingError.title)}
          message={t(text.loadingError.message)}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <AdminProductList
        products={products || []}
        onDeleteProduct={handleDeleteProduct}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

export default AdminProductsPage; 