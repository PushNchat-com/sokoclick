import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fileUploadService, DEFAULT_BUCKET } from '../services/fileUpload';
import { ImageFile, ImageUploadResult } from '../types/image';
import { supabase } from '../services/supabase';

interface UseImageUploadOptions {
  productId?: string;
  bucket?: string;
}

export const useImageUpload = (options: UseImageUploadOptions = {}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const uploadImage = useCallback(async (
    image: ImageFile,
    index: number
  ): Promise<ImageUploadResult> => {
    if (!image.file) {
      return {
        success: false,
        url: '',
        error: 'No file to upload'
      };
    }

    try {
      setIsUploading(true);
      setUploadProgress(prev => ({ ...prev, [index]: 0 }));

      // Get current user ID for the path
      const userId = user?.id || 'anonymous';
      
      // Upload the file
      const result = await fileUploadService.uploadFile(
        image.file,
        options.bucket || DEFAULT_BUCKET,
        options.productId 
          ? `products/${options.productId}` 
          : `products/temp/${userId}`,
        {
          onProgress: (progress) => {
            setUploadProgress(prev => ({ ...prev, [index]: progress }));
          }
        }
      );

      return result;
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        url: '',
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    } finally {
      setIsUploading(false);
      setUploadProgress(prev => ({ ...prev, [index]: 100 }));
    }
  }, [options.bucket, options.productId, user]);

  const uploadImages = useCallback(async (
    images: ImageFile[]
  ): Promise<string[]> => {
    const urls: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      // Skip if image is already uploaded
      if (image.url) {
        urls.push(image.url);
        continue;
      }

      const result = await uploadImage(image, i);
      if (result.success && result.url) {
        urls.push(result.url);
      } else {
        throw new Error(result.error || 'Failed to upload image');
      }
    }

    return urls;
  }, [uploadImage]);

  const deleteImage = useCallback(async (url: string): Promise<boolean> => {
    try {
      const path = url.split('/').pop();
      if (!path) return false;

      const { error } = await supabase.storage
        .from(options.bucket || DEFAULT_BUCKET)
        .remove([path]);

      return !error;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }, [options.bucket]);

  return {
    uploadImage,
    uploadImages,
    deleteImage,
    isUploading,
    uploadProgress
  };
};

export default useImageUpload; 