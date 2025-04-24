import React from 'react';
import { useLanguage } from '../../../store/LanguageContext';
import { DeliveryOptionInternal } from '../../../types/delivery';
import DeliveryOptionsSection from '../form-sections/DeliveryOptionsSection';

interface DeliveryOptionsStepProps {
  options: DeliveryOptionInternal[];
  errors: Record<string, string>;
  onChange: (options: DeliveryOptionInternal[]) => void;
  onRemove: (index: number) => void;
}

const DeliveryOptionsStep: React.FC<DeliveryOptionsStepProps> = ({
  options,
  errors,
  onChange,
  onRemove
}) => {
  return (
    <DeliveryOptionsSection
      deliveryOptions={options}
      onChange={onChange}
      onOptionRemoved={onRemove}
      errors={errors}
    />
  );
};

export default DeliveryOptionsStep; 