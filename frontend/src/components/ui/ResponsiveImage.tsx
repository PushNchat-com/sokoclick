import React, {
  useState,
  useEffect,
  useRef,
  ImgHTMLAttributes,
  DetailedHTMLProps,
  SyntheticEvent,
  RefObject,
  memo,
} from "react";
import { twMerge } from "tailwind-merge";
import {
  generateSrcSet,
  calculateSizes,
  getWebpUrl,
  getPlaceholderImage,
  handleImageError,
  supportsWebP,
  FALLBACK_IMAGE,
} from "../../utils/imageTools";

// Extend ImgHTMLAttributes to include fetchpriority
interface ExtendedImgHTMLAttributes
  extends DetailedHTMLProps<
    ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  > {
  fetchpriority?: "high" | "low" | "auto";
}

interface ResponsiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  fallbackSrc?: string;
  aspectRatio?: "square" | "16:9" | "4:3" | "3:2" | "auto";
  imageSize?: "xs" | "sm" | "md" | "lg" | "product" | "thumbnail";
  showTextFallback?: boolean;
}

// Text fallback component for when images fail to load
const TextLogoFallback: React.FC<{ text: string; className?: string }> = ({
  text,
  className,
}) => {
  // Split text into words
  const words = text.split(/\s+/);
  const firstWord = words[0] || "";
  const remainingText = words.slice(1).join(" ");

  return (
    <div
      className={twMerge(
        "flex items-center justify-center w-full h-full bg-indigo-600 text-white rounded-md",
        className,
      )}
    >
      <div className="text-center">
        <span className="font-bold">{firstWord}</span>
        {remainingText && <span>{" " + remainingText}</span>}
      </div>
    </div>
  );
};

/**
 * Responsive image component that handles proper sizing, lazy loading, and formats
 * Ensures consistent aspect ratios and dimensions across the application
 *
 * Performance optimized with:
 * 1. Lazy loading of off-screen images
 * 2. WebP format for modern browsers
 * 3. Proper srcset for responsive sizing
 * 4. LQIP (Low Quality Image Placeholder) loading animation
 * 5. Error handling with fallback images
 */
const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  width,
  height,
  className = "",
  objectFit = "cover",
  priority = false,
  sizes,
  onLoad,
  fallbackSrc = FALLBACK_IMAGE,
  aspectRatio = "auto",
  imageSize,
  showTextFallback = true,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [useFallback, setUseFallback] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Update with numeric values
  const defaultSizes =
    sizes ||
    calculateSizes({
      "(max-width: 640px)": 100,
      "(max-width: 768px)": 50,
      "(max-width: 1024px)": 33,
      "(min-width: 1025px)": 25,
    });

  // Generate srcset for responsive sizes
  const srcSet = src ? generateSrcSet(src) : "";
  const webpSrcSet = src ? generateSrcSet(getWebpUrl(src)) : "";

  // Get placeholder for LQIP (Low Quality Image Placeholder)
  const placeholder = src ? getPlaceholderImage(src) : "";

  // Handle successful load
  const handleLoad = () => {
    setLoaded(true);
    if (onLoad) onLoad();
  };

  // Handle load error with retries
  const handleErrorWithFallback = (
    e: React.SyntheticEvent<HTMLImageElement>,
  ) => {
    // Attempt to retry loading a few times
    if (retryCount < 2) {
      setRetryCount((prev) => prev + 1);
      // Add a small delay before retry
      setTimeout(() => {
        if (imgRef.current) {
          imgRef.current.src = src + "?retry=" + (retryCount + 1);
        }
      }, 1000);
      return;
    }

    setError(true);

    // If fallback image provided, try it
    if (fallbackSrc && !useFallback) {
      setUseFallback(true);
      e.currentTarget.src = fallbackSrc;
      // Reset retry count for fallback
      setRetryCount(0);
    } else {
      // If fallback also failed or no fallback, we'll show text fallback
      console.warn(`Image failed to load: ${src} (fallback also failed)`);
    }
  };

  // Check if URL is valid
  useEffect(() => {
    if (!src) {
      setError(true);
      setUseFallback(true);
    }
  }, [src]);

  // Set up IntersectionObserver for lazy loading if not priority
  useEffect(() => {
    if (
      priority ||
      !imgRef.current ||
      typeof IntersectionObserver === "undefined"
    ) {
      // If IntersectionObserver is not supported, load immediately
      if (!priority && imgRef.current) {
        if (imgRef.current.dataset.src) {
          imgRef.current.src = imgRef.current.dataset.src;
        }
        if (imgRef.current.dataset.srcset) {
          imgRef.current.srcset = imgRef.current.dataset.srcset;
        }
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;

            // If data-src exists, move it to src
            if (img.dataset.src) {
              img.src = img.dataset.src;
              delete img.dataset.src;
            }

            // If data-srcset exists, move it to srcset
            if (img.dataset.srcset) {
              img.srcset = img.dataset.srcset;
              delete img.dataset.srcset;
            }

            observer.unobserve(img);
          }
        });
      },
      // Increase rootMargin for earlier loading on fast connections
      { rootMargin: "300px 0px", threshold: 0.1 },
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [priority, src]);

  // Determine aspect ratio class
  const aspectRatioClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "16:9"
        ? "aspect-video"
        : aspectRatio === "4:3"
          ? "aspect-[4/3]"
          : aspectRatio === "3:2"
            ? "aspect-[3/2]"
            : "";

  // Determine size class for height
  const sizeClass = imageSize
    ? imageSize === "product"
      ? "h-product-image"
      : imageSize === "thumbnail"
        ? "h-thumbnail"
        : `h-image-${imageSize}`
    : "";

  // Determine if we should show text fallback when image fails
  if (error && useFallback && showTextFallback) {
    return (
      <div
        className={twMerge(
          "relative overflow-hidden",
          aspectRatioClass,
          sizeClass,
          className,
        )}
        style={{ width, height }}
        aria-label={alt}
      >
        <TextLogoFallback text={alt} />
      </div>
    );
  }

  return (
    <picture
      className={twMerge(
        "block w-full relative overflow-hidden",
        aspectRatioClass,
        sizeClass,
        className,
      )}
    >
      {/* Show text fallback if image errors and showTextFallback is true */}
      {error && showTextFallback && (
        <TextLogoFallback text={alt} className={className} />
      )}

      {/* WebP source */}
      <source
        type="image/webp"
        srcSet={!priority ? undefined : webpSrcSet}
        data-srcset={priority ? undefined : webpSrcSet}
        sizes={defaultSizes}
      />

      {/* Original format source */}
      <source
        srcSet={!priority ? undefined : srcSet}
        data-srcset={priority ? undefined : srcSet}
        sizes={defaultSizes}
      />

      {/* Actual image element */}
      <img
        ref={imgRef}
        src={!priority ? placeholder : src}
        data-src={priority ? undefined : src}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleErrorWithFallback}
        fetchpriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
        className={twMerge(
          "w-full h-full transition-opacity duration-300",
          objectFit && `object-${objectFit}`,
          !loaded && "opacity-50",
          error && !showTextFallback && "hidden",
        )}
      />
    </picture>
  );
};

// Memoize the component to prevent unnecessary rerenders
export default memo(ResponsiveImage);
