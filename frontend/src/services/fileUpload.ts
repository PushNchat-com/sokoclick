import { supabase } from './supabase';
import { ImageUploadResult } from '../types/image';
import { IMAGE_CONSTRAINTS } from '../types/image';

interface UploadOptions {
  onProgress?: (progress: number) => void;
}

// Default bucket name - use consistently across the app
const DEFAULT_BUCKET = 'product-images';

class FileUploadService {
  async uploadFile(
    file: File,
    bucket: string = DEFAULT_BUCKET,
    path: string,
    options: UploadOptions = {}
  ): Promise<ImageUploadResult> {
    try {
      // Validate file type
      if (!this.validateFileType(file)) {
        return {
          success: false,
          url: '',
          error: `Invalid file type. Allowed types: ${IMAGE_CONSTRAINTS.allowedTypes.join(', ')}`
        };
      }
      
      // Validate file size
      if (file.size > IMAGE_CONSTRAINTS.maxSize) {
        return {
          success: false,
          url: '',
          error: `File too large. Maximum size: ${IMAGE_CONSTRAINTS.maxSize / (1024 * 1024)}MB`
        };
      }
      
      // Make sure we have a valid filename
      const fileName = file.name || `file-${Date.now()}.${this.getFileExtension(file)}`;
      const filePath = `${path}/${fileName}`;
      
      console.log(`Uploading file to bucket: ${bucket}, path: ${filePath}`);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          // Handle progress callback if provided
          ...(options.onProgress && {
            onUploadProgress: (progress: { percent?: number }) => {
              if (options.onProgress && typeof progress.percent === 'number') {
                options.onProgress(progress.percent);
              }
            }
          })
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: publicUrl,
        path: data.path
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        url: '',
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }
  
  // Helper to determine file extension
  private getFileExtension(file: File): string {
    if (file.name && file.name.includes('.')) {
      return file.name.split('.').pop() || 'jpg';
    }
    
    // Try to determine from mime type
    switch (file.type) {
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      default:
        return 'jpg'; // Default fallback
    }
  }
  
  // Validate that the file type is allowed
  private validateFileType(file: File): boolean {
    return IMAGE_CONSTRAINTS.allowedTypes.includes(file.type as any);
  }
}

export const fileUploadService = new FileUploadService();
export { DEFAULT_BUCKET };
export default fileUploadService; 