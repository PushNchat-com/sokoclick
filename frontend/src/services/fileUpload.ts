import { supabase } from "@/services/supabase";
import { toast } from "../utils/toast";
import { optimizeImage, ImageOptimizationOptions } from "../utils/imageTools";
import { getSlotImagePath } from "../utils/slotStorage";
import { TIMEOUTS } from "../config/timeouts";

export const DEFAULT_BUCKET = "public";
const MAX_RETRIES = TIMEOUTS.UPLOAD_MAX_RETRIES;
const RETRY_DELAY = TIMEOUTS.UPLOAD_RETRY_DELAY;

export interface ImageUploadResult {
  url: string;
  thumbnailUrl?: string;
  placeholderUrl?: string;
  path: string;
  thumbnailPath?: string;
  placeholderPath?: string;
  name: string;
  size: number;
  format: string;
  width?: number;
  height?: number;
  sizeReduction?: number;
}

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  optimize?: boolean;
  optimizationOptions?: ImageOptimizationOptions;
  slotNumber?: number;
  productId?: string;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Upload with retry logic
 */
const uploadWithRetry = async (
  bucket: string,
  path: string,
  file: Blob,
  options: {
    cacheControl?: string;
    upsert?: boolean;
    onUploadProgress?: (event: { percent: number }) => void;
  } = {},
  retryCount = 0,
  maxRetries = MAX_RETRIES,
  retryDelay = RETRY_DELAY,
) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, options);

    if (error) {
      // If we have retries left
      if (retryCount < maxRetries) {
        console.warn(
          `Upload retry ${retryCount + 1}/${maxRetries} after error: ${error.message}`,
        );
        // Exponential backoff with jitter
        const delay =
          retryDelay * Math.pow(2, retryCount) + Math.random() * 300;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return uploadWithRetry(
          bucket,
          path,
          file,
          options,
          retryCount + 1,
          maxRetries,
          retryDelay,
        );
      }
      throw error;
    }

    return { data, error: null };
  } catch (err) {
    // Also handle network errors
    const error = err as Error;
    if (retryCount < maxRetries) {
      console.warn(
        `Upload retry ${retryCount + 1}/${maxRetries} after exception`,
      );
      const delay = retryDelay * Math.pow(2, retryCount) + Math.random() * 300;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return uploadWithRetry(
        bucket,
        path,
        file,
        options,
        retryCount + 1,
        maxRetries,
        retryDelay,
      );
    }
    return { data: null, error };
  }
};

/**
 * Upload a file to Supabase Storage with optional optimization
 */
