import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholderColor = 'bg-gray-200'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { t } = useTranslation();

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div className="relative w-full h-full">
      {/* Loading Placeholder */}
      {!isLoaded && !hasError && (
        <div className={`absolute inset-0 flex items-center justify-center ${placeholderColor}`}>
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Error Placeholder */}
      {hasError && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${placeholderColor} text-gray-500`}>
          <svg className="w-10 h-10 mb-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
          <span>{t('noImage')}</span>
        </div>
      )}
      
      {/* Actual Image */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
};

export default LazyImage; 