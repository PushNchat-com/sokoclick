import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/dayjs';
import { AuctionSlot } from '../../types/auctions';
import { useSellerProducts, useAdminSlotActions } from '../../hooks/useSupabaseData';
import { useAuth } from '../../context/AuthContext';
import { supabaseHelper } from '../../api/supabase';
import Button from '../ui/Button';
import LoadingState from '../ui/LoadingState';

interface AuctionSlotFormProps {
  auctionSlot?: AuctionSlot;
  onSuccess: (slotId: number) => void;
  onCancel: () => void;
}

const AuctionSlotForm: React.FC<AuctionSlotFormProps> = ({ 
  auctionSlot, 
  onSuccess, 
  onCancel 
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  
  // Get current seller ID from auth context
  const sellerId = user?.id || '';
  const currentLanguage = i18n.language;
  
  const { products, loading: productsLoading, error: productsError } = useSellerProducts(sellerId);
  const { assignProductToSlot, updateSlotDetails, loading, error } = useAdminSlotActions();

  const [form, setForm] = useState({
    productId: auctionSlot?.product_id || '',
    startTime: auctionSlot?.start_time ? formatDate(new Date(auctionSlot.start_time), 'yyyy-MM-dd\'T\'HH:mm') : '',
    endTime: auctionSlot?.end_time ? formatDate(new Date(auctionSlot.end_time), 'yyyy-MM-dd\'T\'HH:mm') : '',
    featured: auctionSlot?.featured || false
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Validate the form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!form.productId) {
      errors.productId = t('validation.required');
    }
    
    if (!form.startTime) {
      errors.startTime = t('validation.required');
    }
    
    if (!form.endTime) {
      errors.endTime = t('validation.required');
    }
    
    if (form.startTime && form.endTime && new Date(form.startTime) >= new Date(form.endTime)) {
      errors.endTime = t('validation.endTimeAfterStart');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    if (submitted) {
      validateForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    
    if (!validateForm()) {
      return;
    }
    
    try {
      let slotId: number;
      
      if (auctionSlot) {
        // Update existing slot
        const result = await updateSlotDetails(auctionSlot.id, {
          product_id: form.productId,
          start_time: new Date(form.startTime).toISOString(),
          end_time: new Date(form.endTime).toISOString(),
          featured: form.featured
        });
        
        // Use the existing slot ID if the update was successful
        slotId = auctionSlot.id;
      } else {
        // Create a new auction slot using the Supabase helper
        const newSlotData = {
          product_id: form.productId,
          seller_id: sellerId,
          start_time: new Date(form.startTime).toISOString(),
          end_time: new Date(form.endTime).toISOString(),
          featured: form.featured,
          is_active: true
        };
        
        // Create a new auction slot
        const newSlot = await supabaseHelper.auctionSlots.createAuctionSlot(newSlotData);
        slotId = newSlot.id;
      }
      
      onSuccess(slotId);
    } catch (err) {
      console.error('Error saving auction slot:', err);
    }
  };

  if (productsLoading) {
    return <LoadingState message={t('common.loading')} />;
  }

  if (productsError) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        {productsError instanceof Error ? productsError.message : String(productsError)}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-md">
          {error instanceof Error ? error.message : String(error)}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">
            {t('product.selectProduct')} <span className="text-red-500">*</span>
          </label>
          <select
            id="productId"
            name="productId"
            value={form.productId}
            onChange={handleChange}
            className={`w-full rounded-md border ${formErrors.productId ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500`}
            disabled={loading}
          >
            <option value="">{t('product.selectOption')}</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {currentLanguage === 'fr' ? product.name_fr : product.name_en} - {product.currency} {product.starting_price}
              </option>
            ))}
          </select>
          {formErrors.productId && (
            <p className="mt-1 text-sm text-red-500">{formErrors.productId}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auction.startTime')} <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="startTime"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              className={`w-full rounded-md border ${formErrors.startTime ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500`}
              disabled={loading}
            />
            {formErrors.startTime && (
              <p className="mt-1 text-sm text-red-500">{formErrors.startTime}</p>
            )}
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auction.endTime')} <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="endTime"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              className={`w-full rounded-md border ${formErrors.endTime ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500`}
              disabled={loading}
            />
            {formErrors.endTime && (
              <p className="mt-1 text-sm text-red-500">{formErrors.endTime}</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              name="featured"
              checked={form.featured}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
              {t('auction.markAsFeatured')}
            </label>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {t('auction.featuredDescription')}
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block mr-2">⟳</span>
              {t('common.saving')}
            </>
          ) : (
            auctionSlot ? t('common.update') : t('common.create')
          )}
        </Button>
      </div>
    </form>
  );
};

export default AuctionSlotForm; 