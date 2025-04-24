import React, { useState, useEffect } from 'react';

export interface ImageType {
  url: string;
  alt?: string;
}

interface ImageGalleryProps {
  images: ImageType[];
  className?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  images, 
  className = '' 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([]);

  // Initialize image loading state
  useEffect(() => {
    setImagesLoaded(new Array(images.length).fill(false));
  }, [images.length]);

  // Handle image load
  const handleImageLoad = (index: number) => {
    setImagesLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  // Create WebP version of image URL
  const getWebpUrl = (url: string) => {
    const urlWithoutExtension = url.substring(0, url.lastIndexOf('.'));
    return `${urlWithoutExtension}.webp`;
  };

  // Handle keyboard navigation in fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      } else if (e.key === 'ArrowLeft') {
        navigateImage(-1);
      } else if (e.key === 'ArrowRight') {
        navigateImage(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, currentIndex]);

  const navigateImage = (direction: number) => {
    const newIndex = (currentIndex + direction + images.length) % images.length;
    setCurrentIndex(newIndex);
  };

  // If there are no images, display a placeholder
  if (!images || images.length === 0) {
    return (
      <div className={`relative w-full aspect-square bg-gray-200 rounded-lg ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          No image available
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Main Image */}
      <div 
        className="relative aspect-square w-full overflow-hidden rounded-lg mb-2 cursor-pointer"
        onClick={() => setIsFullscreen(true)}
      >
        <div className="relative w-full h-full">
          {/* Loading skeleton */}
          {!imagesLoaded[currentIndex] && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
          )}
          
          <picture>
            <source srcSet={getWebpUrl(images[currentIndex].url)} type="image/webp" />
            <source srcSet={images[currentIndex].url} type="image/jpeg" /> 
            <img
              src={images[currentIndex].url}
              alt={images[currentIndex].alt || `Product image ${currentIndex + 1}`}
              className="absolute object-cover w-full h-full"
              loading={currentIndex === 0 ? "eager" : "lazy"}
              onLoad={() => handleImageLoad(currentIndex)}
              style={{ opacity: imagesLoaded[currentIndex] ? 1 : 0 }}
            />
          </picture>
        </div>
        
        <button 
          className="absolute bottom-2 right-2 bg-white/70 p-2 rounded-full shadow-md z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setIsFullscreen(true);
          }}
          aria-label="View fullscreen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
          </svg>
        </button>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex overflow-x-auto space-x-2 pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                index === currentIndex ? 'border-blue-500' : 'border-transparent'
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`View image ${index + 1}`}
            >
              {!imagesLoaded[index] && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
              )}
              
              <picture>
                <source srcSet={getWebpUrl(image.url)} type="image/webp" />
                <source srcSet={image.url} type="image/jpeg" />
                <img
                  src={image.url}
                  alt={image.alt || `Thumbnail ${index + 1}`}
                  className="absolute object-cover w-full h-full"
                  loading="lazy"
                  onLoad={() => handleImageLoad(index)}
                  style={{ opacity: imagesLoaded[index] ? 1 : 0 }}
                />
              </picture>
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <button 
              className="absolute top-4 right-4 z-10 bg-white/20 p-2 rounded-full text-white hover:bg-white/40 min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setIsFullscreen(false)}
              aria-label="Close fullscreen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <button 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 p-2 rounded-full text-white hover:bg-white/40 min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => navigateImage(-1)}
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="relative h-[80vh] w-[80vw] max-w-screen-lg">
              <picture>
                <source srcSet={getWebpUrl(images[currentIndex].url)} type="image/webp" />
                <source srcSet={images[currentIndex].url} type="image/jpeg" />
                <img
                  src={images[currentIndex].url}
                  alt={images[currentIndex].alt || `Product image ${currentIndex + 1}`}
                  className="object-contain w-full h-full"
                  loading="eager"
                />
              </picture>
            </div>
            
            <button 
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 p-2 rounded-full text-white hover:bg-white/40 min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => navigateImage(1)}
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Thumbnails in fullscreen */}
          {images.length > 1 && (
            <div className="flex overflow-x-auto space-x-2 p-4 bg-black/50 w-full justify-center">
              {images.map((image, index) => (
                <button
                  key={index}
                  className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                    index === currentIndex ? 'border-white' : 'border-transparent'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`View image ${index + 1}`}
                >
                  <picture>
                    <source srcSet={getWebpUrl(image.url)} type="image/webp" />
                    <source srcSet={image.url} type="image/jpeg" />
                    <img
                      src={image.url}
                      alt={image.alt || `Thumbnail ${index + 1}`}
                      className="absolute object-cover w-full h-full"
                      loading="lazy"
                    />
                  </picture>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
