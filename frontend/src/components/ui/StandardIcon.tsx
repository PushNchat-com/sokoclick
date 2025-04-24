import React, { Suspense } from 'react';
import { twMerge } from 'tailwind-merge';
import * as IconsModule from './Icons';

// Get the actual icon components from the default export
const Icons = IconsModule.default || IconsModule;

export type IconName = keyof typeof Icons;
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

interface StandardIconProps {
  name: IconName;
  size?: IconSize;
  color?: string;
  className?: string;
  onClick?: () => void;
}

// Error boundary component specifically for icons
class IconErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('StandardIcon error:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="inline-block w-6 h-6 bg-gray-200 rounded-full" aria-hidden="true"></div>
      );
    }
    return this.props.children;
  }
}

/**
 * StandardIcon component for consistent icon usage throughout the application
 * Uses the IconWrapper approach from Icons.tsx
 * 
 * @example
 * <StandardIcon name="WhatsApp" size="md" />
 * <StandardIcon name="Location" size={16} className="text-primary-500" />
 */
const StandardIcon: React.FC<StandardIconProps> = ({
  name,
  size = 'md',
  color,
  className = '',
  onClick,
}) => {
  // Define standard sizes in pixels
  const sizeMap = {
    'xs': 12,
    'sm': 16,
    'md': 24,
    'lg': 32,
    'xl': 40,
  };

  // Convert size to pixel value if it's a string preset
  const pixelSize = typeof size === 'string' ? sizeMap[size] || 24 : size;
  
  // Get the icon component or use fallback
  const IconComponent = Icons[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found, using fallback`);
    return (
      <div 
        className={twMerge(
          "inline-block bg-gray-200 rounded-full",
          typeof size === 'string' ? `h-icon-${size} w-icon-${size}` : '',
          className
        )}
        style={typeof size !== 'string' ? { width: `${pixelSize}px`, height: `${pixelSize}px` } : {}}
        aria-hidden="true"
      />
    );
  }

  // Create responsive size classes
  const sizeClasses = typeof size === 'string' 
    ? `h-icon-${size} w-icon-${size}` 
    : '';

  // Add proper icon properties
  const iconProps = {
    size: pixelSize,
    color: color,
    className: twMerge(sizeClasses, className),
    onClick: onClick,
    // Only add role and aria attributes if it's interactive
    ...(onClick ? { role: 'button' } : { 'aria-hidden': true })
  };

  return (
    <IconErrorBoundary>
      {React.createElement(IconComponent, iconProps)}
    </IconErrorBoundary>
  );
};

export default StandardIcon; 