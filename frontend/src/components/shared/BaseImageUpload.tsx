import React, { useCallback, useRef, useState } from 'react';
import { useLanguage } from '../../store/LanguageContext';
import { ImageFile, IMAGE_CONSTRAINTS, validateImage } from '../../types/image';
import { compressImage } from '../../utils/imageCompression';

interface BaseImageUploadProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  maxImages?: number;
  disabled?: boolean;
  showPreview?: boolean;
  className?: string;
  onUpload?: (file: File) => Promise<{ url: string }>;
  maxRetries?: number;
}

export const BaseImageUpload: React.FC<BaseImageUploadProps> = ({
  images,
  onChange,
  maxImages = IMAGE_CONSTRAINTS.maxImages,
  disabled = false,
  showPreview = true,
  className = '',
  onUpload,
  maxRetries = 3
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [retryQueue, setRetryQueue] = useState<{ file: File; retries: number }[]>([]);

  // Text content
  const text = {
    dragHere: { en: 'Drag & drop images here or click to browse', fr: 'Glissez-déposez des images ici ou cliquez pour parcourir' },
    addImage: { en: 'Add Image', fr: 'Ajouter une image' },
    maxSizeInfo: { en: `Max file size: ${IMAGE_CONSTRAINTS.maxSize / (1024 * 1024)}MB`, fr: `Taille maximale: ${IMAGE_CONSTRAINTS.maxSize / (1024 * 1024)}Mo` },
    supportedFormats: { en: 'Supported formats: JPG, PNG, WebP', fr: 'Formats supportés: JPG, PNG, WebP' },
    uploadingImage: { en: 'Uploading...', fr: 'Téléchargement...' },
    retrying: { en: 'Retrying...', fr: 'Nouvelle tentative...' },
    remove: { en: 'Remove', fr: 'Supprimer' },
    compressionError: { en: 'Error compressing image', fr: 'Erreur de compression de l\'image' }
  };

  // Process upload queue
  const processRetryQueue = useCallback(async () => {
    if (retryQueue.length === 0) return;

    const [nextItem, ...remainingQueue] = retryQueue;
    setRetryQueue(remainingQueue);

    if (nextItem.retries >= maxRetries) {
      // Update image with error
      onChange(images.map(img => 
        img.file === nextItem.file 
          ? { ...img, error: 'Max retries exceeded', progress: 0 }
          : img
      ));
      return;
    }

    try {
      // Attempt upload
      if (onUpload) {
        const { url } = await onUpload(nextItem.file);
        onChange(images.map(img =>
          img.file === nextItem.file
            ? { ...img, url, progress: 100, error: null }
            : img
        ));
      }
    } catch (error) {
      // Add back to queue with incremented retry count
      setRetryQueue([...remainingQueue, { ...nextItem, retries: nextItem.retries + 1 }]);
    }
  }, [retryQueue, maxRetries, onUpload, images, onChange]);

  // Handle file selection
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || disabled) return;

    const newFiles = Array.from(files);
    if (images.length + newFiles.length > maxImages) {
      alert(t({
        en: `You can upload a maximum of ${maxImages} images`,
        fr: `Vous pouvez télécharger un maximum de ${maxImages} images`
      }));
      return;
    }

    // Process each file
    for (const file of newFiles) {
      const validation = validateImage(file);
      if (!validation.valid) {
        alert(t({ en: validation.error!, fr: validation.error! }));
        continue;
      }

      try {
        // Compress image before upload
        const compressedFile = await compressImage(file, {
          maxSizeMB: IMAGE_CONSTRAINTS.maxSize / (1024 * 1024),
          maxWidthOrHeight: 1920
        });

        // Create preview URL
        const preview = URL.createObjectURL(compressedFile);
        const newImage: ImageFile = {
          file: compressedFile,
          preview,
          progress: 0,
          error: null
        };

        const updatedImages = [...images, newImage];
        onChange(updatedImages);

        // Attempt upload if handler provided
        if (onUpload) {
          try {
            const { url } = await onUpload(compressedFile);
            onChange(updatedImages.map(img =>
              img === newImage
                ? { ...img, url, progress: 100 }
                : img
            ));
          } catch (error) {
            // Add to retry queue
            setRetryQueue(prev => [...prev, { file: compressedFile, retries: 0 }]);
            onChange(updatedImages.map(img =>
              img === newImage
                ? { ...img, error: 'Upload failed, retrying...', progress: 0 }
                : img
            ));
          }
        }
      } catch (error) {
        alert(t(text.compressionError));
      }
    }
  }, [images, maxImages, disabled, onChange, onUpload, t]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Handle remove image
  const handleRemoveImage = useCallback((index: number) => {
    if (disabled) return;

    const newImages = [...images];
    const image = newImages[index];

    // Revoke object URL to prevent memory leaks
    if (image.preview && image.preview.startsWith('blob:')) {
      URL.revokeObjectURL(image.preview);
    }

    // Remove from retry queue if present
    if (image.file) {
      setRetryQueue(prev => prev.filter(item => item.file !== image.file));
    }

    newImages.splice(index, 1);
    onChange(newImages);
  }, [images, disabled, onChange]);

  // Process retry queue when it changes
  React.useEffect(() => {
    if (retryQueue.length > 0) {
      processRetryQueue();
    }
  }, [retryQueue, processRetryQueue]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      images.forEach(image => {
        if (image.preview && image.preview.startsWith('blob:')) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, []);

  return (
    <div className={`image-upload-container ${className}`}>
      {/* Image previews */}
      {showPreview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
            >
              {(image.preview || image.url) && (
                <>
                  <img
                    src={image.preview || image.url!}
                    alt={t({ en: `Image ${index + 1}`, fr: `Image ${index + 1}` })}
                    className="w-full h-full object-cover"
                  />
                  {image.progress > 0 && image.progress < 100 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-sm">
                        {t(text.uploadingImage)} ({image.progress}%)
                      </div>
                    </div>
                  )}
                  {image.error && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-sm px-2 text-center">
                        {image.error}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    disabled={disabled}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 focus:outline-none disabled:opacity-50"
                    aria-label={t(text.remove)}
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {images.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          role="button"
          tabIndex={disabled ? -1 : 0}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={IMAGE_CONSTRAINTS.allowedTypes.join(',')}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={disabled}
          />
          <div className="text-gray-600">{t(text.dragHere)}</div>
          <div className="mt-2 text-sm text-gray-500">
            <div>{t(text.maxSizeInfo)}</div>
            <div>{t(text.supportedFormats)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseImageUpload; 