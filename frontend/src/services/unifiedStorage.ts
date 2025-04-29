import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/services/supabase";
import { IMAGE_CONSTRAINTS, ImageUploadResult } from "../types/image";
import { getSlotImagePath } from "../utils/slotStorage";

// Define storage buckets
export enum StorageBucket {
  PRODUCTS = "product-images",
  AVATARS = "avatars",
  CATEGORIES = "categories",
  GENERAL = "general",
  SLOTS = "slot-images",
}

// Default bucket
export const DEFAULT_BUCKET = StorageBucket.PRODUCTS;

// Upload options interface
export interface UploadOptions {
  onProgress?: (progress: number) => void;
  slotNumber?: number;
  upsert?: boolean;
  metadata?: Record<string, string>;
  userId?: string;
  productId?: string;
  isAdmin?: boolean;
  folder?: string;
  compress?: boolean;
}

// Result interfaces
export interface UploadResult {
  success: boolean;
  path: string;
  url: string;
  error: string | null;
  metadata?: Record<string, any>;
  slotNumber?: number;
}

export interface DeleteResult {
  success: boolean;
  error: string | null;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * Unified Storage Service
 *
 * This service consolidates all storage operations across the application,
 * providing a consistent API for file uploads, management, and storage organization.
 */
class UnifiedStorageService {
  private storage = getStorage();

  /**
   * Validate a file based on constraints
   */
  validateFile(
    file: File,
    options?: {
      maxSize?: number;
      allowedTypes?: string[];
    },
  ): { valid: boolean; error: string | null } {
    const maxSize = options?.maxSize || IMAGE_CONSTRAINTS.maxSize;
    const allowedTypes =
      options?.allowedTypes || IMAGE_CONSTRAINTS.allowedTypes;

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
      };
    }

