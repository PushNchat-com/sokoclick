import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/types/auth';
import { ProductFormData } from '@/types/product';
import { ImageFile } from '@/types/image';
import { DeliveryOptionInternal } from '@/types/delivery';
import { validateStepData, validateWhatsAppNumber } from '@/utils/productFormValidation';
import { useLanguage } from '@/store/LanguageContext';
import { fileUploadService } from '@/services/fileUpload';
import { createProduct, updateProduct, Product } from '@/services/products';
import { createDeliveryOption, updateDeliveryOption, deleteDeliveryOption } from '@/services/deliveryOptions';
import supabase from '@/services/supabase';
import { UploadedImage } from '@/components/shared/ImageUploadZone';
import { toast } from '@/utils/toast';

export interface UseProductFormProps {
  isEditing: boolean;
  productId?: string;
  isAdmin: boolean;
  user: UserProfile | null;
  initialSlotId?: string | null;
  onSuccess?: () => void;
}

export interface UseProductFormReturn {
  currentStep: number;
  formData: ProductFormData;
  imageFiles: ImageFile[];
  deliveryOptions: DeliveryOptionInternal[];
  errors: Record<string, string>;
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  uploadingImages: boolean;
  formError: string | null;
  successMessage: string | null;
  showCancelDialog: boolean;
  setShowCancelDialog: (show: boolean) => void;
  handleFormDataChange: (newData: Partial<ProductFormData>) => void;
  handleImagesChange: (newImages: ImageFile[]) => void;
  handleDeliveryOptionsChange: (options: DeliveryOptionInternal[]) => void;
  handleDeliveryOptionRemoved: (index: number) => void;
  handleNextStep: () => void;
  handlePrevStep: () => void;
  handleSubmit: () => Promise<void>;
  confirmCancel: () => void;
  setFormData: (data: ProductFormData) => void;
  setImageFiles: (files: ImageFile[]) => void;
  setDeliveryOptions: (options: DeliveryOptionInternal[]) => void;
  setCurrentStep: (step: number) => void;
}

