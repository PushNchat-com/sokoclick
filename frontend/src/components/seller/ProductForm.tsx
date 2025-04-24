import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BaseProductForm from '../shared/BaseProductForm';
import { useRoleBasedAccess } from '../../hooks/useRoleBasedAccess';
import { uploadProductImage } from '../../utils/storage';

interface ProductFormProps {
  isEditing?: boolean;
  onSuccess?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  isEditing = false,
  onSuccess: propsOnSuccess 
}) => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  
  const { loading, hasAccess, isAdmin, userId } = useRoleBasedAccess({
    productId,
    context: 'seller'
  });

  const handleSuccess = () => {
    if (propsOnSuccess) {
      propsOnSuccess();
    } else {
      navigate('/seller/products');
    }
  };

  const handleUpload = async (file: File) => {
    if (!userId) throw new Error('No user ID available');
    return uploadProductImage(file, {
      userId,
      isAdmin: false,
      productId
    });
  };
  
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!hasAccess) {
    return null; // The hook will handle navigation
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Edit Product' : 'Create New Product'}
      </h1>
      
      <BaseProductForm
        isEditing={isEditing}
        productId={productId}
        onSuccess={handleSuccess}
        context="seller"
        onUpload={handleUpload}
      />
    </div>
  );
};

export default ProductForm; 