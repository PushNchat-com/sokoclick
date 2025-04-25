import { FileObject } from '@supabase/storage-js';

// Image file interface for handling uploads
export interface ImageFile {
  file: File | null;
  preview: string | undefined;
  progress: number;
  error: string | null;
  url?: string;
}

// Uploaded image interface
export interface UploadedImage {
  id?: string;
  url: string;
  alt?: string;
  filename?: string;
  size?: number;
  width?: number;
  height?: number;
  created_at?: string;
}

// Image upload response
export interface ImageUploadResponse {
  success: boolean;
  url: string;
  error?: string;
}

export interface ImageUploadResult {
  success: boolean;
  url: string;
  error?: string;
  path?: string;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export type AllowedImageType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/jpg';

export const IMAGE_CONSTRAINTS = {
  maxSize: 2 * 1024 * 1024, // 2MB in bytes (changed from 5MB)
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'] as AllowedImageType[],
  maxImages: 5,
  minImages: 1,
  maxDimensions: {
    width: 2048,
    height: 2048
  }
} as const;

export const validateImage = (file: File): ImageValidationResult => {
  // Check file type
  if (!IMAGE_CONSTRAINTS.allowedTypes.includes(file.type as AllowedImageType)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPG, PNG, and WebP images are allowed.'
    };
  }

  // Check file size
  if (file.size > IMAGE_CONSTRAINTS.maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${IMAGE_CONSTRAINTS.maxSize / (1024 * 1024)}MB.`
    };
  }

  return { valid: true };
}; 