import React, { useCallback, useState } from 'react';
import { useLanguage } from '../../store/LanguageContext';

export interface UploadedImage {
  url: string;
  previewUrl?: string;
  uploading?: boolean;
  error?: string;
  file?: File | null;
}

interface UploadResult {
  success: boolean;
  url: string;
  error?: string;
}

interface ImageUploadZoneProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSizeInMB?: number;
  uploadHandler?: (file: File) => Promise<UploadResult>;
  disabled?: boolean;
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  images,
  onChange,
  maxImages = 5,
  maxSizeInMB = 2,
  uploadHandler,
  disabled = false
}) => {
  const { t } = useLanguage();
  const [dragActive, setDragActive] = useState(false);
  
  // Handle file selection
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    await handleFiles(Array.from(files));
    // Reset the input
    e.target.value = '';
  }, [images, maxImages, maxSizeInMB, uploadHandler]);
  
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
  
  // Handle file drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  }, [images, maxImages, maxSizeInMB, uploadHandler]);
  
  // Process multiple files
  const handleFiles = async (files: File[]) => {
    if (disabled) return;
    
    // Check if adding these files would exceed the max
    if (images.length + files.length > maxImages) {
      alert(t({ 
        en: `You can upload a maximum of ${maxImages} images`, 
        fr: `Vous pouvez télécharger un maximum de ${maxImages} images` 
      }));
      return;
    }
    
    // Process each file
    for (const file of files) {
      // Check file size
      if (file.size > maxSizeInMB * 1024 * 1024) {
        alert(t({ 
          en: `File ${file.name} exceeds the maximum size of ${maxSizeInMB}MB`, 
          fr: `Le fichier ${file.name} dépasse la taille maximale de ${maxSizeInMB}MB` 
        }));
        continue;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert(t({ 
          en: `File ${file.name} is not an image`, 
          fr: `Le fichier ${file.name} n'est pas une image` 
        }));
        continue;
      }
      
      // Create a temporary preview
      const preview = URL.createObjectURL(file);
      
      // Add to images array with uploading state
      const newImage: UploadedImage = {
        url: '',
        previewUrl: preview,
        uploading: true,
        file
      };
      
      const newImages = [...images, newImage];
      onChange(newImages);
      
      // Upload the file if a handler is provided
      if (uploadHandler) {
        try {
          const result = await uploadHandler(file);
          
          // Update the image with the result
          const updatedImages = newImages.map((img, i) => {
            if (i === newImages.length - 1) {
              return {
                ...img,
                url: result.success ? result.url : '',
                uploading: false,
                error: result.success ? undefined : result.error
              };
            }
            return img;
          });
          
          onChange(updatedImages);
        } catch (error) {
          // Handle upload error
          const updatedImages = newImages.map((img, i) => {
            if (i === newImages.length - 1) {
              return {
                ...img,
                uploading: false,
                error: error instanceof Error ? error.message : 'Upload failed'
              };
            }
            return img;
          });
          
          onChange(updatedImages);
        }
      }
    }
  };
  
  // Handle image removal
  const handleRemoveImage = (index: number) => {
    if (disabled) return;
    
    const newImages = [...images];
    
    // If there's a preview URL, revoke it to free up memory
    if (newImages[index].previewUrl && newImages[index].previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(newImages[index].previewUrl);
    }
    
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const uploadDescription = t({ 
    en: `Drag & drop images or click to browse. Up to ${maxImages} images (${maxSizeInMB}MB max each).`, 
    fr: `Glissez-déposez des images ou cliquez pour parcourir. Jusqu'à ${maxImages} images (${maxSizeInMB}MB max chacune).` 
  });
  
  return (
    <div className="image-upload-zone" role="region" aria-label={t({ en: 'Product Images', fr: 'Images du produit' })}>
      {/* Image previews */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4" role="list">
        {images.map((image, index) => (
          <div 
            key={index} 
            className="relative border border-gray-200 rounded-lg overflow-hidden aspect-square flex items-center justify-center bg-gray-50"
            role="listitem"
          >
            {image.url || image.previewUrl ? (
              <>
                <img 
                  src={image.previewUrl || image.url} 
                  alt={t({ en: `Product image ${index + 1}`, fr: `Image du produit ${index + 1}` })}
                  className="object-cover w-full h-full"
                />
                {image.uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center" 
                    role="status" 
                    aria-label={t({ en: 'Uploading image...', fr: 'Téléchargement de l\'image...' })}>
                    <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
                  </div>
                )}
                {image.error && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
                    role="alert"
                    aria-live="assertive">
                    <div className="text-white text-center text-xs p-2">
                      {image.error}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  disabled={disabled}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 focus:outline-none disabled:opacity-50"
                  aria-label={t({ en: `Remove image ${index + 1}`, fr: `Supprimer l'image ${index + 1}` })}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              <div className="text-gray-400 text-center text-xs p-2">
                {t({ en: 'Empty slot', fr: 'Emplacement vide' })}
              </div>
            )}
          </div>
        ))}
        
        {/* Add image button */}
        {images.length < maxImages && (
          <div 
            className={`border-2 border-dashed rounded-lg overflow-hidden aspect-square flex flex-col items-center justify-center p-4 cursor-pointer transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => {
              if (!disabled) {
                document.getElementById('image-upload')?.click();
              }
            }}
            role="button"
            aria-label={t({ en: 'Add product image', fr: 'Ajouter une image de produit' })}
            aria-describedby="upload-description"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
          >
            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm text-gray-500">
              {t({ en: 'Add Image', fr: 'Ajouter une image' })}
            </span>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled}
              aria-label={t({ en: 'Upload product images', fr: 'Télécharger des images de produit' })}
            />
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-500" id="upload-description">
        {uploadDescription}
      </p>
    </div>
  );
};

export default ImageUploadZone; 