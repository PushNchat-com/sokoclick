import { Toaster as HotToaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface ToasterProps {
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
  reverseOrder?: boolean;
}

export function Toaster({
  position = 'top-center',
  reverseOrder = false,
}: ToasterProps) {
  const { i18n } = useTranslation();
  
  return (
    <HotToaster
      position={position}
      reverseOrder={reverseOrder}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Define default options
        className: '',
        duration: 5000,
        style: {
          background: '#fff',
          color: '#363636',
          direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
        },
        // Default options for specific types
        success: {
          duration: 3000,
          style: {
            background: '#10b981',
            color: '#fff',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#ef4444',
            color: '#fff',
          },
        },
        loading: {
          duration: Infinity,
        },
      }}
    />
  );
} 