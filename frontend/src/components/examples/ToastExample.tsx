import React from 'react';
import { toast } from '../../utils/toast';
import { useLanguage } from '../../store/LanguageContext';
import { Button } from '../ui/Button';

/**
 * Example component showing how to use toast notifications
 * with proper bilingual support
 */
const ToastExample: React.FC = () => {
  const { t } = useLanguage();

  // Text content
  const text = {
    title: { en: 'Toast Notifications', fr: 'Notifications Toast' },
    description: { 
      en: 'Example of using toast notifications with proper bilingual support', 
      fr: 'Exemple d\'utilisation des notifications toast avec support bilingue' 
    },
    successToast: { en: 'Success notification', fr: 'Notification de succès' },
    errorToast: { en: 'Error notification', fr: 'Notification d\'erreur' },
    infoToast: { en: 'Info notification', fr: 'Notification d\'information' },
    warningToast: { en: 'Warning notification', fr: 'Notification d\'avertissement' },
    successMessage: { 
      en: 'Operation completed successfully!', 
      fr: 'Opération terminée avec succès!' 
    },
    errorMessage: { 
      en: 'An error occurred during the operation.', 
      fr: 'Une erreur s\'est produite pendant l\'opération.' 
    },
    infoMessage: { 
      en: 'This is an informational message.', 
      fr: 'Ceci est un message d\'information.' 
    },
    warningMessage: { 
      en: 'Warning: This action cannot be undone.', 
      fr: 'Avertissement: Cette action ne peut pas être annulée.' 
    },
  };

  const showSuccessToast = () => {
    // Example with translation object
    toast.success(text.successMessage);
  };

  const showErrorToast = () => {
    // Example with translation object
    toast.error(text.errorMessage);
  };

  const showInfoToast = () => {
    // Example with translation object
    toast.info(text.infoMessage);
  };

  const showWarningToast = () => {
    // Example with translation object
    toast.warning(text.warningMessage);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">{t(text.title)}</h2>
      <p className="text-gray-600 mb-6">{t(text.description)}</p>
      
      <div className="grid grid-cols-2 gap-4">
        <Button 
          onClick={showSuccessToast}
          variant="primary"
        >
          {t(text.successToast)}
        </Button>
        
        <Button 
          onClick={showErrorToast}
          variant="danger"
        >
          {t(text.errorToast)}
        </Button>
        
        <Button 
          onClick={showInfoToast}
          variant="secondary"
        >
          {t(text.infoToast)}
        </Button>
        
        <Button 
          onClick={showWarningToast}
          variant="outline"
        >
          {t(text.warningToast)}
        </Button>
      </div>
    </div>
  );
};

export default ToastExample; 