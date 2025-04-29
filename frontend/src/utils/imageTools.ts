/**
 * Consolidated image utilities into a single imageTools.ts module.
 * Includes image compression, optimization, and utility helpers.
 * Deprecated and removed imageUtils.ts, imageOptimizer.ts, and imageCompression.ts.
 * Date: 2023-10-24
 */

import { v4 as uuidv4 } from "uuid";
import imageCompression from "browser-image-compression";

/*********************
 * CONSTANTS
 *********************/

// Default fallback image path
export const FALLBACK_IMAGE = "/images/fallback-placeholder.svg";

// Image quality settings
export const IMAGE_QUALITY = {
  LOW: 40,
  MEDIUM: 70,
  HIGH: 90,
  WEBP: 0.75,
  JPEG: 0.85,
};

// Default breakpoints for responsive images (in pixels)
export const BREAKPOINTS = {
  MOBILE: 767,
  TABLET: 1023,
  DESKTOP: 1024,
};

// Default image sizes for different viewports
export const DEFAULT_SIZES = [300, 600, 900, 1200];

// Maximum dimensions for optimized images
export const IMAGE_SIZE_LIMITS = {
  FULL: { width: 800, height: 800 },
  THUMBNAIL: { width: 200, height: 200 },
  TINY: { width: 30, height: 30 },
};

/*********************
 * TYPES
 *********************/

// Extend Navigator interface to include connection property
interface NavigatorWithConnection extends Navigator {
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
    [key: string]: any;
  };
}

// Compression options
export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker?: boolean;
  preserveExif?: boolean;
}

// Options for image optimization
export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png" | "original";
  generateThumbnail?: boolean;
  generatePlaceholder?: boolean;
}

// Result of image optimization
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

/*********************
 * IMAGE COMPRESSION (from imageCompression.ts)
 *********************/

/**
 * Compresses an image file using browser-image-compression
 * @param file The image file to compress
 * @param options Compression options
 * @returns Promise<File> A compressed image file
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions,
): Promise<File> => {
  const defaultOptions = {
    useWebWorker: true,
    preserveExif: true,
  };

  try {
    return await imageCompression(file, {
      ...defaultOptions,
      ...options,
    });
  } catch (error) {
    console.error("Error compressing image:", error);
    throw error;
  }
};

/*********************
 * IMAGE OPTIMIZATION (from imageOptimizer.ts)
 *********************/

/**
 * Optimizes an image for upload
 *
 * @param file The original image file
 * @param options Optimization options
 * @returns Promise with optimization results and blobs
 */
export const optimizeImage = async (
  file: File,
  options: ImageOptimizationOptions = {},
): Promise<OptimizedImageResult> => {
  // Default options
  const {
    maxWidth = IMAGE_SIZE_LIMITS.FULL.width,
    maxHeight = IMAGE_SIZE_LIMITS.FULL.height,
    quality = IMAGE_QUALITY.WEBP,
    format = "webp",
    generateThumbnail = true,
    generatePlaceholder = true,
  } = options;

  // Create a unique ID for the file to avoid collisions
  const uniqueId = uuidv4().substring(0, 8);
  const originalName = file.name;
  const extension =
    format === "original"
      ? originalName.split(".").pop()?.toLowerCase() || "jpg"
      : format;

  // Create a file reader to get the image data
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        // Create an image element to load the file
        const img = new Image();
        img.src = event.target?.result as string;

        await new Promise((resolve) => {
          img.onload = resolve;
        });

        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // Create canvas for the full-size image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Could not get canvas context");
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Generate the optimized blob
        const optimizedName = `${uniqueId}_optimized.${extension}`;
        let optimizedBlob: Blob;

        if (format === "webp") {
          optimizedBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), "image/webp", quality);
          });
        } else if (format === "jpeg") {
          optimizedBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), "image/jpeg", quality);
          });
        } else if (format === "png") {
          optimizedBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), "image/png");
          });
        } else {
          // Use original format
          optimizedBlob = file;
        }

        // Calculate size reduction percentage
        const sizeReduction = Math.round(
          ((file.size - optimizedBlob.size) / file.size) * 100,
        );

        // Generate thumbnail if requested
        let thumbnailBlob: Blob | undefined;
        let thumbnailName: string | undefined;

        if (generateThumbnail) {
          const thumbCanvas = document.createElement("canvas");
          const thumbWidth = Math.min(width, IMAGE_SIZE_LIMITS.THUMBNAIL.width);
          const thumbHeight = Math.round((height * thumbWidth) / width);

          thumbCanvas.width = thumbWidth;
          thumbCanvas.height = thumbHeight;

          const thumbCtx = thumbCanvas.getContext("2d");
          if (thumbCtx) {
            thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
            thumbnailName = `${uniqueId}_thumb.${extension}`;

            if (format === "webp") {
              thumbnailBlob = await new Promise<Blob>((resolve) => {
                thumbCanvas.toBlob(
                  (blob) => resolve(blob!),
                  "image/webp",
                  quality,
                );
              });
            } else if (format === "jpeg") {
              thumbnailBlob = await new Promise<Blob>((resolve) => {
                thumbCanvas.toBlob(
                  (blob) => resolve(blob!),
                  "image/jpeg",
                  quality,
                );
              });
            } else {
              thumbnailBlob = await new Promise<Blob>((resolve) => {
                thumbCanvas.toBlob((blob) => resolve(blob!), "image/png");
              });
            }
          }
        }

        // Generate tiny placeholder if requested (for LQIP - Low Quality Image Placeholder)
        let placeholderBlob: Blob | undefined;
        let placeholderName: string | undefined;

        if (generatePlaceholder) {
          const tinyCanvas = document.createElement("canvas");
          tinyCanvas.width = IMAGE_SIZE_LIMITS.TINY.width;
          tinyCanvas.height = IMAGE_SIZE_LIMITS.TINY.height;

          const tinyCtx = tinyCanvas.getContext("2d");
          if (tinyCtx) {
            tinyCtx.drawImage(
              img,
              0,
              0,
              IMAGE_SIZE_LIMITS.TINY.width,
              IMAGE_SIZE_LIMITS.TINY.height,
            );
            placeholderName = `${uniqueId}_placeholder.${extension}`;

            // Use lower quality for placeholders
            if (format === "webp") {
              placeholderBlob = await new Promise<Blob>((resolve) => {
                tinyCanvas.toBlob((blob) => resolve(blob!), "image/webp", 0.5);
              });
            } else if (format === "jpeg") {
              placeholderBlob = await new Promise<Blob>((resolve) => {
                tinyCanvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.5);
              });
            } else {
              placeholderBlob = await new Promise<Blob>((resolve) => {
                tinyCanvas.toBlob((blob) => resolve(blob!), "image/png");
              });
            }
          }
        }

        // Return the results
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
          format,
          sizeReduction,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Optimizes multiple images in parallel
 * @param files Array of files to optimize
 * @param options Optimization options
 * @returns Promise with array of optimization results
 */