    return { valid: true, error: null };
  }

  /**
   * Generate a storage path for different contexts
   */
  generatePath(file: File, options: UploadOptions = {}): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

    // Handle slot-based paths
    if (
      options.slotNumber &&
      options.slotNumber > 0 &&
      options.slotNumber <= 25
    ) {
      const productId = options.productId || "unknown";
      return getSlotImagePath(options.slotNumber, file, productId);
    }

    // Handle admin paths
    if (options.isAdmin && options.userId) {
      return `admin/${options.userId}/${options.productId || "new"}/${randomId}_${timestamp}_${safeFileName}`;
    }

    // Handle seller paths
    if (options.userId) {
      return `sellers/${options.userId}/${options.productId || "new"}/${randomId}_${timestamp}_${safeFileName}`;
    }

    // Handle categorized paths
    if (options.folder) {
      return `${options.folder}/${randomId}_${timestamp}_${safeFileName}`;
    }

    // Default path
    return `${randomId}_${timestamp}_${safeFileName}`;
  }

  /**
   * Upload a file to a specific path in Firebase Storage
   */
  async uploadFile(
    file: File,
    path: string,
    onProgressUpdate?: UploadProgressCallback,
  ): Promise<string> {
    try {
      const fileName = `${uuidv4()}-${file.name}`;
      const storageRef = ref(this.storage, `${path}/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgressUpdate) {
              onProgressUpdate(progress);
            }
          },
          (error) => {
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          },
        );
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  /**
   * Shortcut method to upload an image to a specific slot
   */
  async uploadToSlot(
    file: File,
    slotNumber: number,
    productId: string,
    options: Omit<UploadOptions, "slotNumber" | "productId"> = {},
  ): Promise<UploadResult> {
    if (slotNumber < 1 || slotNumber > 25) {
      return {
        success: false,
        path: "",
        url: "",
        error: "Invalid slot number. Must be between 1 and 25.",
      };
    }

    return this.uploadFile(file, DEFAULT_BUCKET, options.onProgress)
      .then((url) => ({
        success: true,
        path: this.generatePath(file, options),
        url,
        error: null,
        slotNumber: options.slotNumber,
      }))
      .catch((error) => ({
        success: false,
        path: "",
        url: "",
        error: error instanceof Error ? error.message : "Upload failed",
        slotNumber: options.slotNumber,
      }));
  }

  /**
   * Upload an avatar image
   */
  async uploadAvatar(
    file: File,
    userId: string,
    options: Omit<UploadOptions, "userId"> = {},
  ): Promise<UploadResult> {
    // Force specific avatar settings
    const path = `${userId}/avatar`;

    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          path: "",
          url: "",
          error: validation.error,
        };
      }

      // Always upsert avatars to replace existing ones
      const url = await this.uploadFile(file, path, options.onProgress);

      return {
        success: true,
        path: this.generatePath(file, options),
        url,
        error: null,
      };
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return {
        success: false,
        path: "",
        url: "",
        error: error instanceof Error ? error.message : "Avatar upload failed",
      };
    }
  }

  /**
   * Upload a category image
   */
  async uploadCategoryImage(
    file: File,
    categorySlug: string,
    options: Omit<UploadOptions, "folder"> = {},
  ): Promise<UploadResult> {
    // Generate path with extension
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${categorySlug}.${extension}`;

    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          path: "",
          url: "",
          error: validation.error,
        };
      }

      // Upload category image (always upsert to replace existing)
      const url = await this.uploadFile(file, path, options.onProgress);

      return {
        success: true,
        path: this.generatePath(file, options),
        url,
        error: null,
      };
    } catch (error) {
      console.error("Error uploading category image:", error);
      return {
        success: false,
        path: "",
        url: "",
        error:
          error instanceof Error
            ? error.message
            : "Category image upload failed",
      };
    }
  }

  /**
   * Delete a file by its full storage URL
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const fileRef = ref(this.storage, this.getStoragePathFromUrl(fileUrl));
      await deleteObject(fileRef);
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }

  /**
   * List all files in a directory
   */
  async listFiles(path: string): Promise<string[]> {
    try {
      const directoryRef = ref(this.storage, path);
      const fileList = await listAll(directoryRef);

      const urls = await Promise.all(
        fileList.items.map(async (itemRef) => {
          return await getDownloadURL(itemRef);
        }),
      );

      return urls;
    } catch (error) {
      console.error("Error listing files:", error);
      throw error;
    }
  }

  /**
   * Initialize slot folders (slots 1-25)
   */
  async initializeSlotFolders(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log("Initializing slot folders...");

      // Create placeholder files for each slot folder
      for (let i = 1; i <= 25; i++) {
        const folderPath = `slot-${i}/.folder`;

        // Create an empty text file to establish the folder
        const emptyFile = new Blob([""], { type: "text/plain" });

        // Upload placeholder file to create the folder structure
        const { error } = await supabase.storage
          .from(DEFAULT_BUCKET)
          .upload(folderPath, emptyFile, {
            upsert: true,
          });

        if (error) {
          console.error(`Error creating slot-${i} folder:`, error);
        } else {
          console.log(`Created slot-${i} folder`);
        }
      }

      return {
        success: true,
        message: "Slot folders initialized successfully",
      };
    } catch (error) {
      console.error("Failed to initialize slot folders:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown error initializing slot folders",
      };
    }
  }

  /**
   * Clear all images from a specific slot folder
   */
  async clearSlotImages(
    slotNumber: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (slotNumber < 1 || slotNumber > 25) {
        throw new Error("Invalid slot number");
      }

      // List all files in the slot folder
      const { data: files, error: listError } = await supabase.storage
        .from(DEFAULT_BUCKET)
        .list(`slot-${slotNumber}`);

      if (listError) {
        throw listError;
      }

      if (!files || files.length === 0) {
        return { success: true, message: "No files to clear" };
      }

      // Get file paths to delete (exclude .folder placeholder)
      const filesToDelete = files
        .filter((file) => file.name !== ".folder")
        .map((file) => `slot-${slotNumber}/${file.name}`);

      if (filesToDelete.length === 0) {
        return { success: true, message: "No files to clear" };
      }

      // Delete all files in the slot folder
      const { error: deleteError } = await supabase.storage
        .from(DEFAULT_BUCKET)
        .remove(filesToDelete);

      if (deleteError) {
        throw deleteError;
      }

      return {
        success: true,
        message: `Cleared ${filesToDelete.length} files from slot ${slotNumber}`,
      };
    } catch (error) {
      console.error(`Failed to clear slot ${slotNumber} images:`, error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : `Unknown error clearing slot ${slotNumber}`,
      };
    }
  }

  /**
   * Get the public URL for a file
   */
  async getPublicUrl(path: string): Promise<string> {
    try {
      const fileRef = ref(this.storage, path);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error("Error getting public URL:", error);
      throw error;
    }
  }

  /**
   * Extract the storage path from a Firebase Storage download URL
   */
  private getStoragePathFromUrl(url: string): string {
    // Extract the path after the domain and before any query parameters
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);

    if (pathMatch && pathMatch[1]) {
      // Decode the URL-encoded path
      return decodeURIComponent(pathMatch[1]);
    }

    throw new Error("Invalid Firebase Storage URL format");
  }
}

export const unifiedStorage = new UnifiedStorageService();
