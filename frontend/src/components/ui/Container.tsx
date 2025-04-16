import React from 'react';

export interface ContainerProps {
  children: React.ReactNode;
  size?: 'default' | 'small' | 'large' | 'full';
  className?: string;
  as?: React.ElementType;
}

/**
 * Container component for consistent layout widths
 * 
 * @example
 * <Container>Content goes here</Container>
 * <Container size="small">Narrower content</Container>
 */
const Container: React.FC<ContainerProps> = ({
  children,
  size = 'default',
  className = '',
  as: Component = 'div',
}) => {
  const sizeClasses = {
    default: 'max-container',
    small: 'container-sm',
    large: 'max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8',
    full: 'w-full px-4 sm:px-6 lg:px-8',
  };

  const classes = [
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={classes}>
      {children}
    </Component>
  );
};

export default Container; 