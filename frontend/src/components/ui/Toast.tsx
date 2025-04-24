import React from 'react';
import { Toaster } from '../../utils/toast';

interface ToastProps {
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  gutter?: number;
}

/**
 * Toast notification container component
 * @param props Component props
 * @returns React component
 */
export const Toast = ({ 
  position = 'bottom-right', 
  containerClassName,
  containerStyle,
  gutter = 8
}: ToastProps) => {
  return (
    <Toaster
      position={position}
      gutter={gutter}
      containerClassName={containerClassName}
      containerStyle={containerStyle}
      toastOptions={{
        duration: 4000,
        className: 'text-sm'
      }}
    />
  );
};

export default Toast; 