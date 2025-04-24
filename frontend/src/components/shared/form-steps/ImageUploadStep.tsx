import React, { useCallback } from 'react';
import { useLanguage } from '../../../store/LanguageContext';
import { ImageFile } from '../../../types/image';
import BaseImageUpload from '../BaseImageUpload';
import useImageUpload from '../../../hooks/useImageUpload';

interface ImageUploadStepProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  errors: Record<string, string>;
  productId?: string;
  isSaving: boolean;
}

const ImageUploadStep: React.FC<ImageUploadStepProps> = ({
  images,
  onChange,
  errors,
  productId,
  isSaving
}) => {
  const { t } = useLanguage();
  const { uploadImage, uploadProgress } = useImageUpload({ productId });

  // Text content
  const text = {
    productImages: { en: 'Product Images', fr: 'Images du produit' },
    imageUploadHelp: { en: 'Upload up to 5 images (5MB max per image)', fr: 'Téléchargez jusqu\'à 5 images (5MB max par image)' },
  };

  // Handle image change with automatic upload
  const handleImageChange = useCallback(async (newImages: ImageFile[]) => {
    // Update the images immediately with local previews
    onChange(newImages);

    // Find the new image that needs to be uploaded
    const lastImage = newImages[newImages.length - 1];
    if (lastImage && lastImage.file && !lastImage.url) {
      // Upload the new image
      const result = await uploadImage(lastImage, newImages.length - 1);
      
      // Update the image with the upload result
      if (result.success) {
        const updatedImages = newImages.map((img, index) => 
          index === newImages.length - 1
            ? { ...img, url: result.url, progress: 100, error: null }
            : img
        );
        onChange(updatedImages);
      } else {
        // Handle upload error
        const updatedImages = newImages.map((img, index) => 
          index === newImages.length - 1
            ? { ...img, error: result.error || 'Upload failed', progress: 0 }
            : img
        );
        onChange(updatedImages);
      }
    }
  }, [onChange, uploadImage]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{t(text.productImages)}</h3>
      <p className="text-sm text-gray-500 mb-4">{t(text.imageUploadHelp)}</p>
      
      <BaseImageUpload
        images={images.map((img, index) => ({
          ...img,
          progress: uploadProgress[index] || img.progress
        }))}
        onChange={handleImageChange}
        disabled={isSaving}
        showPreview={true}
      />
      
      {errors.images && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {errors.images}
        </p>
      )}
    </div>
  );
};

export default ImageUploadStep; 