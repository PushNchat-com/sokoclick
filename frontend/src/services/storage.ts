import supabase from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE_MB = 5; // 5MB max file size

// Image dimensions for different purposes
export enum ImageSize {
  THUMBNAIL = 'thumbnail',
  MEDIUM = 'medium',
  FULL = 'full'
}

// Storage buckets
enum StorageBucket {
  PRODUCTS = 'product-images',
  AVATARS = 'avatars',
  CATEGORIES = 'categories',
  GENERAL = 'general'
}

// Result interface
interface UploadResult {
  path: string;
  url: string;
  error: string | null;
}

/**
 * Validate image file
 * @param file File to validate
 * @returns Validation result
 */
export const validateImage = (file: File): { valid: boolean; error: string | null } => {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    };
  }

  // Check file size
  const maxSizeBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_IMAGE_SIZE_MB}MB limit`
    };
  }

  return { valid: true, error: null };
};

/**
 * Generate a unique filename for storage
 * @param originalName Original file name
 * @returns Unique filename
 */
const generateUniqueFilename = (originalName: string): string => {
  const extension = originalName.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const uuid = uuidv4().substring(0, 8);
  return `${timestamp}-${uuid}.${extension}`;
};

/**
 * Storage service for uploading and managing images
 */
export const storageService = {
  /**
   * Upload a product image to Supabase storage
   * @param file Image file to upload
   * @param productId Product ID for organization (optional)
   * @returns Upload result
   */
  uploadProductImage: async (file: File, productId?: string): Promise<UploadResult> => {
    try {
      // Validate image
      const validation = validateImage(file);
      if (!validation.valid) {
        return { path: '', url: '', error: validation.error };
      }

      // Generate path
      const filename = generateUniqueFilename(file.name);
      const path = productId
        ? `${productId}/${filename}`
        : `new/${filename}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(StorageBucket.PRODUCTS)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(StorageBucket.PRODUCTS)
        .getPublicUrl(path);

      return {
        path: data.path,
        url: urlData.publicUrl,
        error: null
      };
    } catch (error) {
      console.error('Error uploading product image:', error);
      return {
        path: '',
        url: '',
        error: error instanceof Error ? error.message : 'Failed to upload image'
      };
    }
  },

  /**
   * Upload a user avatar to Supabase storage
   * @param file Image file to upload
   * @param userId User ID for organization
   * @returns Upload result
   */
  uploadAvatar: async (file: File, userId: string): Promise<UploadResult> => {
    try {
      // Validate image
      const validation = validateImage(file);
      if (!validation.valid) {
        return { path: '', url: '', error: validation.error };
      }

      // Generate path - avatars are stored with user ID as filename
      const extension = file.name.split('.').pop() || 'jpg';
      const path = `${userId}.${extension}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(StorageBucket.AVATARS)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true // Overwrite if exists
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(StorageBucket.AVATARS)
        .getPublicUrl(path);

      return {
        path: data.path,
        url: urlData.publicUrl,
        error: null
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return {
        path: '',
        url: '',
        error: error instanceof Error ? error.message : 'Failed to upload avatar'
      };
    }
  },

  /**
   * Upload a category image to Supabase storage
   * @param file Image file to upload
   * @param categorySlug Category slug for organization
   * @returns Upload result
   */
  uploadCategoryImage: async (file: File, categorySlug: string): Promise<UploadResult> => {
    try {
      // Validate image
      const validation = validateImage(file);
      if (!validation.valid) {
        return { path: '', url: '', error: validation.error };
      }

      // Generate path
      const extension = file.name.split('.').pop() || 'jpg';
      const path = `${categorySlug}.${extension}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(StorageBucket.CATEGORIES)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true // Overwrite if exists
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(StorageBucket.CATEGORIES)
        .getPublicUrl(path);

      return {
        path: data.path,
        url: urlData.publicUrl,
        error: null
      };
    } catch (error) {
      console.error('Error uploading category image:', error);
      return {
        path: '',
        url: '',
        error: error instanceof Error ? error.message : 'Failed to upload image'
      };
    }
  },

  /**
   * Upload a general image to Supabase storage
   * @param file Image file to upload
   * @param folder Folder to store in (optional)
   * @returns Upload result
   */
  uploadGeneralImage: async (file: File, folder?: string): Promise<UploadResult> => {
    try {
      // Validate image
      const validation = validateImage(file);
      if (!validation.valid) {
        return { path: '', url: '', error: validation.error };
      }

      // Generate path
      const filename = generateUniqueFilename(file.name);
      const path = folder
        ? `${folder}/${filename}`
        : filename;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(StorageBucket.GENERAL)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(StorageBucket.GENERAL)
        .getPublicUrl(path);

      return {
        path: data.path,
        url: urlData.publicUrl,
        error: null
      };
    } catch (error) {
      console.error('Error uploading general image:', error);
      return {
        path: '',
        url: '',
        error: error instanceof Error ? error.message : 'Failed to upload image'
      };
    }
  },

  /**
   * Delete an image from Supabase storage
   * @param bucket Storage bucket
   * @param path Image path
   * @returns Success or error message
   */
  deleteImage: async (bucket: StorageBucket, path: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete image'
      };
    }
  },

  /**
   * Get a signed URL for a private image
   * @param bucket Storage bucket
   * @param path Image path
   * @param expiresIn Expiry time in seconds (default: 60 minutes)
   * @returns Signed URL or error
   */
  getSignedUrl: async (
    bucket: StorageBucket,
    path: string,
    expiresIn: number = 3600
  ): Promise<{ url: string; error: string | null }> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw error;
      }

      return { url: data.signedUrl, error: null };
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return {
        url: '',
        error: error instanceof Error ? error.message : 'Failed to generate signed URL'
      };
    }
  },
  
  /**
   * Get all images for a product
   * @param productId Product ID
   * @returns List of image URLs or error
   */
  getProductImages: async (productId: string): Promise<{ urls: string[]; error: string | null }> => {
    try {
      const { data, error } = await supabase.storage
        .from(StorageBucket.PRODUCTS)
        .list(productId);

      if (error) {
        throw error;
      }

      // Get public URLs for all files
      const urls = data.map(file => {
        const { data: urlData } = supabase.storage
          .from(StorageBucket.PRODUCTS)
          .getPublicUrl(`${productId}/${file.name}`);
        return urlData.publicUrl;
      });

      return { urls, error: null };
    } catch (error) {
      console.error('Error getting product images:', error);
      return {
        urls: [],
        error: error instanceof Error ? error.message : 'Failed to get product images'
      };
    }
  }
}; 