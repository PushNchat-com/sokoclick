/**
 * Image utility functions for SokoClick
 * Handles image optimization, responsive sizing, WebP conversion and fallbacks
 */

// Default fallback image path
export const FALLBACK_IMAGE = '/images/fallback-placeholder.svg';

// Image quality settings
export const IMAGE_QUALITY = {
  LOW: 40,
  MEDIUM: 70,
  HIGH: 90
};

// Default breakpoints for responsive images (in pixels)
export const BREAKPOINTS = {
  MOBILE: 767,
  TABLET: 1023,
  DESKTOP: 1024
};

// Default image sizes for different viewports
export const DEFAULT_SIZES = [300, 600, 900, 1200];

/**
 * Generates a WebP version URL from original image URL
 * @param url Original image URL
 * @returns WebP version URL
 */
export const getWebpUrl = (url: string): string => {
  if (!url) return FALLBACK_IMAGE;
  const lastDotIndex = url.lastIndexOf('.');
  if (lastDotIndex === -1) return `${url}.webp`;
  return `${url.substring(0, lastDotIndex)}.webp`;
};

/**
 * Checks if browser supports WebP format
 * @returns Promise resolving to boolean indicating WebP support
 */
export const supportsWebP = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  if ('createImageBitmap' in window && 'avif' in window.Image.prototype) {
    return true; // Modern browser with WebP support
  }
  
  // Test for WebP support using a small WebP image
  return new Promise(resolve => {
    const webpImg = new Image();
    webpImg.onload = () => resolve(true);
    webpImg.onerror = () => resolve(false);
    webpImg.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vv9UAA=';
  });
};

/**
 * Creates responsive image srcset for different viewport sizes
 * @param url Base image URL
 * @param sizes Array of sizes to generate (e.g. [300, 600, 900, 1200])
 * @returns Formatted srcset string
 */
export const generateSrcSet = (url: string, sizes: number[] = DEFAULT_SIZES): string => {
  if (!url) return '';
  const lastDotIndex = url.lastIndexOf('.');
  if (lastDotIndex === -1) return url;
  
  const baseUrl = url.substring(0, lastDotIndex);
  const extension = url.substring(lastDotIndex);
  
  return sizes
    .map(size => `${baseUrl}-${size}w${extension} ${size}w`)
    .join(', ');
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
  const hash = url.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
    '(max-width: 767px)': 100,
    '(max-width: 1023px)': 50,
    '(min-width: 1024px)': 33
  }
): string => {
  return Object.entries(viewportBreakpoints)
    .map(([breakpoint, widthPercent]) => `${breakpoint} ${widthPercent}vw`)
    .join(', ');
};

/**
 * Handles image loading error by replacing with a fallback image
 * @param event Error event from img element
 * @param fallbackSrc Optional custom fallback image source
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackSrc: string = FALLBACK_IMAGE
): void => {
  const target = event.currentTarget;
  
  // Prevent infinite error loops by checking if already using fallback
  if (target.src === fallbackSrc) {
    target.style.visibility = 'hidden'; // Hide the image if even fallback fails
    return;
  }
  
  // Set fallback image
  target.src = fallbackSrc;
  
  // Remove srcset to prevent further attempts with responsive images
  target.removeAttribute('srcset');
  target.removeAttribute('sizes');
  
  // Add error class for styling
  target.classList.add('image-load-error');
  
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
  loadingClass = 'image-loading', 
  loadedClass = 'image-loaded'
): IntersectionObserver | null => {
  // Only create observer if IntersectionObserver is available
  if (typeof IntersectionObserver === 'undefined') return null;
  
  return new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
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
          currentTarget: img
        } as React.SyntheticEvent<HTMLImageElement>);
      };
      
      // Stop observing this image
      observer.unobserve(img);
    });
  }, {
    rootMargin: '200px 0px', // Start loading images 200px before they enter viewport
    threshold: 0.01
  });
};

/**
 * Optimizes image dimensions based on device pixel ratio
 * @param width Original width
 * @param height Original height
 * @param maxWidth Maximum allowed width
 * @returns Optimized dimensions {width, height}
 */
export const getOptimizedDimensions = (
  width: number,
  height: number,
  maxWidth: number = window.innerWidth
): { width: number; height: number } => {
  // Account for device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  const optimizedMaxWidth = Math.min(maxWidth * dpr, maxWidth * 2);
  
  // If image is smaller than max width, return original dimensions
  if (width <= optimizedMaxWidth) {
    return { width, height };
  }
  
  // Calculate new height maintaining aspect ratio
  const aspectRatio = width / height;
  const newWidth = optimizedMaxWidth;
  const newHeight = Math.round(newWidth / aspectRatio);
  
  return { width: newWidth, height: newHeight };
};

/**
 * Preloads critical images to improve perceived performance
 * @param urls Array of image URLs to preload
 */
export const preloadCriticalImages = (urls: string[]): void => {
  if (typeof window === 'undefined') return;
  
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};

/**
 * Determines if image optimization should be applied based on user preferences
 * @returns Boolean indicating if optimization should be applied
 */
export const shouldOptimizeImages = (): boolean => {
  // Check for user preferences regarding data usage
  const prefersReducedData = window.matchMedia?.('(prefers-reduced-data: reduce)').matches;
  
  // Check for slow connection
  const connection = (navigator as any).connection;
  const isSlowConnection = connection?.effectiveType === '2g' || connection?.saveData;
  
  return prefersReducedData || isSlowConnection;
};

/**
 * Gets appropriate image quality based on connection and user preferences
 * @returns Image quality level
 */
export const getAppropriateImageQuality = (): number => {
  if (shouldOptimizeImages()) {
    return IMAGE_QUALITY.LOW;
  }
  
  const connection = (navigator as any).connection;
  if (connection?.effectiveType === '3g') {
    return IMAGE_QUALITY.MEDIUM;
  }
  
  return IMAGE_QUALITY.HIGH;
}; 