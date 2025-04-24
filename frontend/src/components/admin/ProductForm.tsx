import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BaseProductForm from '../shared/BaseProductForm';
import { useRoleBasedAccess } from '../../hooks/useRoleBasedAccess';
import { uploadProductImage } from '../../utils/storage';
import { useLanguage } from '../../store/LanguageContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

interface ProductFormProps {
  isEditing?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ isEditing = false }) => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Text content
  const text = {
    loading: { en: 'Loading...', fr: 'Chargement...' },
    unauthorized: { 
      title: { en: 'Access Denied', fr: 'Accès Refusé' },
      message: { en: 'You do not have permission to access this page.', fr: 'Vous n\'avez pas la permission d\'accéder à cette page.' }
    },
    uploadError: { en: 'Failed to upload image', fr: 'Échec du téléchargement de l\'image' },
    pageTitle: {
      create: { en: 'Create New Product', fr: 'Créer un Nouveau Produit' },
      edit: { en: 'Edit Product', fr: 'Modifier le Produit' }
    }
  };
  
  const { loading, hasAccess, isAdmin, userId } = useRoleBasedAccess({
    productId,
    context: 'admin'
  });

  const handleSuccess = () => {
    navigate('/admin/products');
  };

  const handleUpload = async (file: File) => {
    if (!userId) throw new Error('No user ID available');
    
    try {
      setUploadError(null);
      const result = await uploadProductImage(file, {
        userId,
        isAdmin: true,
        productId
      });
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(t(text.uploadError));
      throw error;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">{t(text.loading)}</span>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-4">
        <ErrorMessage
          title={t(text.unauthorized.title)}
          message={t(text.unauthorized.message)}
        />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">
        {t(isEditing ? text.pageTitle.edit : text.pageTitle.create)}
      </h1>
      
      {uploadError && (
        <div className="mb-6">
          <ErrorMessage message={uploadError} />
        </div>
      )}
      
      <BaseProductForm
        isEditing={isEditing}
        productId={productId}
        onSuccess={handleSuccess}
        context="admin"
        onUpload={handleUpload}
      />
    </div>
  );
};

export default ProductForm;
