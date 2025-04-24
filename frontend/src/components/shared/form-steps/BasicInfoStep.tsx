import React from 'react';
import BasicInfoSection from '../form-sections/BasicInfoSection';
import { ProductFormData } from '../../../types/product';
import { useLanguage } from '../../../store/LanguageContext';

export interface BasicInfoStepProps {
  formData: ProductFormData;
  errors: Record<string, string>;
  isAdmin: boolean;
  onDataChange: (data: Partial<ProductFormData>) => void;
  availableSlots: number[];
  loadingSlots: boolean;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  errors,
  isAdmin,
  onDataChange,
  availableSlots,
  loadingSlots
}) => {
  const { t } = useLanguage();

  // Text content
  const text = {
    slotAssignment: { en: 'Slot Assignment', fr: 'Affectation de l\'emplacement' },
    slotNumber: { en: 'Slot', fr: 'Emplacement' },
    selectSlot: { en: 'Select slot', fr: 'Sélectionner un emplacement' },
    noSlots: { en: 'No available slots', fr: 'Aucun emplacement disponible' },
  };

  return (
    <>
      {/* Basic Information */}
      <BasicInfoSection
        formData={formData}
        onChange={onDataChange}
        errors={errors}
      />
      
      {/* Slot assignment for admin only */}
      {isAdmin && (
        <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t(text.slotAssignment)}</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="slotNumber" className="block text-sm font-medium text-gray-700 mb-1">
                {t(text.slotNumber)} <span className="text-red-500">*</span>
              </label>
              <select
                id="slotNumber"
                name="slotNumber"
                value={formData.slotNumber}
                onChange={(e) => onDataChange({ slotNumber: e.target.value })}
                className={`bg-white border text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ${errors.slotNumber ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">{t(text.selectSlot)}</option>
                {availableSlots.length > 0 ? (
                  availableSlots.map(slot => (
                    <option key={slot} value={slot.toString()}>
                      {t(text.slotNumber)} #{slot}
                    </option>
                  ))
                ) : (
                  <option disabled>{t(text.noSlots)}</option>
                )}
              </select>
              {errors.slotNumber && <p className="text-red-500 text-xs mt-1">{errors.slotNumber}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BasicInfoStep; 