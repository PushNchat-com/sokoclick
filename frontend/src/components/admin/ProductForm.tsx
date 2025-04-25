import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BaseProductForm from '../shared/BaseProductForm';
import { useRoleBasedAccess } from '../../hooks/useRoleBasedAccess';
import { uploadProductImage } from '../../utils/storage';
import { useLanguage } from '../../store/LanguageContext';
import SlotImageUploader from './SlotImageUploader';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

interface ProductFormProps {
  isEditing?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ isEditing = false }) => {
  const { productId } = useParams<{ productId: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [productCreated, setProductCreated] = useState(false);
  
  // Access check using proper interface
  const { loading, hasAccess, isAdmin, userId } = useRoleBasedAccess({
    productId,
    context: 'admin'
  });
  
  // Handle successful product creation/update
  const handleSuccess = () => {
    if (isEditing) {
      // If editing, just set the flag to show the uploader
      setProductCreated(true);
    } else {
      // If creating a new product, redirect will happen automatically
      // but set the flag to show success messaging
      setProductCreated(true);
    }
  };
  
  // Custom upload handler to match the expected signature in BaseProductForm
  const handleUpload = async (file: File) => {
    if (!userId) throw new Error('No user ID available');
    
    // Use the uploadProductImage function with required options
    return uploadProductImage(file, {
      userId,
      isAdmin: true,
      productId
    });
  };
  
  // If still checking permissions, show loading
  if (loading) {
    return <LoadingSpinner text={t({ en: 'Loading...', fr: 'Chargement...' })} />;
  }
  
  // If not admin, show error
  if (!hasAccess || !isAdmin) {
    return (
      <ErrorMessage 
        title={t({ en: 'Access Denied', fr: 'Accès Refusé' })}
        message={t({ 
          en: 'You do not have permission to access this page.', 
          fr: "Vous n'avez pas la permission d'accéder à cette page." 
        })}
      />
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing 
          ? t({ en: 'Edit Product', fr: 'Modifier le Produit' })
          : t({ en: 'Add New Product', fr: 'Ajouter un Nouveau Produit' })
        }
      </h1>
      
      <BaseProductForm
        isEditing={isEditing}
        productId={productId}
        context="admin"
        onSuccess={handleSuccess}
        onUpload={handleUpload}
      />
      
      {/* Show SlotImageUploader when editing or after product is created */}
      {(isEditing || productCreated) && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">
            {t({ en: 'Product Images', fr: 'Images du Produit' })}
          </h2>
          <p className="text-gray-600 mb-4">
            {t({ 
              en: 'Upload images for this product using the slot uploader below.', 
              fr: 'Téléchargez des images pour ce produit en utilisant le téléchargeur d\'emplacements ci-dessous.' 
            })}
          </p>
          <SlotImageUploader className="mt-4" />
        </div>
      )}
    </div>
  );
};

export default ProductForm;
