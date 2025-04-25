import { supabase } from '../services/supabase';
import { toast } from '../utils/toast';
import { DEFAULT_BUCKET } from '../services/fileUpload';

/**
 * Initializes all 25 slot folders in Storage
 * Creates a .folder file in each to maintain the folder structure
 */
export const initializeSlotFolders = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const promises = [];
    
    // Create 25 slot folders
    for (let i = 1; i <= 25; i++) {
      const folderPath = `product-images/slot-${i}/.folder`;
      
      // Add empty file to create the folder
      promises.push(
        supabase.storage
          .from('public')
          .upload(folderPath, new Blob([''], { type: 'text/plain' }), {
            upsert: true, // This will overwrite if it exists
          })
      );
    }
    
    // Wait for all folder creations to complete
    const results = await Promise.allSettled(promises);
    const successful = results.filter(result => result.status === 'fulfilled').length;
    
    // Check if all were successful
    if (successful === 25) {
      return { 
        success: true, 
        message: 'Successfully initialized all 25 slot folders' 
      };
    } else {
      return { 
        success: false, 
        message: `Partially initialized slots: ${successful} of 25 successful` 
      };
    }
  } catch (error) {
    console.error('Error initializing slot folders:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to initialize slot folders'
    };
  }
};

/**
 * Clears all images from a slot's folder
 * Retains the folder structure by keeping the .folder file
 */
export const clearSlotImages = async (slotNumber: number): Promise<{ success: boolean; message: string }> => {
  try {
    // Verify slot number is valid
    if (slotNumber < 1 || slotNumber > 25) {
      return {
        success: false,
        message: 'Invalid slot number. Must be between 1 and 25.'
      };
    }
    
    // List all files in the slot folder
    const { data: files, error: listError } = await supabase.storage
      .from('public')
      .list(`product-images/slot-${slotNumber}`);
    
    if (listError) {
      throw listError;
    }
    
    // If no files found, the folder might not exist
    if (!files || files.length === 0) {
      // Create the folder if it doesn't exist
      await supabase.storage
        .from('public')
        .upload(`product-images/slot-${slotNumber}/.folder`, new Blob([''], { type: 'text/plain' }), {
          upsert: true,
        });
      
      return {
        success: true,
        message: `Slot ${slotNumber} folder was empty or didn't exist. Created empty folder.`
      };
    }
    
    // Filter out the .folder file to preserve folder structure
    const filesToDelete = files
      .filter(file => file.name !== '.folder')
      .map(file => `product-images/slot-${slotNumber}/${file.name}`);
    
    // If no files to delete (only .folder exists), return success
    if (filesToDelete.length === 0) {
      return {
        success: true,
        message: `Slot ${slotNumber} folder was already empty.`
      };
    }
    
    // Delete files in batches to avoid API limits
    const BATCH_SIZE = 100;
    let deleted = 0;
    
    for (let i = 0; i < filesToDelete.length; i += BATCH_SIZE) {
      const batch = filesToDelete.slice(i, i + BATCH_SIZE);
      const { error: deleteError } = await supabase.storage
        .from('public')
        .remove(batch);
      
      if (deleteError) {
        throw deleteError;
      }
      
      deleted += batch.length;
    }
    
    // Ensure .folder exists after clearing
    await supabase.storage
      .from('public')
      .upload(`product-images/slot-${slotNumber}/.folder`, new Blob([''], { type: 'text/plain' }), {
        upsert: true,
      });
    
    return {
      success: true,
      message: `Successfully cleared ${deleted} images from slot ${slotNumber}`
    };
  } catch (error) {
    console.error(`Error clearing slot ${slotNumber} images:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : `Failed to clear slot ${slotNumber} images`
    };
  }
};

/**
 * Generates a standardized path for a slot image
 */
export const getSlotImagePath = (slotNumber: number, file: File, productId: string): string => {
  // Extract file extension
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  
  // Generate a unique filename using timestamp and random string
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  // Create path with pattern: slot-{slotNumber}/{productId}_{timestamp}_{random}.{ext}
  return `product-images/slot-${slotNumber}/${productId}_${timestamp}_${randomString}.${extension}`;
};

/**
 * Checks if a slot's storage folder exists
 */
export const checkSlotFolderExists = async (slotNumber: number): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage
      .from('public')
      .list(`product-images/slot-${slotNumber}`);
    
    // If we can list files (even if empty), the folder exists
    return !error && data !== null;
  } catch (error) {
    console.error(`Error checking if slot ${slotNumber} folder exists:`, error);
    return false;
  }
};

/**
 * Gets all images for a specific slot
 */
export const getSlotImages = async (slotNumber: number): Promise<string[]> => {
  try {
    const { data, error } = await supabase.storage
      .from('public')
      .list(`product-images/slot-${slotNumber}`);
    
    if (error) {
      throw error;
    }
    
    // Filter out .folder file and get public URLs for each image
    const images = data
      ?.filter(file => file.name !== '.folder')
      .map(file => {
        const { data: url } = supabase.storage
          .from('public')
          .getPublicUrl(`product-images/slot-${slotNumber}/${file.name}`);
        
        return url.publicUrl;
      }) || [];
    
    return images;
  } catch (error) {
    console.error(`Error getting images for slot ${slotNumber}:`, error);
    return [];
  }
}; 