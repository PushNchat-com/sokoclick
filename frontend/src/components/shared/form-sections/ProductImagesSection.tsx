import React, { useRef, useState, useCallback, useEffect } from "react";
import { useLanguage } from "../../../store/LanguageContext";
import { ImageFile } from "../../../types/image";
import { imageUploadService } from "../../../services/imageUpload";

interface ProductImagesSectionProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  productId?: string;
  errors?: Record<string, string>;
  disabled?: boolean;
}

const ProductImagesSection: React.FC<ProductImagesSectionProps> = ({
  images,
  onChange,
  productId,
  errors = {},
  disabled = false,
}) => {
  const { t } = useLanguage();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [dragActive, setDragActive] = useState<number | null>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((image) => {
        if (image.preview) {
          imageUploadService.revokeObjectURL(image.preview);
        }
      });
    };
  }, []);

  // Process a newly selected file
  const handleNewFile = async (index: number, file: File) => {
    // Create preview URL
    const preview = imageUploadService.createObjectURL(file);

    // Update state with new image
    const newImages = [...images];
    newImages[index] = {
      file,
      preview,
      progress: 0,
      error: null,
    };
    onChange(newImages);

    // If we have a productId, start upload
    if (productId) {
      try {
        const result = await imageUploadService.uploadImage(
          file,
          productId,
          (progress) => {
            const updatedImages = [...images];
            updatedImages[index] = {
              ...updatedImages[index],
              progress: (progress.loaded / progress.total) * 100,
            };
            onChange(updatedImages);
          },
        );

        if (result.success) {
          const updatedImages = [...images];
          updatedImages[index] = {
            ...updatedImages[index],
            url: result.url,
            progress: 100,
            error: null,
          };
          onChange(updatedImages);
        } else {
          const updatedImages = [...images];
          updatedImages[index] = {
            ...updatedImages[index],
            error: result.error || "Upload failed",
            progress: 0,
          };
          onChange(updatedImages);
        }
      } catch (error) {
        const updatedImages = [...images];
        updatedImages[index] = {
          ...updatedImages[index],
          error: error instanceof Error ? error.message : "Upload failed",
          progress: 0,
        };
        onChange(updatedImages);
      }
    }
  };

  // Handle file input change
  const handleFileChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      handleNewFile(index, e.target.files[0]);
    }
  };

  // Handle drag events
  const handleDrag = useCallback(
    (
      e: React.DragEvent<HTMLDivElement>,
      index: number,
      isDragActive: boolean,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(isDragActive ? index : null);
    },
    [],
  );

  // Handle drop events
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(null);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleNewFile(index, e.dataTransfer.files[0]);
      }
    },
    [handleNewFile],
  );

  // Delete image
  const handleDeleteImage = async (index: number) => {
    const image = images[index];

    // If image has a URL, try to delete from storage
    if (image.url) {
      await imageUploadService.deleteImage(image.url);
    }

    // Clean up preview URL
    if (image.preview) {
      imageUploadService.revokeObjectURL(image.preview);
    }

    // Remove from state
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-xl font-medium text-gray-900 mb-6">
        {t({ en: "Product Images", fr: "Images du produit" })}
      </h3>

      <div className="space-y-6">
        <div className="flex flex-col space-y-2 text-sm text-gray-500">
          <p>
            {t({ en: "Maximum file size: 5MB", fr: "Taille maximale: 5Mo" })}
          </p>
          <p>
            {t({
              en: "Supported formats: JPG, PNG, WebP",
              fr: "Formats supportés: JPG, PNG, WebP",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className={`relative border-2 ${
                errors[`image_${index}`]
                  ? "border-red-300 bg-red-50"
                  : dragActive === index
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 bg-gray-50"
              } rounded-lg p-4 flex flex-col items-center justify-center transition-all`}
              onDragEnter={(e) => handleDrag(e, index, true)}
              onDragLeave={(e) => handleDrag(e, index, false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, index)}
              style={{ minHeight: "200px" }}
            >
              <input
                type="file"
                ref={(el) => (fileInputRefs.current[index] = el)}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileChange(index, e)}
                disabled={disabled}
              />

              {image.url || image.preview ? (
                <div className="relative w-full h-full">
                  <img
                    src={image.url || image.preview}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-contain"
                  />

                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      aria-label="Delete image"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}

                  {image.progress > 0 && image.progress < 100 && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                      <div className="w-full max-w-md px-4">
                        <div className="mb-1 text-sm text-center font-medium text-blue-700">
                          {t({ en: "Uploading...", fr: "Téléchargement..." })} (
                          {Math.round(image.progress)}%)
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${image.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="text-center cursor-pointer"
                  onClick={() =>
                    !disabled && fileInputRefs.current[index]?.click()
                  }
                >
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-1 text-sm text-gray-600">
                    {index === 0
                      ? t({
                          en: "Main Product Image",
                          fr: "Image principale du produit",
                        })
                      : t({
                          en: "Additional Image",
                          fr: "Image supplémentaire",
                        })}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t({
                      en: "Click or drag to upload",
                      fr: "Cliquez ou glissez pour télécharger",
                    })}
                  </p>
                </div>
              )}

              {image.error && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {image.error}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductImagesSection;
