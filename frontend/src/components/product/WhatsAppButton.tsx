import React from 'react';
import { twMerge } from 'tailwind-merge';
import { WhatsAppIcon } from '../ui/Icons';

interface WhatsAppButtonProps {
  phoneNumber: string;
  message: string;
  buttonText?: string;
  variant?: 'default' | 'large' | 'corner';
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber,
  message,
  buttonText,
  variant = 'default',
  className,
  children,
  disabled = false,
}) => {
  // Ensure phone number is properly formatted (should start with '+')
  const formattedNumber = phoneNumber.startsWith('+') 
    ? phoneNumber 
    : `+${phoneNumber}`;
  
  // Handle WhatsApp click
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    
    // Create WhatsApp URL with the message
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedNumber.replace('+', '')}?text=${encodedMessage}`, '_blank');
  };

  // Style based on variant
  let variantStyles = "";
  
  if (variant === 'default') {
    variantStyles = "px-4 py-2 text-sm gap-2 min-h-[44px] min-w-[44px] rounded-md";
  } else if (variant === 'large') {
    variantStyles = "px-6 py-3 text-base gap-3 min-h-[50px] min-w-[50px] rounded-md";
  } else if (variant === 'corner') {
    variantStyles = "px-4 py-2 text-sm rounded-tl-btn rounded-br-none rounded-tr-none rounded-bl-none";
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={twMerge(
        "flex items-center justify-center font-medium transition-colors",
        variantStyles,
        "bg-[#25D366] text-white hover:bg-[#22c55e] focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:ring-offset-2",
        disabled && "opacity-60 cursor-not-allowed hover:bg-[#25D366]",
        className
      )}
      aria-label="Contact seller via WhatsApp"
    >
      {/* WhatsApp Icon */}
      <WhatsAppIcon 
        className={variant === 'large' ? "w-6 h-6" : "w-5 h-5"} 
        aria-hidden="true" 
      />
      
      {/* Don't show text for corner variant */}
      {variant !== 'corner' && (
        <span className="truncate">{buttonText || children}</span>
      )}
    </button>
  );
};

export default WhatsAppButton;
export type { WhatsAppButtonProps };