export const optimizeMultipleImages = async (
  files: File[],
  options: ImageOptimizationOptions = {},
): Promise<OptimizedImageResult[]> => {
  const optimizationPromises = files.map((file) =>
    optimizeImage(file, options),
  );
  return Promise.all(optimizationPromises);
};

/*********************
 * IMAGE UTILITIES (from imageUtils.ts)
 *********************/

/**
 * Generates a WebP version URL from original image URL
 * @param url Original image URL
 * @returns WebP version URL
 */
export const getWebpUrl = (url: string): string => {
  if (!url) return FALLBACK_IMAGE;
  const lastDotIndex = url.lastIndexOf(".");
  if (lastDotIndex === -1) return `${url}.webp`;
  return `${url.substring(0, lastDotIndex)}.webp`;
};

/**
 * Checks if browser supports WebP format
 * @returns Promise resolving to boolean indicating WebP support
 */
export const supportsWebP = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  if ("createImageBitmap" in window && "avif" in window.Image.prototype) {
    return true; // Modern browser with WebP support
  }

  // Test for WebP support using a small WebP image
  return new Promise((resolve) => {
    const webpImg = new Image();
    webpImg.onload = () => resolve(true);
    webpImg.onerror = () => resolve(false);
    webpImg.src =
      "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vv9UAA=";
  });
};

/**
 * Creates responsive image srcset for different viewport sizes
 * @param url Base image URL
 * @param sizes Array of sizes to generate (e.g. [300, 600, 900, 1200])
 * @returns Formatted srcset string
 */
export const generateSrcSet = (
  url: string,
  sizes: number[] = DEFAULT_SIZES,
): string => {
  if (!url) return "";
  const lastDotIndex = url.lastIndexOf(".");
  if (lastDotIndex === -1) return url;

  const baseUrl = url.substring(0, lastDotIndex);
  const extension = url.substring(lastDotIndex);

  return sizes
    .map((size) => `${baseUrl}-${size}w${extension} ${size}w`)
    .join(", ");
};

/**
 * Generates a blurred placeholder base64 string for LQIP (Low Quality Image Placeholder)
 * Note: In a real implementation, this would be pre-computed on the server
 * @param url Image URL
 * @returns Placeholder data URL (simplified version - would normally be generated server-side)
 */
export const getPlaceholderImage = (url: string): string => {
  // In a real implementation, this would return a pre-computed base64 tiny placeholder
  // For this implementation, we'll just return a color based on the URL string
  const hash = url.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6' width='10' height='6'%3E%3Crect width='10' height='6' fill='hsl(${hue}, 40%%, 80%%)'/%3E%3C/svg%3E`;
};

/**
 * Calculates the required sizes attribute for responsive images
 * @param viewportBreakpoints Mapping of viewport breakpoints to image width percentage
 * @returns Formatted sizes attribute string
 */
export const calculateSizes = (
  viewportBreakpoints: Record<string, number> = {
    "(max-width: 767px)": 100,
    "(max-width: 1023px)": 50,
    "(min-width: 1024px)": 33,
  },
): string => {
  return Object.entries(viewportBreakpoints)
    .map(([breakpoint, widthPercent]) => `${breakpoint} ${widthPercent}vw`)
    .join(", ");
};

