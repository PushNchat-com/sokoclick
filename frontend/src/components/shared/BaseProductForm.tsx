import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../store/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../utils/toast';
import { useSlots, getAvailableSlotsForProductForm } from '../../services/slots';
import { useProductForm } from '../../hooks/useProductForm';
import { useLocalFormStorage } from '../../hooks/useLocalFormStorage';
import { UserProfile, UserRole } from '../../types/auth';

// Import form steps
import BasicInfoStep from './form-steps/BasicInfoStep';
import ImageUploadStep from './form-steps/ImageUploadStep';
import DeliveryOptionsStep from './form-steps/DeliveryOptionsStep';
import FormActionButtons from './form-actions/FormActionButtons';

// Props interface
interface BaseProductFormProps {
  isEditing?: boolean;
  productId?: string;
  onSuccess?: () => void;
  context: 'admin' | 'seller';
  onUpload: (file: File) => Promise<{ url: string }>;
}

const BaseProductForm: React.FC<BaseProductFormProps> = ({ 
  isEditing = false, 
  productId,
  onSuccess,
  context,
  onUpload
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSlotId = searchParams.get('slot');
  const isAdmin = context === 'admin';
  
  // Initialize local storage hook
  const formId = productId || user?.id || 'anonymous';
  const { saveFormState, clearStoredState, checkStoredState, initialized, setInitialized } = useLocalFormStorage({
    formId,
    isEditing
  });
  
  // Convert User to UserProfile
  const userProfile: UserProfile | null = user ? {
    id: user.id,
    email: user.email || '',
    role: user.user_metadata?.role || UserRole.SELLER,
    firstName: user.user_metadata?.firstName,
    lastName: user.user_metadata?.lastName,
    name: user.user_metadata?.name,
    phone: user.user_metadata?.phone,
  } : null;
  
  // Get available slots for assignment (for admin context)
  const { slots, loading: slotsLoading, error: slotsError } = useSlots();
  const [availableSlots, setAvailableSlots] = useState<number[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(true);
  
  // Fetch available slots for admin
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (isAdmin) {
        try {
          setLoadingSlots(true);
          // Use the slots from useSlots if available and no error, otherwise use our fallback
          if (slots.length > 0 && !slotsError) {
            setAvailableSlots(slots.filter(slot => slot.status === 'available').map(slot => slot.id));
          } else {
            // If there's an error or no slots, use the fallback method
            const availableSlotIds = await getAvailableSlotsForProductForm();
            setAvailableSlots(availableSlotIds);
          }
        } catch (err) {
          console.error('Error fetching available slots:', err);
          toast.error(t({
            en: 'Failed to load available slots. Using default values.',
            fr: 'Échec du chargement des emplacements disponibles. Utilisation des valeurs par défaut.'
          }));
        } finally {
          setLoadingSlots(false);
        }
      }
    };
    
    fetchAvailableSlots();
  }, [isAdmin, slots, slotsError, t]);
  
  // Custom success handler that incorporates the onSuccess prop
  const handleSuccess = () => {
    // Clear stored form state on successful submission
    clearStoredState();
    
    if (onSuccess) {
      onSuccess();
    } else {
      // Navigate to the appropriate page
      setTimeout(() => {
        navigate(isAdmin ? '/admin/products' : '/dashboard');
      }, 2000);
    }
  };
  
  // Use the custom hook for form state management
  const {
    currentStep,
    formData,
    imageFiles,
    deliveryOptions,
    errors,
    isLoading,
    isSaving,
    isSubmitting,
    uploadingImages,
    formError,
    successMessage,
    showCancelDialog,
    setShowCancelDialog,
    handleFormDataChange,
    handleImagesChange,
    handleDeliveryOptionsChange,
    handleDeliveryOptionRemoved,
    handleNextStep,
    handlePrevStep,
    handleSubmit,
    confirmCancel,
    setFormData,
    setImageFiles,
    setDeliveryOptions,
    setCurrentStep
  } = useProductForm({
    isEditing,
    productId,
    isAdmin,
    user: userProfile,
    initialSlotId,
    onSuccess: handleSuccess
  });
  
  // Load stored form state on mount
  useEffect(() => {
    if (!initialized && !isLoading) {
      const storedState = checkStoredState();
      if (storedState) {
        setFormData(storedState.formData);
        setImageFiles(storedState.imageFiles);
        setDeliveryOptions(storedState.deliveryOptions);
        setCurrentStep(storedState.currentStep);
        
        toast.info(t({
          en: 'Restored your previous progress',
          fr: 'Progression précédente restaurée'
        }));
      }
      setInitialized(true);
    }
  }, [initialized, isLoading]);
  
  // Save form state on changes
  useEffect(() => {
    if (initialized && !isLoading && !isSubmitting) {
      saveFormState({
        formData,
        imageFiles,
        deliveryOptions,
        currentStep
      });
    }
  }, [formData, imageFiles, deliveryOptions, currentStep, initialized, isLoading, isSubmitting]);
  
  // Text content
  const text = {
    step1Title: { en: 'Basic Information', fr: 'Informations de base' },
    step2Title: { en: 'Product Images', fr: 'Images du produit' },
    step3Title: { en: 'Delivery Options', fr: 'Options de livraison' },
    loading: { en: 'Loading product data...', fr: 'Chargement des données du produit...' },
    confirmCancel: { en: 'Cancel product creation?', fr: 'Annuler la création du produit?' },
    confirmCancelMessage: { en: 'Your unsaved changes will be lost.', fr: 'Vos modifications non enregistrées seront perdues.' },
    confirmCancelNo: { en: 'No, continue editing', fr: 'Non, continuer l\'édition' },
    confirmCancelYes: { en: 'Yes, cancel', fr: 'Oui, annuler' },
  };
  
  // Cancel and go back with cleanup
  const handleCancel = () => {
    const hasChanges = Object.values(formData).some(val => val !== '' && val !== null && val !== undefined) ||
      imageFiles.length > 1 || 
      imageFiles[0].file !== null || 
      imageFiles[0].preview !== null;
    
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      clearStoredState();
      navigate(isAdmin ? '/admin/products' : '/dashboard');
    }
  };
  
  // Update confirmCancel to clear stored state
  const handleConfirmCancel = () => {
    clearStoredState();
    confirmCancel();
  };
  
  // Step titles for progress bar - memoized to prevent unnecessary re-renders
  const steps = useMemo(() => [
    { id: '1', name: text.step1Title, number: 1 },
    { id: '2', name: text.step2Title, number: 2 },
    { id: '3', name: text.step3Title, number: 3 }
  ], [text.step1Title, text.step2Title, text.step3Title]);
  
  // Image transformation for ImageUploadStep - memoized to prevent unnecessary re-renders
  const transformedImages = useMemo(() => imageFiles.map(img => ({
    url: img.url || '',
    preview: img.preview || '',
    progress: img.progress,
    error: img.error,
    file: img.file
  })), [imageFiles]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p className="mt-4 text-gray-600">{t(text.loading)}</p>
      </div>
    );
  }
  
  return (
    <div className="product-form-container w-full max-w-4xl mx-auto">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        {/* Display current step */}
        {currentStep === 1 && (
          <BasicInfoStep
            formData={formData}
            errors={errors}
            isAdmin={isAdmin}
            onDataChange={handleFormDataChange}
            availableSlots={availableSlots}
            loadingSlots={loadingSlots}
          />
        )}
        
        {currentStep === 2 && (
          <ImageUploadStep
            images={transformedImages}
            onChange={handleImagesChange}
            errors={errors}
            productId={productId}
            isSaving={isSaving}
          />
        )}
        
        {currentStep === 3 && (
          <DeliveryOptionsStep
            options={deliveryOptions}
            onChange={handleDeliveryOptionsChange}
            onRemove={handleDeliveryOptionRemoved}
            errors={errors}
          />
        )}
        
        {/* Error and success messages */}
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {formError}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
        
        {/* Add form action buttons */}
        <FormActionButtons
          currentStep={currentStep}
          totalSteps={3}
          isSubmitting={isSubmitting}
          isSaving={isSaving}
          isSubmitDisabled={Object.keys(errors).length > 0}
          onPrevious={handlePrevStep}
          onNext={handleNextStep}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          showCancelDialog={showCancelDialog}
          onConfirmCancel={handleConfirmCancel}
          onCancelDialog={() => setShowCancelDialog(false)}
          className="mt-6"
        />
      </form>
      
      {/* Cancel confirmation dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t(text.confirmCancel)}</h3>
            <p className="text-gray-500 mb-4">{t(text.confirmCancelMessage)}</p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
              >
                {t(text.confirmCancelNo)}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmCancel()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none"
              >
                {t(text.confirmCancelYes)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseProductForm; 