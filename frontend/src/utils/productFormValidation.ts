import { ProductFormData } from '../types/product';
import { ImageFile, IMAGE_CONSTRAINTS } from '../types/image';
import { DeliveryOptionInternal } from '../types/delivery';

export type ProductStatus = 'pending' | 'approved' | 'rejected' | 'inactive' | 'draft';

interface ValidationContext {
  t: (text: { en: string; fr: string }) => string;
  isAdmin: boolean;
}

/**
 * Validates the data for a specific step of the product form
 * @param step The current step number
 * @param formData The form data
 * @param imageFiles The image files
 * @param deliveryOptions The delivery options
 * @param isAdmin Whether the current user is an admin
 * @param t Translation function
 * @returns An object with field names as keys and error messages as values
 */
export const validateStepData = (
  step: number,
  formData: ProductFormData,
  imageFiles: ImageFile[],
  deliveryOptions: DeliveryOptionInternal[],
  isAdmin: boolean,
  t: (text: { en: string; fr: string }) => string
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const ctx: ValidationContext = { t, isAdmin };

  switch (step) {
    case 1:
      validateBasicInfo(formData, errors, ctx);
      break;
    case 2:
      validateImages(imageFiles, errors, ctx);
      break;
    case 3:
      validateDeliveryOptions(deliveryOptions, errors, ctx);
      break;
  }

  return errors;
};

const validateBasicInfo = (
  formData: ProductFormData,
  errors: Record<string, string>,
  ctx: ValidationContext
) => {
  // Product name (English)
  if (!formData.name_en?.trim()) {
    errors.name_en = ctx.t({
      en: 'Product name in English is required',
      fr: 'Le nom du produit en anglais est requis'
    });
  } else if (formData.name_en.length > 100) {
    errors.name_en = ctx.t({
      en: 'Product name must be less than 100 characters',
      fr: 'Le nom du produit doit contenir moins de 100 caractères'
    });
  }

  // Product name (French)
  if (!formData.name_fr?.trim()) {
    errors.name_fr = ctx.t({
      en: 'Product name in French is required',
      fr: 'Le nom du produit en français est requis'
    });
  } else if (formData.name_fr.length > 100) {
    errors.name_fr = ctx.t({
      en: 'Product name must be less than 100 characters',
      fr: 'Le nom du produit doit contenir moins de 100 caractères'
    });
  }

  // Description (English)
  if (!formData.description_en?.trim()) {
    errors.description_en = ctx.t({
      en: 'Description in English is required',
      fr: 'La description en anglais est requise'
    });
  } else if (formData.description_en.length > 1000) {
    errors.description_en = ctx.t({
      en: 'Description must be less than 1000 characters',
      fr: 'La description doit contenir moins de 1000 caractères'
    });
  }

  // Description (French)
  if (!formData.description_fr?.trim()) {
    errors.description_fr = ctx.t({
      en: 'Description in French is required',
      fr: 'La description en français est requise'
    });
  } else if (formData.description_fr.length > 1000) {
    errors.description_fr = ctx.t({
      en: 'Description must be less than 1000 characters',
      fr: 'La description doit contenir moins de 1000 caractères'
    });
  }

  // Price
  if (!formData.price) {
    errors.price = ctx.t({
      en: 'Price is required',
      fr: 'Le prix est requis'
    });
  } else {
    const numericPrice = parseFloat(formData.price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      errors.price = ctx.t({
        en: 'Price must be a positive number',
        fr: 'Le prix doit être un nombre positif'
      });
    } else if (numericPrice > 10000000) {
      errors.price = ctx.t({
        en: 'Price must be less than 10,000,000',
        fr: 'Le prix doit être inférieur à 10 000 000'
      });
    }
  }

  // Currency
  if (!formData.currency) {
    errors.currency = ctx.t({
      en: 'Currency is required',
      fr: 'La devise est requise'
    });
  } else if (!['XAF', 'FCFA'].includes(formData.currency)) {
    errors.currency = ctx.t({
      en: 'Invalid currency',
      fr: 'Devise invalide'
    });
  }

  // WhatsApp number
  if (!formData.seller_whatsapp) {
    errors.seller_whatsapp = ctx.t({
      en: 'WhatsApp number is required',
      fr: 'Le numéro WhatsApp est requis'
    });
  } else if (!/^\+[0-9]{1,15}$/.test(formData.seller_whatsapp)) {
    errors.seller_whatsapp = ctx.t({
      en: 'WhatsApp number must be in international format (e.g., +237XXXXXXXXX)',
      fr: 'Le numéro WhatsApp doit être au format international (ex: +237XXXXXXXXX)'
    });
  }

  // Category
  if (!formData.category) {
    errors.category = ctx.t({
      en: 'Category is required',
      fr: 'La catégorie est requise'
    });
  }

  // Condition
  if (!formData.condition) {
    errors.condition = ctx.t({
      en: 'Condition is required',
      fr: "L'état est requis"
    });
  } else if (!['new', 'used', 'refurbished'].includes(formData.condition)) {
    errors.condition = ctx.t({
      en: 'Invalid condition',
      fr: 'État invalide'
    });
  }

  // Slot number (admin only)
  if (ctx.isAdmin && !formData.slotNumber) {
    errors.slotNumber = ctx.t({
      en: 'Slot number is required',
      fr: "Le numéro d'emplacement est requis"
    });
  }
};

