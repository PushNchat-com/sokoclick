import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../../types/supabase';
import { supabaseClient } from '../../api/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import ProductImageUploader from '../ui/ProductImageUploader';

interface ProductFormProps {
  product?: Product;
  onSuccess?: (productId: string) => void;
  onCancel?: () => void;
}

// Form validation schema
interface ValidationErrors {
  nameEn?: string;
  nameFr?: string;
  descriptionEn?: string;
  descriptionFr?: string;
  price?: string;
  imageUrls?: string;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSuccess,
  onCancel
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Form fields
  const [nameEn, setNameEn] = useState<string>('');
  const [nameFr, setNameFr] = useState<string>('');
  const [descriptionEn, setDescriptionEn] = useState<string>('');
  const [descriptionFr, setDescriptionFr] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState<string>('XAF');
  const [condition, setCondition] = useState<string>('new');
  const [category, setCategory] = useState<string>('electronics');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  // Initialize form if editing an existing product
  useEffect(() => {
    if (product) {
      setNameEn(product.name_en || '');
      setNameFr(product.name_fr || '');
      setDescriptionEn(product.description_en || '');
      setDescriptionFr(product.description_fr || '');
      setPrice(product.starting_price?.toString() || '');
      setCurrency(product.currency || 'XAF');
      setCondition(product.condition || 'new');
      setCategory(product.category || 'electronics');
      setImageUrls(product.image_urls || []);
    }
  }, [product]);
  
  // Validate form fields
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!nameEn.trim()) {
      errors.nameEn = t('validation.required');
    } else if (nameEn.length < 3) {
      errors.nameEn = t('validation.minLength', { length: 3 });
    } else if (nameEn.length > 100) {
      errors.nameEn = t('validation.maxLength', { length: 100 });
    }
    
    if (!nameFr.trim()) {
      errors.nameFr = t('validation.required');
    } else if (nameFr.length < 3) {
      errors.nameFr = t('validation.minLength', { length: 3 });
    } else if (nameFr.length > 100) {
      errors.nameFr = t('validation.maxLength', { length: 100 });
    }
    
    if (!descriptionEn.trim()) {
      errors.descriptionEn = t('validation.required');
    } else if (descriptionEn.length < 10) {
      errors.descriptionEn = t('validation.minLength', { length: 10 });
    } else if (descriptionEn.length > 2000) {
      errors.descriptionEn = t('validation.maxLength', { length: 2000 });
    }
    
    if (!descriptionFr.trim()) {
      errors.descriptionFr = t('validation.required');
    } else if (descriptionFr.length < 10) {
      errors.descriptionFr = t('validation.minLength', { length: 10 });
    } else if (descriptionFr.length > 2000) {
      errors.descriptionFr = t('validation.maxLength', { length: 2000 });
    }
    
    if (!price) {
      errors.price = t('validation.required');
    } else {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        errors.price = t('validation.invalidPrice');
      }
    }
    
    if (imageUrls.length === 0) {
      errors.imageUrls = t('validation.atLeastOneImage');
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (!user?.id) {
        throw new Error(t('errors.loginRequired'));
      }
      
      const productData = {
        seller_id: user.id,
        name_en: nameEn,
        name_fr: nameFr,
        description_en: descriptionEn,
        description_fr: descriptionFr,
        starting_price: parseFloat(price),
        currency,
        condition,
        category,
        image_urls: imageUrls,
        seller_whatsapp: user.user_metadata?.whatsapp_number || '',
        approved: false // Requires admin approval
      };
      
      let productId: string;
      
      if (product) {
        // Update existing product
        const { data, error } = await supabaseClient
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .select('id')
          .single();
          
        if (error) throw error;
        productId = data.id;
      } else {
        // Create new product
        const { data, error } = await supabaseClient
          .from('products')
          .insert([productData])
          .select('id')
          .single();
          
        if (error) throw error;
        productId = data.id;
      }
      
      // Call success callback with the product ID
      if (onSuccess) {
        onSuccess(productId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{t('product.englishDetails')}</h3>
          <FormField
            label={t('product.nameEn')}
            value={nameEn}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNameEn(e.target.value)}
            required
            error={validationErrors.nameEn}
          />
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('product.descriptionEn')}
            </label>
            <textarea
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                validationErrors.descriptionEn ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {validationErrors.descriptionEn && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.descriptionEn}</p>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">{t('product.frenchDetails')}</h3>
          <FormField
            label={t('product.nameFr')}
            value={nameFr}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNameFr(e.target.value)}
            required
            error={validationErrors.nameFr}
          />
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('product.descriptionFr')}
            </label>
            <textarea
              value={descriptionFr}
              onChange={(e) => setDescriptionFr(e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                validationErrors.descriptionFr ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {validationErrors.descriptionFr && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.descriptionFr}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <FormField
            label={t('product.price')}
            type="number"
            value={price}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
            required
            min="0"
            error={validationErrors.price}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('product.currency')}
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="XAF">XAF (CFA)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('product.condition')}
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="new">{t('condition.new')}</option>
            <option value="like-new">{t('condition.likeNew')}</option>
            <option value="good">{t('condition.good')}</option>
            <option value="fair">{t('condition.fair')}</option>
            <option value="poor">{t('condition.poor')}</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('product.category')}
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          required
        >
          <option value="electronics">{t('categories.electronics')}</option>
          <option value="fashion">{t('categories.fashion')}</option>
          <option value="home">{t('categories.home')}</option>
          <option value="sports">{t('categories.sports')}</option>
          <option value="automotive">{t('categories.automotive')}</option>
          <option value="toys">{t('categories.toys')}</option>
          <option value="health">{t('categories.health')}</option>
          <option value="other">{t('categories.other')}</option>
        </select>
      </div>
      
      <div>
        <ProductImageUploader
          existingImages={imageUrls}
          onImagesChange={setImageUrls}
          maxImages={5}
        />
        {validationErrors.imageUrls && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.imageUrls}</p>
        )}
      </div>
      
      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
        )}
        
        <Button 
          type="submit" 
          variant="primary"
          disabled={loading}
        >
          {loading 
            ? t('common.saving') 
            : product 
              ? t('common.update') 
              : t('common.create')
          }
        </Button>
      </div>
    </form>
  );
};

export default ProductForm; 