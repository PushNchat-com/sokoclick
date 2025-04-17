import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabaseClient } from '../../api/supabase';
import Button from './Button';

interface ImageUploaderProps {
  existingImages?: string[];
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  existingImages = [],
  onImagesChange,
  maxImages = 5
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>(existingImages);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  
  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Check if adding new files would exceed the max
    if (images.length + files.length > maxImages) {
      setError(`${t('errors.tooManyImages', { max: maxImages })}`);
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `products/${fileName}`;
        
        // Upload the file to Supabase Storage
        const { data, error: uploadError } = await supabaseClient.storage
          .from('images')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: { publicUrl } } = supabaseClient.storage
          .from('images')
          .getPublicUrl(filePath);
        
        uploadedUrls.push(publicUrl);
      }
      
      // Update images state
      const newImages = [...images, ...uploadedUrls];
      setImages(newImages);
      onImagesChange(newImages);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(`${t('errors.uploadFailed')}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  };
  
  // Handle image removal
  const handleRemoveImage = (urlToRemove: string) => {
    // Check if the URL is from Supabase Storage
    if (urlToRemove.includes('supabase') && urlToRemove.includes('/storage/v1/object/public/')) {
      // Extract the path from the URL
      const path = urlToRemove.split('/storage/v1/object/public/')[1];
      if (path) {
        // Try to delete the file from storage
        supabaseClient.storage
          .from('images')
          .remove([path])
          .then(({ error }) => {
            if (error) {
              console.error('Error deleting image from storage:', error);
            }
          });
      }
    }
    
    const newImages = images.filter(url => url !== urlToRemove);
    setImages(newImages);
    onImagesChange(newImages);
  };
  
  // Handle adding image from URL
  const handleAddImageUrl = () => {
    if (!newImageUrl) return;
    
    // Check if URL is valid
    try {
      new URL(newImageUrl);
    } catch (err) {
      setError(t('errors.invalidUrl'));
      return;
    }
    
    // Check if adding new URL would exceed the max
    if (images.length + 1 > maxImages) {
      setError(`${t('errors.tooManyImages', { max: maxImages })}`);
      return;
    }
    
    // Check if URL is already in the list
    if (images.includes(newImageUrl)) {
      setError(t('errors.duplicateImage'));
      return;
    }
    
    const newImages = [...images, newImageUrl];
    setImages(newImages);
    onImagesChange(newImages);
    setNewImageUrl('');
    setError(null);
  };
  
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
        
        <div className="grid grid-cols-2 gap-4">
          {/* File upload */}
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading || images.length >= maxImages}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || images.length >= maxImages}
            >
              {uploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('common.uploading')}
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {t('product.uploadImages')}
                </span>
              )}
            </Button>
          </div>
          
          {/* URL input */}
          <div>
            <div className="flex">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:ring-primary-500 focus:border-primary-500"
                disabled={uploading || images.length >= maxImages}
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="bg-primary-600 text-white px-4 py-2 rounded-r-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading || !newImageUrl || images.length >= maxImages}
              >
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mt-1">
          {t('product.imageHelp')}
        </p>
      </div>
      
      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {images.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="h-24 w-full object-cover rounded border border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/150?text=Error';
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(url)}
                className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl"
                disabled={uploading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 