const validateImages = (
  imageFiles: ImageFile[],
  errors: Record<string, string>,
  ctx: ValidationContext
) => {
  // Check minimum required images
  const validImages = imageFiles.filter(img => 
    (img.file !== null && img.progress >= 0) || 
    (img.url !== null && typeof img.url === 'string') ||
    (img.preview !== null && typeof img.preview === 'string')
  );

  if (validImages.length < IMAGE_CONSTRAINTS.minImages) {
    errors.images = ctx.t({
      en: 'At least one product image is required',
      fr: 'Au moins une image de produit est requise'
    });
    return; // Exit early if no valid images
  }

  // Check maximum images
  if (imageFiles.length > IMAGE_CONSTRAINTS.maxImages) {
    errors.images = ctx.t({
      en: `Maximum ${IMAGE_CONSTRAINTS.maxImages} images allowed`,
      fr: `Maximum ${IMAGE_CONSTRAINTS.maxImages} images autorisées`
    });
    return;
  }

  // Check for upload errors or incomplete uploads
  const failedUploads = imageFiles.filter(img => img.error !== null);
  const incompleteUploads = imageFiles.filter(img => 
    img.file && img.progress !== undefined && img.progress < 100 && !img.error
  );

  if (failedUploads.length > 0) {
    errors.imageUpload = ctx.t({
      en: 'Some images failed to upload. Please try again or remove them.',
      fr: "Certaines images n'ont pas pu être téléchargées. Veuillez réessayer ou les supprimer."
    });
  }

  if (incompleteUploads.length > 0) {
    errors.imageUpload = ctx.t({
      en: 'Please wait for all images to finish uploading.',
      fr: "Veuillez attendre que toutes les images soient téléchargées."
    });
  }
};

const validateDeliveryOptions = (
  deliveryOptions: DeliveryOptionInternal[],
  errors: Record<string, string>,
  ctx: ValidationContext
) => {
  // At least one delivery option required
  if (deliveryOptions.length === 0) {
    errors.deliveryOptions = ctx.t({
      en: 'At least one delivery option is required',
      fr: 'Au moins une option de livraison est requise'
    });
    return;
  }

  // Validate each delivery option
  deliveryOptions.forEach((option, index) => {
    // Name (English)
    if (!option.name_en?.trim()) {
      errors[`deliveryOption_${index}_name_en`] = ctx.t({
        en: 'Delivery option name in English is required',
        fr: "Le nom de l'option de livraison en anglais est requis"
      });
    }

    // Name (French)
    if (!option.name_fr?.trim()) {
      errors[`deliveryOption_${index}_name_fr`] = ctx.t({
        en: 'Delivery option name in French is required',
        fr: "Le nom de l'option de livraison en français est requis"
      });
    }

    // Areas
    if (!option.areas || option.areas.length === 0) {
      errors[`deliveryOption_${index}_areas`] = ctx.t({
        en: 'At least one delivery area is required',
        fr: 'Au moins une zone de livraison est requise'
      });
    }

    // Estimated days
    if (option.estimated_days === undefined || option.estimated_days === null) {
      errors[`deliveryOption_${index}_estimated_days`] = ctx.t({
        en: 'Estimated delivery days is required',
        fr: 'Le délai de livraison estimé est requis'
      });
    } else if (option.estimated_days <= 0) {
      errors[`deliveryOption_${index}_estimated_days`] = ctx.t({
        en: 'Estimated delivery days must be greater than 0',
        fr: 'Le délai de livraison estimé doit être supérieur à 0'
      });
    } else if (option.estimated_days > 30) {
      errors[`deliveryOption_${index}_estimated_days`] = ctx.t({
        en: 'Estimated delivery days must be less than 30',
        fr: 'Le délai de livraison estimé doit être inférieur à 30'
      });
    }

    // Fee
    if (option.fee === undefined || option.fee === null) {
      errors[`deliveryOption_${index}_fee`] = ctx.t({
        en: 'Delivery fee is required',
        fr: 'Les frais de livraison sont requis'
      });
    } else if (option.fee < 0) {
      errors[`deliveryOption_${index}_fee`] = ctx.t({
        en: 'Delivery fee cannot be negative',
        fr: 'Les frais de livraison ne peuvent pas être négatifs'
      });
    }
  });
};

/**
 * Validates a WhatsApp number according to international standards
 * @param number The WhatsApp number to validate
 * @returns True if the number is valid, false otherwise
 */
export const validateWhatsAppNumber = (number: string): boolean => {
  return /^\+[0-9]{1,15}$/.test(number);
};

/**
 * Formats a WhatsApp number to ensure it starts with +
 * @param number The WhatsApp number to format
 * @returns The formatted WhatsApp number
 */
export const formatWhatsAppNumber = (number: string): string => {
  // Remove all non-digit characters except +
  let cleaned = number.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}; 