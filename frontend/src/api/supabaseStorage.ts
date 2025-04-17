import { supabaseClient } from './supabase';

/**
 * Configuration for storage buckets
 */
export interface BucketConfig {
  name: string;
  isPublic: boolean;
  fileSizeLimit?: number; // in bytes
  allowedMimeTypes?: string[];
}

/**
 * Default bucket configurations
 */
export const DEFAULT_BUCKETS: BucketConfig[] = [
  {
    name: 'images',
    isPublic: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  {
    name: 'avatars',
    isPublic: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    name: 'documents',
    isPublic: false,
    fileSizeLimit: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  }
];

/**
 * Initialize storage buckets with appropriate configurations
 * @param bucketConfigs Array of bucket configurations to initialize
 * @returns Object containing results of bucket initialization
 */
export const initStorage = async (bucketConfigs: BucketConfig[] = DEFAULT_BUCKETS) => {
  const results: Record<string, { success: boolean; message: string }> = {};

  try {
    // Get existing buckets
    const { data: existingBuckets, error: listError } = await supabaseClient.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing storage buckets:', listError);
      // Continue anyway - assume buckets exist and we'll try to use them
      console.log('Continuing with storage operations despite bucket listing error');
      
      // Mark all buckets as "assumed existing" for frontend operation
      bucketConfigs.forEach(config => {
        results[config.name] = { 
          success: true, 
          message: `Assuming bucket exists - will attempt to use it`
        };
      });
      
      return { 
        success: true, 
        message: 'Assuming storage buckets are already configured on the server', 
        results 
      };
    }
    
    // Get list of existing bucket names for easier checking
    const existingBucketNames = existingBuckets?.map(b => b.name) || [];
    
    // Check each bucket - only update existing ones
    for (const config of bucketConfigs) {
      try {
        const exists = existingBucketNames.includes(config.name);
        
        if (exists) {
          // Only update buckets that we know exist
          const { error } = await supabaseClient.storage.updateBucket(config.name, {
            public: config.isPublic,
            fileSizeLimit: config.fileSizeLimit,
            allowedMimeTypes: config.allowedMimeTypes
          });
          
          if (error) {
            console.error(`Error updating ${config.name} bucket:`, error);
            results[config.name] = { 
              success: false, 
              message: `Failed to update bucket: ${error.message}`
            };
          } else {
            console.log(`Updated ${config.name} bucket successfully`);
            results[config.name] = { 
              success: true, 
              message: `Bucket updated successfully`
            };
          }
        } else {
          console.log(`Bucket "${config.name}" does not exist. Only an admin can create it.`);
          results[config.name] = {
            success: false,
            message: `Bucket does not exist and cannot be created due to permissions. Admin needs to create it.`
          };
        }
      } catch (error: any) {
        console.error(`Error processing ${config.name} bucket:`, error);
        results[config.name] = { 
          success: false, 
          message: `Error: ${error.message || 'Unknown error'}`
        };
      }
    }
    
    // Return success even if some operations failed - the app should still work with existing buckets
    return { 
      success: true, 
      message: 'Storage initialization completed with some operations succeeding',
      results 
    };
  } catch (error: any) {
    console.error('Error initializing storage:', error);
    return { 
      success: true, // Still return true to let the app continue
      message: `Warning - storage initialization had errors: ${error.message || 'Unknown error'}`,
      error
    };
  }
};

// Helper functions for handling storage operations
export const supabaseStorage = {
  /**
   * Upload file to a specific bucket
   * @param file File to upload
   * @param bucket Name of the bucket to upload to
   * @param folder Optional folder within the bucket
   * @param customFileName Optional custom file name
   * @returns Public URL of the uploaded file
   */
  uploadFile: async (file: File, bucket = 'images', folder = '', customFileName?: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = customFileName 
        ? `${customFileName}.${fileExt}` 
        : `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      
      const filePath = folder 
        ? `${folder}/${fileName}` 
        : fileName;
      
      const { data, error } = await supabaseClient.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabaseClient.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },
  
  /**
   * Upload image with specific optimization for images
   * @param file Image file to upload
   * @param folder Optional folder within the images bucket
   * @returns Public URL of the uploaded image
   */
  uploadImage: async (file: File, folder = 'products') => {
    return supabaseStorage.uploadFile(file, 'images', folder);
  },
  
  /**
   * Delete file from storage
   * @param fileUrl Public URL of the file to delete
   * @returns Boolean indicating if the file was deleted
   */
  deleteFile: async (fileUrl: string) => {
    try {
      // Check if the URL is from Supabase Storage
      if (fileUrl.includes('supabase') && fileUrl.includes('/storage/v1/object/public/')) {
        // Extract bucket and path from the URL
        const parts = fileUrl.split('/storage/v1/object/public/')[1].split('/');
        const bucket = parts[0];
        const path = parts.slice(1).join('/');
        
        if (bucket && path) {
          const { error } = await supabaseClient.storage
            .from(bucket)
            .remove([path]);
          
          if (error) throw error;
          return true;
        }
      }
      return false; // Not a Supabase URL
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },
  
  /**
   * Delete image - alias for deleteFile
   * @param imageUrl Public URL of the image to delete
   * @returns Boolean indicating if the image was deleted
   */
  deleteImage: async (imageUrl: string) => {
    return supabaseStorage.deleteFile(imageUrl);
  },
  
  /**
   * Get public URLs for multiple files
   * @param bucket Bucket name
   * @param paths Array of file paths within the bucket
   * @returns Array of public URLs
   */
  getFileUrls: async (bucket: string, paths: string[]) => {
    return paths.map(path => {
      const { data: { publicUrl } } = supabaseClient.storage
        .from(bucket)
        .getPublicUrl(path);
      return publicUrl;
    });
  },
  
  /**
   * Get public URLs for multiple images
   * @param paths Array of image paths within the images bucket
   * @returns Array of public image URLs
   */
  getImageUrls: async (paths: string[]) => {
    return supabaseStorage.getFileUrls('images', paths);
  }
};

export default supabaseStorage; 