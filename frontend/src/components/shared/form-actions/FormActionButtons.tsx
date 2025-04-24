import React from 'react';
import { Button } from '../../ui/Button';
import { useLanguage } from '../../../store/LanguageContext';

interface FormActionButtonsProps {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  isSaving: boolean;
  isSubmitDisabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  showCancelDialog: boolean;
  onConfirmCancel: () => void;
  onCancelDialog: () => void;
  className?: string;
}

const FormActionButtons: React.FC<FormActionButtonsProps> = ({
  currentStep,
  totalSteps,
  isSubmitting,
  isSaving,
  isSubmitDisabled,
  onPrevious,
  onNext,
  onSubmit,
  onCancel,
  showCancelDialog,
  onConfirmCancel,
  onCancelDialog,
  className = ''
}) => {
  const { t } = useLanguage();

  // Text content
  const text = {
    back: { en: 'Back', fr: 'Retour' },
    next: { en: 'Next', fr: 'Suivant' },
    submit: { en: 'Submit', fr: 'Soumettre' },
    cancel: { en: 'Cancel', fr: 'Annuler' },
    confirmCancel: { en: 'Confirm Cancel', fr: 'Confirmer l\'annulation' },
    confirmCancelMessage: { en: 'Are you sure you want to cancel? All unsaved changes will be lost.', fr: 'Êtes-vous sûr de vouloir annuler ? Toutes les modifications non enregistrées seront perdues.' },
    keepEditing: { en: 'Keep Editing', fr: 'Continuer l\'édition' }
  };

  return (
    <div className={`flex justify-between items-center ${className}`}>
      <div className="flex-1">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isSubmitting || isSaving}
          >
            {t(text.back)}
          </Button>
        )}
      </div>

      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting || isSaving}
        >
          {t(text.cancel)}
        </Button>

        {currentStep < totalSteps ? (
          <Button
            type="button"
            variant="primary"
            onClick={onNext}
            disabled={isSubmitting || isSaving || isSubmitDisabled}
          >
            {t(text.next)}
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || isSaving || isSubmitDisabled}
          >
            {t(text.submit)}
          </Button>
        )}
      </div>

      {/* Cancel confirmation dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t(text.confirmCancel)}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {t(text.confirmCancelMessage)}
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelDialog}
              >
                {t(text.keepEditing)}
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                onClick={onConfirmCancel}
              >
                {t(text.confirmCancel)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormActionButtons; 