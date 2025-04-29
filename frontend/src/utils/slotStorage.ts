import { supabase } from "../services/supabase";
import { toast } from "../utils/toast";
import { DEFAULT_BUCKET } from "../services/fileUpload";
// Note: ServiceResponse import removed as it was only used by the deleted functions

const PRODUCT_IMAGES_BUCKET = "public";

// Helper to get live folder path
const getLiveSlotPath = (slotNumber: number): string =>
  `product-images/slot-${slotNumber}`;

/**
 * Initializes all 25 slot folders in Storage
 * Creates a .folder file in each to maintain the folder structure
 */
export const initializeSlotFolders = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const promises = [];

    // Create 25 slot folders
    for (let i = 1; i <= 25; i++) {
      const folderPath = `${getLiveSlotPath(i)}/.folder`; // Use helper

      // Add empty file to create the folder
      promises.push(
        supabase.storage
          .from(PRODUCT_IMAGES_BUCKET) // Use constant
          .upload(folderPath, new Blob([""], { type: "text/plain" }), {
            upsert: true, // This will overwrite if it exists
          }),
      );
    }

    // Wait for all folder creations to complete
    const results = await Promise.allSettled(promises);
    const successful = results.filter(
      (result) => result.status === "fulfilled",
    ).length;

    // Check if all were successful
    if (successful === 25) {
      return {
        success: true,
        message: "Successfully initialized all 25 slot folders",
      };
    } else {
      return {
        success: false,
        message: `Partially initialized slots: ${successful} of 25 successful`,
      };
    }
  } catch (error) {
    console.error("Error initializing slot folders:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to initialize slot folders",
    };
  }
};

/**
 * Clears all images from a slot's folder (product-images/slot-{slotNumber}/)
 * Retains the folder structure by keeping the .folder file
 */
export const clearSlotImages = async (
  slotNumber: number,
): Promise<{ success: boolean; message: string }> => {
  try {
    // Verify slot number is valid
    if (slotNumber < 1 || slotNumber > 25) {
      return {
        success: false,
        message: "Invalid slot number. Must be between 1 and 25.",
      };
    }

    const livePath = getLiveSlotPath(slotNumber); // Use helper

    // List all files in the slot folder
    const { data: files, error: listError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET) // Use constant
      .list(livePath);

    if (listError) {
      // If folder doesn't exist, treat as success (already cleared)
      if (
        listError.message.includes("Could not find file") ||
        listError.message.includes("Object not found")
      ) {
        console.log(`Slot folder ${livePath} not found, assuming cleared.`);
        // Optionally recreate the folder with .folder
        await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .upload(
            `${livePath}/.folder`,
            new Blob([""], { type: "text/plain" }),
            {
              upsert: true,
            },
          );
        return {
          success: true,
          message: `Slot ${slotNumber} folder was already empty or didn't exist.`,
        };
      }
      throw listError; // Rethrow other errors
    }

    // If no files found, the folder might be empty but exists
    if (!files || files.length === 0) {
      // Ensure .folder exists
      await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(`${livePath}/.folder`, new Blob([""], { type: "text/plain" }), {
          upsert: true,
        });
      return {
        success: true,
        message: `Slot ${slotNumber} folder was already empty.`,
      };
    }

    // Filter out the .folder file to preserve folder structure
    const filesToDelete = files
      .filter((file) => file.name !== ".folder")
      .map((file) => `${livePath}/${file.name}`);

    // If no files to delete (only .folder exists), return success
    if (filesToDelete.length === 0) {
      return {
        success: true,
        message: `Slot ${slotNumber} folder was already empty (only .folder existed).`,
      };
    }

    // Delete files in batches to avoid API limits
    const BATCH_SIZE = 100;
    let deleted = 0;

    for (let i = 0; i < filesToDelete.length; i += BATCH_SIZE) {
      const batch = filesToDelete.slice(i, i + BATCH_SIZE);
      const { error: deleteError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET) // Use constant
        .remove(batch);

      if (deleteError) {
        throw deleteError;
      }

      deleted += batch.length;
    }

    // Ensure .folder exists after clearing
    await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET) // Use constant
      .upload(`${livePath}/.folder`, new Blob([""], { type: "text/plain" }), {
        upsert: true,
      });

    return {
      success: true,
      message: `Successfully cleared ${deleted} images from slot ${slotNumber}`,
    };
  } catch (error) {
    console.error(`Error clearing slot ${slotNumber} images:`, error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : `Failed to clear slot ${slotNumber} images`,
    };
  }
};

/**
 * Generates a standardized path for an image intended for a specific slot's live folder.
 * Note: This seems inconsistent with uploadProductImage which uses seller/admin paths.
 *       Keeping it for now as it might be used elsewhere or intended for direct admin uploads to slots.
 */
export const getSlotImagePath = (
  slotNumber: number,
  file: File,
  productId: string,
): string => {
  // Extract file extension
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

  // Generate a unique filename using timestamp and random string
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);

  // Create path with pattern: product-images/slot-{slotNumber}/{productId}_{timestamp}_{random}.{ext}
  return `${getLiveSlotPath(slotNumber)}/${productId}_${timestamp}_${randomString}.${extension}`;
};

/**
 * Checks if a slot's live storage folder exists (product-images/slot-{slotNumber}/)
 */
export const checkSlotFolderExists = async (
  slotNumber: number,
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET) // Use constant
      .list(getLiveSlotPath(slotNumber)); // Use helper

    // If we can list files (even if empty), the folder exists
    return !error && data !== null;
  } catch (error) {
    console.error(`Error checking if slot ${slotNumber} folder exists:`, error);
    return false;
  }
};

/**
 * Gets all image public URLs from a specific slot's live folder (product-images/slot-{slotNumber}/)
 */
export const getSlotImages = async (slotNumber: number): Promise<string[]> => {
  try {
    const livePath = getLiveSlotPath(slotNumber); // Use helper
    const { data, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET) // Use constant
      .list(livePath);

    if (error) {
      // If folder doesn't exist, return empty array
      if (
        error.message.includes("Could not find file") ||
        error.message.includes("Object not found")
      ) {
        return [];
      }
      throw error; // Rethrow other errors
    }

    // Filter out .folder file and get public URLs for each image
    const images =
      data
        ?.filter((file) => file.name !== ".folder")
        .map((file) => {
          const { data: urlData } = supabase.storage
            .from(PRODUCT_IMAGES_BUCKET) // Use constant
            .getPublicUrl(`${livePath}/${file.name}`);

          return urlData.publicUrl;
        }) || [];

    return images;
  } catch (error) {
    console.error(`Error getting images for slot ${slotNumber}:`, error);
    return [];
  }
};
