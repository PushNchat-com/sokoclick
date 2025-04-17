import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from './Toast';
import Button from './Button';
import { supabaseStorage, initStorage } from '../../api/supabaseStorage';

interface ProductImageUploaderProps {
  existingImages?: string[];
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
}

const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  existingImages = [],
  onImagesChange,
  maxImages = 5
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>(existingImages);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [storageInitialized, setStorageInitialized] = useState<boolean>(false);
  
  // Initialize storage when component mounts
  useEffect(() => {
    const checkStorage = async () => {
      try {
        // Ensure images bucket exists
        const result = await initStorage();
        setStorageInitialized(result.success);
        
        if (!result.success) {
          console.warn('Storage initialization warning:', result.message);
        }
      } catch (err) {
        console.error('Storage initialization error:', err);
        // Continue anyway as the app-level initialization may have worked
      }
    };
    
    checkStorage();
  }, []);
  
  // Handle file selection
  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Check if adding new files would exceed the max
    if (images.length + files.length > maxImages) {
      setError(`${t('errors.tooManyImages', { max: maxImages })}`);
      toast.error(t('errors.tooManyImages', { max: maxImages }));
      return;
    }
    
    setUploading(true);
    setError(null);
    
    const uploadedUrls: string[] = [];
    const newProgress: { [key: string]: number } = {};
    
    try {
      // Ensure storage is initialized before upload
      if (!storageInitialized) {
        const result = await initStorage();
        setStorageInitialized(result.success);
        
        if (!result.success) {
          throw new Error(`${t('errors.storageNotInitialized')}: ${result.message}`);
        }
      }
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(t('errors.invalidFileType', { name: fileName }));
          continue;
        }
        
        // Validate file size (max 5MB)
        const maxSizeInBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
          toast.error(t('errors.fileTooLarge', { name: fileName, maxSize: '5MB' }));
          continue;
        }
        
        // Add to progress tracking
        newProgress[fileName] = 0;
        setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));
        
        // Set initial 10% progress to show activity
        setUploadProgress(prev => ({ ...prev, [fileName]: 10 }));
        
        try {
          // Use our storage helper to upload the file
          const publicUrl = await supabaseStorage.uploadImage(file, 'products');
          
          // Update progress to 100%
          setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));
          
          uploadedUrls.push(publicUrl);
          
          // Show success message
          toast.success(t('product.imageUploaded'));
        } catch (uploadErr) {
          // Handle individual upload errors but continue with other files
          const errorMessage = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
          toast.error(`${t('errors.uploadFailed')}: ${fileName} - ${errorMessage}`);
        }
      }
      
      if (uploadedUrls.length > 0) {
        // Update images state
        const newImages = [...images, ...uploadedUrls];
        setImages(newImages);
        onImagesChange(newImages);
      } else {
        setError(t('errors.noImagesUploaded'));
      }
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`${t('errors.uploadFailed')}: ${errorMessage}`);
      toast.error(`${t('errors.uploadFailed')}: ${errorMessage}`);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };
  
  // Handle image removal
  const handleRemoveImage = async (urlToRemove: string) => {
    try {
      setUploading(true);
      
      // Use our storage helper to delete the file if it's from Supabase
      const deleted = await supabaseStorage.deleteImage(urlToRemove);
      
      if (deleted) {
        toast.success(t('product.imageRemoved'));
      }
      
      const newImages = images.filter(url => url !== urlToRemove);
      setImages(newImages);
      onImagesChange(newImages);
    } catch (err) {
      console.error('Error removing image:', err);
      toast.error(t('errors.deleteFailed'));
      
      // Still remove from UI even if storage deletion fails
      const newImages = images.filter(url => url !== urlToRemove);
      setImages(newImages);
      onImagesChange(newImages);
    } finally {
      setUploading(false);
    }
  };
  
  // Handle adding image from URL
  const handleAddImageUrl = () => {
    if (!newImageUrl) return;
    
    // Check if URL is valid
    try {
      new URL(newImageUrl);
    } catch (err) {
      setError(t('errors.invalidUrl'));
      toast.error(t('errors.invalidUrl'));
      return;
    }
    
    // Check if adding new URL would exceed the max
    if (images.length + 1 > maxImages) {
      setError(`${t('errors.tooManyImages', { max: maxImages })}`);
      toast.error(t('errors.tooManyImages', { max: maxImages }));
      return;
    }
    
    // Check if URL is already in the list
    if (images.includes(newImageUrl)) {
      setError(t('errors.duplicateImage'));
      toast.error(t('errors.duplicateImage'));
      return;
    }
    
    const newImages = [...images, newImageUrl];
    setImages(newImages);
    onImagesChange(newImages);
    setNewImageUrl('');
    setError(null);
    toast.success(t('product.imageAdded'));
  };
  
  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);
  
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('product.images')} ({images.length}/{maxImages})
        </label>
        
        {/* Drag and drop area */}
        <div 
          className={`mb-4 border-2 border-dashed rounded-lg p-6 transition-colors text-center
            ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
            ${uploading ? 'bg-gray-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || images.length >= maxImages}
          />
          
          {uploading ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-primary-600 border-r-primary-300 border-b-primary-200 border-l-primary-100 mb-2"></div>
              <p className="text-gray-600">{t('common.uploading')}...</p>
              
              {/* Progress bars */}
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="mt-2 w-full">
                  <div className="text-xs text-gray-500 text-left mb-1">{fileName}</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 rounded-full" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H8m36-12h-4m-20 4h.01M4 20h36" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                {t('product.dragImages')}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t('product.imageRequirements')}
              </p>
              <button
                type="button"
                className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={uploading || images.length >= maxImages}
              >
                {t('common.selectFiles')}
              </button>
            </div>
          )}
        </div>
        
        {/* List of uploaded images */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((url, index) => (
              <div key={`${url}-${index}`} className="relative group overflow-hidden rounded-lg border border-gray-200">
                <img 
                  src={url} 
                  alt={`Product ${index + 1}`} 
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Image+Error';
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(url)}
                  className="absolute top-2 right-2 bg-red-100 bg-opacity-80 text-red-600 p-1 rounded-full hover:bg-red-200"
                  disabled={uploading}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="sr-only">{t('common.remove')}</span>
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Add image by URL */}
        <div className="mt-4 flex">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder={t('product.imageUrlPlaceholder')}
            className="flex-1 rounded-l-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={uploading || images.length >= maxImages}
          />
          <Button
            type="button"
            onClick={handleAddImageUrl}
            className="rounded-l-none"
            disabled={!newImageUrl || uploading || images.length >= maxImages}
          >
            {t('common.add')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductImageUploader; 