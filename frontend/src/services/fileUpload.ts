import { supabase } from './supabase';
import { ImageUploadResult } from '../types/image';

interface UploadOptions {
  onProgress?: (progress: number) => void;
}

class FileUploadService {
  async uploadFile(
    file: File,
    bucket: string,
    path: string,
    options: UploadOptions = {}
  ): Promise<ImageUploadResult> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(`${path}/${file.name}`, file, {
          cacheControl: '3600',
          upsert: true,
          onUploadProgress: options.onProgress
            ? ({ percent }) => options.onProgress!(percent || 0)
            : undefined
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(`${path}/${file.name}`);

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
}

export const fileUploadService = new FileUploadService();

export default fileUploadService; 