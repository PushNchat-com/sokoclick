import React, { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  lazyLoad?: boolean;
  fallbackFormat?: 'jpg' | 'png';
  priority?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  lazyLoad = true,
  fallbackFormat = 'jpg',
  priority = false,
  objectFit = 'cover',
  onLoad,
  onError,
}) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Check if WebP is supported
  const [supportsWebp, setSupportsWebp] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check WebP support
    const checkWebpSupport = async () => {
      try {
        const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
        const blob = await fetch(webpData).then(r => r.blob());
        setSupportsWebp(blob.size > 0);
      } catch (e) {
        setSupportsWebp(false);
      }
    };
    
    checkWebpSupport();
  }, []);

  useEffect(() => {
    // Wait until we know if WebP is supported
    if (supportsWebp === null) return;
    
    const isImageKit = src.includes('imagekit.io');
    const isCloudinary = src.includes('cloudinary.com');
    const isFirebase = src.includes('firebasestorage.googleapis.com');
    const isExternal = isImageKit || isCloudinary || isFirebase;
    
    let optimizedSrc = src;
    
    if (isImageKit) {
      // ImageKit optimization
      const params = [];
      if (width) params.push(`w-${width}`);
      if (height) params.push(`h-${height}`);
      if (supportsWebp) params.push('f-webp');
      if (params.length > 0) {
        optimizedSrc = src.replace('/upload/', `/upload/tr:${params.join(',')}/`);
      }
    } else if (isCloudinary) {
      // Cloudinary optimization
      let transformations = 'f_auto,q_auto';
      if (width) transformations += `,w_${width}`;
      if (height) transformations += `,h_${height}`;
      
      optimizedSrc = src.replace('/upload/', `/upload/${transformations}/`);
    } else if (isFirebase) {
      // For Firebase Storage, we can add query parameters
      optimizedSrc = src;
      if (width || height) {
        const separator = src.includes('?') ? '&' : '?';
        if (width) optimizedSrc += `${separator}width=${width}`;
        if (height) optimizedSrc += `${separator}height=${height}`;
      }
    } else if (src.startsWith('/')) {
      // Local image - create appropriate path for Next.js Image optimization or similar
      optimizedSrc = src;
    }
    
    setImgSrc(optimizedSrc);
  }, [src, width, height, supportsWebp]);

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    if (onError) onError();
    
    // Try fallback if WebP failed
    if (supportsWebp && imgSrc && imgSrc.includes('f-webp')) {
      const fallbackSrc = imgSrc.replace('f-webp', `f-${fallbackFormat}`);
      setImgSrc(fallbackSrc);
    }
  };

  if (!imgSrc) return null;

  return (
    <div 
      className={twMerge(
        'relative overflow-hidden',
        isLoading && 'bg-gray-100 animate-pulse',
        className
      )}
      style={{ 
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
      }}
    >
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        loading={lazyLoad && !priority ? 'lazy' : undefined}
        decoding={priority ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        className={twMerge(
          'w-full h-full transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          hasError && 'hidden',
          className
        )}
        style={{ objectFit }}
      />
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage; 