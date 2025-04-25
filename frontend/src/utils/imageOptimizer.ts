import { v4 as uuidv4 } from 'uuid';

/**
 * Maximum dimensions for optimized images
 */
export const IMAGE_SIZE_LIMITS = {
  FULL: { width: 1280, height: 1280 },
  THUMBNAIL: { width: 300, height: 300 },
  TINY: { width: 50, height: 50 }
};

/**
 * Image types and their quality settings
 */
export const IMAGE_QUALITY = {
  JPEG: 0.85,
  WEBP: 0.85
};

/**
 * Options for image optimization
 */
export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'original';
  generateThumbnail?: boolean;
  generatePlaceholder?: boolean;
}

/**
 * Result of image optimization
 */
export interface OptimizedImageResult {
  optimizedBlob: Blob;
  thumbnailBlob?: Blob;
  placeholderBlob?: Blob;
  originalName: string;
  optimizedName: string;
  thumbnailName?: string;
  placeholderName?: string;
  width: number;
  height: number;
  format: string;
  sizeReduction: number; // percentage size reduction
}

/**
 * Optimizes an image for upload
 * 
 * @param file The original image file
 * @param options Optimization options
 * @returns Promise with optimization results and blobs
 */
export const optimizeImage = async (
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> => {
  // Default options
  const {
    maxWidth = IMAGE_SIZE_LIMITS.FULL.width,
    maxHeight = IMAGE_SIZE_LIMITS.FULL.height,
    quality = IMAGE_QUALITY.WEBP,
    format = 'webp',
    generateThumbnail = true,
    generatePlaceholder = true
  } = options;

  // Create a unique ID for the file to avoid collisions
  const uniqueId = uuidv4().substring(0, 8);
  const originalName = file.name;
  const extension = format === 'original' 
    ? originalName.split('.').pop()?.toLowerCase() || 'jpg'
    : format;

  // Create a file reader to get the image data
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        // Create an image element to load the file
        const img = new Image();
        img.src = event.target?.result as string;
        
        await new Promise(resolve => { img.onload = resolve; });
        
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        // Create canvas for the full-size image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        
        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Generate the optimized blob
        const optimizedName = `${uniqueId}_optimized.${extension}`;
        let optimizedBlob: Blob;
        
        if (format === 'webp') {
          optimizedBlob = await new Promise<Blob>(resolve => {
            canvas.toBlob(blob => resolve(blob!), 'image/webp', quality);
          });
        } else if (format === 'jpeg') {
          optimizedBlob = await new Promise<Blob>(resolve => {
            canvas.toBlob(blob => resolve(blob!), 'image/jpeg', quality);
          });
        } else if (format === 'png') {
          optimizedBlob = await new Promise<Blob>(resolve => {
            canvas.toBlob(blob => resolve(blob!), 'image/png');
          });
        } else {
          // Use original format
          optimizedBlob = file;
        }
        
        // Calculate size reduction percentage
        const sizeReduction = Math.round(
          ((file.size - optimizedBlob.size) / file.size) * 100
        );
        
        // Generate thumbnail if requested
        let thumbnailBlob: Blob | undefined;
        let thumbnailName: string | undefined;
        
        if (generateThumbnail) {
          const thumbCanvas = document.createElement('canvas');
          const thumbWidth = Math.min(width, IMAGE_SIZE_LIMITS.THUMBNAIL.width);
          const thumbHeight = Math.round(
            (height * thumbWidth) / width
          );
          
          thumbCanvas.width = thumbWidth;
          thumbCanvas.height = thumbHeight;
          
          const thumbCtx = thumbCanvas.getContext('2d');
          if (thumbCtx) {
            thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
            thumbnailName = `${uniqueId}_thumb.${extension}`;
            
            if (format === 'webp') {
              thumbnailBlob = await new Promise<Blob>(resolve => {
                thumbCanvas.toBlob(blob => resolve(blob!), 'image/webp', quality);
              });
            } else if (format === 'jpeg') {
              thumbnailBlob = await new Promise<Blob>(resolve => {
                thumbCanvas.toBlob(blob => resolve(blob!), 'image/jpeg', quality);
              });
            } else {
              thumbnailBlob = await new Promise<Blob>(resolve => {
                thumbCanvas.toBlob(blob => resolve(blob!), 'image/png');
              });
            }
          }
        }
        
        // Generate tiny placeholder if requested (for LQIP - Low Quality Image Placeholder)
        let placeholderBlob: Blob | undefined;
        let placeholderName: string | undefined;
        
        if (generatePlaceholder) {
          const tinyCanvas = document.createElement('canvas');
          tinyCanvas.width = IMAGE_SIZE_LIMITS.TINY.width;
          tinyCanvas.height = IMAGE_SIZE_LIMITS.TINY.height;
          
          const tinyCtx = tinyCanvas.getContext('2d');
          if (tinyCtx) {
            tinyCtx.drawImage(img, 0, 0, IMAGE_SIZE_LIMITS.TINY.width, IMAGE_SIZE_LIMITS.TINY.height);
            placeholderName = `${uniqueId}_placeholder.${extension}`;
            
            // Use lower quality for placeholders
            if (format === 'webp') {
              placeholderBlob = await new Promise<Blob>(resolve => {
                tinyCanvas.toBlob(blob => resolve(blob!), 'image/webp', 0.5);
              });
            } else if (format === 'jpeg') {
              placeholderBlob = await new Promise<Blob>(resolve => {
                tinyCanvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.5);
              });
            } else {
              placeholderBlob = await new Promise<Blob>(resolve => {
                tinyCanvas.toBlob(blob => resolve(blob!), 'image/png');
              });
            }
          }
        }
        
        // Return the optimization results
        resolve({
          optimizedBlob,
          thumbnailBlob,
          placeholderBlob,
          originalName,
          optimizedName,
          thumbnailName,
          placeholderName,
          width,
          height,
          format: extension,
          sizeReduction
        });
      } catch (error) {
        console.error('Image optimization failed:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    // Start reading the file
    reader.readAsDataURL(file);
  });
};

/**
 * Processes multiple images in parallel
 */
export const optimizeMultipleImages = async (
  files: File[],
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult[]> => {
  const optimizationPromises = files.map(file => optimizeImage(file, options));
  return Promise.all(optimizationPromises);
};

export default {
  optimizeImage,
  optimizeMultipleImages,
  IMAGE_SIZE_LIMITS,
  IMAGE_QUALITY
}; 