export const useProductForm = ({
  isEditing,
  productId,
  isAdmin,
  user,
  initialSlotId,
  onSuccess
}: UseProductFormProps): UseProductFormReturn => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // UI state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(isEditing);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingImages, setUploadingImages] = useState(false);
  const [removedDeliveryOptionIds, setRemovedDeliveryOptionIds] = useState<string[]>([]);
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);

  // Form data state - unified format
  const [formData, setFormData] = useState<ProductFormData>({
    name_en: '',
    name_fr: '',
    description_en: '',
    description_fr: '',
    price: '',
    currency: 'XAF',
    seller_whatsapp: user?.phone || '',
    category: '',
    condition: 'new',
    image_urls: [],
    // Admin-specific field
    slotNumber: initialSlotId || '',
  });
  
  // Image state
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([{
    file: null,
    preview: null,
    progress: 0,
    error: null
  }]);
  
  // Delivery options state
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptionInternal[]>([
    {
      name_en: 'Standard Delivery',
      name_fr: 'Livraison Standard',
      areas: ['Douala', 'Yaoundé'],
      estimated_days: 3,
      fee: 1000,
    }
  ]);

  // Text content for error messages
  const errorMessages = {
    success: { en: 'Product created successfully!', fr: 'Produit créé avec succès!' },
    updateSuccess: { en: 'Product updated successfully!', fr: 'Produit mis à jour avec succès!' },
    error: { en: 'Failed to create product. Please try again.', fr: 'Échec de la création du produit. Veuillez réessayer.' },
    updateError: { en: 'Failed to update product. Please try again.', fr: 'Échec de la mise à jour du produit. Veuillez réessayer.' },
  };
  
  // Load saved form data from localStorage
  useEffect(() => {
    if (!isEditing) {
      try {
        const savedForm = localStorage.getItem('product_form_draft');
        if (savedForm) {
          const parsedForm = JSON.parse(savedForm);
          setFormData(parsedForm);
        }
      } catch (err) {
        console.error('Error parsing saved form data:', err);
      }
    }
  }, [isEditing]);

  // Save form data to localStorage on change
  useEffect(() => {
    if (!isEditing && Object.values(formData).some(val => val !== '' && val !== null)) {
      localStorage.setItem('product_form_draft', JSON.stringify(formData));
    }
  }, [formData, isEditing]);

  // Clear localStorage on successful submission
  const clearSavedFormData = () => {
    localStorage.removeItem('product_form_draft');
  };
  
  // Fetch product data for editing
  useEffect(() => {
    if (isEditing && productId) {
      const fetchProductData = async () => {
        setIsLoading(true);
        setFormError(null);
        
        try {
          // Fetch product details
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
            
          if (productError) {
            throw new Error(productError.message);
          }
          
          if (!product) {
            throw new Error('Product not found');
          }
          
          // Update form data
          setFormData({
            name_en: product.name_en || '',
            name_fr: product.name_fr || '',
            description_en: product.description_en || '',
            description_fr: product.description_fr || '',
            price: product.price?.toString() || '',
            currency: product.currency || 'XAF',
            seller_whatsapp: product.seller_whatsapp || '',
            category: product.category_id || '',
            condition: product.condition || 'new',
            image_urls: product.image_urls || [],
            slotNumber: product.auction_slot_id?.toString() || '',
          });
          
          // Update image files with existing images
          if (product.image_urls && product.image_urls.length > 0) {
            const images = product.image_urls.map((url: string) => ({
              file: null,
              preview: url,
              progress: 100,
              error: null
            }));
            setImageFiles(images);
          }
          
          // Fetch delivery options
          const { data: deliveryData, error: deliveryError } = await supabase
            .from('delivery_options')
            .select('*')
            .eq('product_id', productId);
          
          if (deliveryError) {
            console.error('Error fetching delivery options:', deliveryError);
          }
          
          if (deliveryData && deliveryData.length > 0) {
            setDeliveryOptions(deliveryData);
          }
        } catch (err) {
          console.error('Error fetching product for editing:', err);
          setFormError(err instanceof Error ? err.message : 'Failed to load product data');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchProductData();
    }
  }, [isEditing, productId]);
  
  // Handle next step
  const handleNextStep = () => {
    // Validate current step data
    const isValid = validateCurrentStep(currentStep);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      window.scrollTo(0, 0);
    }
  };
  
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };
  
  // Validate current step data using the imported validation utility
  const validateCurrentStep = (step: number): boolean => {
    const newErrors = validateStepData(
      step,
      formData,
      imageFiles,
      deliveryOptions,
      isAdmin,
      t
    );
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle uploading of images
  const uploadImages = async (): Promise<string[]> => {
    try {
      setUploadingImages(true);
      const urls: string[] = [];
      
      for (const image of imageFiles) {
        if (image.file) {
          // Get current user ID to use in the path
          const { data } = await supabase.auth.getUser();
          const userId = data.user?.id;
          
          const result = await fileUploadService.uploadFile(
            image.file,
            'product-images', // Using hyphen to match policy
            productId 
              ? `products/${productId}` 
              : `products/temp/${userId || 'anonymous'}`  // Use user ID instead of "new"
          );
          
          if (result.success) {
            urls.push(result.url);
          } else {
            throw new Error(result.error || 'Failed to upload image');
          }
        } else if (image.preview && !image.preview.startsWith('blob:')) {
          // If it's an existing URL (not a blob), add it to the URLs
          urls.push(image.preview);
        }
      }
      
      return urls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };
  
  // Handle delivery option removed
  const handleDeliveryOptionRemoved = (index: number) => {
    // If it has an ID, add it to the removed list
    const option = deliveryOptions[index];
    if (option.id) {
      setRemovedDeliveryOptionIds(prev => [...prev, option.id as string]);
    }
  };
  
  // Handle delivery options for a product
  const handleDeliveryOptions = async (productId: string) => {
    // Delete removed delivery options
    for (const optionId of removedDeliveryOptionIds) {
      await deleteDeliveryOption(optionId);
    }
    
    // Update or create delivery options
    for (const option of deliveryOptions) {
      if (option.id) {
        // Update existing option
        const { name_en, name_fr, areas, estimated_days, fee } = option;
        await updateDeliveryOption(option.id, {
          name_en,
          name_fr,
          areas,
          estimated_days,
          fee
        });
      } else {
        // Create new option
        await createDeliveryOption({
          product_id: productId,
          name_en: option.name_en,
          name_fr: option.name_fr,
          areas: option.areas,
          estimated_days: option.estimated_days,
          fee: option.fee
        });
      }
    }
  };
  
  // Handle submission of the form
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      // Validate all steps before submission
      const step1Errors = validateStepData(1, formData, imageFiles, deliveryOptions, isAdmin, t);
      const step2Errors = validateStepData(2, formData, imageFiles, deliveryOptions, isAdmin, t);
      const step3Errors = validateStepData(3, formData, imageFiles, deliveryOptions, isAdmin, t);
      
      const allErrors = { ...step1Errors, ...step2Errors, ...step3Errors };
      
      if (Object.keys(allErrors).length > 0) {
        setErrors(allErrors);
        setCurrentStep(1); // Go back to first step with errors
        throw new Error('Please fix validation errors before submitting');
      }
      
      // Upload images first
      setUploadingImages(true);
      const imageUrls = await uploadImages();
      setUploadingImages(false);
      
      // Prepare product data
      const productData: Partial<Product> = {
        name_en: formData.name_en,
        name_fr: formData.name_fr,
        description_en: formData.description_en,
        description_fr: formData.description_fr,
        price: parseFloat(formData.price),
        currency: formData.currency as 'XAF' | 'FCFA',
        image_urls: imageUrls,
        category_id: formData.category,
        condition: formData.condition as 'new' | 'used' | 'refurbished',
        seller_whatsapp: formData.seller_whatsapp,
        seller_id: isAdmin ? undefined : user?.id, // Let backend handle default vendor for admin
        auction_slot_id: formData.slotNumber ? parseInt(formData.slotNumber) : undefined,
        status: isAdmin ? 'approved' : 'pending' // Auto-approve admin products
      };
      
      // Create or update product
      const { success, data: product, error } = isEditing && productId
        ? await updateProduct(productId, productData)
        : await createProduct(productData);
      
      if (!success || !product) {
        throw new Error(error || 'Failed to save product');
      }
      
      // Handle delivery options
      if (product.id) {
        await handleDeliveryOptions(product.id);
      }
      
      // Clear form data from localStorage
      clearSavedFormData();
      
      // Show success message
      setSuccessMessage(t(isEditing ? errorMessages.updateSuccess : errorMessages.success));
      
      // Call success callback
      onSuccess?.();
      
    } catch (err) {
      console.error('Error submitting product form:', err);
      setFormError(err instanceof Error ? err.message : 'Unknown error occurred');
      toast.error(t(isEditing ? errorMessages.updateError : errorMessages.error));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const confirmCancel = () => {
    navigate(isAdmin ? '/admin/products' : '/dashboard');
  };
  
  // Handle form data change
  const handleFormDataChange = (newData: Partial<ProductFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...newData
    }));
  };
  
  // Handle delivery options change
  const handleDeliveryOptionsChange = (newOptions: DeliveryOptionInternal[]) => {
    setDeliveryOptions(newOptions);
    
    // Clear delivery-related errors when options change
    const updatedErrors = { ...errors };
    Object.keys(updatedErrors).forEach(key => {
      if (key.startsWith('delivery_')) {
        delete updatedErrors[key];
      }
    });
    
    setErrors(updatedErrors);
  };
  
  // Handle images change
  const handleImagesChange = (newImages: ImageFile[]) => {
    setImageFiles(newImages);
  };

  return {
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
  };
} 