import React from 'react';

export interface LogoProps {
  variant?: 'default' | 'small' | 'white';
  showTagline?: boolean;
  className?: string;
}

/**
 * SokoClick Logo component using the SVG logo
 * 
 * @example
 * <Logo />
 * <Logo variant="small" />
 * <Logo variant="white" />
 */
const Logo: React.FC<LogoProps> = ({ 
  variant = 'default',
  showTagline = false,
  className = ''
}) => {
  // Set sizes based on variant
  const sizes = {
    default: 'h-10 w-auto', // ~40px height
    small: 'h-8 w-auto',    // ~32px height
    white: 'h-10 w-auto',   // Same as default but with white color
  };

  // Logo filter for white variant
  const logoFilter = variant === 'white' ? 'filter brightness-0 invert' : '';
  
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center">
        {/* SVG Logo */}
        <div className={`relative ${sizes[variant]}`}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="32" 
            height="32" 
            viewBox="0 0 32 32" 
            fill="none"
            className={`h-full w-full ${logoFilter}`}
          >
            <rect width="32" height="32" rx="6" fill="#0EA5E9"/>
            <path d="M16 5C9.92487 5 5 9.92487 5 16C5 22.0751 9.92487 27 16 27C22.0751 27 27 22.0751 27 16C27 9.92487 22.0751 5 16 5ZM16 8C20.4183 8 24 11.5817 24 16C24 20.4183 20.4183 24 16 24C11.5817 24 8 20.4183 8 16C8 11.5817 11.5817 8 16 8Z" fill="white"/>
            <path d="M16 12C13.7909 12 12 13.7909 12 16C12 18.2091 13.7909 20 16 20C18.2091 20 20 18.2091 20 16C20 13.7909 18.2091 12 16 12Z" fill="orange"/>
          </svg>
        </div>
        
        {/* Text next to logo */}
        <span className={`ml-2 font-bold ${variant === 'white' ? 'text-white' : 'text-gray-800'}`}>
          SokoClick
        </span>
      </div>
      
      {/* Optional tagline */}
      {showTagline && (
        <span className={`text-xs mt-1 ${variant === 'white' ? 'text-gray-200' : 'text-gray-600'}`}>
          Exclusive Auctions, Direct Contact
        </span>
      )}
    </div>
  );
};

export default Logo; 