/**
 * Handles image loading error by replacing with a fallback image
 * @param event Error event from img element
 * @param fallbackSrc Optional custom fallback image source
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackSrc: string = FALLBACK_IMAGE,
): void => {
  const target = event.currentTarget;

  // Prevent infinite error loops by checking if already using fallback
  if (target.src === fallbackSrc) {
    target.style.visibility = "hidden"; // Hide the image if even fallback fails
    return;
  }

  // Set fallback image
  target.src = fallbackSrc;

  // Remove srcset to prevent further attempts with responsive images
  target.removeAttribute("srcset");
  target.removeAttribute("sizes");

  // Add error class for styling
  target.classList.add("image-load-error");

  // Log error for monitoring (in production would send to analytics)
  console.warn(`Image load error: ${target.src}`);
};

/**
 * Creates an observer to lazy load images
 * @param loadingClass CSS class to add during loading
 * @param loadedClass CSS class to add when loaded
 * @returns IntersectionObserver instance
 */
export const createLazyImageObserver = (
  loadingClass = "image-loading",
  loadedClass = "image-loaded",
): IntersectionObserver | null => {
  // Only create observer if IntersectionObserver is available
  if (typeof IntersectionObserver === "undefined") return null;

  return new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const img = entry.target as HTMLImageElement;

        // Add loading class
        img.classList.add(loadingClass);

        // If data-src exists, move it to src to trigger loading
        if (img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }

        // Same for srcset
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
          delete img.dataset.srcset;
        }

        // When image is loaded, add loaded class and remove loading class
        img.onload = () => {
          img.classList.remove(loadingClass);
          img.classList.add(loadedClass);
        };

        // Handle load errors
        img.onerror = () => {
          // Create a synthetic event with the img element as currentTarget
          handleImageError({
            currentTarget: img,
          } as React.SyntheticEvent<HTMLImageElement>);
        };

        // Stop observing this image
        observer.unobserve(img);
      });
    },
    {
      rootMargin: "200px 0px", // Start loading images 200px before they enter viewport
      threshold: 0.01,
    },
  );
};

/**
 * Optimizes image dimensions based on device pixel ratio
 * @param width Original width
 * @param height Original height
 * @param maxWidth Maximum allowed width
 * @returns Object with optimized width and height
 */
export const getOptimizedDimensions = (
  width: number,
  height: number,
  maxWidth: number = window.innerWidth,
): { width: number; height: number } => {
  // Get device pixel ratio
  const dpr = window.devicePixelRatio || 1;

  // Calculate max width based on device and container
  const deviceAwareMaxWidth = maxWidth * dpr;

  // If image is already smaller than max width, keep dimensions
  if (width <= deviceAwareMaxWidth) {
    return { width, height };
  }

  // Calculate aspect ratio
  const aspectRatio = width / height;

  // Calculate new dimensions
  const newWidth = deviceAwareMaxWidth;
  const newHeight = newWidth / aspectRatio;

  return {
    width: Math.round(newWidth / dpr),
    height: Math.round(newHeight / dpr),
  };
};

/**
 * Preloads critical images to improve perceived performance
 * @param urls Array of image URLs to preload
 */
export const preloadCriticalImages = (urls: string[]): void => {
  if (typeof window === "undefined") return;

  urls.forEach((url) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = url;
    document.head.appendChild(link);
  });
};

/**
 * Determines if image optimization should be performed
 * based on connection type and user preferences
 * @returns Boolean indicating if optimization should be applied
 */
export const shouldOptimizeImages = (): boolean => {
  // Cast navigator to include connection property
  const nav = navigator as NavigatorWithConnection;

  // Check if data saver is enabled in browser
  if (nav.connection && "saveData" in nav.connection) {
    return nav.connection.saveData === true;
  }

  // Check connection type if available
  if (nav.connection && "effectiveType" in nav.connection) {
    const connectionType = nav.connection.effectiveType;
    // Optimize for slow connections
    return ["slow-2g", "2g", "3g"].includes(connectionType || "");
  }

  // Default to optimize
  return true;
};

/**
 * Determines appropriate image quality based on device and connection
 * @returns Quality value between 0-100
 */
export const getAppropriateImageQuality = (): number => {
  // Cast navigator to include connection property
  const nav = navigator as NavigatorWithConnection;

  // Data saver on = lower quality
  if (nav.connection && "saveData" in nav.connection) {
    if (nav.connection.saveData === true) {
      return IMAGE_QUALITY.LOW;
    }
  }

  // Check connection type if available
  if (nav.connection && "effectiveType" in nav.connection) {
    const connectionType = nav.connection.effectiveType;

    switch (connectionType) {
      case "slow-2g":
      case "2g":
        return IMAGE_QUALITY.LOW;
      case "3g":
        return IMAGE_QUALITY.MEDIUM;
      case "4g":
      default:
        return IMAGE_QUALITY.HIGH;
    }
  }

  // Default to medium
  return IMAGE_QUALITY.MEDIUM;
};
