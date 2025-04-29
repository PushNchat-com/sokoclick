import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "../types/auth";
import { ProductFormData } from "../types/product";
import { ImageFile } from "../types/image";
import { DeliveryOptionInternal } from "../types/delivery";
import {
  validateStepData,
  validateWhatsAppNumber,
} from "../utils/productFormValidation";
import { useLanguage } from "../store/LanguageContext";
import { fileUploadService, DEFAULT_BUCKET } from "../services/fileUpload";
import { createProduct, updateProduct, Product } from "../services/products";
import {
  createDeliveryOption,
  updateDeliveryOption,
  deleteDeliveryOption,
} from "../services/deliveryOptions";
import { supabase } from "../services/supabase";
import { UploadedImage } from "../components/shared/ImageUploadZone";
import { toast } from "../utils/toast";

export interface UseProductFormProps {
  isEditing: boolean;
  productId?: string;
  isAdmin: boolean;
  user: UserProfile | null;
  initialSlotId?: string | null;
  onSuccess?: () => void;
}

export const useProductForm = ({
  isEditing,
  productId,
  isAdmin,
  user,
  initialSlotId,
  onSuccess,
}: UseProductFormProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Form state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<ProductFormData>({
    name_en: "",
    name_fr: "",
    description_en: "",
    description_fr: "",
    price: "",
    currency: "XAF",
    seller_whatsapp: user?.phone || "",
    category: "",
    condition: "new",
    slotNumber: initialSlotId || "",
    category_id: "", // Required by ProductFormData type
    image_urls: [], // Required by ProductFormData type
  });

  // Initialize imageFiles as an empty array to prevent map errors
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);

  const [deliveryOptions, setDeliveryOptions] = useState<
    DeliveryOptionInternal[]
  >([
    {
      id: Date.now().toString(),
      name_en: "",
      name_fr: "",
      areas: [],
      estimated_days: 1,
      fee: 0,
    },
  ]);

  // Form state management
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(isEditing);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Fetch existing product data if editing
  useEffect(() => {
    const fetchProductData = async () => {
      if (isEditing && productId) {
        try {
          setIsLoading(true);

          // Fetch product data
          const { data: productData, error: productError } = await supabase
            .from("products")
            .select(
              `
              *,
              auction_slot_id,
              category:categories(id, name_en, name_fr)
            `,
            )
            .eq("id", productId)
            .single();

          if (productError) throw productError;

          if (!productData) {
            throw new Error("Product not found");
          }

          // Set form data from product
          setFormData({
            name_en: productData.name_en || "",
            name_fr: productData.name_fr || "",
            description_en: productData.description_en || "",
            description_fr: productData.description_fr || "",
            price: productData.price?.toString() || "",
            currency: productData.currency || "XAF",
            seller_whatsapp: productData.seller_whatsapp || "",
            category: productData.category?.id || "",
            condition: productData.condition || "new",
            slotNumber: productData.auction_slot_id?.toString() || "",
            category_id: productData.category?.id || "", // Required by ProductFormData type
            image_urls: productData.image_urls || [], // Required by ProductFormData type
          });

          // Fetch delivery options
          const { data: deliveryData, error: deliveryError } = await supabase
            .from("delivery_options")
            .select("*")
            .eq("product_id", productId);

          if (deliveryError) throw deliveryError;

          // Set delivery options from data
          if (deliveryData && deliveryData.length > 0) {
            setDeliveryOptions(
              deliveryData.map((option) => ({
                id: option.id,
                name_en: option.name_en || "",
                name_fr: option.name_fr || "",
                areas: option.areas || [],
                estimated_days: option.estimated_days || 1,
                fee: option.fee || 0,
              })),
            );
          }

          // No need to load images as they're now managed separately
        } catch (error) {
          console.error("Error loading product data:", error);
          toast.error(
            t({
              en: "Failed to load product data",
              fr: "Échec du chargement des données du produit",
            }),
          );
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProductData();
  }, [isEditing, productId, t]);

  // Handle form data changes
  const handleFormDataChange = (data: Partial<ProductFormData>) => {
    // Special handling for WhatsApp numbers
    if ("seller_whatsapp" in data && typeof data.seller_whatsapp === "string") {
      // Remove all non-digit characters except the plus sign
      let formattedNumber = data.seller_whatsapp.replace(/[^\d+]/g, "");

      // Ensure it starts with +
      if (formattedNumber.length > 0 && !formattedNumber.startsWith("+")) {
        formattedNumber = "+" + formattedNumber;
      }

      // If the number has 9 digits without country code, add Cameroon code
      if (!formattedNumber.startsWith("+") && formattedNumber.length === 9) {
        formattedNumber = "+237" + formattedNumber;
      } else if (
        formattedNumber.startsWith("+") &&
        formattedNumber.length === 10
      ) {
        // If it has a + but only 9 digits, assume Cameroon and add the code
        formattedNumber = "+237" + formattedNumber.substring(1);
      }

      // Update the data with the formatted number
      data.seller_whatsapp = formattedNumber;
    }

    setFormData((prevData) => ({ ...prevData, ...data }));

    // Clear errors for changed fields
    const updatedErrors = { ...errors };
    Object.keys(data).forEach((key) => {
      if (key in updatedErrors) {
        delete updatedErrors[key];
      }
    });
    setErrors(updatedErrors);
  };

  // Handle image changes (keeping for backward compatibility)
  const handleImagesChange = (newImages: ImageFile[]) => {
    setImageFiles(newImages);

    // Clear image errors if any images are added
    if (newImages.length > 0 && "images" in errors) {
      const updatedErrors = { ...errors };
      delete updatedErrors.images;
      setErrors(updatedErrors);
    }
  };

  // Handle delivery option changes
  const handleDeliveryOptionsChange = (
    optionIndex: number,
    data: Partial<DeliveryOptionInternal>,
  ) => {
    setDeliveryOptions((prevOptions) => {
      const updatedOptions = [...prevOptions];
      updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], ...data };
      return updatedOptions;
    });

    // Clear delivery option errors
    if ("deliveryOptions" in errors) {
      const updatedErrors = { ...errors };
      delete updatedErrors.deliveryOptions;
      setErrors(updatedErrors);
    }
  };

  // Handle removing a delivery option
  const handleDeliveryOptionRemoved = (optionIndex: number) => {
    setDeliveryOptions((prevOptions) => {
      // Need at least one option, so replace with empty if this is the last one
      if (prevOptions.length === 1) {
        return [
          {
            id: Date.now().toString(),
            name_en: "",
            name_fr: "",
            areas: [],
            estimated_days: 1,
            fee: 0,
          },
        ];
      }

      // Otherwise filter out the removed option
      return prevOptions.filter((_, index) => index !== optionIndex);
    });
  };

  // Handle next step
  const handleNextStep = () => {
    // Validate current step - ensure imageFiles is always an array
    const safeImageFiles = Array.isArray(imageFiles) ? imageFiles : [];
    const validationErrors = validateStepData(
      currentStep,
      formData,
      safeImageFiles,
      deliveryOptions,
      isAdmin,
      t,
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // We only have two steps now - basic info and delivery
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      handleSubmit();
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    // We only have two steps now
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Upload images helper function
  const uploadImages = async (): Promise<string[]> => {
    // Images are now managed by SlotImageUploader
    // This function remains for compatibility but returns an empty array
    return [];
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      // Validate all steps before submission - ensure imageFiles is always an array
      const safeImageFiles = Array.isArray(imageFiles) ? imageFiles : [];
      const step1Errors = validateStepData(
        1,
        formData,
        safeImageFiles,
        deliveryOptions,
        isAdmin,
        t,
      );
      const step2Errors = validateStepData(
        2,
        formData,
        safeImageFiles,
        deliveryOptions,
        isAdmin,
        t,
      );

      const allErrors = { ...step1Errors, ...step2Errors };

      if (Object.keys(allErrors).length > 0) {
        setErrors(allErrors);
        setCurrentStep(1); // Go back to first step with errors
        throw new Error("Please fix validation errors before submitting");
      }

      // We no longer need to upload images as they're managed separately

      // Prepare product data
      const productData: Partial<Product> = {
        name_en: formData.name_en,
        name_fr: formData.name_fr,
        description_en: formData.description_en,
        description_fr: formData.description_fr,
        price: parseFloat(formData.price),
        currency: formData.currency as "XAF" | "FCFA",
        image_urls: [], // Empty array since images are now managed separately
        category_id: formData.category,
        condition: formData.condition as "new" | "used" | "refurbished",
        seller_whatsapp: formData.seller_whatsapp,
        seller_id: isAdmin ? undefined : user?.id, // Let backend handle default vendor for admin
        auction_slot_id: formData.slotNumber
          ? parseInt(formData.slotNumber)
          : undefined,
        status: isAdmin ? "approved" : "pending", // Auto-approve admin products
      };

      // Create or update product
      const {
        success,
        data: product,
        error,
      } = isEditing && productId
        ? await updateProduct(productId, productData)
        : await createProduct(productData);

      if (!success || !product) {
        throw new Error(error || "Failed to save product");
      }

      // Handle delivery options
      await Promise.all(
        deliveryOptions.map(async (option) => {
          // Skip empty options
          if (!option.name_en && !option.name_fr && option.areas.length === 0) {
            return;
          }

          const deliveryData = {
            product_id: product.id,
            name_en: option.name_en,
            name_fr: option.name_fr,
            areas: option.areas,
            estimated_days: option.estimated_days,
            fee: option.fee,
          };

          if (isEditing && option.id && !option.id.startsWith("temp_")) {
            // Update existing option
            await updateDeliveryOption(option.id, deliveryData);
          } else {
            // Create new option
            await createDeliveryOption(deliveryData);
          }
        }),
      );

      // Show success message
      setSuccessMessage(
        t({
          en: isEditing
            ? "Product updated successfully"
            : "Product created successfully",
          fr: isEditing
            ? "Produit mis à jour avec succès"
            : "Produit créé avec succès",
        }),
      );

      // Take slot number from formData to construct redirect URL
      const redirectUrl = product.auction_slot_id
        ? `/admin/slots/uploads?slot=${product.auction_slot_id}`
        : formData.slotNumber
          ? `/admin/slots/uploads?slot=${formData.slotNumber}`
          : undefined;

      // If the product has a slot number, prompt the user to upload images
      if (redirectUrl && isAdmin) {
        toast.info(
          t({
            en: "Don't forget to upload images for this product using the Slot Image Uploader",
            fr: "N'oubliez pas de télécharger des images pour ce produit en utilisant le Téléchargeur d'images de l'emplacement",
          }),
        );

        // Call success handler after a delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            navigate(redirectUrl);
          }
        }, 2000);
      } else {
        // Call success handler after a delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            navigate(isAdmin ? "/admin/products" : "/dashboard");
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setFormError(
        error instanceof Error ? error.message : "Failed to submit form",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel dialog
  const confirmCancel = () => {
    navigate(isAdmin ? "/admin/products" : "/dashboard");
  };

  // Functions needed by BaseProductForm.tsx for local storage
  const checkStoredState = () => null; // Simplified - we don't need to restore state
  const saveFormState = () => {}; // No-op, we don't need to save state
  const clearStoredState = () => {}; // No-op, we don't need to clear state

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
    setCurrentStep,
    initialized,
    setInitialized,
    checkStoredState,
    saveFormState,
    clearStoredState,
  };
};