export const uploadFile = async (
  file: File,
  bucket: string = DEFAULT_BUCKET,
  path: string,
  options: UploadOptions = {},
): Promise<ImageUploadResult> => {
  const {
    onProgress,
    optimize = true,
    optimizationOptions = {},
    slotNumber,
    productId,
    maxRetries = MAX_RETRIES,
    retryDelay = RETRY_DELAY,
  } = options;

  try {
    // Check if image needs optimization (only image files)
    const isImage = file.type.startsWith("image/");

    if (isImage && optimize) {
      try {
        // Optimize the image before uploading
        const optimizedResult = await optimizeImage(file, optimizationOptions);

        // Upload the optimized image with retry
        const { data: optimizedData, error: optimizedError } =
          await uploadWithRetry(
            bucket,
            `${path}/${optimizedResult.optimizedName}`,
            optimizedResult.optimizedBlob,
            {
              cacheControl: "3600",
              upsert: true,
              onUploadProgress: onProgress
                ? ({ percent }) => onProgress(percent * 0.7)
                : undefined,
            },
            0,
            maxRetries,
            retryDelay,
          );

        if (optimizedError) throw optimizedError;

        // Upload the thumbnail if available
        let thumbnailPath: string | undefined;
        if (optimizedResult.thumbnailBlob && optimizedResult.thumbnailName) {
          const { data: thumbData, error: thumbError } = await uploadWithRetry(
            bucket,
            `${path}/${optimizedResult.thumbnailName}`,
            optimizedResult.thumbnailBlob,
            {
              cacheControl: "3600",
              upsert: true,
              onUploadProgress: onProgress
                ? ({ percent }) => onProgress(70 + percent * 0.15)
                : undefined,
            },
            0,
            maxRetries,
            retryDelay,
          );

          if (!thumbError) {
            thumbnailPath = thumbData?.path;
          }
        }

        // Upload the placeholder if available
        let placeholderPath: string | undefined;
        if (
          optimizedResult.placeholderBlob &&
          optimizedResult.placeholderName
        ) {
          const { data: placeholderData, error: placeholderError } =
            await uploadWithRetry(
              bucket,
              `${path}/${optimizedResult.placeholderName}`,
              optimizedResult.placeholderBlob,
              {
                cacheControl: "3600",
                upsert: true,
                onUploadProgress: onProgress
                  ? ({ percent }) => onProgress(85 + percent * 0.15)
                  : undefined,
              },
              0,
              maxRetries,
              retryDelay,
            );

          if (!placeholderError) {
            placeholderPath = placeholderData?.path;
          }
        }

        // Get public URLs
        const { data: optimizedUrl } = supabase.storage
          .from(bucket)
          .getPublicUrl(`${path}/${optimizedResult.optimizedName}`);

        let thumbnailUrl: string | undefined;
        if (thumbnailPath) {
          const { data: thumbUrl } = supabase.storage
            .from(bucket)
            .getPublicUrl(`${path}/${optimizedResult.thumbnailName}`);
          thumbnailUrl = thumbUrl.publicUrl;
        }

        let placeholderUrl: string | undefined;
        if (placeholderPath) {
          const { data: placeUrl } = supabase.storage
            .from(bucket)
            .getPublicUrl(`${path}/${optimizedResult.placeholderName}`);
          placeholderUrl = placeUrl.publicUrl;
        }

        // Complete the progress if provided
        if (onProgress) onProgress(100);

        // Return optimized image result
        return {
          url: optimizedUrl.publicUrl,
          thumbnailUrl,
          placeholderUrl,
          path: optimizedData?.path || "",
          thumbnailPath,
          placeholderPath,
          name: optimizedResult.optimizedName,
          size: optimizedResult.optimizedBlob.size,
          format: optimizedResult.format,
          width: optimizedResult.width,
          height: optimizedResult.height,
          sizeReduction: optimizedResult.sizeReduction,
        };
      } catch (optimizeError) {
        console.warn(
          "Image optimization failed, falling back to original upload:",
          optimizeError,
        );
        // If optimization fails, fall back to original upload
      }
    }

    // Standard upload (non-image or optimization failed)
    const { data, error } = await uploadWithRetry(
      bucket,
      path,
      file,
      {
        cacheControl: "3600",
        upsert: true,
        onUploadProgress: onProgress
          ? ({ percent }) => onProgress(percent)
          : undefined,
      },
      0,
      maxRetries,
      retryDelay,
    );

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    // Complete the progress if provided
    if (onProgress) onProgress(100);

    return {
      url: urlData.publicUrl,
      path: data?.path || "",
      name: file.name,
      size: file.size,
      format: file.name.split(".").pop()?.toLowerCase() || "unknown",
    };
  } catch (err) {
    const error = err as Error;
    console.error("Error uploading file:", error);
    toast.error(`Failed to upload file: ${error.message || "Unknown error"}`);
    throw error;
  }
};

/**
 * Uploads a file to a specific slot
 */
export const uploadToSlot = async (
  file: File,
  slotNumber: number,
  productId: string,
  options: UploadOptions = {},
): Promise<ImageUploadResult> => {
  try {
    // Generate the path using the slot-based storage utility
    const path = getSlotImagePath(slotNumber, file, productId);

    // Use the standard upload function with the slot path
    return uploadFile(file, DEFAULT_BUCKET, path, {
      ...options,
      slotNumber,
      productId,
    });
  } catch (err) {
    const error = err as Error;
    console.error(`Error uploading to slot ${slotNumber}:`, error);
    toast.error(
      `Failed to upload to slot ${slotNumber}: ${error.message || "Unknown error"}`,
    );
    throw error;
  }
};

/**
 * Delete a file from Supabase Storage
 */
export const deleteFile = async (
  path: string,
  bucket: string = DEFAULT_BUCKET,
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;

    return true;
  } catch (err) {
    const error = err as Error;
    console.error("Error deleting file:", error);
    toast.error(`Failed to delete file: ${error.message || "Unknown error"}`);
    throw error;
  }
};

export const fileUploadService = {
  uploadFile,
  uploadToSlot,
  deleteFile,
  DEFAULT_BUCKET,
};

export default {
  uploadFile,
  uploadToSlot,
  deleteFile,
  DEFAULT_BUCKET,
};
