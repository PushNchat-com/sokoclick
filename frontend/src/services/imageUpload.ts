import { supabase } from "@/services/supabase";
import {
  ImageFile,
  ImageValidationResult,
  IMAGE_CONSTRAINTS,
} from "../types/image";
import imageCompression from "browser-image-compression";

export interface UploadProgress {
  loaded: number;
  total: number;
}

export interface UploadResult {
  success: boolean;
  url: string;
  error?: string;
  path?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class ImageUploadService {
  private async validateAndOptimizeImage(
    file: File,
  ): Promise<{ file: File; error?: string }> {
    // Validate image
    const validation = this.validateImage(file);
    if (!validation.valid) {
      return { file, error: validation.error };
    }

    try {
      // Optimize image if needed
      if (file.size > IMAGE_CONSTRAINTS.maxSize / 2) {
        // Only optimize if larger than 2.5MB
        const options = {
          maxSizeMB: IMAGE_CONSTRAINTS.maxSize / (1024 * 1024),
          maxWidthOrHeight: Math.max(
            IMAGE_CONSTRAINTS.maxDimensions.width,
            IMAGE_CONSTRAINTS.maxDimensions.height,
          ),
          useWebWorker: true,
        };

        const compressedFile = await imageCompression(file, options);
        return { file: compressedFile };
      }

      return { file };
    } catch (error) {
      console.error("Error optimizing image:", error);
      return { file, error: "Failed to optimize image" };
    }
  }

  private validateImage(file: File): ImageValidationResult {
    // Check file type
    if (!IMAGE_CONSTRAINTS.allowedTypes.includes(file.type as any)) {
      return {
        valid: false,
        error: "Invalid file type. Only JPG, PNG, and WebP images are allowed.",
      };
    }

    // Check file size
    if (file.size > IMAGE_CONSTRAINTS.maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${IMAGE_CONSTRAINTS.maxSize / (1024 * 1024)}MB.`,
      };
    }

    return { valid: true };
  }

  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const ext = originalName.split(".").pop();
    return `${timestamp}-${random}.${ext}`;
  }

  private async uploadWithRetry(
    file: File,
    path: string,
    attempt: number = 1,
  ): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error && attempt < MAX_RETRIES) {
        console.log(`Upload attempt ${attempt} failed, retrying...`);
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * attempt),
        );
        return this.uploadWithRetry(file, path, attempt + 1);
      }

      return { data, error };
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.log(`Upload attempt ${attempt} failed, retrying...`);
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * attempt),
        );
        return this.uploadWithRetry(file, path, attempt + 1);
      }
      return { data: null, error };
    }
  }

  async uploadImage(
    file: File,
    productId: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadResult> {
    try {
      // Validate and optimize image
      const { file: optimizedFile, error: optimizationError } =
        await this.validateAndOptimizeImage(file);
      if (optimizationError) {
        return { success: false, url: "", error: optimizationError };
      }

      // Generate unique filename
      const filename = this.generateUniqueFilename(file.name);
      const filePath = `products/${productId}/${filename}`;

      // Upload to Supabase storage with retry
      const { data, error } = await this.uploadWithRetry(
        optimizedFile,
        filePath,
      );

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath,
      };
    } catch (error) {
      console.error("Error uploading image:", error);
      return {
        success: false,
        url: "",
        error:
          error instanceof Error ? error.message : "Failed to upload image",
      };
    }
  }

  async uploadMultipleImages(
    files: File[],
    productId: string,
    onProgress?: (index: number, progress: UploadProgress) => void,
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const failedUploads: { file: File; error: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadImage(files[i], productId, (progress) =>
        onProgress?.(i, progress),
      );

      results.push(result);

      if (!result.success) {
        failedUploads.push({
          file: files[i],
          error: result.error || "Unknown error",
        });
      }
    }

    // If there are failed uploads, try to retry them once
    if (failedUploads.length > 0) {
      console.log(`Retrying ${failedUploads.length} failed uploads...`);
      for (const { file } of failedUploads) {
        const retryResult = await this.uploadImage(file, productId);
        if (retryResult.success) {
          const index = results.findIndex((r) => !r.success);
          if (index !== -1) {
            results[index] = retryResult;
          }
        }
      }
    }

    return results;
  }

  async deleteImage(url: string): Promise<boolean> {
    try {
      const path = url.split("/").pop();
      if (!path) return false;

      const { error } = await supabase.storage
        .from("product-images")
        .remove([path]);

      return !error;
    } catch (error) {
      console.error("Error deleting image:", error);
      return false;
    }
  }

  async cleanup(productId: string, urls: string[]): Promise<void> {
    try {
      const paths = urls
        .map((url) => url.split("/").pop())
        .filter((path): path is string => path !== undefined);

      if (paths.length === 0) return;

      await supabase.storage.from("product-images").remove(paths);
    } catch (error) {
      console.error("Error cleaning up images:", error);
    }
  }

  createObjectURL(file: File): string {
    return URL.createObjectURL(file);
  }

  revokeObjectURL(url: string): void {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }
}

export const imageUploadService = new ImageUploadService();
