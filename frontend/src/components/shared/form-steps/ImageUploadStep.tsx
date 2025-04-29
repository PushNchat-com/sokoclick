import React, { useCallback, useState } from "react";
import { useLanguage } from "../../../store/LanguageContext";
import { ImageFile } from "../../../types/image";
import BaseImageUpload from "../BaseImageUpload";
import useImageUpload from "../../../hooks/useImageUpload";
import { DEFAULT_BUCKET } from "../../../services/fileUpload";

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
  isSaving,
}) => {
  const { t } = useLanguage();
  const { uploadImage, uploadProgress } = useImageUpload({
    productId,
    bucket: DEFAULT_BUCKET, // Explicitly use the default bucket
  });
  const [isUploading, setIsUploading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Text content
  const text = {
    productImages: { en: "Product Images", fr: "Images du produit" },
    imageUploadHelp: {
      en: "Upload up to 5 images (2MB max per image)",
      fr: "Téléchargez jusqu'à 5 images (2MB max par image)",
    },
    retryUpload: { en: "Retry Upload", fr: "Réessayer" },
    uploadingImage: {
      en: "Uploading image...",
      fr: "Téléchargement en cours...",
    },
    uploadError: {
      en: "Upload failed. Try again.",
      fr: "Échec du téléchargement. Essayez à nouveau.",
    },
  };

  // Handle image upload operation
  const performUpload = useCallback(
    async (imageFiles: ImageFile[], imageIndex: number) => {
      try {
        // Reset debug info
        setDebugInfo(null);

        // Mark as uploading
        setIsUploading(true);

        // Start with 0 progress
        const updatedImages = imageFiles.map((img, index) =>
          index === imageIndex ? { ...img, progress: 0, error: null } : img,
        );
        onChange(updatedImages);

        // Log upload attempt
        console.log(
          `Attempting to upload image to bucket: ${DEFAULT_BUCKET}, productId: ${productId || "none"}`,
        );

        // Upload the image
        const result = await uploadImage(imageFiles[imageIndex], imageIndex);

        // Update with the upload result
        if (result.success) {
          console.log("Upload successful:", result.url);
          const finalImages = imageFiles.map((img, index) =>
            index === imageIndex
              ? { ...img, url: result.url, progress: 100, error: null }
              : img,
          );
          onChange(finalImages);
        } else {
          // Handle upload error
          console.error("Upload failed:", result.error);
          setDebugInfo(`Upload error: ${result.error}`);

          const errorImages = imageFiles.map((img, index) =>
            index === imageIndex
              ? { ...img, error: result.error || "Upload failed", progress: 0 }
              : img,
          );
          onChange(errorImages);
        }
      } catch (error) {
        // Handle unexpected errors
        console.error("Unexpected upload error:", error);
        setDebugInfo(
          `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );

        const errorImages = imageFiles.map((img, index) =>
          index === imageIndex
            ? { ...img, error: "Unexpected error during upload", progress: 0 }
            : img,
        );
        onChange(errorImages);
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, uploadImage, productId],
  );

  // Handle image change with automatic upload
  const handleImageChange = useCallback(
    async (newImages: ImageFile[]) => {
      // Update the images immediately with local previews
      onChange(newImages);

      // Find the new image that needs to be uploaded
      const lastImage = newImages[newImages.length - 1];
      if (lastImage && lastImage.file && !lastImage.url) {
        await performUpload(newImages, newImages.length - 1);
      }
    },
    [onChange, performUpload],
  );

  // Handle retry for failed uploads
  const handleRetry = useCallback(
    async (index: number) => {
      if (!images[index] || !images[index].file) return;
      await performUpload([...images], index);
    },
    [images, performUpload],
  );

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {t(text.productImages)}
      </h3>
      <p className="text-sm text-gray-500 mb-4">{t(text.imageUploadHelp)}</p>

      {isUploading && (
        <div className="mb-4 text-sm text-blue-600">
          {t(text.uploadingImage)}
        </div>
      )}

      <BaseImageUpload
        images={
          Array.isArray(images)
            ? images.map((img, index) => ({
                ...img,
                progress:
                  uploadProgress[index] !== undefined
                    ? uploadProgress[index]
                    : img?.progress || 0,
                url: img?.url,
                preview: img?.preview,
                error: img?.error,
                file: img?.file,
              }))
            : []
        }
        onChange={handleImageChange}
        disabled={isSaving || isUploading}
        showPreview={true}
        onRetry={handleRetry}
        retryLabel={t(text.retryUpload)}
      />

      {errors.images && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {errors.images}
        </p>
      )}

      {debugInfo && (
        <p className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded">
          Debug info: {debugInfo}
        </p>
      )}
    </div>
  );
};

export default ImageUploadStep;
